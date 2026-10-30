import { type ParsedMixcloudSource, parseMixcloudSource } from '@videojs/media';
import { isBoolean, isNil } from '@videojs/utils/predicate';

import type { MixcloudAdapterProps } from './props';
import { WIDGET_ORIGIN } from './widget-api';

export { type ParsedMixcloudSource, parseMixcloudSource } from '@videojs/media';

/** What a widget parameter can be given as. `null` removes a parameter the embed URL would otherwise carry. */
export type MixcloudWidgetParamValue = string | number | boolean | null | undefined;

/**
 * Mixcloud Widget parameters, spelled as Mixcloud spells them and written onto the widget URL. They win over the
 * parameters of a widget embed URL given as `src`, which win over the host's defaults. Anything not listed still passes
 * through, so parameters Mixcloud adds later keep working.
 *
 * The host's default is `hide_cover: true`, so the widget shows its classic layout rather than its large cover. The
 * show's title, its uploader, and Mixcloud's logo show in every layout.
 */
export interface MixcloudEngineConfig extends Record<string, MixcloudWidgetParamValue> {
  /** The mini layout, 60 pixels tall, without the repost, favorite, and share buttons. */
  mini?: boolean | null;
  /** Hide the picture layout, a large cover that needs about 400 pixels of height. Defaults to `true`. */
  hide_cover?: boolean | null;
  /** Hide the show's artwork. */
  hide_artwork?: boolean | null;
  /** Hide the tracklist. */
  hide_tracklist?: boolean | null;
  /** The light theme. Mixcloud offers no other colors. */
  light?: boolean | null;
  /** Start playback once the widget is ready, as `autoplay` does. Never written to the URL. */
  autoplay?: boolean | null;
  /** `referrerpolicy` for the widget iframe. Not a widget parameter. */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured Mixcloud source: which show to play, plus how to play it. */
export interface MixcloudSource {
  /** Mixcloud show URL or widget embed URL. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: MixcloudSourceEngineConfig | undefined;
}

/** The engines a Mixcloud source can configure. */
export interface MixcloudSourceEngineConfig {
  /** Mixcloud Widget parameters, passed through untouched. */
  mixcloud?: MixcloudEngineConfig | undefined;
}

/**
 * Build the widget iframe URL for a source. Empty when `src` is not a Mixcloud show.
 *
 * @internal
 */
export function buildMixcloudIframeSrc(src: string, props: Partial<MixcloudAdapterProps> = {}): string {
  const parsed = parseMixcloudSource(src);
  if (!parsed) return '';

  return buildMixcloudWidgetUrl(parsed, props);
}

/**
 * Build the widget iframe URL for a parsed show. The widget is loaded from its own host rather than through Mixcloud's
 * redirect, since a frame that redirects to another origin loses the `autoplay` permission the page gave it.
 *
 * @internal
 */
export function buildMixcloudWidgetUrl(
  parsed: ParsedMixcloudSource,
  props: Partial<MixcloudAdapterProps> = {}
): string {
  const query = new URLSearchParams({ feed: parsed.key, ...resolveMixcloudWidgetParams(parsed, props) });

  return `${WIDGET_ORIGIN}/?${query}`;
}

/**
 * The widget parameters a source and the host's props resolve to, as the widget URL writes them.
 *
 * @internal
 */
export function resolveMixcloudWidgetParams(
  parsed: Pick<ParsedMixcloudSource, 'params'>,
  props: Partial<MixcloudAdapterProps> = {}
): Record<string, string> {
  const params: Record<string, MixcloudWidgetParamValue> = {
    ...DEFAULT_PARAMS,
    ...parsed.params,
    ...props.source?.engine?.mixcloud,
  };
  const resolved: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    // The host starts playback itself, so it can apply the volume first.
    if (key === 'feed' || key === 'autoplay' || key === 'referrerPolicy' || isNil(value)) continue;

    resolved[key] = isBoolean(value) ? (value ? '1' : '0') : String(value);
  }

  return resolved;
}

/**
 * Whether the widget stays unloaded until playback is requested. Under `preload="none"` nothing is fetched from
 * Mixcloud, so the page makes no third-party request before the listener asks to play. `autoplay`, or the widget's own
 * `autoplay` parameter, asks to play now, and `controls` makes the widget's play button the way to ask, so any of them
 * loads the widget regardless.
 *
 * @internal
 */
export function shouldDeferMixcloudWidget(
  props: Partial<Pick<MixcloudAdapterProps, 'src' | 'source' | 'preload' | 'autoplay' | 'controls'>> = {}
) {
  if (props.preload !== 'none' || props.autoplay || props.controls) return false;

  // `source.src` is the only other way to name a show, so honor it when `src` is absent.
  return !wantsMixcloudAutoplay(parseMixcloudSource(props.src || props.source?.src || ''), props.source);
}

/**
 * Whether the source asks to autoplay through the widget's own `autoplay` parameter.
 *
 * @internal
 */
export function wantsMixcloudAutoplay(
  parsed: Pick<ParsedMixcloudSource, 'params'> | null,
  source?: MixcloudSource | null
): boolean {
  const value = source?.engine?.mixcloud?.autoplay ?? parsed?.params.autoplay;

  return value === true || value === 'true' || value === '1';
}

/**
 * The widget parameters it applies in place through its `setOption` method, without reloading the show.
 *
 * @internal
 */
export const MIXCLOUD_LIVE_PARAMS: ReadonlySet<string> = new Set([
  'mini',
  'hide_cover',
  'hide_artwork',
  'hide_tracklist',
  'light',
]);

const DEFAULT_PARAMS: Record<string, MixcloudWidgetParamValue> = {
  hide_cover: true,
};
