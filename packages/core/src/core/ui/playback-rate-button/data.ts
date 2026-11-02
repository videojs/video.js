import type { StateAttrMap } from '../types';
import type { PlaybackRateButtonState } from './core';

/** @internal */
export const PlaybackRateButtonDataAttrs = {
  /** Current playback rate. */
  rate: 'data-rate',
  /** Indicates playback rate availability (`available`, `unavailable`, `unsupported`). */
  availability: 'data-availability',
  /** Present when the button is hidden because the media has no playback rate to change. */
  hidden: 'data-hidden',
} as const satisfies StateAttrMap<PlaybackRateButtonState>;
