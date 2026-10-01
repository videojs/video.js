import type { StateAttrMap } from '../types';
import type { StatusIndicatorState } from './core';

/** @internal */
export const StatusIndicatorDataAttrs = {
  /** Present while the indicator is open. */
  open: 'data-open',
  /** Predicted visual status for the handled input action. */
  status: 'data-status',
  /** Present during the open transition. */
  transitionStarting: 'data-starting-style',
  /** Present during the close transition. */
  transitionEnding: 'data-ending-style',
} as const satisfies StateAttrMap<StatusIndicatorState>;
