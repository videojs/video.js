import { TransitionDataAttrs } from '../transition';
import type { StateAttrMap } from '../types';
import type { PopoverState } from './core';

/** @internal */
export const PopoverDataAttrs = {
  /** Present when the popover is open. */
  open: 'data-open',
  /** Indicates the rendered side of the popover after collision handling. */
  side: 'data-side',
  /** Indicates how the popover is aligned relative to the specified side. */
  align: 'data-align',
  ...TransitionDataAttrs,
} as const satisfies StateAttrMap<PopoverState>;
