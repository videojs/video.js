import { isFunction } from '@videojs/utils/predicate';

import type { GestureActionName } from '../../core/ui/gesture/core';
import { ignoreRejection, MEDIA_INPUT_ACTION_OVERRIDES } from '../media-actions';
import type { AnyPlayerStore } from '../player';
import { selectControls, selectPlayback } from '../store/selectors';

export type { GestureActionName } from '../../core/ui/gesture/core';

/** @internal */
export interface GestureActionContext {
  store: AnyPlayerStore;
  value?: number | undefined;
  event: PointerEvent;
}

/** @internal */
export type GestureActionResolver = (context: GestureActionContext) => void;

/** Actions that need custom logic beyond `store.state[action]()`. */
const GESTURE_ACTION_OVERRIDES: Partial<Record<GestureActionName, GestureActionResolver>> = {
  togglePaused: MEDIA_INPUT_ACTION_OVERRIDES.togglePaused,

  // Lets a touch tap start paused media, where toggling the always-visible controls would do nothing.
  playOrToggleControls({ store }) {
    const playback = selectPlayback(store.state);

    if (playback?.paused) {
      ignoreRejection(playback.play());
      return;
    }

    selectControls(store.state)?.toggleControls();
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
