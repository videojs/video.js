'use client';

import type { PopoverCore, StateAttrMap } from '@videojs/core';
import type { MediaContainer, PopoverApi, PositioningBoundary } from '@videojs/core/dom';
import { createContext, useContext } from 'react';

export interface PopoverContextValue {
  core: PopoverCore;
  popover: PopoverApi;
  state: PopoverCore.State;
  preferredSide: PopoverCore.State['side'];
  setPositionedSide: (side: PopoverCore.State['side']) => void;
  stateAttrMap: StateAttrMap<PopoverCore.State>;
  anchorName: string;
  popupId: string;
  boundary: PositioningBoundary;
  container: MediaContainer | null;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

export const PopoverContextProvider = PopoverContext.Provider;

/** Returns the current popover compound-component context. Throws outside `Popover.Root`. */
export function usePopoverContext(): PopoverContextValue {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('Popover compound components must be used within a Popover.Root');

  return ctx;
}
