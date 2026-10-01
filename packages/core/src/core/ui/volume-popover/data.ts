import type { StateAttrMap } from '../types';
import type { VolumePopoverState } from './core';

/** @internal */
export const VolumePopoverDataAttrs = {
  /** Present when the popover is open. */
  open: 'data-open',
  /** Indicates the rendered side after collision handling. */
  side: 'data-side',
  /** Indicates how the popup is aligned relative to its side. */
  align: 'data-align',
  /** Present during the open transition. */
  transitionStarting: 'data-starting-style',
  /** Present during the close transition. */
  transitionEnding: 'data-ending-style',
  /** Indicates volume control availability (`available`, `unavailable`, or `unsupported`). */
  availability: 'data-availability',
  /** Present when volume level controls are unavailable. */
  hidden: 'data-hidden',
} as const satisfies StateAttrMap<VolumePopoverState>;
