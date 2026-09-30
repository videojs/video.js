'use client';

import { type DialogCore, getErrorDialogTitleText } from '@videojs/core';
import { translateText } from '@videojs/core/i18n';
import { forwardRef, type ReactNode } from 'react';

import { useTranslator } from '../../i18n/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useDialogContext } from '../dialog/context';

export interface ErrorDialogTitleProps extends UIComponentProps<'h2', DialogCore.State> {}

/** Renders the localized error dialog heading, or authored children when provided. */
export const ErrorDialogTitle = forwardRef<HTMLHeadingElement, ErrorDialogTitleProps>(function ErrorDialogTitle(
  { render, className, style, children, ...elementProps },
  forwardedRef
) {
  const t = useTranslator();
  const { state, stateAttrMap } = useDialogContext();
  const content: ReactNode = children ?? translateText(getErrorDialogTitleText(), t);

  return renderElement(
    'h2',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: forwardedRef,
      props: [{ id: state.titleId, children: content }, elementProps],
    }
  );
});

export namespace ErrorDialogTitle {
  export type Props = ErrorDialogTitleProps;
  export type State = DialogCore.State;
}
