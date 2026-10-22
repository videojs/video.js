import { createLazyMediaElement, type LazyMediaDefinition, type LazyMediaElement } from '../lazy-media';

export type { AdapterType, LazyMediaMatcher, LazySource } from '@videojs/media';
export type { LazyMediaDefinition, LazyMediaElement } from '../lazy-media';

/**
 * Create a `<lazy-video>` element class that renders the first of `medias` to play its source, and loads only that
 * element's code. Put custom media first to take sources from the built-in ones, and leave out the built-ins you don't
 * need, so their packages don't have to be installed. Register the class under a tag of your own.
 *
 * @param medias - The media to choose from, tried in order.
 * @experimental
 */
export function createLazyVideoElement(medias: readonly LazyMediaDefinition[]): typeof LazyMediaElement {
  return createLazyMediaElement(medias);
}
