import type { StateAttrMap } from '../types';
import type { CaptionsRadioGroupState } from './core';

/** @internal */
export const CaptionsRadioGroupDataAttrs = {
  /** Present when captions are enabled. */
  subtitlesShowing: 'data-active',
  /** Present when track selection is disabled. */
  disabled: 'data-disabled',
  /** Present when track selection is unavailable. */
  hidden: 'data-hidden',
  /** Indicates captions availability (`available` or `unavailable`). */
  availability: 'data-availability',
} as const satisfies StateAttrMap<CaptionsRadioGroupState>;
