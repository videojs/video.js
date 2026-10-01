import { isBoolean, isNumber, isString } from '@videojs/utils/predicate';
import { kebabCase } from '@videojs/utils/string';

import type { WistiaAdapterProps } from './props';
import { type WistiaSource, wistiaControlProps, wistiaPlayerDefaultOptions } from './source';

/**
 * The media props that configure a Wistia player rather than name the media it plays.
 *
 * @internal
 */
export type WistiaMediaOptionsProps = {
  [Key in 'autoplay' | 'controls' | 'loop' | 'poster' | 'preload']?: WistiaAdapterProps[Key] | undefined;
};

/**
 * Wistia's options for the props a media element is written with — the translation both platforms need, in neither
 * one's terms: the custom element assigns the result as properties, React writes it as attributes.
 *
 * The whole set comes back every time, because a prop that goes away has to take its option with it. A prop that was
 * never given is left out rather than defaulted: a Wistia media is configured in Wistia's app too, and a `poster`
 * written for a consumer who said nothing would overrule that.
 *
 * `muted` is missing because it is the state a player _starts_ in, where this runs again on every render and every
 * attribute change; `src` and `source` because they name a media rather than configure one.
 *
 * @internal
 */
export function wistiaMediaOptions(props: WistiaMediaOptionsProps): WistiaSource {
  return {
    ...wistiaPlayerDefaultOptions,
    ...(props.autoplay !== undefined && { autoplay: props.autoplay }),
    ...(props.loop !== undefined && { endVideoBehavior: props.loop ? 'loop' : 'default' }),
    ...(props.poster !== undefined && { poster: props.poster }),
    // An empty `preload` is what a bare `preload` attribute means; Wistia accepts only the three words.
    ...(props.preload !== undefined && { preload: props.preload || 'metadata' }),
    ...wistiaControlProps(props.controls ?? false),
  };
}

/**
 * The options whose kebab-cased spelling is also a member Wistia keeps on `<wistia-player>`'s prototype, which is what
 * React consults before it decides to assign a prop rather than write it. Read off the package rather than reasoned
 * about, and every one is a single word, since a name carrying a hyphen cannot be a property.
 */
const WISTIA_PLAYER_MEMBERS = new Set([
  'aspect',
  'autoplay',
  'email',
  'muted',
  'poster',
  'preload',
  'resumable',
  'seo',
  'swatch',
]);

/**
 * Wistia's options as its element takes them in React: kebab-cased, and each one spelled the way it has to arrive.
 * React's half of applying what {@link wistiaMediaOptions} decides, where the custom element assigns the same options
 * as properties.
 *
 * Attributes for most of them, because they are what `<wistia-player>` watches and can read before anything of ours
 * runs — it configures itself as it connects, and React has no moment before that. Booleans are spelled out for the
 * same reason: `false` has React drop the attribute, and a dropped attribute is Wistia's default instead — the
 * difference between a chromeless player and one wearing two sets of controls.
 *
 * {@link WISTIA_PLAYER_MEMBERS} is the exception, and React is what makes it one: a prop it finds on the element is
 * assigned rather than written, so no attribute is involved and the value lands on Wistia's own setter. That setter
 * reads a boolean, and `'false'` is a string — a truthy one. Spelling those out is how an unmuted player mutes itself
 * and a paused one autoplays, so they go as they are.
 *
 * Anything else has no attribute spelling at all and is left out, `playerColorGradient` being the one documented option
 * in that gap.
 *
 * @internal
 */
export function wistiaAttributes(options: Record<string, unknown>): Record<string, string | number | boolean> {
  const attributes: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(options)) {
    if (!isString(value) && !isNumber(value) && !isBoolean(value)) continue;

    const name = kebabCase(key);

    attributes[name] = WISTIA_PLAYER_MEMBERS.has(name) ? value : String(value);
  }

  return attributes;
}
