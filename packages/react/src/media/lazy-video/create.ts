import type { VideoHTMLAttributes } from 'react';

import { createLazyMedia, type LazyMediaDefinition, type LazyMediaProps } from '../lazy-media';

export type { AdapterType, LazyMediaMatcher, LazySource } from '@videojs/media';
export type { LazyMediaDefinition, LazyMediaProps } from '../lazy-media';

/** @experimental */
export interface LazyVideoProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, keyof LazyMediaProps>, LazyMediaProps {}

/**
 * Create a `LazyVideo` that renders the first of `medias` to play its source, and loads only that media's code. Put
 * custom media first to take sources from the built-in ones, and leave out the built-ins you don't need, so their
 * packages don't have to be installed.
 *
 * Call it at module level: creating one during render would remount the media on every render.
 *
 * @param medias - The media to choose from, tried in order.
 * @experimental
 */
export function createLazyVideo(medias: readonly LazyMediaDefinition[]) {
  return createLazyMedia<HTMLVideoElement | HTMLIFrameElement, LazyVideoProps>('LazyVideo', medias);
}
