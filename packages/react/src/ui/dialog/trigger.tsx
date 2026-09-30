'use client';

import type { DialogCore } from '@videojs/core';
import { forwardRef, useCallback } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useDialogContext } from './context';

export interface DialogTriggerProps extends UIComponentProps<'button', DialogCore.State> {}

/** Renders a button that opens the dialog. */
export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(function DialogTrigger(
  { render, className, style, ...elementProps },
  forwardedRef
) {
  const { core, dialog, state, stateAttrMap, popupId } = useDialogContext();

  const triggerRef = useCallback((element: HTMLButtonElement | null) => dialog.setTriggerElement(element), [dialog]);

  return renderElement(
    'button',
    { render, className, style },
    {
      state,
      stateAttrMap,
      ref: [forwardedRef, triggerRef],
      props: [{ type: 'button' as const, ...core.getTriggerAttrs(state, popupId) }, dialog.triggerProps, elementProps],
    }
  );
});

export namespace DialogTrigger {
  export type Props = DialogTriggerProps;
  export type State = DialogCore.State;
}
