'use client';

import type { StateAttrMap, TooltipCore, TooltipState } from '@videojs/core';
import type { MediaContainer, PositioningBoundary, TooltipApi } from '@videojs/core/dom';
import { createContext, useContext } from 'react';

/** @internal */
export interface TooltipContent {
  label?: string | undefined;
  shortcut?: string | undefined;
}

/** @internal */
export interface TooltipContextValue {
  core: TooltipCore;
  tooltip: TooltipApi;
  state: TooltipState;
  preferredSide: TooltipState['side'];
  setPositionedSide: (side: TooltipState['side']) => void;
  stateAttrMap: StateAttrMap<TooltipState>;
  anchorName: string;
  popupId: string;
  content: TooltipContent | undefined;
  setContent: (content: TooltipContent | undefined) => void;
  boundary: PositioningBoundary;
  container: MediaContainer | null;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export const TooltipContextProvider = TooltipContext.Provider;

/**
 * Returns the current tooltip compound-component context. Throws outside `Tooltip.Root`.
 *
 * @internal
 */
export function useTooltipContext(): TooltipContextValue {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error('Tooltip compound components must be used within a Tooltip.Root');

  return ctx;
}

export function useOptionalTooltipContext(): TooltipContextValue | null {
  return useContext(TooltipContext);
}
