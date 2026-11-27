// Minimal typings and loader for the Vidyard embed script (https://github.com/Vidyard/vidyard-player-sdk, published as
// `@vidyard/embed-code`) and its Player API (https://knowledge.vidyard.com/hc/en-us/articles/360019034753).

import { loadScript } from '@videojs/utils/dom';
import { isFunction } from '@videojs/utils/predicate';

/** Where the player is served from, and the origin its iframe posts messages from. */
export const VIDYARD_PLAYER_ORIGIN = 'https://play.vidyard.com';

const VIDYARD_EMBED_SCRIPT = `${VIDYARD_PLAYER_ORIGIN}/embed/v4.js`;

/** A caption track of a video, as the player metadata lists it. */
export interface VidyardCaption {
  name?: string;
  /** ISO 639-1 language code. */
  language?: string;
  is_default?: boolean;
  vtt_url?: string;
}

/** One video of a player. A player holds one video, or several as a playlist. */
export interface VidyardVideoAttributes {
  name?: string;
  description?: string | null;
  length_in_milliseconds?: number;
  length_in_seconds?: number;
  captions?: VidyardCaption[];
  thumbnail_urls?: Record<string, string>;
}

/** Player metadata. Only the members this adapter reads are typed. */
export interface VidyardPlayerMetadata {
  name?: string;
  uuid?: string;
  chapters_attributes?: { video_attributes?: VidyardVideoAttributes }[];
}

/** Playback state the player reports with every message it sends. */
export interface VidyardPlayerStatus {
  /** Index of the current video in the player's playlist. */
  chapterIndex?: number;
  /** Seconds. */
  currentTime?: number;
  /** Whether the viewer gave GDPR consent. */
  consent?: boolean;
}

/** The player object `renderPlayer` resolves with, once the player is ready for commands. */
export interface VidyardPlayerApi {
  readonly uuid: string;
  /** The player's root element, which the embed script builds. */
  readonly container?: HTMLElement;
  /** `null` until the player is ready. */
  readonly metadata: VidyardPlayerMetadata | null;
  /** `null` until the player is ready. */
  readonly status: VidyardPlayerStatus | null;
  play(): void;
  pause(): void;
  /** Seconds. */
  seek(position: number): void;
  /** Level in the `0`–`1` range. */
  setVolume(volume: number): void;
  setPlaybackSpeed(speed: number): void;
  /** Without arguments, the first caption track. */
  enableCaption(label?: string, language?: string): void;
  /** Without arguments, every caption track. */
  disableCaption(label?: string, language?: string): void;
  /** Play the video at an index of the playlist. */
  playVideoAtIndex(index: number): void;
  on(event: string, listener: (data: unknown, player: VidyardPlayerApi) => void): void;
  off(event?: string, listener?: (data: unknown, player: VidyardPlayerApi) => void): void;
}

/**
 * Options `renderPlayer` takes: the player UUID, the element to build the player in, and player parameters, which the
 * player reads from its iframe URL.
 *
 * @internal
 */
export interface VidyardRenderPlayerOptions extends Record<string, unknown> {
  uuid: string;
  container: HTMLElement;
  type: 'inline';
}

/**
 * The `VidyardV4` global the embed script installs.
 *
 * @internal
 */
export interface VidyardApi {
  api: {
    /** Resolves once the player is ready, or with nothing when it can't be rendered. */
    renderPlayer(options: VidyardRenderPlayerOptions): Promise<VidyardPlayerApi | undefined>;
    destroyPlayer(player: VidyardPlayerApi): void;
  };
  /** Every player the script rendered on the page. */
  players: VidyardPlayerApi[];
}

/** Load the embed script once, reusing it if the page already has it. */
export function loadVidyardApi(): Promise<VidyardApi> {
  const existing = getVidyardApi();
  if (existing) return Promise.resolve(existing);

  if (apiLoad) return apiLoad;

  const load = loadScript(VIDYARD_EMBED_SCRIPT).then(() => {
    const api = getVidyardApi();
    if (!api) throw new Error('The Vidyard embed script failed to load');

    return api;
  });

  // Held only while loading: once loaded, the global answers, and after a failure the next call retries.
  const settle = () => {
    if (apiLoad === load) apiLoad = null;
  };

  apiLoad = load;
  load.then(settle, settle);

  return load;
}

let apiLoad: Promise<VidyardApi> | null = null;

function getVidyardApi(): VidyardApi | null {
  // SAFETY: checked for `renderPlayer` below; markup can define a `VidyardV4` global too.
  const api = (globalThis as { VidyardV4?: VidyardApi }).VidyardV4;

  return isFunction(api?.api?.renderPlayer) ? api : null;
}

/**
 * Remove a player, keeping the other players on the page registered.
 *
 * @internal
 */
export function destroyVidyardPlayer(api: VidyardApi, player: VidyardPlayerApi): void {
  const others = api.players.filter((other) => other !== player);

  try {
    api.api.destroyPlayer(player);
  } catch {}

  // `destroyPlayer` splices every player registered after this one out of the list too.
  if (api.players.length !== others.length) api.players.splice(0, api.players.length, ...others);
}
