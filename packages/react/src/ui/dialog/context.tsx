'use client';

import type { DialogCore, StateAttrMap } from '@videojs/core';
import type { DialogApi } from '@videojs/core/dom';
import { createContext, useContext } from 'react';

export interface DialogContextValue {
  core: DialogCore;
  dialog: DialogApi;
  state: DialogCore.State;
  stateAttrMap: StateAttrMap<DialogCore.State>;
  popupId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const DialogContextProvider = DialogContext.Provider;

/** Returns the current dialog compound-component context. Throws outside a dialog root. */
export function useDialogContext(): DialogContextValue {
  return useDialogContextFor('Dialog');
}

export function useDialogContextFor(componentName: string): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error(`${componentName} compound components must be used within a ${componentName}.Root`);

  return ctx;
}
