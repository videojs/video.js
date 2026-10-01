'use client';

import type { DialogState } from '@videojs/core';

import type { UIComponentProps } from '../../utils/types';
import { createContextPart } from '../create-context-part';
import { useDialogContext } from './context';

export interface DialogDescriptionProps extends UIComponentProps<'p', DialogState> {}

/** Renders the description announced with the dialog. */
export const DialogDescription = createContextPart<DialogDescriptionProps, DialogState>({
  displayName: 'DialogDescription',
  tag: 'p',
  useContext: useDialogContext,
  getProps: (state) => ({ id: state.descriptionId }),
});

export namespace DialogDescription {
  export type Props = DialogDescriptionProps;
  export type State = DialogState;
}
