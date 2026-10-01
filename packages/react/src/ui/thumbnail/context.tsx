'use client';

import type { ThumbnailCore, ThumbnailState, ThumbnailImageProps } from '@videojs/core';
import { createContext, type CSSProperties, type ProviderProps, type RefCallback, useContext } from 'react';

export interface ThumbnailContextValue {
  core: ThumbnailCore;
  state: ThumbnailState;
  src: string | undefined;
  imageStyle: CSSProperties | undefined;
  /** CORS mode inherited from the media element, supplied only for `<track>`-sourced thumbnails. */
  inheritedCrossOrigin: ThumbnailImageProps['crossOrigin'];
  /** Attach to the image so the root can track its loading lifecycle. */
  imageRef: RefCallback<HTMLImageElement>;
}

const ThumbnailContext = createContext<ThumbnailContextValue | null>(null);

export function ThumbnailProvider({ value, children }: ProviderProps<ThumbnailContextValue>) {
  return <ThumbnailContext.Provider value={value}>{children}</ThumbnailContext.Provider>;
}

export function useThumbnailContext(): ThumbnailContextValue {
  const ctx = useContext(ThumbnailContext);
  if (!ctx) throw new Error('Thumbnail compound components must be used within a Thumbnail.Root');

  return ctx;
}
