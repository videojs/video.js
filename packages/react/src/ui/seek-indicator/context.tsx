'use client';

import type { SeekIndicatorState } from '@videojs/core';
import { createContext, type ProviderProps, useContext } from 'react';

export interface SeekIndicatorContextValue {
  state: SeekIndicatorState;
}

const SeekIndicatorContext = createContext<SeekIndicatorContextValue | null>(null);

export function SeekIndicatorProvider({ value, children }: ProviderProps<SeekIndicatorContextValue>) {
  return <SeekIndicatorContext.Provider value={value}>{children}</SeekIndicatorContext.Provider>;
}

export function useSeekIndicatorContext(): SeekIndicatorContextValue {
  const ctx = useContext(SeekIndicatorContext);
  if (!ctx) throw new Error('SeekIndicator child compounds must be used within a SeekIndicator.Root');

  return ctx;
}
