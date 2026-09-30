'use client';

import type { TooltipGroupCore } from '@videojs/core';
import { createContext, useContext } from 'react';

interface TooltipGroupContextValue {
  group: TooltipGroupCore;
}

const TooltipGroupContext = createContext<TooltipGroupContextValue | null>(null);

export const TooltipGroupContextProvider = TooltipGroupContext.Provider;

/** Returns the nearest `TooltipGroupCore`, or `undefined` when used outside a `Tooltip.Provider`. */
export function useTooltipGroup(): TooltipGroupCore | undefined {
  return useContext(TooltipGroupContext)?.group;
}
