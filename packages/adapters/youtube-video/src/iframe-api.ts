// Minimal typings and loader for the YouTube iframe API
// (https://developers.google.com/youtube/iframe_api_reference).
// The API arrives from a script tag, so there is no npm SDK to type against.

import { MediaError } from '@videojs/media';
import { loadScript } from '@videojs/utils/dom';

export interface YouTubePlayerApi {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getVolume(): number;
  getDuration(): number;
  getCurrentTime(): number;
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  getVideoLoadedFraction(): number;
  getPlayerState(): number;
  loadVideoById(options: { videoId: string; startSeconds?: number }): void;
  cueVideoById(options: { videoId: string; startSeconds?: number }): void;
  loadPlaylist(options: { list: string; listType?: string }): void;
  cuePlaylist(options: { list: string; listType?: string }): void;
  stopVideo(): void;
  getOption(module: string, option: string): unknown;
  setOption(module: string, option: string, value: unknown): void;
  addEventListener(type: string, listener: (event: { data: number }) => void): void;
  destroy(): void;
}

export interface YouTubePlayerEvents {
  onReady?: () => void;
  onError?: (event: { data: number }) => void;
}

/** @internal */
export interface YouTubeApi {
  Player: new (target: HTMLIFrameElement, options: { events?: YouTubePlayerEvents }) => YouTubePlayerApi;
  ready(callback: () => void): void;
}

export interface YouTubeCaptionTrack {
  languageCode?: string;
  displayName?: string;
}

const API_URL = 'https://www.youtube.com/iframe_api';

/** Load the iframe API once, reusing it if another host already pulled it in. */
export async function loadYouTubeApi(): Promise<YouTubeApi> {
  const existing = (globalThis as { YT?: YouTubeApi }).YT;
  if (existing?.Player) return existing;

  await loadScript(API_URL);
  const api = (globalThis as { YT?: YouTubeApi }).YT;
  if (!api) throw new Error('YouTube iframe API failed to load');

  // The loader stub exposes `YT.ready` before `YT.Player` is defined.
  await new Promise<void>((resolve) => api.ready(resolve));
  return api;
}

// https://developers.google.com/youtube/iframe_api_reference#onStateChange
export const STATE_UNSTARTED = -1;
export const STATE_ENDED = 0;
export const STATE_PLAYING = 1;
export const STATE_PAUSED = 2;
export const STATE_BUFFERING = 3;

// https://developers.google.com/youtube/iframe_api_reference#onError
export const youtubeErrorCodeToMediaErrorCode: Record<number, number> = {
  2: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, // invalid parameter (e.g. malformed video id)
  5: MediaError.MEDIA_ERR_DECODE, // HTML5 player error
  100: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, // video not found, removed, or private
  101: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, // embedding not allowed
  150: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, // embedding not allowed (alias of 101)
};
