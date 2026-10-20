import { type Composition, type ConfigWithDefaults, defineCompositionFactory, flattenFeatures } from '@videojs/spf';
import * as hlsAudio from '@videojs/spf/engines/hls-audio';
import * as transmux from '@videojs/spf/features/mpeg-ts-audio-transmux';
import type { Simplify } from '@videojs/utils/types';

// Every export here is annotated from the base engine's and the feature's own exported types rather than inferred:
// the declaration emitter cannot name an inferred composition type across the package boundary.

/**
 * The features the Mux audio engine composes: the HLS audio engine's, then `mpegTsAudioTransmuxFeature`, so Mux's
 * MPEG-TS audio renditions (an audio-only asset, the alternates of a video asset, or a video asset's default audio
 * carried in its video segments) play by transmuxing their AAC to fMP4, with no video codec compiled in. Composed last,
 * as the feature requires. Mux-only for the reason `@videojs/mux-video/spf`'s engine is.
 */
export const features: readonly [...typeof hlsAudio.features, typeof transmux.mpegTsAudioTransmuxFeature] = [
  ...hlsAudio.features,
  transmux.mpegTsAudioTransmuxFeature,
];

const composed = flattenFeatures(features);

/** The behaviors the engine composes, in setup order: the base engine's, since the transmux composes none of its own. */
export const behaviors: typeof hlsAudio.behaviors = composed.behaviors;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read, before `defaultConfig` makes any optional. */
export type Config = hlsAudio.Config;
/** State shape: the base engine's, since the transmux declares no state. */
export type EngineState = hlsAudio.EngineState;
/** Context shape: the base engine's, since the transmux declares no context. */
export type EngineContext = hlsAudio.EngineContext;

/** The config defaults the features contribute, the transmux's replacing the base engine's where they overlap. */
export const defaultConfig: Omit<typeof hlsAudio.defaultConfig, keyof typeof transmux.defaultConfig> &
  typeof transmux.defaultConfig = composed.defaultConfig;

/** Configuration: every config key its behaviors read, with each key `defaultConfig` covers optional. */
export type EngineConfig = Simplify<ConfigWithDefaults<Config, typeof defaultConfig>>;

/**
 * The state values the engine seeds: the base engine's, including any it seeds beyond its features' (the background
 * engine's `loadActivated`), since the transmux seeds none.
 */
export const initialState: typeof hlsAudio.initialState = { ...hlsAudio.initialState, ...composed.initialState };

/** Creates the engine, the same shape `@videojs/spf/engines/hls-audio`'s `createEngine` produces. */
export const createEngine: (config?: EngineConfig) => Composition<EngineState, EngineContext> =
  defineCompositionFactory(behaviors, { defaultConfig, initialState });
