import { definePlayerFeature, type PlayerFeatureConfig } from '@videojs/core/dom';
import { hasMetadata, isMediaPauseCapable, isMediaSeekCapable, isMediaSourceCapable } from '@videojs/media';
import { listen } from '@videojs/utils/dom';
import { isNumber } from '@videojs/utils/predicate';

import { isJsonObject, type JsonStorage, type JsonValue, localJsonStorage } from './storage';

/** Where the listener was before a jump: the place they can get back to. */
export interface RecentPlace {
  /** Media time, in seconds. */
  time: number;
  /** When they left it, epoch milliseconds. */
  at: number;
}

/** Everything the feature remembers for one key. */
interface ProgressRecord {
  position: number;
  listened: number;
  places: RecentPlace[];
  firstAt: number | null;
  lastAt: number | null;
}

export interface ProgressState {
  /** Which title the remembered position and history belong to. Nothing is remembered while it is `null`. */
  progressKey: string | null;
  setProgressKey(key: string | null | undefined): void;
  /** The remembered position, which the feature restores once the media has metadata. */
  resumeTime: number;
  /** Where the listener was before each jump of more than a few seconds, most recent first. */
  recentPlaces: readonly RecentPlace[];
  /** Seconds of media actually heard, at any rate, across every session. */
  listenedSeconds: number;
  /** Epoch milliseconds of the first and most recent listening. */
  firstListenedAt: number | null;
  lastListenedAt: number | null;
  clearRecentPlaces(): void;
}

const STORAGE_PREFIX = 'vjs-usecase-audiobook:progress:';
/** How far a jump has to be before where it started is worth remembering. */
const PLACE_THRESHOLD = 30;
const MAX_PLACES = 10;
/** How often the position is written while playing. */
const SAVE_INTERVAL = 5000;
/** A `timeupdate` delta above this is a jump, not listening. */
const MAX_LISTEN_DELTA = 2;

const EMPTY_RECORD: ProgressRecord = { position: 0, listened: 0, places: [], firstAt: null, lastAt: null };

function isRecentPlace(value: JsonValue): value is RecentPlace & { [key: string]: JsonValue } {
  return isJsonObject(value) && isNumber(value.time) && isNumber(value.at);
}

function parseRecord(value: JsonValue | null): ProgressRecord {
  if (!isJsonObject(value)) return { ...EMPTY_RECORD, places: [] };

  return {
    position: isNumber(value.position) ? value.position : 0,
    listened: isNumber(value.listened) ? value.listened : 0,
    places: Array.isArray(value.places) ? value.places.filter(isRecentPlace) : [],
    firstAt: isNumber(value.firstAt) ? value.firstAt : null,
    lastAt: isNumber(value.lastAt) ? value.lastAt : null,
  };
}

/**
 * Remembers where the listener is in a title and how much of it they have heard, and restores the position when the
 * title comes back. Keyed by `progressKey`, a player input, so one player can move between titles.
 *
 * Nothing in it is audiobook-specific: a lecture series, a podcast, or a long film wants the same three things.
 */
export function createProgressFeature(storage: JsonStorage = localJsonStorage) {
  return definePlayerFeature({
    name: 'progress',
    config: {
      /** Which title the remembered position belongs to. */
      progressKey: { action: 'setProgressKey', state: 'progressKey' },
    } satisfies PlayerFeatureConfig<ProgressState>,
    state: ({ set }): ProgressState => ({
      progressKey: null,
      setProgressKey: (key) => set({ progressKey: key || null }),
      resumeTime: 0,
      recentPlaces: [],
      listenedSeconds: 0,
      firstListenedAt: null,
      lastListenedAt: null,
      clearRecentPlaces() {
        set({ recentPlaces: [] });
      },
    }),

    attach({ target, signal, set, get, store }) {
      const { media } = target;
      if (!isMediaSeekCapable(media) || !isMediaPauseCapable(media) || !isMediaSourceCapable(media)) return;

      let key = get().progressKey;
      let record = key ? parseRecord(storage.read(STORAGE_PREFIX + key)) : parseRecord(null);
      // The key whose position has been applied to the current source, so a new source or a new key restores again.
      let restoredKey: string | null = null;
      // Where the clock was at the last `timeupdate`: the "before" of a seek, and the base of a listening delta.
      let lastTime = media.currentTime;
      let seekFrom: number | null = null;
      let lastSavedAt = 0;

      const publish = () => {
        set({
          resumeTime: record.position,
          recentPlaces: record.places,
          listenedSeconds: record.listened,
          firstListenedAt: record.firstAt,
          lastListenedAt: record.lastAt,
        });
      };

      const save = () => {
        if (key)
          storage.write(STORAGE_PREFIX + key, { ...record, places: record.places.map((place) => ({ ...place })) });

        lastSavedAt = Date.now();
        publish();
      };

      const restore = () => {
        if (!key || restoredKey === key || !hasMetadata(media)) return;

        restoredKey = key;

        if (record.position > 1 && Math.abs(media.currentTime - record.position) > 1) {
          media.currentTime = record.position;
        }

        lastTime = media.currentTime;
      };

      const onTimeUpdate = () => {
        const { currentTime } = media;
        const delta = currentTime - lastTime;

        lastTime = currentTime;

        if (media.paused) return;

        if (delta > 0 && delta < MAX_LISTEN_DELTA) {
          const now = Date.now();

          record.listened += delta;
          record.lastAt = now;
          record.firstAt ??= now;
        }

        record.position = currentTime;

        if (Date.now() - lastSavedAt >= SAVE_INTERVAL) save();
      };

      const onSeeking = () => {
        seekFrom ??= lastTime;
      };

      const onSeeked = () => {
        const from = seekFrom;

        seekFrom = null;
        lastTime = media.currentTime;
        record.position = media.currentTime;

        if (from !== null && Math.abs(media.currentTime - from) >= PLACE_THRESHOLD) {
          const places = record.places.filter((place) => Math.abs(place.time - from) >= PLACE_THRESHOLD);

          record.places = [{ time: from, at: Date.now() }, ...places].slice(0, MAX_PLACES);
        }

        save();
      };

      const onStop = () => {
        record.position = media.currentTime;
        save();
      };

      const onKeyChange = () => {
        const next = get().progressKey;

        if (next === key) {
          // `clearRecentPlaces` is the one write that comes from the store side.
          if (get().recentPlaces.length === 0 && record.places.length > 0) {
            record.places = [];
            save();
          }

          return;
        }

        key = next;
        record = key ? parseRecord(storage.read(STORAGE_PREFIX + key)) : parseRecord(null);
        restoredKey = null;
        restore();
        publish();
      };

      publish();
      restore();

      listen(media, 'loadedmetadata', restore, { signal });
      listen(media, 'emptied', () => void (restoredKey = null), { signal });
      listen(media, 'timeupdate', onTimeUpdate, { signal });
      listen(media, 'seeking', onSeeking, { signal });
      listen(media, 'seeked', onSeeked, { signal });
      listen(media, 'pause', onStop, { signal });
      listen(media, 'ended', onStop, { signal });

      const unsubscribe = store.subscribe(onKeyChange);

      signal.addEventListener(
        'abort',
        () => {
          unsubscribe();
          onStop();
        },
        { once: true }
      );
    },
  });
}

export const progressFeature = createProgressFeature();

/** The remembered position for a key without a player, for a library view that shows where each title stands. */
export function readProgressPosition(key: string, storage: JsonStorage = localJsonStorage): number {
  return parseRecord(storage.read(STORAGE_PREFIX + key)).position;
}
