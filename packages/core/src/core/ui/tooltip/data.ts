import { TransitionDataAttrs } from '../transition';
import type { StateAttrMap } from '../types';
import type { TooltipState } from './core';

/** @internal */
export const TooltipDataAttrs = {
  /** Present when the tooltip is open. */
  open: 'data-open',
  /** Indicates the rendered side of the tooltip after collision handling. */
  side: 'data-side',
  /** Indicates how the tooltip is aligned relative to the specified side. */
  align: 'data-align',
  ...TransitionDataAttrs,
} as const satisfies StateAttrMap<TooltipState>;
