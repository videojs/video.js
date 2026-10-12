import type { PlayerJsAdapterProps } from './props';
import { getPlayerJsProvider } from './providers';

/** What an embed URL parameter can be given as. An array repeats the parameter once per value. */
export type PlayerJsEmbedParamValue = string | number | boolean | null | undefined | readonly (string | number)[];

/**
 * Player.js engine options. player.js standardizes the messages an embed answers, not its URL, so there are no shared
 * parameters: each key here is a query parameter written onto the embed URL for whichever service serves it — anything
 * in [Gumlet's](https://docs.gumlet.com/video/embed-stream), [Bunny Stream's](https://bunny.net/docs/stream/embedding),
 * or [Livid's](https://support.livid.com/article/46-advanced-embedding-parameters) parameter lists, say. A parameter a
 * service reads from the URL hash, like Livid's `#t`, belongs in `src`. Values are stringified as given becomes
 * `'true'`), an array repeats the parameter once per value, and `null` removes a parameter the embed URL would
 * otherwise carry.
 *
 * These win over everything else on the URL: over parameters already in `src`, and over the ones the host derives from
 * `autoplay`, `muted`, `loop`, `controls`, and `preload` for the services it recognizes.
 */
export interface PlayerJsEngineConfig extends Record<string, PlayerJsEmbedParamValue> {
  /** `referrerpolicy` for the embed iframe. Not written to the URL. */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured player.js source: which embed to load, plus how to load it. */
export interface PlayerJsSource {
  /** Embed URL of any player.js receiver. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: PlayerJsSourceEngineConfig | undefined;
}

/** The engines a player.js source can configure. */
export interface PlayerJsSourceEngineConfig {
  /** Query parameters for the embed URL, passed through untouched. */
  playerJs?: PlayerJsEngineConfig | undefined;
}

/**
 * Parse a player.js embed URL. player.js is a protocol, not a host, so any absolute `http(s)` URL qualifies — whether
 * the page behind it answers is only known once it reports `ready`. Protocol-relative URLs are read as `https`.
 *
 * @internal
 */
export function parsePlayerJsSource(src: string): URL | null {
  if (!src) return null;

  try {
    const url = new URL(src.startsWith('//') ? `https:${src}` : src);

    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Build the iframe `src` URL for a player.js embed from the given props. Empty when `src` is not an embed URL.
 *
 * For the services it recognizes (Mux Player, Gumlet, FrameRate, Livid, Bunny Stream, Streamable), the host writes
 * `autoplay`, `muted`, `loop`, `controls`, and `preload` in the service's own spelling, and without `controls` hides as
 * much of the service's chrome as its URL allows. A parameter already in `src` is left as written, and
 * `engine.playerJs` overrides both.
 *
 * @internal
 */
export function buildPlayerJsIframeSrc(src: string, props: Partial<PlayerJsAdapterProps> = {}): string {
  const url = parsePlayerJsSource(src);
  if (!url) return '';

  const derived = getPlayerJsProvider(url)?.params(props) ?? {};

  for (const [key, value] of Object.entries(derived)) {
    // What the author wrote into `src` is the more specific intent.
    if (value !== null && !url.searchParams.has(key)) url.searchParams.set(key, value);
  }

  // `referrerPolicy` is an attribute of the iframe rather than something the embed reads.
  const { referrerPolicy: _referrerPolicy, ...params } = props.source?.engine?.playerJs ?? {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;

    url.searchParams.delete(key);

    if (value === null) continue;

    for (const item of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(item));
  }

  return url.toString();
}
