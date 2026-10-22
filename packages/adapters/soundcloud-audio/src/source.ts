import { type ParsedSoundCloudSource, parseSoundCloudSource } from '@videojs/media';

import type { SoundCloudAdapterProps } from './props';
import { WIDGET_ORIGIN } from './widget-api';

export { type ParsedSoundCloudSource, parseSoundCloudSource, type SoundCloudSourceKind } from '@videojs/media';

/** What a widget parameter can be given as. `null` removes a parameter the embed URL would otherwise carry. */
export type SoundCloudWidgetParamValue = string | number | boolean | null | undefined;

/**
 * SoundCloud Widget parameters, spelled as SoundCloud spells them
 * (https://developers.soundcloud.com/docs/api/html5-widget#parameters) and written onto the widget URL. They win over
 * the parameters of a `w.soundcloud.com/player/` URL given as `src`, which win over the host's defaults. Anything not
 * listed still passes through, so parameters SoundCloud adds later keep working.
 *
 * The host's defaults hide the social chrome a player skin has no use for: `buying`, `sharing`, `download`,
 * `show_comments`, `show_reposts`, and `show_teaser` are `false`, `hide_related` is `true`, and `visual` is `false`.
 * The uploader and SoundCloud's own branding stay whenever the widget shows: the widget is what credits the sound.
 */
export interface SoundCloudEngineConfig extends Record<string, SoundCloudWidgetParamValue> {
  /** Hex color of the play button and other accents, such as `'#ff5500'`. */
  color?: string | null;
  /** The large artwork layout. Defaults to `false`. */
  visual?: boolean | null;
  /** Start playback once the widget is ready, as `autoplay` does. Never written to the URL. */
  auto_play?: boolean | null;
  /** Index of the track in a set to start from. */
  start_track?: number | null;
  /** When `false`, playing this widget does not pause the other SoundCloud widgets on the page. */
  single_active?: boolean | null;
  /** Show the artwork. */
  show_artwork?: boolean | null;
  /** Show the uploader's name. The widget is what credits the uploader, so keep it unless the page does that elsewhere. */
  show_user?: boolean | null;
  /** Show the play count. */
  show_playcount?: boolean | null;
  /** Show listener comments on the waveform. Defaults to `false`. */
  show_comments?: boolean | null;
  /** Show reposts. Defaults to `false`. */
  show_reposts?: boolean | null;
  /** Show SoundCloud's promotional teaser. Defaults to `false`. */
  show_teaser?: boolean | null;
  /** Hide the related tracks the widget offers once a track ends. Defaults to `true`. */
  hide_related?: boolean | null;
  /** Show the buy button. Defaults to `false`. */
  buying?: boolean | null;
  /** Show the share button. Defaults to `false`. */
  sharing?: boolean | null;
  /** Show the download button. Defaults to `false`. */
  download?: boolean | null;
  /** `referrerpolicy` for the widget iframe. Not a widget parameter. */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured SoundCloud source: which track or set to play, plus how to play it. */
export interface SoundCloudSource {
  /** SoundCloud track, set, or widget embed URL. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: SoundCloudSourceEngineConfig | undefined;
}

/** The engines a SoundCloud source can configure. */
export interface SoundCloudSourceEngineConfig {
  /** SoundCloud Widget parameters, passed through untouched. */
  soundcloud?: SoundCloudEngineConfig | undefined;
}

/**
 * Build the widget iframe URL for a source. Empty when `src` is not a SoundCloud URL.
 *
 * @internal
 */
export function buildSoundCloudIframeSrc(src: string, props: Partial<SoundCloudAdapterProps> = {}): string {
  const parsed = parseSoundCloudSource(src);
  if (!parsed) return '';

  return buildSoundCloudWidgetUrl(parsed.url, parsed, props);
}

/**
 * Build the widget iframe URL for a resource URL the widget plays, carrying the parameters of the source it came from.
 *
 * @internal
 */
export function buildSoundCloudWidgetUrl(
  resourceUrl: string,
  parsed: Pick<ParsedSoundCloudSource, 'params'>,
  props: Partial<SoundCloudAdapterProps> = {}
): string {
  const { referrerPolicy: _referrerPolicy, ...engine } = props.source?.engine?.soundcloud ?? {};
  const params: Record<string, SoundCloudWidgetParamValue> = { ...DEFAULT_PARAMS, ...parsed.params, ...engine };
  const query = new URLSearchParams({ url: resourceUrl });

  for (const [key, value] of Object.entries(params)) {
    // The host starts playback itself, so it can apply the volume first.
    if (key === 'url' || key === 'auto_play' || value === null || value === undefined) continue;

    query.set(key, String(value));
  }

  return `${WIDGET_ORIGIN}/player/?${query}`;
}

/**
 * Whether the source asks to autoplay through the widget's own `auto_play` parameter.
 *
 * @internal
 */
export function wantsSoundCloudAutoplay(
  parsed: Pick<ParsedSoundCloudSource, 'params'> | null,
  source?: SoundCloudSource | null
) {
  const value = source?.engine?.soundcloud?.auto_play ?? parsed?.params.auto_play;

  return value === true || value === 'true';
}

const DEFAULT_PARAMS: Record<string, SoundCloudWidgetParamValue> = {
  visual: false,
  hide_related: true,
  show_comments: false,
  show_reposts: false,
  show_teaser: false,
  buying: false,
  sharing: false,
  download: false,
};
