import { parseSpotifySource } from '@videojs/media';
import { serializeEmbedParams } from '@videojs/media/dom';

import type { SpotifyAdapterProps } from './props';

export {
  type ParsedSpotifySource,
  parseSpotifyEntityId,
  parseSpotifySource,
  type SpotifyEntityType,
} from '@videojs/media';

/**
 * Spotify engine options, spelled exactly as Spotify spells them (https://developer.spotify.com/documentation/embeds).
 * They are serialized onto the embed URL verbatim, so what you write here is what the embed reads.
 *
 * Spotify publishes only a handful of them, and the ones the host owns are deliberately absent: the start position
 * comes from the `t` parameter on `src`. The index signature still carries anything not listed here, so undocumented
 * knobs and whatever Spotify adds next keep working.
 */
export interface SpotifyEngineConfig extends Record<string, unknown> {
  /** Start position in seconds. */
  t?: number;
  /**
   * `0` renders the embed in its dark theme. Defaults to the light theme. Spotify documents no other value, and the
   * embed goes by whether the parameter is there, so leaving it out is the only way to ask for the default.
   */
  theme?: 0;
  /** Embed the video variant of an episode when it has one. Not a URL parameter: the video embed lives at its own path. */
  preferVideo?: boolean;
  /** `referrerpolicy` for the embed iframe. Not a Spotify embed parameter. */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured Spotify source: which source to play, plus how to play it. */
export interface SpotifySource {
  /** Spotify URL or URI. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: SpotifySourceEngineConfig | undefined;
}

/** The engines a Spotify source can configure. */
export interface SpotifySourceEngineConfig {
  /** Spotify's own embed options, passed through untouched. */
  spotify?: SpotifyEngineConfig | undefined;
}

/** Build the iframe `src` URL for an initial Spotify embed from the given props. */
export function buildSpotifyIframeSrc(src: string, props: Partial<SpotifyAdapterProps> = {}) {
  const parsed = parseSpotifySource(src);
  if (!parsed) return '';

  // Neither of these is an embed parameter: `preferVideo` picks the path below,
  // and `referrerPolicy` is an attribute of the iframe hosting the embed.
  const { preferVideo, referrerPolicy: _referrerPolicy, ...spotify } = props.source?.engine?.spotify ?? {};
  const params: Record<string, unknown> = {
    t: parsed.startTime,
    // Spotify-specific knobs (`theme`, `utm_source`, …) flow through here.
    ...spotify,
  };
  const videoPath = preferVideo ? '/video' : '';
  // Spotify publishes so few parameters that most embeds need none at all.
  const query = serializeEmbedParams(params);

  return `${EMBED_BASE}/embed/${parsed.type}/${parsed.id}${videoPath}${query ? `?${query}` : ''}`;
}

const EMBED_BASE = 'https://open.spotify.com';
