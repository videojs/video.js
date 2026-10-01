// Minimal typings and loader for the Cloudflare Stream player SDK, which arrives from a script tag rather than npm.
// https://developers.cloudflare.com/stream/viewing-videos/using-the-stream-player/using-the-player-api/

import { loadScript } from '@videojs/utils/dom';

/** The Stream player mimics `HTMLVideoElement`, so only the parts of that surface the SDK implements are typed here. */
export interface CloudflareStreamPlayerApi {
  play(): Promise<void> | void;
  pause(): void;
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
  /** Video UID or signed token. Assigning one swaps the video without a new embed. */
  src: string;
  currentTime: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  loop: boolean;
  autoplay: boolean;
  controls: boolean;
  preload: string;
  poster: string;
  readonly paused: boolean;
  readonly ended: boolean;
  readonly seeking: boolean;
  readonly duration: number;
  readonly buffered: TimeRanges;
  readonly played: TimeRanges;
  readonly videoWidth: number;
  readonly videoHeight: number;
}

/**
 * The SDK is a single factory: hand it the embed iframe, get its player back.
 *
 * @internal
 */
export type CloudflareStreamApi = (target: HTMLIFrameElement) => CloudflareStreamPlayerApi;

const API_URL = 'https://embed.videodelivery.net/embed/sdk.latest.js';

/** Load the Stream SDK once, reusing it if another host already pulled it in. */
export async function loadCloudflareStreamApi(): Promise<CloudflareStreamApi> {
  const existing = (globalThis as { Stream?: CloudflareStreamApi }).Stream;
  if (existing) return existing;

  await loadScript(API_URL);
  const api = (globalThis as { Stream?: CloudflareStreamApi }).Stream;
  if (!api) throw new Error('Cloudflare Stream SDK failed to load');

  return api;
}
