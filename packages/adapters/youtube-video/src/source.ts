import { parseYouTubeSource } from '@videojs/media';
import { serializeEmbedParams } from '@videojs/media/dom';

import type { YouTubeAdapterProps } from './props';

export { type ParsedYouTubeSource, parseYouTubeSource, parseYouTubeVideoId } from '@videojs/media';

/**
 * YouTube engine options, spelled exactly as YouTube spells them
 * (https://developers.google.com/youtube/player_parameters). They are serialized onto the embed URL verbatim, so what
 * you write here is what the player reads.
 *
 * Parameters the host owns are deliberately absent: `autoplay`, `controls`, and `playsinline` come from the props of
 * the same name, so configuring them here would give two ways to say one thing. Parameters YouTube has deprecated
 * (`modestbranding`, `showinfo`, `autohide`, `theme`, and `listType: 'search'`) are absent too. The index signature
 * still carries anything not listed here, so undocumented knobs and whatever YouTube adds next keep working.
 */
export interface YouTubeEngineConfig extends Record<string, unknown> {
  /** ISO 639-1 language to display captions in. Pair with `cc_load_policy`. */
  cc_lang_pref?: string;
  /** Show closed captions by default, even if the viewer has turned them off. */
  cc_load_policy?: 1;
  /** Progress-bar highlight color. Defaults to `'red'`. */
  color?: 'red' | 'white';
  /** Stop responding to keyboard controls. Defaults to `0`. */
  disablekb?: 0 | 1;
  /** Allow the player to be driven through the IFrame Player API. Defaults to `0`. */
  enablejsapi?: 0 | 1;
  /** Stop playback this many seconds from the start of the video. */
  end?: number;
  /** Display the fullscreen button. Defaults to `1`. */
  fs?: 0 | 1;
  /** Player interface language: an ISO 639-1 code or full locale (`fr`, `fr-ca`). */
  hl?: string;
  /** Show video annotations (`1`) or hide them (`3`). Defaults to `1`. */
  iv_load_policy?: 1 | 3;
  /** Playlist id (prefixed with `PL`) or channel name, depending on `listType`. */
  list?: string;
  /** What `list` refers to. */
  listType?: 'playlist' | 'user_uploads';
  /** Repeat playback. Looping a single video also needs `playlist` set to the same id. */
  loop?: 0 | 1;
  /** Embedding domain. Set it whenever `enablejsapi` is `1`. */
  origin?: string;
  /** Comma-separated video ids to play after the one named by the URL path. */
  playlist?: string;
  /** Draw related videos from the same channel (`0`) or anywhere (`1`). Defaults to `1`. */
  rel?: 0 | 1;
  /** Begin playback this many seconds from the start of the video. */
  start?: number;
  /** Embedding URL reported to YouTube Analytics for widget-hosted players. */
  widget_referrer?: string;
  /** `referrerpolicy` for the embed iframe. Not a YouTube player parameter. */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured YouTube source: which source to play, plus how to play it. */
export interface YouTubeSource {
  /** YouTube URL or id. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: YouTubeSourceEngineConfig | undefined;
}

/** The engines a YouTube source can configure. */
export interface YouTubeSourceEngineConfig {
  /** YouTube's own player parameters, passed through untouched. */
  youtube?: YouTubeEngineConfig | undefined;
}

/**
 * Build the iframe `src` URL for an initial YouTube embed from the given props.
 *
 * @internal
 */
// Literal fallbacks mirror `YouTubeAdapter.defaultProps`; the class imports this module, so it cannot be imported back.
export function buildYouTubeIframeSrc(src: string, props: Partial<YouTubeAdapterProps> = {}) {
  const parsed = parseYouTubeSource(src);
  if (!parsed) return '';

  const embedBase = parsed.noCookie ? EMBED_BASE_NOCOOKIE : EMBED_BASE;
  const params: Record<string, unknown> = {
    // Hide YouTube chrome by default; pass nothing only when controls is explicitly true.
    controls: props.controls === true ? null : 0,
    autoplay: props.autoplay,
    loop: props.loop,
    mute: props.defaultMuted,
    playsinline: props.playsInline ?? true,
    preload: props.preload ?? 'metadata',
    // https://developers.google.com/youtube/player_parameters#Parameters
    enablejsapi: 1,
    rel: 0,
    iv_load_policy: 3,
    start: parsed.startTime,
    // YouTube-specific knobs (`cc_load_policy`, `hl`, `color`, …) flow through here.
    ...(props.source?.engine?.youtube ?? undefined),
  };

  if (parsed.kind === 'playlist' && parsed.listId) {
    return `${embedBase}?${serializeEmbedParams({ listType: 'playlist', list: parsed.listId, ...params })}`;
  }

  return `${embedBase}/${parsed.id}?${serializeEmbedParams(params)}`;
}

const EMBED_BASE = 'https://www.youtube.com/embed';
const EMBED_BASE_NOCOOKIE = 'https://www.youtube-nocookie.com/embed';
