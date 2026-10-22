import { isObject, isString } from '@videojs/utils/predicate';

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
 * Names the engine a media plays through. Media classes declare it as a static `engineName`. An adapter that picks its
 * engine per source, such as one choosing between hls.js and native HLS, reports the current pick on the instance.
 */
interface EngineNamed {
  readonly engineName?: unknown;
}

/**
 * The name of the engine playing a media the player resolved, such as `hlsjs`, `spf`, or `youtube`. An adapter's
 * instance `engineName` wins over the static one its class declares, and a plain `<video>` / `<audio>` is played by the
 * `browser`. A media component is read through the adapter it exposes as `adapter`, embeds included.
 *
 * @returns `undefined` when the media names no engine.
 * @internal
 */
export function getMediaEngineName(media: unknown): string | undefined {
  media = getRegisteredMedia(media);

  if (media instanceof HTMLMediaElement) return 'browser';

  if (!isObject(media)) return undefined;

  const adapter = 'adapter' in media && isObject(media.adapter) ? media.adapter : media;
  const instanceName = (adapter as EngineNamed).engineName;
  if (isString(instanceName)) return instanceName;

  const staticName = (adapter.constructor as EngineNamed | undefined)?.engineName;

  return isString(staticName) ? staticName : undefined;
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
