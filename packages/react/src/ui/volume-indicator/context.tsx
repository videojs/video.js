'use client';

import type { VolumeIndicatorCore } from '@videojs/core';
import { createContext, type ProviderProps, useContext } from 'react';

export interface VolumeIndicatorContextValue {
  state: VolumeIndicatorCore.State;
}

const VolumeIndicatorContext = createContext<VolumeIndicatorContextValue | null>(null);

export function VolumeIndicatorProvider({ value, children }: ProviderProps<VolumeIndicatorContextValue>) {
  return <VolumeIndicatorContext.Provider value={value}>{children}</VolumeIndicatorContext.Provider>;
}

export function useVolumeIndicatorContext(): VolumeIndicatorContextValue {
  const ctx = useContext(VolumeIndicatorContext);
  if (!ctx) throw new Error('VolumeIndicator child compounds must be used within a VolumeIndicator.Root');

  return ctx;
}
