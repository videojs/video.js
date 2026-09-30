import { parseCloudflareSource } from '@videojs/media';
import { serializeEmbedParams } from '@videojs/media/dom';

import type { CloudflareAdapterProps } from './props';

export { parseCloudflareSource, parseCloudflareVideoId, type ParsedCloudflareSource } from '@videojs/media';

/**
 * Cloudflare Stream engine options, spelled exactly as Cloudflare spells them
 * (https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/). They are serialized onto the
 * embed URL verbatim, so what you write here is what the player reads. The embed reads them once, when its URL is
 * built, so changing them after the iframe exists only takes effect on the next embed.
 *
 * Parameters the host owns are deliberately absent: `controls`, `autoplay`, `loop`, `muted`, `preload`, and `poster`
 * come from the props of the same name, so configuring them here would give two ways to say one thing. The index
 * signature still carries anything not listed here, so undocumented knobs and whatever Cloudflare adds next keep
 * working.
 */
export interface CloudflareEngineConfig extends Record<string, unknown> {
  /** BCP 47 language of the text track to show by default (`'en'`, `'de'`). */
  defaultTextTrack?: string;
  /** Any CSS color for the progress bar and other player accents. */
  primaryColor?: string;
  /** Any CSS color for the letterbox bars around a video that does not fill the player. */
  letterboxColor?: string;
  /** Where playback starts, in seconds or as a time string (`'5m30s'`). */
  startTime?: number | string;
  /** VAST tag to play as a pre-roll ad. Reported through the `stream-ad*` events. */
  'ad-url'?: string;
  /** `referrerpolicy` for the embed iframe. Not a Cloudflare player parameter. */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured Cloudflare source: which source to play, plus how to play it. */
export interface CloudflareSource {
  /** Cloudflare Stream URL, video UID, or signed token. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: CloudflareSourceEngineConfig | undefined;
}

/** The engines a Cloudflare source can configure. */
export interface CloudflareSourceEngineConfig {
  /** Cloudflare's own embed parameters, passed through untouched. */
  cloudflare?: CloudflareEngineConfig | undefined;
}

/** Build the iframe `src` URL for an initial Cloudflare Stream embed from the given props. */
// Literal fallbacks mirror `CloudflareAdapter.defaultProps`; the class imports this module, so it cannot be imported back.
export function buildCloudflareIframeSrc(src: string, props: Partial<CloudflareAdapterProps> = {}) {
  const parsed = parseCloudflareSource(src);
  if (!parsed) return '';

  // `referrerPolicy` is an attribute of the iframe hosting the embed rather than
  // something the player reads, so it never reaches the URL.
  const { referrerPolicy: _referrerPolicy, ...cloudflare } = props.source?.engine?.cloudflare ?? {};
  const params: Record<string, unknown> = {
    // `controls` defaults to on and is read by value, so hiding Cloudflare's own
    // chrome takes an explicit `0`; passing nothing leaves it shown.
    controls: props.controls === true ? null : 0,
    // These three are read by presence rather than by value, unlike `controls`
    // and unlike every other embed this package talks to. Cloudflare documents it
    // for `autoplay` — "if you don't want the video to autoplay, don't include the
    // autoplay flag at all (instead of setting it to autoplay=false)" — and
    // `loop` and `muted` read the same way. Sending `0` turns all three *on*.
    autoplay: props.autoplay || null,
    loop: props.loop || null,
    muted: props.defaultMuted || null,
    // `||` rather than `??`: `preload` is empty for a bare `preload` attribute,
    // and empty serializes to `1`, which is not one of the values Cloudflare
    // accepts.
    preload: props.preload || 'metadata',
    // Cloudflare reads `poster` as an image URL, so an unset one has to be absent
    // rather than empty: empty serializes to `1`, and the embed rejects that with
    // "poster value should be a valid encoded URL" instead of painting its own
    // thumbnail. A real URL needs no encoding here — `URLSearchParams` does it.
    poster: props.poster || null,
    // Cloudflare-specific knobs (`primaryColor`, `startTime`, `ad-url`, …) flow through here.
    ...cloudflare,
  };
  // A customer origin embeds at `/<id>/iframe`, where the shared host embeds at
  // `/<id>`; rebuilding onto the shared host would drop the very origin a signed
  // or access-controlled video is authorized for.
  const base = parsed.origin ? `${parsed.origin}/${parsed.id}/iframe` : `${EMBED_BASE}/${parsed.id}`;

  return `${base}?${serializeEmbedParams(params)}`;
}

const EMBED_BASE = 'https://iframe.videodelivery.net';
