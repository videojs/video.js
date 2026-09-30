'use client';

import { ErrorDialogCore, ErrorDialogDataAttrs } from '@videojs/core';
import { selectError } from '@videojs/core/dom';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { useContainer, usePlayer } from '../../player/context';
import { useLatestRef } from '../../utils/use-latest-ref';
import { DialogContextProvider } from '../dialog/context';
import { useDialogRoot } from '../dialog/use-dialog-root';
import { ErrorDialogContextProvider } from './context';

export interface ErrorDialogRootProps {
  children?: ReactNode;
}

/** Opens from player error state and provides it to the shared dialog parts. */
export function ErrorDialogRoot({ children }: ErrorDialogRootProps): ReactNode {
  const errorState = usePlayer(selectError);
  const container = useContainer();
  // Keep the last error so the dialog can finish its close transition with content after the error clears. Adjusting
  // state during render is the sanctioned way to derive it from props; writing a ref here would be invisible to React.
  const [lastError, setLastError] = useState(errorState?.error ?? null);

  if (errorState?.error && errorState.error !== lastError) setLastError(errorState.error);

  const errorStateRef = useLatestRef(errorState);
  const dialogContext = useDialogRoot({
    open: Boolean(errorState?.error),
    onOpenChange(nextOpen) {
      if (!nextOpen) errorStateRef.current?.dismissError();
    },
    coreFactory: createErrorDialogCore,
    stateAttrMap: ErrorDialogDataAttrs,
    idPrefix: 'error-dialog',
    interactionRoot: container,
  });

  if (!errorState) return null;

  return (
    <ErrorDialogContextProvider value={{ lastError }}>
      <DialogContextProvider value={dialogContext}>{children}</DialogContextProvider>
    </ErrorDialogContextProvider>
  );
}

function createErrorDialogCore(): ErrorDialogCore {
  return new ErrorDialogCore();
}

export namespace ErrorDialogRoot {
  export type Props = ErrorDialogRootProps;
}
