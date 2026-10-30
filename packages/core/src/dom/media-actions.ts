import { noop } from '@videojs/utils/function';
import { isPromise } from '@videojs/utils/predicate';

import { getMediaInputActionValue } from './media-action-value';
import type { AnyPlayerStore } from './player';
import {
  selectFullscreen,
  selectPiP,
  selectPlayback,
  selectPlaybackRate,
  selectTime,
  selectVolume,
} from './store/selectors';

export { getMediaInputActionValue } from './media-action-value';

export type MediaInputActionName =
  | 'togglePaused'
  | 'toggleMuted'
  | 'toggleFullscreen'
  | 'togglePictureInPicture'
  | 'seekStep'
  | 'volumeStep'
  | 'speedUp'
  | 'speedDown';

export interface MediaInputActionContext {
  store: AnyPlayerStore;
  /** The store state the input acted on, when it can differ from the current one. */
  state?: object | undefined;
  value?: number | undefined;
  key?: string | undefined;
}

export type MediaInputActionResolver = (context: MediaInputActionContext) => void;

/** Swallow a rejected promise, since input actions have no caller to report it to. */
export function ignoreRejection(result: unknown): void {
  if (isPromise(result)) result.catch(noop);
}

export const MEDIA_INPUT_ACTION_OVERRIDES: Record<MediaInputActionName, MediaInputActionResolver> = {
  // A tap fires a doubletap window after the click, and the click can start playback by itself, as Safari's start
  // button over a refused autoplay does, so a tap toggles from the state its pointer-down found.
  togglePaused({ store, state = store.state }) {
    const playback = selectPlayback(state);
    if (!playback) return;

    // A pending autoplay counts as playing, so the toggle cancels it, as the play button does.
    ignoreRejection(playback.paused && !playback.autoplaying ? playback.play() : playback.pause());
  },

  toggleMuted({ store }) {
    const volume = selectVolume(store.state);
    if (!volume) return;

    // Volume 0 reads as muted, so the toggle unmutes it rather than muting again.
    volume.setMuted(!(volume.muted || volume.volume === 0));
  },

  toggleFullscreen({ store }) {
    const fullscreen = selectFullscreen(store.state);
    if (!fullscreen) return;

    ignoreRejection(fullscreen.isFullscreen ? fullscreen.exitFullscreen() : fullscreen.requestFullscreen());
  },

  togglePictureInPicture({ store }) {
    const pip = selectPiP(store.state);
    if (!pip) return;

    ignoreRejection(pip.isPictureInPicture ? pip.exitPictureInPicture() : pip.requestPictureInPicture());
  },

  seekStep({ store, value, key }) {
    const step = getMediaInputActionValue('seekStep', key, value)!;

    const time = selectTime(store.state);
    if (!time) return;

    time.seek(time.currentTime + step);
  },

  volumeStep({ store, value, key }) {
    const step = getMediaInputActionValue('volumeStep', key, value)!;

    const vol = selectVolume(store.state);
    if (!vol) return;

    vol.setVolume(vol.volume + step);
  },

  speedUp({ store }) {
    const rate = selectPlaybackRate(store.state);
    if (!rate) return;

    const { playbackRates, playbackRate } = rate;
    const idx = playbackRates.indexOf(playbackRate);
    const next = idx < 0 || idx >= playbackRates.length - 1 ? 0 : idx + 1;

    rate.setPlaybackRate(playbackRates[next]!);
  },

  speedDown({ store }) {
    const rate = selectPlaybackRate(store.state);
    if (!rate) return;

    const { playbackRates, playbackRate } = rate;
    const idx = playbackRates.indexOf(playbackRate);
    const next = idx <= 0 ? playbackRates.length - 1 : idx - 1;

    rate.setPlaybackRate(playbackRates[next]!);
  },
};
