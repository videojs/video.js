'use client';

import type { DialogCore } from '@videojs/core';
import { forwardRef, useCallback } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useDialogContext } from './context';

export interface DialogPopupProps extends UIComponentProps<'div', DialogCore.State> {}

/** Renders the modal dialog while it is open. */
export const DialogPopup = forwardRef<HTMLDivElement, DialogPopupProps>(function DialogPopup(
  { render, className, style, ...elementProps },
  forwardedRef
) {
  const { core, dialog, state, stateAttrMap, popupId } = useDialogContext();

  const popupRef = useCallback((element: HTMLDivElement | null) => dialog.setPopupElement(element), [dialog]);

  if (!state.open) return null;

  return renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: [forwardedRef, popupRef],
      props: [{ id: popupId, tabIndex: -1, ...core.getPopupAttrs(state) }, elementProps],
    }
  );
});

export namespace DialogPopup {
  export type Props = DialogPopupProps;
  export type State = DialogCore.State;
}
