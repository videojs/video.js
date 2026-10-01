'use client';

import type { DialogState } from '@videojs/core';

import type { UIComponentProps } from '../../utils/types';
import { createContextPart } from '../create-context-part';
import { useDialogContext } from './context';

export interface DialogTitleProps extends UIComponentProps<'h2', DialogState> {}

/** Renders the heading that labels the dialog. */
export const DialogTitle = createContextPart<DialogTitleProps, DialogState>({
  displayName: 'DialogTitle',
  tag: 'h2',
  useContext: useDialogContext,
  getProps: (state) => ({ id: state.titleId }),
});

export namespace DialogTitle {
  export type Props = DialogTitleProps;
  export type State = DialogState;
}
