import type { StateAttrMap } from '../types';
import type { VolumeIndicatorState } from './core';

/** @internal */
export const VolumeIndicatorDataAttrs = {
  /** Present while the indicator is open. */
  open: 'data-open',
  /** Predicted volume level as `"off"`, `"low"`, or `"high"`. */
  level: 'data-level',
  /** Present briefly when a downward step cannot lower the volume further. */
  min: 'data-min',
  /** Present briefly when an upward step cannot raise the volume further. */
  max: 'data-max',
  /** Present during the open transition. */
  transitionStarting: 'data-starting-style',
  /** Present during the close transition. */
  transitionEnding: 'data-ending-style',
} as const satisfies StateAttrMap<VolumeIndicatorState>;
