import { DialogCore, type DialogInput, type DialogProps, type DialogState } from '../dialog/core';

export interface AlertDialogProps extends DialogProps {}
/** @internal */
export interface AlertDialogInput extends DialogInput {}
/** @internal */
export interface AlertDialogState extends DialogState {}

/**
 * A dialog with alert semantics for urgent messages that require acknowledgement.
 *
 * @internal
 */
export class AlertDialogCore extends DialogCore {
  constructor() {
    super('alertdialog');
  }
}

/** @internal */
export namespace AlertDialogCore {
  export type Props = AlertDialogProps;
  export type State = AlertDialogState;
  export type Input = AlertDialogInput;
}
