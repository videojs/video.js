'use client';

import type { ControlsState, StateAttrMap } from '@videojs/core';
import { createContext, useContext } from 'react';

export interface ControlsContextValue {
  state: ControlsState;
  stateAttrMap: StateAttrMap<ControlsState>;
}

const ControlsContext = createContext<ControlsContextValue | null>(null);

export const ControlsContextProvider = ControlsContext.Provider;

export function useControlsContext(): ControlsContextValue {
  const ctx = useContext(ControlsContext);
  if (!ctx) throw new Error('Controls compound components must be used within a Controls.Root');

  return ctx;
}

export function useOptionalControlsContext(): ControlsContextValue | null {
  return useContext(ControlsContext);
}
