import type { StateAttrMap } from '../types';
import type { PlayButtonState } from './core';

/** @internal */
export const PlayButtonDataAttrs = {
  /** Present when the media is paused. */
  paused: 'data-paused',
  /** Present when the media has ended. */
  ended: 'data-ended',
  /** Present when playback has started. */
  started: 'data-started',
} as const satisfies StateAttrMap<PlayButtonState>;
