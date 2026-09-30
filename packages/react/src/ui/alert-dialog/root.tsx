'use client';

import { AlertDialogCore, AlertDialogDataAttrs, type AlertDialogProps } from '@videojs/core';
import type { ReactNode } from 'react';

import { DialogContextProvider } from '../dialog/context';
import { useDialogRoot } from '../dialog/use-dialog-root';

export interface AlertDialogRootProps extends AlertDialogProps {
  /** Called when the open state changes, before animations complete. */
  onOpenChange?: (open: boolean) => void;
  /** Called after open or close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void;
  children?: ReactNode;
}

/** Manages alert dialog state and provides it to the shared dialog parts. */
export function AlertDialogRoot({ children, ...props }: AlertDialogRootProps): ReactNode {
  const context = useDialogRoot({
    ...props,
    coreFactory: createAlertDialogCore,
    stateAttrMap: AlertDialogDataAttrs,
    idPrefix: 'alert-dialog',
  });

  return <DialogContextProvider value={context}>{children}</DialogContextProvider>;
}

function createAlertDialogCore(): AlertDialogCore {
  return new AlertDialogCore();
}

export namespace AlertDialogRoot {
  export type Props = AlertDialogRootProps;
}
