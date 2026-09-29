import { getTimeRangeEnd } from '@videojs/media';
import { isUndefined } from '@videojs/utils/predicate';

import type { HotkeyActionName } from '../../core/ui/hotkey/core';
import { MEDIA_INPUT_ACTION_OVERRIDES } from '../media-actions';
import type { AnyPlayerStore } from '../player';
import { selectBuffer, selectTextTrack, selectTime } from '../store/selectors';

export type { HotkeyActionName } from '../../core/ui/hotkey/core';

export interface HotkeyActionContext {
  store: AnyPlayerStore;
  value?: number | undefined;
  /** The matched key character (used by `seekToPercent` to derive digit). */
  key: string;
}

export type HotkeyActionResolver = (context: HotkeyActionContext) => void;

export function isHotkeyToggleAction(action: string): boolean {
  return action.startsWith('toggle');
}

const HOTKEY_ACTIONS: Record<HotkeyActionName, HotkeyActionResolver> = {
  togglePaused: MEDIA_INPUT_ACTION_OVERRIDES.togglePaused,

  toggleMuted: MEDIA_INPUT_ACTION_OVERRIDES.toggleMuted,

  toggleFullscreen: MEDIA_INPUT_ACTION_OVERRIDES.toggleFullscreen,

  toggleSubtitles({ store }) {
    selectTextTrack(store.state)?.toggleSubtitles();
  },

  togglePictureInPicture: MEDIA_INPUT_ACTION_OVERRIDES.togglePictureInPicture,

  seekStep: MEDIA_INPUT_ACTION_OVERRIDES.seekStep,

  volumeStep: MEDIA_INPUT_ACTION_OVERRIDES.volumeStep,

  speedUp: MEDIA_INPUT_ACTION_OVERRIDES.speedUp,

  speedDown: MEDIA_INPUT_ACTION_OVERRIDES.speedDown,

  seekToPercent({ store, value, key }) {
    const time = selectTime(store.state);
    if (!time) return;

    const buffer = selectBuffer(store.state);
    const duration = getTimeRangeEnd({ duration: time.duration, seekable: buffer?.seekable ?? [] });
    if (duration <= 0) return;

    let percent: number;

    if (!isUndefined(value)) {
      percent = value;
    } else if (key >= '0' && key <= '9') {
      percent = Number(key) * 10;
    } else {
      return;
    }

    time.seek((percent / 100) * duration);
  },
};

export function resolveHotkeyAction(name: string): HotkeyActionResolver | undefined {
  const resolver = HOTKEY_ACTIONS[name as HotkeyActionName];

  if (__DEV__ && !resolver) {
    console.warn(`[vjs-hotkey] Unknown action: "${name}"`);
  }

  return resolver;
}
