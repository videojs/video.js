import type {
  MediaTextCuesState,
  MediaTextTrack,
  MediaTrackCues,
  TextTrackFilter,
  TextTrackLike,
} from '@videojs/media';
import { getRegisteredMedia, isMediaSeekCapable, isMediaSourceCapable, isMediaTextTrackCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { isAbortError, isUndefined } from '@videojs/utils/predicate';

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
import { loadTextTrackCues } from '../load-text-track';
import { fillChapterEnds, reuseCues, sortCues, toMediaTextCues } from '../text-cues';
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
        mediaSrc: get()[CURRENT_SRC] as string | null,
      };

      const src = content?.src ?? init.src;

      // Loading waits for the store to attach, which only happens on the client.
      if (src) record.load = { src, format: content?.format ?? init.format };

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
    let tracked = new Map<string, TextTrackLike>();
    let trackCleanup: AbortController | null = null;

    const getTime = () => (isMediaSeekCapable(media) ? media.currentTime : Number.NaN);
    const getDuration = () => (isMediaSeekCapable(media) ? media.duration : Number.NaN);

    // The store reset on detach, so bring back the app tracks it held. A container change or an extension re-attaches
    // to the same media and keeps them; other media drop the tracks that belonged to the last one's source.
    const appTracks = get()[APP_TEXT_TRACKS_CHANGE];
    const registeredMedia = getRegisteredMedia(media);

    if (!isUndefined(appTracks.media) && appTracks.media !== registeredMedia) {
      appTracks.records = appTracks.records.filter((record) => record.mediaSrc === null);
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
        if (record.mediaSrc === src) return [record];

        if (record.mediaSrc === null) return [{ ...record, mediaSrc: src }];

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
        const cues = reuseCues(prior?.cues, sortCues(toMediaTextCues(track.cues, { kind: plain.kind, duration })));
        const activeCues = reuseCues(prior?.activeCues, findActiveCues(cues, time));

        tracked.set(plain.id, track);
        textCues.push(reuseTrackCues(prior, { track: reuseTrack(prior?.track, plain), cues, activeCues }));

        // Hidden tracks fire `cuechange` as cues start and end, which is sooner than the next `timeupdate`.
        if (track instanceof EventTarget) listen(track, 'cuechange', syncActive, { signal: trackCleanup.signal });
      }

      // App cues are already plain and ordered. A chapter without an end runs to the next one, and the last to the end
      // of the media.
      for (const record of get()[APP_TEXT_TRACKS]) {
        if (!isTracked(record.track, filters)) continue;

        const prior = previous.get(record.track.id);
        const cues =
          record.track.kind === 'chapters'
            ? reuseCues(prior?.cues, fillChapterEnds(record.cues, duration))
            : record.cues;
        const activeCues = reuseCues(prior?.activeCues, findActiveCues(cues, time));

        textCues.push(reuseTrackCues(prior, { track: record.track, cues, activeCues }));
      }

      if (textTracks) listenForTrackLoads(textTracks, sync, trackCleanup.signal);

      set({ textCues: reuseList(get().textCues, textCues) });
      loadAppCues();
    };

    // App tracks with a `src` load once per attach, each with its own request so removing the track stops it.
    const loads = new Map<string, AbortController>();

    const loadAppCues = () => {
      const records = get()[APP_TEXT_TRACKS];

      for (const [id, controller] of loads) {
        if (records.some(({ track }) => track.id === id)) continue;

        controller.abort();
        loads.delete(id);
      }

      for (const { track, load } of records) {
        if (!load || loads.has(track.id)) continue;

        const controller = new AbortController();

        loads.set(track.id, controller);

        loadTextTrackCues(load, track, controller.signal)
          .then((cues) =>
            updateAppTrack(track.id, (record) => ({ ...record, cues: sortCues([...record.cues, ...cues]) }))
          )
          .catch((error: unknown) => {
            if (isAbortError(error)) return;

            // A track that fails to load keeps the cues it has; it never fails the player.
            if (__DEV__) console.warn(error);

            updateAppTrack(track.id, (record) => record);
          })
          .finally(() => {
            if (loads.get(track.id) === controller) loads.delete(track.id);
          });
      }
    };

    const updateAppTrack = (id: string, update: (record: AppTextTrackRecord) => AppTextTrackRecord) => {
      if (signal.aborted) return;

      const records = get()[APP_TEXT_TRACKS];
      if (!records.some((record) => record.track.id === id)) return;

      set({
        [APP_TEXT_TRACKS]: records.map((record) =>
          record.track.id === id ? { ...update(record), load: undefined } : record
        ),
      });
      get()[APP_TEXT_TRACKS_CHANGE].notify();
    };

    const syncActive = () => {
      const duration = getDuration();
      const time = getTime();
      const current = get().textCues;
      const next = current.map((entry) => {
        const track = tracked.get(entry.track.id);
        // Engines add, remove, and change cues in place without an event, so the cues are read again. Each unchanged
        // cue comes back as the copy already published, which keeps this cheap.
        const cues = track
          ? reuseCues(entry.cues, sortCues(toMediaTextCues(track.cues, { kind: entry.track.kind, duration })))
          : entry.cues;
        const activeCues = reuseCues(entry.activeCues, findActiveCues(cues, time));

        return reuseTrackCues(entry, { ...entry, cues, activeCues });
      });

      set({ textCues: reuseList(current, next) });
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
    listen(media, 'seeked', syncActive, { signal });

    const unsubscribeFilters = get()[CUE_FILTERS].subscribe(sync);
    const unsubscribeAppTracks = get()[APP_TEXT_TRACKS_CHANGE].subscribe(sync);

    signal.addEventListener(
      'abort',
      () => {
        unsubscribeFilters();
        unsubscribeAppTracks();
        trackCleanup?.abort();

        for (const controller of loads.values()) controller.abort();

        loads.clear();
      },
      { once: true }
    );
  },
});

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
