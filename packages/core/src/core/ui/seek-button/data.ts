import type { StateAttrMap } from '../types';
import type { SeekButtonState } from './core';

/** @internal */
export const SeekButtonDataAttrs = {
  /** Present when a seek is in progress. */
  seeking: 'data-seeking',
  /** Indicates the seek direction: `"forward"` or `"backward"`. */
  direction: 'data-direction',
} as const satisfies StateAttrMap<SeekButtonState>;
