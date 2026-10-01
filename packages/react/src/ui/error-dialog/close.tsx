'use client';

import { getErrorDialogDismissText, type DialogState } from '@videojs/core';
import { translateText } from '@videojs/core/i18n';
import { forwardRef, type ReactNode, useCallback } from 'react';

import { useTranslator } from '../../i18n/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useDialogContext } from '../dialog/context';

export interface ErrorDialogCloseProps extends UIComponentProps<'button', DialogState> {}

/** Renders a localized button that closes the dialog and dismisses the player error. */
export const ErrorDialogClose = forwardRef<HTMLButtonElement, ErrorDialogCloseProps>(function ErrorDialogClose(
  { render, className, style, disabled, children, ...elementProps },
  forwardedRef
) {
  const t = useTranslator();
  const { dialog, state, stateAttrMap } = useDialogContext();

  const handleClick = useCallback(() => {
    if (disabled) return;

    dialog.close();
  }, [dialog, disabled]);

  const content: ReactNode = children ?? translateText(getErrorDialogDismissText(), t);

  return renderElement(
    'button',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: forwardedRef,
      props: [{ type: 'button' as const, disabled, onClick: handleClick, children: content }, elementProps],
    }
  );
});

export namespace ErrorDialogClose {
  export type Props = ErrorDialogCloseProps;
  export type State = DialogState;
}
