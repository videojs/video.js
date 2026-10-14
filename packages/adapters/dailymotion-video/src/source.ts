import { parseDailymotionSource } from '@videojs/media';

import type { DailymotionAdapterProps } from './props';
import type { DailymotionCreatePlayerOptions } from './sdk-api';

export { type ParsedDailymotionSource, parseDailymotionSource, parseDailymotionVideoId } from '@videojs/media';

/**
 * Dailymotion engine options, spelled exactly as Dailymotion spells them
 * (https://developers.dailymotion.com/reference/web-sdk-player-runtime-parameters). Apart from `player`, which names
 * the player configuration, they are handed to `createPlayer` as its `params` verbatim, so what you write here is what
 * the player reads.
 *
 * Parameters the host owns are deliberately absent: `video` comes from `src`, and `loop` from the prop of the same
 * name, so configuring them here would give two ways to say one thing. `autoplay`, `mute`, and the controls are not
 * runtime parameters at all: the player configuration decides them, and the host applies `autoplay` and `muted` through
 * the SDK. The index signature still carries anything not listed, so whatever Dailymotion adds next keeps working.
 */
export interface DailymotionEngineConfig extends Record<string, unknown> {
  /**
   * Player ID of a player configuration from Dailymotion Studio. Dailymotion refuses every embed that does not name
   * one, so it is required unless `src` is a player embed URL, which names its own; this one wins over that. Turn the
   * configuration's controls off so they do not sit under the Video.js skin.
   */
  player?: string;
  /** Start position in seconds. */
  startTime?: number;
  /** How the video fills the player. Defaults to `'fit'`. */
  scaleMode?: 'fit' | 'fill' | 'fillLeft' | 'fillRight' | 'fillTop' | 'fillBottom';
  /** Advertising key-values (https://developers.dailymotion.com/docs/custom-config). */
  customConfig?: Record<string, string>;
  /** Syndication key that attributes the embed to a Dailymotion partner. */
  syndicationKey?: string;
  /**
   * `referrerpolicy` for the iframe the SDK builds. Not a runtime parameter: it is handed to `createPlayer` beside
   * them.
   */
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
    // Dailymotion-specific knobs (`startTime`, `scaleMode`, …) flow through beside the one the host owns.
    params: { ...params, loop: props.loop === true },
    ...(referrerPolicy && { referrerPolicy }),
  };
}
