import type { NonNullableObject } from '@videojs/utils/types';

import type { TransitionFlags, TransitionState, TransitionStatus } from '../transition';
import { getTransitionFlags } from '../transition';

/** @internal */
export type DialogRole = 'dialog' | 'alertdialog';

export interface DialogProps {
  /** Controlled open state. When set, the consumer is responsible for toggling. */
  open?: boolean | undefined;
  /** Initial open state for uncontrolled usage. */
  defaultOpen?: boolean | undefined;
  /** Whether pressing Escape closes the dialog. */
  closeOnEscape?: boolean | undefined;
}

/** @internal */
export interface DialogInput extends TransitionState {}

export interface DialogState extends TransitionFlags {
  /** Whether the dialog is currently open. */
  open: boolean;
  /** Current phase of the transition lifecycle. */
  status: TransitionStatus;
  /** Element ID of the dialog title, used for `aria-labelledby`. */
  titleId: string | undefined;
  /** Element ID of the dialog description, used for `aria-describedby`. */
  descriptionId: string | undefined;
}

/** @internal */
export class DialogCore {
  static readonly defaultProps: NonNullableObject<DialogProps> = {
    open: false,
    defaultOpen: false,
    closeOnEscape: true,
  };

  readonly #role: DialogRole;
  #input: DialogInput | null = null;
  #titleId: string | undefined = undefined;
  #descriptionId: string | undefined = undefined;
  #documentModal = true;

  constructor(role: DialogRole = 'dialog') {
    this.#role = role;
  }

  /** Accept props for API consistency. Props are consumed by platform layers. */
  setProps(_props: DialogProps): void {}

  setInput(input: DialogInput): void {
    this.#input = input;
  }

  setTitleId(id: string | undefined): void {
    this.#titleId = id;
  }

  setDescriptionId(id: string | undefined): void {
    this.#descriptionId = id;
  }

  setDocumentModal(documentModal: boolean): void {
    this.#documentModal = documentModal;
  }

  getState(): DialogState {
    const input = this.#input!;

    return {
      open: input.active,
      status: input.status,
      titleId: this.#titleId,
      descriptionId: this.#descriptionId,
      ...getTransitionFlags(input.status),
    };
  }

  getTriggerAttrs(state: DialogState, popupId?: string) {
    return {
      'aria-expanded': state.open && state.status !== 'ending' ? 'true' : 'false',
      'aria-haspopup': 'dialog' as const,
      'aria-controls': popupId,
    };
  }

  getPopupAttrs(state: DialogState) {
    return {
      role: this.#role,
      'aria-modal': this.#documentModal ? ('true' as const) : undefined,
      'aria-labelledby': state.titleId,
      'aria-describedby': state.descriptionId,
    };
  }
}

/** @internal */
export namespace DialogCore {
  export type Props = DialogProps;
  export type State = DialogState;
  export type Input = DialogInput;
}
