import { parseVidyardSource } from '@videojs/media';
import { isBoolean, isNil } from '@videojs/utils/predicate';

import type { VidyardAdapterProps } from './props';

export { type ParsedVidyardSource, parseVidyardSource } from '@videojs/media';

/** What a player parameter can be given as. `null` removes a parameter the source URL would otherwise carry. */
export type VidyardPlayerParamValue = string | number | boolean | null | undefined;

/**
 * Vidyard player parameters, spelled as Vidyard spells them
 * (https://knowledge.vidyard.com/hc/en-us/articles/360009879754) and passed to the player. They win over the parameters
 * of a source URL's query. Anything not listed still passes through, so parameters Vidyard adds later keep working.
 *
 * `autoplay`, `muted`, `loop`, and `hidden_controls` follow the props of the same name and `controls`, so they have no
 * spelling here. `type`, `aspect`, `width`, and `height` are set by the media, which sizes the player to fill it.
 */
export interface VidyardEngineConfig extends Record<string, VidyardPlayerParamValue> {
  /** Start position in seconds. */
  second?: number | null;
  /** Which video of a playlist to start with, counting from `1`. */
  video?: number | null;
  /**
   * Skip loading the calls to action and other interactive events of the video. Defaults to `true` without `controls`,
   * where the skin covers the player and they could not take input.
   */
  disable_ctas?: boolean | null;
  /** Show Vidyard's share button. Defaults to `false` without `controls`, for the same reason. */
  viral_sharing?: boolean | null;
  /** Quality to start at: `'360p'`, `'480p'`, `'720p'`, or `'1080p'`. */
  quality?: string | null;
  /** JSON Web Token for a video restricted to secure sites. Sign it on your server; never ship the API token. */
  jwt?: string | null;
  /** Stop sending viewing data to Vidyard analytics. */
  disable_analytics?: boolean | null;
}

/** Structured Vidyard source: which player to play, plus how to play it. */
export interface VidyardSource {
  /** Vidyard sharing page URL, player URL, `vidyard/<uuid>` shorthand, or player UUID. Mirrors the host's `src`. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: VidyardSourceEngineConfig | undefined;
}

/** The engines a Vidyard source can configure. */
export interface VidyardSourceEngineConfig {
  /** Vidyard's own player parameters, passed through untouched. */
  vidyard?: VidyardEngineConfig | undefined;
}

/**
 * What a source renders as: the player UUID, plus the player parameters the source and the props resolve to, as the
 * player reads them.
 *
 * @internal
 */
export interface VidyardRenderOptions {
  uuid: string;
  params: Record<string, string>;
}

/**
 * Resolve the player a source renders. Null when `src` is not a Vidyard source.
 *
 * Without `controls`, Vidyard's controls, calls to action, and share button are hidden. Unmuted `autoplay` asks Vidyard
 * to start only with sound, so a browser that refuses it leaves the player paused, as it leaves a `<video>`; a muted
 * start is up to the media.
 *
 * @internal
 */
export function resolveVidyardRenderOptions(
  src: string,
  props: Partial<Pick<VidyardAdapterProps, 'autoplay' | 'muted' | 'controls' | 'source'>> = {}
): VidyardRenderOptions | null {
  const parsed = parseVidyardSource(src);
  if (!parsed) return null;

  const controls = props.controls === true;
  const merged = {
    ...(!controls && CHROMELESS_PARAMS),
    ...parsed.params,
    ...props.source?.engine?.vidyard,
    hidden_controls: !controls,
    autoplay: props.autoplay && !props.muted ? AUTOPLAY_WITH_SOUND : null,
  } satisfies Record<string, VidyardPlayerParamValue>;
  const params: Record<string, string> = {};

  for (const [key, value] of Object.entries(merged)) {
    if (RESERVED_PARAMS.has(key) || isNil(value)) continue;

    params[key] = isBoolean(value) ? (value ? '1' : '0') : String(value);
  }

  return { uuid: parsed.uuid, params };
}

const CHROMELESS_PARAMS = { disable_ctas: true, viral_sharing: false } satisfies VidyardEngineConfig;

// Vidyard's `autoplay=2`: start only if sound is allowed, else stay paused. `1` would start muted instead, without
// reporting the mute.
const AUTOPLAY_WITH_SOUND = 2;

const RESERVED_PARAMS: ReadonlySet<string> = new Set([
  'uuid',
  'container',
  'type',
  'v',
  'muted',
  'loop',
  'aspect',
  'width',
  'height',
]);
