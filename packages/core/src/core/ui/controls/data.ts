import type { StateAttrMap } from '../types';
import type { ControlsState } from './core';

/** @internal */
export const ControlsDataAttrs = {
  /** Present when controls are visible. */
  visible: 'data-visible',
  /** Present when the user has recently interacted. */
  userActive: 'data-user-active',
  /** Present when playback has started or the media is trying to autoplay. */
  started: 'data-started',
} as const satisfies StateAttrMap<ControlsState>;
