import { type Media, REGISTERED_MEDIA, type Video } from '@videojs/media';
import { isFunction, isNil, isUndefined } from '@videojs/utils/predicate';

// `internal/design/media/architecture.md` rejects Proxy machinery for custom media implementations because it hides
// the real shape from readers, types, and non-DOM runtimes. This facade is player-internal plumbing over a media the
// player has already resolved, and store features rely on that media's Element semantics (`instanceof`, `matches`,
// `shadowRoot`, `querySelectorAll`, event dispatch). A Proxy is the only shape that keeps those intact while letting
// player extensions such as Google Cast take over individual members.

/**
 * Media members an extension supplies in place of the attached media's own while the extension is active.
 *
 * @internal
 */
export type MediaOverride = Partial<Video>;

/** @internal */
export interface MediaOverrideSource {
  /** Read on every access so an extension can swap what it overrides (e.g. only while a cast session is connected). */
  readonly mediaOverride?: MediaOverride | null | undefined;
}

/**
 * Wrap `media` so reads, writes, and method calls consult each source's `mediaOverride` first (the first source with a
 * defined value for the member wins) and otherwise reach the media itself. The result still satisfies `instanceof`,
 * `in`, and Element methods for the underlying media, and answers `REGISTERED_MEDIA` with it so `getRegisteredMedia()`
 * can see through for identity checks.
 *
 * `sources` is called on every access, so a live collection can grow and shrink without rebuilding the facade.
 */
export function createMediaFacade<T extends Media>(media: T, sources: () => Iterable<MediaOverrideSource>): T {
  return new Proxy(media, {
    get(target, prop) {
      // Ahead of the overrides so no extension can shadow the way back to the registered media.
      if (prop === REGISTERED_MEDIA) return target;

      const owner = findOverride(sources, prop) ?? target;
      const value = (owner as Record<PropertyKey, unknown>)[prop];

      // Getters run and methods bind against the owner, never the facade: DOM accessors and `#private` members throw
      // when `this` is a Proxy. `constructor` is the one function that must keep its identity.
      return isFunction(value) && prop !== 'constructor' ? value.bind(owner) : value;
    },
    set(target, prop, value) {
      const owner = findOverride(sources, prop) ?? target;

      return Reflect.set(owner, prop, value);
    },
    has(target, prop) {
      return !isNil(findOverride(sources, prop)) || prop in target;
    },
  });
}

/**
 * The first source whose override defines `prop`, or `null` when the media owns it. Members inherited from
 * `Object.prototype` (`constructor`, `toString`, …) are never overridable: every override object has them, so they
 * would otherwise shadow the media's own whenever any extension is installed.
 */
function findOverride(sources: () => Iterable<MediaOverrideSource>, prop: PropertyKey): MediaOverride | null {
  if (Object.hasOwn(Object.prototype, prop)) return null;

  for (const { mediaOverride } of sources()) {
    if (!isNil(mediaOverride) && !isUndefined((mediaOverride as Record<PropertyKey, unknown>)[prop])) {
      return mediaOverride;
    }
  }

  return null;
}
