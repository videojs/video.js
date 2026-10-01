'use client';

import type { StatusIndicatorState } from '@videojs/core';
import { createContext, type ProviderProps, useContext } from 'react';

export interface StatusIndicatorContextValue {
  state: StatusIndicatorState;
}

const StatusIndicatorContext = createContext<StatusIndicatorContextValue | null>(null);

export function StatusIndicatorProvider({ value, children }: ProviderProps<StatusIndicatorContextValue>) {
  return <StatusIndicatorContext.Provider value={value}>{children}</StatusIndicatorContext.Provider>;
}

export function useStatusIndicatorContext(): StatusIndicatorContextValue {
  const ctx = useContext(StatusIndicatorContext);
  if (!ctx) throw new Error('StatusIndicator child compounds must be used within a StatusIndicator.Root');

  return ctx;
}
