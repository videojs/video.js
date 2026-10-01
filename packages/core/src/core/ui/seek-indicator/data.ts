import type { StateAttrMap } from '../types';
import type { SeekIndicatorState } from './core';

/** @internal */
export const SeekIndicatorDataAttrs = {
  /** Present while the indicator is open. */
  open: 'data-open',
  /** Direction of the seek as `"forward"` or `"backward"`. */
  direction: 'data-direction',
  /** Present during the open transition. */
  transitionStarting: 'data-starting-style',
  /** Present during the close transition. */
  transitionEnding: 'data-ending-style',
} as const satisfies StateAttrMap<SeekIndicatorState>;
