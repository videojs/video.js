import { type Composition, type ConfigWithDefaults, defineCompositionFactory, flattenFeatures } from '@videojs/spf';
import * as hlsBackgroundVideo from '@videojs/spf/engines/hls-background-video';
import * as transmux from '@videojs/spf/features/mpeg-ts-transmux';
import type { Simplify } from '@videojs/utils/types';

// Every export here is annotated from the base engine's and the feature's own exported types rather than inferred:
// the declaration emitter cannot name an inferred composition type across the package boundary.

/**
 * The features the Mux background-video engine composes: the HLS background-video engine's, then
 * `mpegTsTransmuxFeature`, so a plus- or basic-tier Mux playback ID plays as a background video. The background engine
 * composes `shiftTimestampsFeature`, which the transmux requires, so the feature lays in last exactly as it does on the
 * video engine. See `../engine` for why this is Mux-only.
 */
export const features: readonly [...typeof hlsBackgroundVideo.features, typeof transmux.mpegTsTransmuxFeature] = [
  ...hlsBackgroundVideo.features,
  transmux.mpegTsTransmuxFeature,
];

const composed = flattenFeatures(features);

/** The behaviors the engine composes, in setup order: the base engine's, since the transmux composes none of its own. */
export const behaviors: typeof hlsBackgroundVideo.behaviors = composed.behaviors;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read, before `defaultConfig` makes any optional. */
export type Config = hlsBackgroundVideo.Config;
/** State shape: the base engine's, since the transmux declares no state. */
export type EngineState = hlsBackgroundVideo.EngineState;
/** Context shape: the base engine's, since the transmux declares no context. */
export type EngineContext = hlsBackgroundVideo.EngineContext;

/** The config defaults the features contribute, the transmux's replacing the base engine's where they overlap. */
export const defaultConfig: Omit<typeof hlsBackgroundVideo.defaultConfig, keyof typeof transmux.defaultConfig> &
  typeof transmux.defaultConfig = composed.defaultConfig;

/** Configuration: every config key its behaviors read, with each key `defaultConfig` covers optional. */
export type EngineConfig = Simplify<ConfigWithDefaults<Config, typeof defaultConfig>>;

/**
 * The state values the engine seeds: the base engine's, including any it seeds beyond its features' (the background
 * engine's `loadActivated`), since the transmux seeds none.
 */
export const initialState: typeof hlsBackgroundVideo.initialState = {
  ...hlsBackgroundVideo.initialState,
  ...composed.initialState,
};

/** Creates the engine, the same shape `@videojs/spf/engines/hls-background-video`'s `createEngine` produces. */
export const createEngine: (config?: EngineConfig) => Composition<EngineState, EngineContext> =
  defineCompositionFactory(behaviors, { defaultConfig, initialState });
