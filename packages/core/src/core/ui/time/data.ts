import type { StateAttrMap } from '../types';
import type { TimeState } from './core';

/** @internal */
export const TimeDataAttrs = {
  /** The type of time being displayed. */
  type: 'data-type',
  /** Present when the time toggle is disabled. */
  disabled: 'data-disabled',
  /** Present when the non-interactive time value is unavailable. */
  unavailable: 'data-unavailable',
} as const satisfies StateAttrMap<TimeState>;
