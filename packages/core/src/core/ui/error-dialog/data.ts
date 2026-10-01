import { DialogDataAttrs } from '../dialog/data';
import type { StateAttrMap } from '../types';
import type { ErrorDialogState } from './core';

/** @internal */
export const ErrorDialogDataAttrs = {
  ...DialogDataAttrs,
} as const satisfies StateAttrMap<ErrorDialogState>;
