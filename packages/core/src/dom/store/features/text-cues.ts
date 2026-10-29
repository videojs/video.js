import type {
  MediaTextCuesState,
  MediaTextTrack,
  MediaTrackCues,
  TextTrackFilter,
  TextTrackLike,
} from '@videojs/media';
import { isMediaSeekCapable, isMediaTextTrackCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';

import { findActiveCues } from '../../../core/text-track/active-cues';
import { matchTextTrack } from '../../../core/text-track/filter';
import { definePlayerFeature } from '../../feature';
import { getAppTextTracks, listenForAppTextTracks } from '../app-text-tracks';
import { fillChapterEnds, reuseCues, sortCues, toMediaTextCues } from '../text-cues';
import { listenForTrackLoads, toMediaTextTrack } from '../text-tracks';

const CUE_FILTERS = Symbol('@videojs/text-cue-filters');

/** The filters `watchTextCues()` callers are reading through. Lives outside store state, so it survives a detach. */
interface TextCueFilters {
  values(): TextTrackFilter[];
  subscribe(listener: () => void): () => void;
}

interface TextCuesSourceState extends MediaTextCuesState {
  [CUE_FILTERS]: TextCueFilters;
}

/**
 * Tracks the cues, and the cues active now, of the text tracks being read, from the media or added by the app through
 * the text-track feature. `metadata` and `chapters` tracks that aren't disabled are read by default, except the
 * thumbnails track; `watchTextCues()` adds others while a reader needs them. Kept apart from the text-track feature so
 * cue changes never reach UI that only lists tracks.
 *
 * Active cues follow `currentTime` with one rule for every track, from the media or the app, so a point added from code
 * and a zero-length cue in a file behave alike.
 */
export const textCuesFeature = definePlayerFeature({
  name: 'textCues',
  state: (): TextCuesSourceState => {
    const entries = new Set<{ filter: TextTrackFilter }>();
    const filterListeners = createListeners();

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
      [CUE_FILTERS]: {
        values: () => Array.from(entries, ({ filter }) => filter),
        subscribe: filterListeners.subscribe,
      },
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

    const sync = () => {
      trackCleanup?.abort();
      trackCleanup = new AbortController();

      const filters = get()[CUE_FILTERS].values();
      const previous = new Map(get().textCues.map((entry) => [entry.track.id, entry]));
      const duration = getDuration();
      const time = getTime();
      const textCues: MediaTrackCues[] = [];
      const appRecords = getAppTextTracks(get());
      const appTrackIds = new Set(appRecords.map(({ track }) => track.id));

      tracked = new Map();

      for (let i = 0; i < (textTracks?.textTracks.length ?? 0); i++) {
        const track = textTracks!.textTracks[i]!;
        const plain = toMediaTextTrack(track, i);
        // A copy of an app track is read through the app track.
        if (appTrackIds.has(plain.id) || !isTracked(plain, filters)) continue;

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
      for (const record of appRecords) {
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

    sync();

    const trackList = textTracks?.textTracks;

    if (trackList instanceof EventTarget) {
      listen(trackList, 'addtrack', sync, { signal });
      listen(trackList, 'removetrack', sync, { signal });
      listen(trackList, 'change', sync, { signal });
    }

    listen(media, 'loadstart', sync, { signal });
    // Cue ends are clamped to the media duration.
    listen(media, 'durationchange', sync, { signal });
    listen(media, 'timeupdate', syncActive, { signal });
    listen(media, 'seeked', syncActive, { signal });

    const unsubscribeFilters = get()[CUE_FILTERS].subscribe(sync);

    listenForAppTextTracks(get(), sync, signal);

    signal.addEventListener(
      'abort',
      () => {
        unsubscribeFilters();
        trackCleanup?.abort();
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
