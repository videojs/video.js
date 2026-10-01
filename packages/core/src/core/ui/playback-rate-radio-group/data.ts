import type { StateAttrMap } from '../types';
import type { PlaybackRateRadioGroupState } from './core';

/** @internal */
export const PlaybackRateRadioGroupDataAttrs = {
  /** Current playback rate. */
  rate: 'data-rate',
  /** Present when playback rate selection is disabled. */
  disabled: 'data-disabled',
  /** Present when playback rate selection is unavailable. */
  hidden: 'data-hidden',
  /** Indicates playback rate availability (`available` or `unavailable`). */
  availability: 'data-availability',
} as const satisfies StateAttrMap<PlaybackRateRadioGroupState>;
