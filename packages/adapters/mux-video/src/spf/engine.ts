import { type Composition, type ConfigWithDefaults, defineCompositionFactory, flattenFeatures } from '@videojs/spf';
import * as hlsVideo from '@videojs/spf/engines/hls-video';
import * as transmux from '@videojs/spf/features/mpeg-ts-transmux';
import type { Simplify } from '@videojs/utils/types';

// Every export here is annotated from the base engine's and the feature's own exported types rather than inferred:
// the declaration emitter cannot name an inferred composition type across the package boundary.

/**
 * The features the Mux video engine composes: the HLS video engine's, then `mpegTsTransmuxFeature`, so the MPEG-TS that
 * Mux packages at the plus and basic tiers plays by transmuxing to fMP4 on the client. Composed last, as the feature
 * requires: it replaces the loader pipelines `shiftTimestampsFeature` sets and the playability probe `drmFeature` sets.
 * Mux-only on purpose — the transmuxer covers what Mux packages (one program, H.264 + AAC-LC), not every MPEG-TS a
 * general HLS source might carry — which is why no shipped SPF engine composes it and the plain `<hls-video>` keeps its
 * unsupported-format verdict.
 */
export const features: readonly [...typeof hlsVideo.features, typeof transmux.mpegTsTransmuxFeature] = [
  ...hlsVideo.features,
  transmux.mpegTsTransmuxFeature,
];

const composed = flattenFeatures(features);

/** The behaviors the engine composes, in setup order: the base engine's, since the transmux composes none of its own. */
export const behaviors: typeof hlsVideo.behaviors = composed.behaviors;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read, before `defaultConfig` makes any optional. */
export type Config = hlsVideo.Config;
/** State shape: the base engine's, since the transmux declares no state. */
export type EngineState = hlsVideo.EngineState;
/** Context shape: the base engine's, since the transmux declares no context. */
export type EngineContext = hlsVideo.EngineContext;

/** The config defaults the features contribute, the transmux's replacing the base engine's where they overlap. */
export const defaultConfig: Omit<typeof hlsVideo.defaultConfig, keyof typeof transmux.defaultConfig> &
  typeof transmux.defaultConfig = composed.defaultConfig;

/** Configuration: every config key its behaviors read, with each key `defaultConfig` covers optional. */
export type EngineConfig = Simplify<ConfigWithDefaults<Config, typeof defaultConfig>>;

/**
 * The state values the engine seeds: the base engine's, including any it seeds beyond its features' (the background
 * engine's `loadActivated`), since the transmux seeds none.
 */
export const initialState: typeof hlsVideo.initialState = { ...hlsVideo.initialState, ...composed.initialState };

/** Creates the engine, the same shape `@videojs/spf/engines/hls-video`'s `createEngine` produces. */
export const createEngine: (config?: EngineConfig) => Composition<EngineState, EngineContext> =
  defineCompositionFactory(behaviors, { defaultConfig, initialState });
