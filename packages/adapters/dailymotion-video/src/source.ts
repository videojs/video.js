import { parseDailymotionSource } from '@videojs/media';

import type { DailymotionAdapterProps } from './props';
import type { DailymotionCreatePlayerOptions } from './sdk-api';

export { type ParsedDailymotionSource, parseDailymotionSource, parseDailymotionVideoId } from '@videojs/media';

/**
 * Dailymotion runtime parameters, spelled as Dailymotion spells them
 * (https://developers.dailymotion.com/reference/web-sdk-player-runtime-parameters) and passed to `createPlayer`
 * verbatim, plus the `player` that names the player configuration.
 *
 * `video` comes from `src`, and `loop` and `autoplay` from the props of the same name, so they have no spelling here.
 * Anything not listed still passes through, so parameters Dailymotion adds later keep working. A source URL's query can
 * also carry `startTime` (or `start`), `scaleMode`, and `customConfig[key]=value`; these options win over it.
 */
export interface DailymotionEngineConfig extends Record<string, unknown> {
  /**
   * Player ID of a player configuration from Dailymotion Studio. Required unless `src` is a player embed URL, which
   * names its own; this one wins over it.
   */
  player?: string;
  /** Start position in seconds. */
  startTime?: number;
  /** How the video fills the player. Defaults to `'fit'`. */
  scaleMode?: 'fit' | 'fill' | 'fillLeft' | 'fillRight' | 'fillTop' | 'fillBottom';
  /** Advertising key-values (https://developers.dailymotion.com/docs/custom-config). */
  customConfig?: Record<string, string>;
  /** `referrerpolicy` for the iframe the SDK builds. */
  referrerPolicy?: ReferrerPolicy;
}

/** Structured Dailymotion source: which video to play, plus how to play it. */
export interface DailymotionSource {
  /** Dailymotion video URL, or a player embed URL that also names the player. Mirrors the host's `src` property. */
  src?: string | undefined;
  /** Playback options, keyed by the engine that reads them. */
  engine?: DailymotionSourceEngineConfig | undefined;
}

/** The engines a Dailymotion source can configure. */
export interface DailymotionSourceEngineConfig {
  /** Dailymotion's own embed parameters, passed through untouched. */
  dailymotion?: DailymotionEngineConfig | undefined;
}

/**
 * Resolve the `createPlayer` options for a source. Null when the source is not a Dailymotion video or names no player
 * configuration, since Dailymotion refuses to embed without one.
 *
 * @internal
 */
export function resolveDailymotionPlayerOptions(
  src: string,
  props: Partial<DailymotionAdapterProps> = {}
): DailymotionCreatePlayerOptions | null {
  const parsed = parseDailymotionSource(src);
  if (!parsed) return null;

  const { player: configured, referrerPolicy, ...params } = props.source?.engine?.dailymotion ?? {};
  const player = configured || parsed.player;

  if (!player) {
    if (__DEV__) {
      console.warn(
        '[vjs-dailymotion] Dailymotion refuses to embed without a Player ID. Set `engine.dailymotion.player` to a player configuration from Dailymotion Studio, or use its player embed URL as `src`.'
      );
    }

    return null;
  }

  return {
    video: parsed.id,
    player,
    params: { ...readUrlParams(src), ...params, loop: props.loop === true, autoplay: props.autoplay === true },
    ...(referrerPolicy && { referrerPolicy }),
  };
}

// Runtime parameters a Dailymotion URL can carry in its query, as its iframe embed reads them: `startTime` (or the
// legacy `start`), `scaleMode`, and `customConfig[key]=value`. `video`, `loop`, `autoplay`, and mute stay with `src`
// and the props.
function readUrlParams(src: string): Record<string, unknown> {
  const query = src.split('#')[0]!.split('?')[1];
  if (!query) return {};

  const search = new URLSearchParams(query);
  const params: Record<string, unknown> = {};
  const startTime = search.get('startTime') || search.get('start');
  const seconds = startTime ? Number(startTime) : Number.NaN;
  const scaleMode = search.get('scaleMode');
  const customConfig: Record<string, string> = {};

  if (Number.isFinite(seconds) && seconds >= 0) params.startTime = seconds;

  if (scaleMode && SCALE_MODES.has(scaleMode)) params.scaleMode = scaleMode;

  for (const [key, value] of search) {
    const name = /^customConfig\[(.+)\]$/.exec(key)?.[1];

    if (name) customConfig[name] = value;
  }

  if (Object.keys(customConfig).length > 0) params.customConfig = customConfig;

  return params;
}

const SCALE_MODES = new Set(['fit', 'fill', 'fillLeft', 'fillRight', 'fillTop', 'fillBottom']);
