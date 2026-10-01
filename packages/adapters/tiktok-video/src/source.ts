import { parseTikTokSource } from '@videojs/media';
import { serializeEmbedParams } from '@videojs/media/dom';

import type { TikTokAdapterProps } from './props';

export { type ParsedTikTokSource, parseTikTokSource, parseTikTokVideoId } from '@videojs/media';

/**
 * TikTok engine options, spelled exactly as TikTok spells them (https://developers.tiktok.com/doc/embed-player). They
 * are serialized onto the embed URL verbatim, so what you write here is what the player reads.
 *
 * Parameters the host owns are deliberately absent: `autoplay`, `controls`, `loop`, and `muted` come from the props of
 * the same name, so configuring them here would give two ways to say one thing. The index signature still carries
 * anything not listed here, so undocumented knobs and whatever TikTok adds next keep working.
 */
export interface TikTokEngineConfig extends Record<string, unknown> {
  /** Show the closed-caption button. Defaults to `1`. */
  closed_caption?: 0 | 1;
  /** Show the video description. Defaults to `0`. */
  description?: 0 | 1;
  /** Show the fullscreen button. Defaults to `1`. */
  fullscreen_button?: 0 | 1;
  /** Show the track the video uses. Defaults to `0`. */
  music_info?: 0 | 1;
  /** Show the browser's native context menu. Defaults to `1`. */
  native_context_menu?: 0 | 1;
  /** Show the play button. Defaults to `1`. */
  play_button?: 0 | 1;
  /** Show the progress bar. Defaults to `1`. */
  progress_bar?: 0 | 1;
  /** Draw related videos from TikTok's recommendations (`1`) or the author's own videos (`0`). Defaults to `1`. */
  rel?: 0 | 1;
  /** Show the current playback time and duration. Defaults to `1`. */
  timestamp?: 0 | 1;
  /** Show the volume control. Defaults to `1`. */
  volume_control?: 0 | 1;
  /** `referrerpolicy` for the embed iframe. Not a TikTok player parameter. */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured TikTok source: which source to play, plus how to play it. */
export interface TikTokSource {
  /** TikTok URL or id. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: TikTokSourceEngineConfig | undefined;
}

/** The engines a TikTok source can configure. */
export interface TikTokSourceEngineConfig {
  /** TikTok's own player parameters, passed through untouched. */
  tiktok?: TikTokEngineConfig | undefined;
}

/**
 * Whether the embed has to carry an `autoplay` nobody asked for. TikTok builds its player lazily: without one it
 * creates no media element, never reports `onPlayerReady`, and drops every command silently, until something is clicked
 * inside the frame — which a frame under a player skin never gets. The host parks the player as soon as it is up, so
 * this buys one that answers commands, not a video that plays.
 *
 * @internal
 */
export function shouldBootstrapTikTokEmbed(props: Partial<TikTokAdapterProps> = {}) {
  // `preload="none"` trades those working controls back for an untouched network, and `controls` hands the player
  // to TikTok's own chrome, which the host must not park playback out from under.
  return !props.autoplay && props.preload !== 'none' && props.controls !== true;
}

/**
 * Build the iframe `src` URL for a TikTok embed from the given props.
 *
 * @internal
 */
export function buildTikTokIframeSrc(src: string, props: Partial<TikTokAdapterProps> = {}) {
  const parsed = parseTikTokSource(src);
  if (!parsed) return '';

  // `referrerPolicy` is an attribute of the iframe hosting the embed rather than
  // something the player reads, so it never reaches the URL.
  const { referrerPolicy: _referrerPolicy, ...tiktok } = props.source?.engine?.tiktok ?? {};
  const params: Record<string, unknown> = {
    // Drops the progress bar and control buttons only: the centre play button, author header, and social rail all
    // survive `controls=0`, and of those only the play button has a parameter of its own.
    controls: props.controls === true ? null : 0,
    // Also carries a bootstrap autoplay, which the host parks once the player is up.
    autoplay: props.autoplay || shouldBootstrapTikTokEmbed(props) || null,
    // Off is the player's default for both, so an explicit `0` says nothing the embed does not already assume.
    muted: props.defaultMuted || null,
    loop: props.loop || null,
    // Keep what the player offers next inside the author's own videos rather
    // than TikTok's recommendations, which is what `1` (the player's default)
    // would pull in.
    rel: 0,
    // TikTok-specific knobs (`description`, `music_info`, `timestamp`, …) flow
    // through here.
    ...tiktok,
  };

  return `${EMBED_BASE}/${parsed.id}?${serializeEmbedParams(params)}`;
}

const EMBED_BASE = 'https://www.tiktok.com/player/v1';
