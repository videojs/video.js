'use client';

import type { VolumePopoverState } from '@videojs/core';
import { createContext, useContext } from 'react';

export interface VolumePopoverContextValue {
  state: VolumePopoverState;
}

const VolumePopoverContext = createContext<VolumePopoverContextValue | null>(null);

export const VolumePopoverContextProvider = VolumePopoverContext.Provider;

export function useVolumePopoverContext(): VolumePopoverContextValue {
  const context = useContext(VolumePopoverContext);
  if (!context) throw new Error('VolumePopover compound components must be used within a VolumePopover.Root');

  return context;
}
