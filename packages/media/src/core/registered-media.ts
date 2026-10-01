/**
 * Key a player media facade answers with the media the player registered, which the facade wraps. `Symbol.for` so a
 * page carrying two copies of the packages (CDN plus npm, duplicate installs) still agrees on it, and so it can never
 * collide with a media member.
 *
 * @internal
 */
export const REGISTERED_MEDIA: unique symbol = Symbol.for('@videojs/media/registered');

/**
 * The media the player registered: the media behind a player facade, or `media` itself when it isn't one. Identity
 * checks and native-element lookups must go through this: a facade passes `instanceof` for the element it wraps but is
 * never identical to it.
 *
 * @internal
 */
export function getRegisteredMedia<T>(media: T): T {
  // SAFETY: only a facade answers `REGISTERED_MEDIA`, with the `T` it wraps; anything else reads `undefined`.
  return (media as { [REGISTERED_MEDIA]?: T } | null | undefined)?.[REGISTERED_MEDIA] ?? media;
}
