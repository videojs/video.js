'use client';

import type { ErrorLike } from '@videojs/media';
import { createContext, useContext } from 'react';

export interface ErrorDialogContextValue {
  lastError: ErrorLike | null;
}

const ErrorDialogContext = createContext<ErrorDialogContextValue | null>(null);

export const ErrorDialogContextProvider = ErrorDialogContext.Provider;

/** Returns the current error dialog compound-component context. Throws outside `ErrorDialog.Root`. */
export function useErrorDialogContext(): ErrorDialogContextValue {
  const ctx = useContext(ErrorDialogContext);
  if (!ctx) throw new Error('ErrorDialog compound components must be used within an ErrorDialog.Root');

  return ctx;
}
