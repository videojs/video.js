import type { StateAttrMap } from '../types';
import type { CaptionsButtonState } from './core';

/** @internal */
export const CaptionsButtonDataAttrs = {
  /** Present when captions are enabled. */
  subtitlesShowing: 'data-active',
  /** Indicates captions availability (`available` or `unavailable`). */
  availability: 'data-availability',
  /** Present when the button is non-interactive (mirrors `aria-disabled`). */
  disabled: 'data-disabled',
  /** Present when the button is hidden because no caption tracks are present. */
  hidden: 'data-hidden',
} as const satisfies StateAttrMap<CaptionsButtonState>;
