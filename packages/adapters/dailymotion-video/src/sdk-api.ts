// Minimal typings and loader for the Dailymotion Web SDK
// (https://developers.dailymotion.com/reference/web-sdk-player-methods).
// The SDK arrives from a script tag, so there is no npm package to type against.

import { loadScript } from '@videojs/utils/dom';

/**
 * Player state the SDK resolves `getState()` with, and hands every event listener. Only the members this adapter reads
 * are typed (https://developers.dailymotion.com/reference/web-sdk-player-states).
 */
export interface DailymotionPlayerState {
  /** Whether an ad is running, during which the `video*` members still describe the video. */
  adIsPlaying?: boolean;
  playerError?: DailymotionPlayerError | null;
  /** `null` while the player has not decided on a mute yet. */
  playerIsMuted?: boolean | null;
  playerIsPlaying?: boolean;
  playerPlaybackPermissionReason?: string | null;
  playerPlaybackSpeed?: number;
  /** Level in the `0`–`1` range, kept separately from the muted flag. */
  playerVolume?: number;
  videoDuration?: number;
  videoId?: string;
  videoTime?: number;
}

/** Error the player reports in its state. */
export interface DailymotionPlayerError {
  code?: string;
  title?: string;
  message?: string;
}

/**
 * Options `createPlayer` takes. `params` are the runtime parameters
 * (https://developers.dailymotion.com/reference/web-sdk-player-runtime-parameters).
 *
 * @internal
 */
export interface DailymotionCreatePlayerOptions {
  video: string;
  player?: string;
  params?: Record<string, unknown>;
  referrerPolicy?: ReferrerPolicy;
}

/** The player object `createPlayer` resolves with, once the player is ready for commands. */
export interface DailymotionPlayerApi {
  play(): void;
  pause(): void;
  seek(time: number): void;
  setVolume(volume: number): void;
  setPlaybackSpeed(speed: number): void;
  setLoop(loop: boolean): void;
  updateParams(params: Record<string, unknown>): void;
  loadContent(options: { video: string; startTime?: number }): void;
  getState(): Promise<DailymotionPlayerState>;
  on(event: string, listener: (state: DailymotionPlayerState) => void): void;
  off(event: string, listener?: (state: DailymotionPlayerState) => void): void;
  destroy(): void;
}

/**
 * The `dailymotion` global the SDK script installs.
 *
 * @internal
 */
export interface DailymotionApi {
  createPlayer(containerId: string, options: DailymotionCreatePlayerOptions): Promise<DailymotionPlayerApi>;
  /** Event names, keyed by the constants the docs use (`VIDEO_PLAY`, `PLAYER_VOLUMECHANGE`, …). */
  events: Record<string, string>;
}

/**
 * Load the SDK once, reusing it if another host already pulled it in. Any player configuration's library installs the
 * same SDK, and `createPlayer` names the configuration each player uses, so the first library loaded serves them all.
 */
export async function loadDailymotionApi(player: string): Promise<DailymotionApi> {
  const existing = (globalThis as { dailymotion?: DailymotionApi }).dailymotion;
  if (existing?.createPlayer) return existing;

  await loadScript(`${DAILYMOTION_PLAYER_ORIGIN}/libs/player/${encodeURIComponent(player)}.js`);
  const api = (globalThis as { dailymotion?: DailymotionApi }).dailymotion;
  if (!api?.createPlayer) throw new Error('Dailymotion Web SDK failed to load');

  return api;
}

/** Where the SDK and the player it embeds are served from. */
export const DAILYMOTION_PLAYER_ORIGIN = 'https://geo.dailymotion.com';
