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

// Whether the media was paused at the last pointer-down. A tap fires a doubletap window after the click, and the click
// can start playback by itself, as Safari's start button over a refused autoplay does; toggling then would pause it.
const pausedOnPointerDown = new WeakMap<AnyPlayerStore, boolean>();

/**
 * Record what a `togglePaused` tap should do, before the click can change it. Pass it as the gesture's `onPointerDown`.
 *
 * @internal
 */
export function captureTogglePaused(store: AnyPlayerStore): void {
  const playback = selectPlayback(store.state);

  // A pending autoplay counts as playing, as it does for the play button.
  if (playback) pausedOnPointerDown.set(store, playback.paused && !playback.autoplaying);
}

/** Actions that need custom logic beyond `store.state[action]()`. */
const GESTURE_ACTION_OVERRIDES: Partial<Record<GestureActionName, GestureActionResolver>> = {
  togglePaused(context) {
    const { store } = context;
    const playback = selectPlayback(store.state);
    const paused = pausedOnPointerDown.get(store);

    pausedOnPointerDown.delete(store);

    if (!playback || paused === undefined) return MEDIA_INPUT_ACTION_OVERRIDES.togglePaused(context);

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
