import { AlertDialogCore, type AlertDialogState } from '../alert-dialog/core';

/** @internal */
export interface ErrorDialogState extends AlertDialogState {}

/**
 * Error-dialog core: an alert dialog whose open state is driven by media error state.
 *
 * @internal
 */
export class ErrorDialogCore extends AlertDialogCore {
  override setProps(): void {}
}

/** @internal */
export namespace ErrorDialogCore {
  export type State = ErrorDialogState;
}
