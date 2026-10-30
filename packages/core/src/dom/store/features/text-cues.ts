import type {
  MediaTextCue,
  MediaTextCuesState,
  MediaTextTrack,
  MediaTrackCues,
  TextTrackCueLike,
  TextTrackFilter,
  TextTrackLike,
} from '@videojs/media';
import { getRegisteredMedia, isMediaSeekCapable, isMediaSourceCapable, isMediaTextTrackCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { isUndefined } from '@videojs/utils/predicate';

import { findActiveCues } from '../../../core/text-track/active-cues';
import {
  type AddTextTrack,
  type AppTextTrack,
  type TextCueInit,
  type TextTrackContent,
  type TextTrackInit,
  toAppCue,
} from '../../../core/text-track/app';
import { matchTextTrack } from '../../../core/text-track/filter';
import { definePlayerFeature } from '../../feature';
import {
  APP_TEXT_TRACKS,
  APP_TEXT_TRACKS_CHANGE,
  type AppTextTrackRecord,
  type AppTextTracksChange,
  type AppTextTracksState,
  getAppTextTracks,
} from '../app-text-tracks';
import { isCueListUnchanged, reuseCues, sortCues, toMediaTextCues } from '../text-cues';
import { listenForTrackLoads, toMediaTextTrack } from '../text-tracks';

const CUE_FILTERS = Symbol('@videojs/text-cue-filters');
const CURRENT_SRC = Symbol('@videojs/text-cues-current-src');

/** The filters `watchTextCues()` callers are reading through. Lives outside store state, so it survives a detach. */
interface TextCueFilters {
  values(): TextTrackFilter[];
  subscribe(listener: () => void): () => void;
}

interface TextCuesSourceState extends MediaTextCuesState, AppTextTracksState {
  /**
   * Add a text track from the app. It works on any media, sits next to the media's tracks in `textTrackList`, and its
   * cues are read like theirs. It belongs to the source playing when it's added, or the first one if there's none yet,
   * and is cleared when the source changes or the media is swapped.
   */
  addTextTrack: AddTextTrack;
  /** Remove a track the app added. Tracks from the media stay. */
  removeTextTrack(id: string): void;
  [CUE_FILTERS]: TextCueFilters;
  /** The media's current source as the feature last saw it, or `null` before one loads. */
  [CURRENT_SRC]: string | null;
}

/**
 * Tracks the cues, and the cues active now, of the text tracks being read, and holds the tracks apps add. `metadata`
 * and `chapters` tracks that aren't disabled are read by default, except the thumbnails track; `watchTextCues()` adds
 * others while a reader needs them. Kept apart from the text-track feature so cue changes never reach UI that only
 * lists tracks.
 *
 * Active cues follow `currentTime` with one rule for every track, from the media or the app, so a point added from code
 * and a zero-length cue in a file behave alike.
 */
export const textCuesFeature = definePlayerFeature({
  name: 'textCues',
  state: ({ get, set }): TextCuesSourceState => {
    const entries = new Set<{ filter: TextTrackFilter }>();
    const filterListeners = createListeners();
    const appListeners = createListeners();
    let trackCount = 0;

    // The tracks apps added, kept outside store state so a detach doesn't drop them. Actions work from this copy.
    const appTracks: AppTextTracksChange = {
      records: [],
      media: undefined,
      subscribe: appListeners.subscribe,
      notify() {
        appTracks.records = getAppTextTracks(get());
        appListeners.notify();
      },
    };

    const setRecords = (records: readonly AppTextTrackRecord[]) => {
      set({ [APP_TEXT_TRACKS]: records });
      appTracks.notify();
    };

    const updateRecord = (id: string, update: (record: AppTextTrackRecord) => AppTextTrackRecord) => {
      const records = appTracks.records;
      if (!records.some((record) => record.track.id === id)) return;

      setRecords(records.map((record) => (record.track.id === id ? update(record) : record)));
    };

    const removeTextTrack = (id: string) => {
      const records = appTracks.records;
      const next = records.filter((record) => record.track.id !== id);

      if (next.length !== records.length) setRecords(next);
    };

    const addTextTrack = (init: TextTrackInit, content?: TextTrackContent): AppTextTrack => {
      const id = `app-text-track-${++trackCount}`;
      let cueCount = 0;

      const toCue = (cue: TextCueInit) => toAppCue(cue, `${id}-cue-${cueCount++}`);

      const record: AppTextTrackRecord = {
        track: {
          id,
          kind: init.kind,
          label: init.label ?? '',
          language: init.language ?? '',
          mode: 'hidden',
          source: 'app',
        },
        cues: sortCues((content?.cues ?? init.cues ?? []).map(toCue)),
        src: get()[CURRENT_SRC] as string | null,
      };

      setRecords([...appTracks.records, record]);

      return {
        id,
        get removed() {
          return !appTracks.records.some((entry) => entry.track.id === id);
        },
        addCue(cue) {
          updateRecord(id, (current) => ({ ...current, cues: sortCues([...current.cues, toCue(cue)]) }));
        },
        removeCue(cueId) {
          updateRecord(id, (current) => ({ ...current, cues: current.cues.filter((cue) => cue.id !== cueId) }));
        },
        remove() {
          removeTextTrack(id);
        },
      };
    };

    return {
      textCues: [],
      watchTextCues(filter) {
        // Each call gets its own entry, so watching one filter twice takes two stops.
        const entry = { filter };

        entries.add(entry);
        filterListeners.notify();

        return () => {
          if (!entries.delete(entry)) return;

          filterListeners.notify();
        };
      },
      // SAFETY: the implementation accepts both overloads; a definition is a track description without cues.
      addTextTrack: addTextTrack as AddTextTrack,
      removeTextTrack,
      [CUE_FILTERS]: {
        values: () => Array.from(entries, ({ filter }) => filter),
        subscribe: filterListeners.subscribe,
      },
      [APP_TEXT_TRACKS]: [],
      [APP_TEXT_TRACKS_CHANGE]: appTracks,
      [CURRENT_SRC]: null,
    };
  },

  attach({ target, signal, get, set }) {
    const { media } = target;
    const textTracks = isMediaTextTrackCapable(media) ? media : null;

    // The media's tracks being read, by the id their cues are published under.
    let tracked = new Map<string, TrackedTrack>();
    let trackCleanup: AbortController | null = null;
    // The time of the last update during playback, so cues played between updates still count as active.
    let lastTime = Number.NaN;

    const getTime = () => (isMediaSeekCapable(media) ? media.currentTime : Number.NaN);
    const getDuration = () => (isMediaSeekCapable(media) ? media.duration : Number.NaN);

    // The store reset on detach, so bring back the app tracks it held. A container change or an extension re-attaches
    // to the same media and keeps them; other media drop the tracks that belonged to the last one's source.
    const appTracks = get()[APP_TEXT_TRACKS_CHANGE];
    const registeredMedia = getRegisteredMedia(media);

    if (!isUndefined(appTracks.media) && appTracks.media !== registeredMedia) {
      appTracks.records = appTracks.records.filter((record) => record.src === null);
    }

    appTracks.media = registeredMedia;
    set({ [APP_TEXT_TRACKS]: appTracks.records });
    appTracks.notify();

    // App tracks added before any source adopt the first one; tracks from an earlier source go with it.
    const syncSource = () => {
      const src = (isMediaSourceCapable(media) && media.currentSrc) || null;

      set({ [CURRENT_SRC]: src });

      if (!src) return;

      const records = get()[APP_TEXT_TRACKS];
      const next = records.flatMap((record) => {
        if (record.src === src) return [record];

        if (record.src === null) return [{ ...record, src }];

        return [];
      });

      const changed = next.length !== records.length || next.some((record, index) => record !== records[index]);

      if (changed) {
        set({ [APP_TEXT_TRACKS]: next });
        get()[APP_TEXT_TRACKS_CHANGE].notify();
      }
    };

    const sync = () => {
      trackCleanup?.abort();
      trackCleanup = new AbortController();

      const filters = get()[CUE_FILTERS].values();
      const previous = new Map(get().textCues.map((entry) => [entry.track.id, entry]));
      const duration = getDuration();
      const time = getTime();
      const textCues: MediaTrackCues[] = [];

      tracked = new Map();

      for (let i = 0; i < (textTracks?.textTracks.length ?? 0); i++) {
        const track = textTracks!.textTracks[i]!;
        const plain = toMediaTextTrack(track, i);
        if (!isTracked(plain, filters)) continue;

        const prior = previous.get(plain.id);
        const read = Array.from(track.cues ?? []);
        const cues = reuseCues(prior?.cues, sortCues(toMediaTextCues(read, { kind: plain.kind, duration })));
        const activeCues = reuseCues(prior?.activeCues, findActiveCues(cues, time, lastTime));

        tracked.set(plain.id, { track, read });
        textCues.push(reuseTrackCues(prior, { track: reuseTrack(prior?.track, plain), cues, activeCues }));

        // Hidden tracks fire `cuechange` as cues start and end, which is sooner than the next `timeupdate`.
        if (track instanceof EventTarget) listen(track, 'cuechange', syncActive, { signal: trackCleanup.signal });
      }

      // App cues are already plain and ordered; only which of them are active changes.
      for (const record of get()[APP_TEXT_TRACKS]) {
        if (!isTracked(record.track, filters)) continue;

        const prior = previous.get(record.track.id);
        const activeCues = reuseCues(prior?.activeCues, findActiveCues(record.cues, time, lastTime));

        textCues.push(reuseTrackCues(prior, { track: record.track, cues: record.cues, activeCues }));
      }

      if (textTracks) listenForTrackLoads(textTracks, sync, trackCleanup.signal);

      lastTime = time;
      set({ textCues: reuseList(get().textCues, textCues) });
    };

    const syncActive = () => {
      const duration = getDuration();
      const time = getTime();
      const current = get().textCues;
      const next = current.map((entry) => {
        const source = tracked.get(entry.track.id);
        const cues = source ? readChangedCues(source, entry, duration) : entry.cues;
        const activeCues = reuseCues(entry.activeCues, findActiveCues(cues, time, lastTime));

        return reuseTrackCues(entry, { ...entry, cues, activeCues });
      });

      lastTime = time;
      set({ textCues: reuseList(current, next) });
    };

    // A seek jumps over cues rather than playing them.
    const forgetLastTime = () => {
      lastTime = Number.NaN;
    };

    const syncSeeked = () => {
      forgetLastTime();
      syncActive();
    };

    syncSource();
    sync();

    const trackList = textTracks?.textTracks;

    if (trackList instanceof EventTarget) {
      listen(trackList, 'addtrack', sync, { signal });
      listen(trackList, 'removetrack', sync, { signal });
      listen(trackList, 'change', sync, { signal });
    }

    listen(
      media,
      'loadstart',
      () => {
        syncSource();
        sync();
      },
      { signal }
    );
    // Cue ends are clamped to the media duration.
    listen(media, 'durationchange', sync, { signal });
    listen(media, 'timeupdate', syncActive, { signal });
    listen(media, 'seeking', forgetLastTime, { signal });
    listen(media, 'seeked', syncSeeked, { signal });

    const unsubscribeFilters = get()[CUE_FILTERS].subscribe(sync);
    const unsubscribeAppTracks = get()[APP_TEXT_TRACKS_CHANGE].subscribe(sync);

    signal.addEventListener(
      'abort',
      () => {
        unsubscribeFilters();
        unsubscribeAppTracks();
        trackCleanup?.abort();
      },
      { once: true }
    );
  },
});

interface TrackedTrack {
  track: TextTrackLike;
  /** The live cues its published cues were last read from. */
  read: TextTrackCueLike[];
}

/**
 * The cues of a media track, read again only when they changed. Engines add, remove, and change cues in place without
 * an event, so they're checked on every tick, and the check is cheap while they stay the same.
 */
function readChangedCues(source: TrackedTrack, entry: MediaTrackCues, duration: number): MediaTextCue[] {
  const options = { kind: entry.track.kind, duration };
  if (isCueListUnchanged(source.track.cues, source.read, options)) return entry.cues;

  source.read = Array.from(source.track.cues ?? []);

  return reuseCues(entry.cues, sortCues(toMediaTextCues(source.read, options)));
}

function isTracked(track: MediaTextTrack, filters: readonly TextTrackFilter[]): boolean {
  return isTrackedByDefault(track) || filters.some((filter) => matchTextTrack(track, filter));
}

function isTrackedByDefault(track: MediaTextTrack): boolean {
  if (track.mode === 'disabled') return false;

  if (track.kind === 'chapters') return true;

  return track.kind === 'metadata' && track.label !== 'thumbnails';
}

function reuseTrack(previous: MediaTextTrack | undefined, next: MediaTextTrack): MediaTextTrack {
  if (
    previous &&
    previous.id === next.id &&
    previous.kind === next.kind &&
    previous.label === next.label &&
    previous.language === next.language &&
    previous.mode === next.mode &&
    previous.source === next.source
  ) {
    return previous;
  }

  return next;
}

function reuseTrackCues(previous: MediaTrackCues | undefined, next: MediaTrackCues): MediaTrackCues {
  if (
    previous &&
    previous.track === next.track &&
    previous.cues === next.cues &&
    previous.activeCues === next.activeCues
  ) {
    return previous;
  }

  return next;
}

/** `next`, or `previous` when every entry is the same, so an unchanged list never notifies subscribers. */
function reuseList<Entry>(previous: Entry[], next: Entry[]): Entry[] {
  const unchanged = next.length === previous.length && next.every((entry, index) => entry === previous[index]);

  return unchanged ? previous : next;
}

function createListeners() {
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      return () => listeners.delete(listener);
    },
    notify(): void {
      for (const listener of [...listeners]) listener();
    },
  };
}
