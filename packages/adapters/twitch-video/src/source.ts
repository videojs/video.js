import { parseTwitchSource } from '@videojs/media';
import { isNil, isString } from '@videojs/utils/predicate';

import { TWITCH_PLAYER_ORIGIN } from './player-api';
import type { TwitchAdapterProps } from './props';

export { type ParsedTwitchSource, parseTwitchSource, parseTwitchVideoId } from '@videojs/media';

/**
 * Twitch engine options, spelled exactly as Twitch spells them (https://dev.twitch.tv/docs/embed/video-and-clips/).
 * They are serialized onto the embed URL verbatim, so what you write here is what the player reads.
 *
 * Parameters the host owns are deliberately absent: `video` and `channel` come from `src`, and `controls`, `autoplay`
 * and `muted` come from the props of the same name, so configuring them here would give two ways to say one thing. So
 * are the ones Twitch documents for something other than the player URL — `allowfullscreen` is an iframe attribute set
 * by inclusion, and `quality` belongs to the scripted embed's `setQuality` — since naming them here would promise an
 * effect the URL cannot have. The index signature still carries anything not listed, so undocumented knobs and whatever
 * Twitch adds next keep working.
 */
export interface TwitchEngineConfig extends Record<string, unknown> {
  /**
   * Every hostname the embed may be framed by. Twitch checks the frame's ancestors against it and refuses to play when
   * the current page is missing, which is why the page's own hostname is always included on top of this.
   */
  parent?: string | readonly string[];
  /** Collection to play through, starting from the video named by `src`. */
  collection?: string;
  /** Start position, spelled the way Twitch spells timestamps: `1h30m10s`. */
  time?: string;
  /**
   * `referrerpolicy` for the embed iframe. Not a Twitch embed parameter, so it never reaches the URL: the React player
   * applies it to the iframe it renders, and the HTML player reads its own `referrerpolicy` attribute instead.
   */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured Twitch source: which source to play, plus how to play it. */
export interface TwitchSource {
  /** Twitch VOD or channel URL. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: TwitchSourceEngineConfig | undefined;
}

/** The engines a Twitch source can configure. */
export interface TwitchSourceEngineConfig {
  /** Twitch's own embed parameters, passed through untouched. */
  twitch?: TwitchEngineConfig | undefined;
}

/**
 * Build the iframe `src` URL for an initial Twitch embed from the given props.
 *
 * @internal
 */
// Literal fallbacks mirror `TwitchAdapter.defaultProps`; the class imports this module, so it cannot be imported back.
export function buildTwitchIframeSrc(src: string, props: Partial<TwitchAdapterProps> = {}) {
  const parsed = parseTwitchSource(src);
  if (!parsed) return '';

  // Neither of these travels with the rest: `parent` repeats (see below), and
  // `referrerPolicy` is an attribute of the iframe hosting the embed.
  const { parent, referrerPolicy: _referrerPolicy, ...twitch } = props.source?.engine?.twitch ?? {};
  const params: Record<string, unknown> = {
    // The embed names its content by parameter rather than by path.
    ...(parsed.kind === 'video' ? { video: `v${parsed.id}` } : { channel: parsed.channel }),
    // Both default to on in the embed, so only turning them off says anything.
    controls: props.controls === true ? null : false,
    autoplay: props.autoplay === true ? null : false,
    muted: props.defaultMuted ?? false,
    preload: props.preload ?? 'metadata',
    // Twitch-specific knobs (`time`, `collection`, …) flow through here.
    ...twitch,
  };

  const query = new URLSearchParams();

  for (const key in params) {
    const value = params[key];
    // Twitch reads every parameter by value, so an empty one says nothing and is
    // left off. The shared `serializeEmbedParams` cannot be used for this reason:
    // it writes the `1` an HTML attribute's presence means, which `time` and
    // `collection` would read as content, and `1`/`0` for booleans, which Twitch
    // spells out as the words `true` and `false`.
    if (isNil(value) || value === '') continue;

    query.set(key, String(value));
  }

  // `parent` is the one parameter that repeats — one entry per hostname the
  // embed may be framed by — so it is appended rather than set with the rest.
  for (const host of resolveParentHosts(parent)) query.append('parent', host);

  if (__DEV__ && !query.has('parent')) {
    console.warn(
      '[vjs-twitch] The Twitch embed refuses to play without a `parent` hostname. Set `engine.twitch.parent` to the host page.'
    );
  }

  return `${TWITCH_PLAYER_ORIGIN}/?${query.toString()}`;
}

/** The configured parent hostnames plus the page's own, deduplicated. */
function resolveParentHosts(parent: TwitchEngineConfig['parent']): string[] {
  const configured = isString(parent) ? [parent] : (parent ?? []);
  const hosts = [...configured, globalThis.location?.hostname];

  return [...new Set(hosts.filter((host): host is string => isString(host) && host !== ''))];
}
