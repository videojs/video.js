import type { StateAttrMap } from '../types';
import type { AudioTrackRadioGroupState } from './core';

/** @internal */
export const AudioTrackRadioGroupDataAttrs = {
  /** Current audio track value. */
  value: 'data-audio-track',
  /** Present when audio track selection is disabled. */
  disabled: 'data-disabled',
  /** Present when audio track selection is unavailable. */
  hidden: 'data-hidden',
  /** Indicates audio track availability (`available` or `unavailable`). */
  availability: 'data-availability',
} as const satisfies StateAttrMap<AudioTrackRadioGroupState>;
