'use client';

import { resolveErrorDialogDescription, type DialogState } from '@videojs/core';
import { translateText } from '@videojs/core/i18n';
import { forwardRef, type ReactNode } from 'react';

import { useTranslator } from '../../i18n/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useDialogContext } from '../dialog/context';
import { useErrorDialogContext } from './context';

export interface ErrorDialogDescriptionProps extends UIComponentProps<'p', DialogState> {}

/** Renders the localized playback error message, or authored children when provided. */
export const ErrorDialogDescription = forwardRef<HTMLParagraphElement, ErrorDialogDescriptionProps>(
  function ErrorDialogDescription({ render, className, style, children, ...elementProps }, forwardedRef) {
    const t = useTranslator();
    const { state, stateAttrMap } = useDialogContext();
    const { lastError } = useErrorDialogContext();
    const description = resolveErrorDialogDescription(lastError);
    const content: ReactNode = children ?? translateText(description, t);

    return renderElement(
      'p',
      { render, className, style },
      {
        state,
        stateAttrMap,
        ref: forwardedRef,
        props: [{ id: state.descriptionId, children: content }, elementProps],
      }
    );
  }
);

export namespace ErrorDialogDescription {
  export type Props = ErrorDialogDescriptionProps;
  export type State = DialogState;
}
