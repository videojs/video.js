import { isFunction } from '@videojs/utils/predicate';

import type { GestureActionName } from '../../core/ui/gesture/core';
import { ignoreRejection, MEDIA_INPUT_ACTION_OVERRIDES } from '../media-actions';
import type { AnyPlayerStore } from '../player';
import { selectPlayback } from '../store/selectors';

export type { GestureActionName } from '../../core/ui/gesture/core';

/** @internal */
export interface GestureActionContext {
  store: AnyPlayerStore;
  value?: number | undefined;
  event: PointerEvent;
}

/** @internal */
export type GestureActionResolver = (context: GestureActionContext) => void;

// Whether each tap found the media paused. A tap fires a doubletap window after the click, and the click can start
// playback by itself: Safari resumes an autoplay it held back on any user gesture. Toggling from the later state would
// pause what the user meant to play.
const pausedOnTap = new WeakMap<PointerEvent, boolean>();

function isPlaybackPaused(store: AnyPlayerStore): boolean | undefined {
  const playback = selectPlayback(store.state);

  // A pending autoplay counts as playing, as it does for the play button.
  return playback && playback.paused && !playback.autoplaying;
}

/** Actions that read state on the tap's pointer-up, before the tap fires. */
const GESTURE_ACTION_PREPARERS: Partial<Record<GestureActionName, GestureActionResolver>> = {
  togglePaused({ store, event }) {
    const paused = isPlaybackPaused(store);

    if (paused !== undefined) pausedOnTap.set(event, paused);
  },
};

/** Actions that need custom logic beyond `store.state[action]()`. */
const GESTURE_ACTION_OVERRIDES: Partial<Record<GestureActionName, GestureActionResolver>> = {
  togglePaused({ store, event }) {
    const playback = selectPlayback(store.state);
    if (!playback) return;

    const paused = pausedOnTap.get(event) ?? isPlaybackPaused(store);

    ignoreRejection(paused ? playback.play() : playback.pause());
  },

  toggleMuted: MEDIA_INPUT_ACTION_OVERRIDES.toggleMuted,

  toggleFullscreen: MEDIA_INPUT_ACTION_OVERRIDES.toggleFullscreen,

  togglePictureInPicture: MEDIA_INPUT_ACTION_OVERRIDES.togglePictureInPicture,

  seekStep: MEDIA_INPUT_ACTION_OVERRIDES.seekStep,

  volumeStep: MEDIA_INPUT_ACTION_OVERRIDES.volumeStep,

  speedUp: MEDIA_INPUT_ACTION_OVERRIDES.speedUp,

  speedDown: MEDIA_INPUT_ACTION_OVERRIDES.speedDown,
};

/**
 * The step an action takes on the tap's pointer-up, if any. Pass it as the gesture's `onPointerUp`.
 *
 * @internal
 */
export function prepareGestureAction(name: GestureActionName | (string & {})): GestureActionResolver | undefined {
  return GESTURE_ACTION_PREPARERS[name as GestureActionName];
}

/** @internal */
export function resolveGestureAction(name: GestureActionName | (string & {})): GestureActionResolver | undefined {
  const override = GESTURE_ACTION_OVERRIDES[name as GestureActionName];
  if (override) return override;

  // Direct store method call — toggleSubtitles, toggleControls, etc.
  return ({ store }) => {
    const method = (store.state as Record<string, unknown>)[name];

    if (isFunction(method)) ignoreRejection(method());
    else if (__DEV__) console.warn(`[vjs-gesture] Unknown action: "${name}"`);
  };
}
