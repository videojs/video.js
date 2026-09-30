'use client';

import { DialogCore, type DialogProps } from '@videojs/core';
import type { ReactNode } from 'react';

import { DialogContextProvider } from './context';
import { useDialogRoot } from './use-dialog-root';

export interface DialogRootProps extends DialogProps {
  /** Called when the open state changes, before animations complete. */
  onOpenChange?: (open: boolean) => void;
  /** Called after open or close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void;
  children?: ReactNode;
}

/** Manages dialog state and provides it to the compound parts. */
export function DialogRoot(props: DialogRootProps): ReactNode {
  const context = useDialogRoot({ ...props, coreFactory: createDialogCore });

  return <DialogContextProvider value={context}>{props.children}</DialogContextProvider>;
}

function createDialogCore(): DialogCore {
  return new DialogCore();
}

export namespace DialogRoot {
  export type Props = DialogRootProps;
}
