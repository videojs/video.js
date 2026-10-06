import type { Simplify } from '@videojs/utils/types';

import {
  type ConfigWithDefaults,
  defineCompositionFactory,
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../core/composition/create-composition';
import { flattenFeatures } from '../../../core/composition/define-feature';
import { backgroundVideoFeature } from './features/background-video';
import { calculateDurationFeature } from './features/calculate-duration';
import { currentTimeFeature } from './features/current-time';
import { errorFeature } from './features/error';
import { hlsLoadingFeature } from './features/hls-loading';
import { mediaSourceFeature } from './features/media-source';

// ============================================================================
// Background-Video Engine State & Context
// ============================================================================

/**
 * The features the background-video playback engine composes, in order. A feature's behaviors compose in its position,
 * and a later feature's `defaultConfig` and `initialState` values replace an earlier one's.
 */
export const features = [
  hlsLoadingFeature,
  errorFeature,
  calculateDurationFeature,
  mediaSourceFeature,
  backgroundVideoFeature,
  currentTimeFeature,
] as const;

const composed = flattenFeatures(features);

/**
 * The behaviors the engine composes, in setup order: its features' behaviors, each composed once. The engine's state
 * and context types are derived from this list, so adding or removing a feature changes them with no separate type to
 * update.
 */
export const behaviors = composed.behaviors;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read, before `defaultConfig` makes any optional. */
export type Config = ResolveBehaviorConfig<Behaviors>;

/**
 * State shape for the background-video playback engine: every state key its behaviors declare.
 *
 * Includes `bandwidthState`: `setupVideoBufferActors` declares it and `loadVideoSegments` samples into it, which is
 * wasted work in this variant, since nothing ranks by bandwidth.
 */
export type EngineState = Simplify<ResolveBehaviorState<Behaviors>>;

/** Context shape for the background-video playback engine: every context key its behaviors declare. */
export type EngineContext = Simplify<ResolveBehaviorContext<Behaviors>>;

/**
 * Configuration for the background-video engine: every config key its behaviors read, with each key `defaultConfig`
 * covers optional. Each field is documented on the config type of the behavior that reads it.
 */
export type EngineConfig = Simplify<ConfigWithDefaults<Config, typeof defaultConfig>>;

// ============================================================================
// Background-Video Playback Engine
// ============================================================================

/**
 * The defaults `createEngine` fills in for every config key the caller leaves `undefined`: its features' merged
 * `defaultConfig`. Each is optional in `EngineConfig`, so a caller may override it.
 */
export const defaultConfig = composed.defaultConfig;

/**
 * The state the engine starts with. `loadActivated: true` stands in for `initialLoadFeature`, which this engine doesn't
 * compose, so it starts loading the moment a source is set.
 */
export const initialState = { ...composed.initialState, loadActivated: true };

/**
 * Create a background-video playback engine.
 *
 * Subtractive composition over the HLS engine baseline: audio-side, text-side, ABR-driven, preload-monitoring, and
 * play/seek load-trigger behaviors are removed. `selectVideoTrack` (with a highest-resolution rule by default) replaces
 * `switchVideoQuality`, pinning a single rendition for the session. The initial state seeds `loadActivated: true` so
 * the composition behaves as if preload has already been activated — appropriate for ambient / hero / GIF-replacement
 * surfaces that should start loading the moment a src is set.
 *
 * Error reporting is _not_ subtracted: `collectErrors` owns the sequence, `resolveVideoTrack` reports per-rendition
 * causes, and `selectVideoTrack` reports the video verdict when nothing survives its constraints. Without them every
 * unplayable source here is a silent stall — an unsupported container, encryption this engine can't decrypt, and an
 * undecodable codec all leave `HTMLMediaElement.error` null on both Chromium and WebKit.
 *
 * Native `loop` / `muted` / `autoplay` are adapter concerns and live on `HlsBackgroundVideoAdapterCore` rather than the
 * engine.
 *
 * @example
 *   ```ts
 *   const engine = createEngine();
 *
 *   engine.context.mediaElement.set(videoEl);
 *   engine.state.presentation.set({ url: 'https://example.com/stream.m3u8' });
 *
 *   await engine.destroy();
 *   ```;
 */
export const createEngine = defineCompositionFactory(behaviors, { defaultConfig, initialState });
