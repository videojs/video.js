import type { StateAttrMap } from '../types';
import type { DialogState } from './core';

/** @internal */
export const DialogDataAttrs = {
  /** Present when the dialog is open. */
  open: 'data-open',
  /** Present during the open transition. */
  transitionStarting: 'data-starting-style',
  /** Present during the close transition. */
  transitionEnding: 'data-ending-style',
} as const satisfies StateAttrMap<DialogState>;
