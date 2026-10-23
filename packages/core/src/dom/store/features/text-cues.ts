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
import { reuseCues, sortCues, toMediaTextCues } from '../text-cues';
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

interface TrackedTrack {
  track: TextTrackLike;
  cueCount: number;
}

/**
 * Tracks the cues, and the cues active now, of the text tracks being read. `metadata` and `chapters` tracks that aren't
 * disabled are read by default, except the thumbnails track; `watchTextCues()` adds others while a reader needs them.
 * Kept apart from the text-track feature so cue changes never reach UI that only lists tracks.
 *
 * Active cues follow `currentTime` with one rule for every track, so a point added from code and a zero-length cue in a
 * file behave alike.
 */
export const textCuesFeature = definePlayerFeature({
  name: 'textCues',
  state: (): TextCuesSourceState => {
    const entries = new Set<{ filter: TextTrackFilter }>();
    const listeners = new Set<() => void>();

    const notify = () => {
      for (const listener of [...listeners]) listener();
    };

    return {
      textCues: [],
      watchTextCues(filter) {
        // Each call gets its own entry, so watching one filter twice takes two stops.
        const entry = { filter };

        entries.add(entry);
        notify();

        return () => {
          if (!entries.delete(entry)) return;

          notify();
        };
      },
      [CUE_FILTERS]: {
        values: () => Array.from(entries, ({ filter }) => filter),
        subscribe(listener) {
          listeners.add(listener);

          return () => listeners.delete(listener);
        },
      },
    };
  },

  attach({ target, signal, get, set }) {
    const { media } = target;
    if (!isMediaTextTrackCapable(media)) return;

    let tracked: TrackedTrack[] = [];
    let trackCleanup: AbortController | null = null;

    const getTime = () => (isMediaSeekCapable(media) ? media.currentTime : Number.NaN);

    const sync = () => {
      trackCleanup?.abort();
      trackCleanup = new AbortController();

      const filters = get()[CUE_FILTERS].values();
      const previous = new Map(get().textCues.map((entry) => [entry.track.id, entry]));
      const duration = isMediaSeekCapable(media) ? media.duration : Number.NaN;
      const time = getTime();
      const textCues: MediaTrackCues[] = [];

      tracked = [];

      for (let i = 0; i < media.textTracks.length; i++) {
        const track = media.textTracks[i]!;
        const plain = toMediaTextTrack(track, i);
        if (!isTracked(plain, filters)) continue;

        const prior = previous.get(plain.id);
        const cues = reuseCues(prior?.cues, sortCues(toMediaTextCues(track.cues, { kind: plain.kind, duration })));
        const activeCues = reuseCues(prior?.activeCues, findActiveCues(cues, time));

        tracked.push({ track, cueCount: track.cues?.length ?? 0 });
        textCues.push(reuseTrackCues(prior, { track: reuseTrack(prior?.track, plain), cues, activeCues }));

        // Hidden tracks fire `cuechange` as cues start and end, which is sooner than the next `timeupdate`.
        if (track instanceof EventTarget) listen(track, 'cuechange', syncActive, { signal: trackCleanup.signal });
      }

      listenForTrackLoads(media, sync, trackCleanup.signal);
      set({ textCues: reuseList(get().textCues, textCues) });
    };

    const syncActive = () => {
      // Engines can append cues without firing an event, so a changed count means the lists need a rebuild.
      if (tracked.some(({ track, cueCount }) => (track.cues?.length ?? 0) !== cueCount)) {
        sync();
        return;
      }

      const time = getTime();
      const current = get().textCues;
      const next = current.map((entry) => {
        const activeCues = reuseCues(entry.activeCues, findActiveCues(entry.cues, time));

        return activeCues === entry.activeCues ? entry : { ...entry, activeCues };
      });

      set({ textCues: reuseList(current, next) });
    };

    sync();

    const textTracks = media.textTracks;

    if (textTracks instanceof EventTarget) {
      listen(textTracks, 'addtrack', sync, { signal });
      listen(textTracks, 'removetrack', sync, { signal });
      listen(textTracks, 'change', sync, { signal });
    }

    listen(media, 'loadstart', sync, { signal });
    // Cue ends are clamped to the media duration.
    listen(media, 'durationchange', sync, { signal });
    listen(media, 'timeupdate', syncActive, { signal });
    listen(media, 'seeked', syncActive, { signal });

    const unsubscribe = get()[CUE_FILTERS].subscribe(sync);

    signal.addEventListener(
      'abort',
      () => {
        unsubscribe();
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
