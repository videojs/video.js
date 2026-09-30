'use client';

import { type PosterImageLoadState, type PosterState } from '@videojs/core';
import { createContext, type ProviderProps, useContext } from 'react';

export interface PosterContextValue {
  state: PosterState;
  setImageLoadState: (state: PosterImageLoadState) => void;
}

const PosterContext = createContext<PosterContextValue | null>(null);

export function PosterProvider({ value, children }: ProviderProps<PosterContextValue>) {
  return <PosterContext.Provider value={value}>{children}</PosterContext.Provider>;
}

export function usePosterContext(): PosterContextValue {
  const ctx = useContext(PosterContext);
  if (!ctx) throw new Error('Poster compound components must be used within a Poster.Root');

  return ctx;
}
