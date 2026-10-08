import { isObject } from '@videojs/utils/predicate';

import { getRegisteredMedia } from '../../core/registered-media';
import { type AnyHTMLMediaAdapter, HTMLMediaAdapter } from '../html-media-adapter';

/**
 * The media adapter behind a media the player resolved: the adapter itself, or the one a media component such as
 * `<mux-video>` exposes as `adapter`. `null` for a plain `<video>` / `<audio>` or an unrelated media implementation.
 *
 * @internal
 */
export function getMediaAdapter(media: unknown): AnyHTMLMediaAdapter | null {
  media = getRegisteredMedia(media);

  if (media instanceof HTMLMediaAdapter) return media;

  const adapter = isObject(media) ? (media as { adapter?: unknown }).adapter : null;

  return adapter instanceof HTMLMediaAdapter ? adapter : null;
}

/**
 * The native element behind a media the player resolved: the element itself, or the one a media component or adapter
 * fronts as `target`. `null` when the media is not backed by an `HTMLMediaElement` (an embed, for example).
 *
 * @internal
 */
export function getMediaElement(media: unknown): HTMLMediaElement | null {
  // A player facade passes `instanceof` for the element it wraps, and its `target` may resolve through an override.
  media = getRegisteredMedia(media);

  if (media instanceof HTMLMediaElement) return media;

  // `HTMLMediaAdapter.target` is protected in TypeScript, but exists at runtime on it and on media components.
  const target = isObject(media) ? (media as { target?: unknown }).target : null;

  return target instanceof HTMLMediaElement ? target : null;
}
