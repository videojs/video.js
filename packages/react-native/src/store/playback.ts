import type { MediaPlaybackState } from '@videojs/media';
import { createSelector, defineSlice } from '@videojs/store';

import type { NativePlayerTarget } from './native-player-target';

const defineNativeFeature = defineSlice<NativePlayerTarget>();

/**
 * Playback state for a native player.
 *
 * ## Why this exists instead of core's `playbackFeature`
 *
 * `packages/core/src/core/store/features/playback.ts` produces the same `MediaPlaybackState`, is DOM-free, and composes
 * into this store's target. Two gaps in `ReactNativeMedia` stop it working today; once they close, this variant can be
 * retired in favour of the shared feature.
 *
 * 1. **TODO(ReactNativeMedia): grow seek and source capability.** The shared feature opens with `if
 *    (!isMediaPauseCapable(media) || !isMediaSeekCapable(media) || !isMediaSourceCapable(media)) return;`.
 *    `isMediaSeekCapable` wants `currentTime`, `duration`, `seeking`; `isMediaSourceCapable` wants `src`, `currentSrc`,
 *    `readyState`, `load()`. The adapter has `src` and none of the rest, so the shared feature would return early and
 *    leave `paused` stuck at `true` — a silent no-op rather than a crash, which is the worse failure. These belong on
 *    the adapter eventually; the TurboModule needs to report position and duration first.
 * 2. **TODO(ReactNativeMedia): finish the standard media events.** The shared feature listens for `emptied`, `timeupdate`,
 *    `canplay`, `seeking`, `seeked` and `waiting` alongside `play`/`playing`/`pause`/`ended`. Native emits all of them
 *    except `canplay`, and `seeking`/`seeked` only fire once native has a seek command.
 */
export const nativePlaybackFeature = defineNativeFeature<MediaPlaybackState>({
  name: 'playback',

  state: ({ target }): MediaPlaybackState => ({
    paused: true,
    ended: false,
    started: false,
    waiting: false,

    play() {
      return target().media.play();
    },

    pause() {
      target().media.pause();
    },
    autoplay: false,
    autoplaying: false,
  }),

  attach({ target, signal, set }) {
    const { media } = target;

    // Latched rather than derived: the web feature reads `currentTime > 0` to decide whether playback ever began, and
    // the adapter exposes no position. Once it does, this can match core's derivation.
    let started = false;

    const sync = () => {
      if (!media.paused) started = true;

      // `waiting` is intentionally not patched — it stays at its initial `false`. Native now emits `waiting`, but core
      // clears it by comparing `currentTime`, which the adapter doesn't expose yet.
      set({ paused: media.paused, ended: media.ended, started });
    };

    sync();

    media.addEventListener('play', sync, { signal });
    media.addEventListener('playing', sync, { signal });
    media.addEventListener('pause', sync, { signal });
    media.addEventListener('ended', sync, { signal });
  },
});

/** Select playback state from a native player store. */
export const selectNativePlayback = createSelector(nativePlaybackFeature);
