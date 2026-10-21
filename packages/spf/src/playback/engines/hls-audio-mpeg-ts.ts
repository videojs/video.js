import type { Simplify } from '@videojs/utils/types';

import { type ConfigWithDefaults, defineCompositionFactory } from '../../core/composition/create-composition';
import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../core/composition/define-behavior';
import { flattenFeatures } from '../../core/composition/define-feature';
import { airPlayFeature } from '../features/airplay';
import { audioFeature } from '../features/audio';
import { calculateDurationFeature } from '../features/calculate-duration';
import { chaptersFeature } from '../features/chapters';
import { currentTimeFeature } from '../features/current-time';
import { endStallRecoveryFeature } from '../features/end-stall-recovery';
import { errorFeature } from '../features/error';
import { hlsLoadingFeature } from '../features/hls-loading';
import { initialLoadFeature } from '../features/initial-load';
import { mediaSourceFeature } from '../features/media-source';
import { mpegTsAudioTransmuxFeature } from '../features/mpeg-ts-audio-transmux';
import { multiCdnFeature } from '../features/multi-cdn';
import { shiftTimestampsFeature } from '../features/shift-timestamps';
import { startPositionFeature } from '../features/start-position';

/**
 * The features the MPEG-TS audio-only HLS playback engine composes: the HLS audio engine's, then
 * `mpegTsAudioTransmuxFeature`, which carries the AAC framing alone — no H.264 — and lays in last as it requires.
 *
 * MPEG-TS coverage is what Mux Video packages (one program, H.264 + AAC-LC, unencrypted), not every MPEG-TS a general
 * HLS source might carry; the container-neutral engine keeps refusing MPEG-TS, so a Media over it keeps the
 * unsupported-format verdict for content this one would mis-play.
 */
export const features = [
  initialLoadFeature,
  hlsLoadingFeature,
  multiCdnFeature,
  errorFeature,
  calculateDurationFeature,
  mediaSourceFeature,
  audioFeature,
  shiftTimestampsFeature,
  airPlayFeature,
  currentTimeFeature,
  startPositionFeature,
  endStallRecoveryFeature,
  chaptersFeature,
  mpegTsAudioTransmuxFeature,
] as const;

const composed = flattenFeatures(features);

/**
 * The behaviors the engine composes, in setup order: its features' behaviors, each composed once — the hls-audio
 * engine's, since the transmux feature composes none of its own. The feature list is written out rather than spread
 * from `./hls-audio` so the reference generator can read it; a test holds the two lists together.
 */
export const behaviors = composed.behaviors;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read, before `defaultConfig` makes any optional. */
export type Config = ResolveBehaviorConfig<Behaviors>;

/** State shape for the engine: every state key its behaviors declare — the hls-audio engine's. */
export type EngineState = Simplify<ResolveBehaviorState<Behaviors>>;

/** Context shape for the engine: every context key its behaviors declare — the hls-audio engine's. */
export type EngineContext = Simplify<ResolveBehaviorContext<Behaviors>>;

/**
 * Configuration for the engine: every config key its behaviors read, with each key `defaultConfig` covers optional.
 * Each field is documented on the config type of the behavior that reads it.
 */
export type EngineConfig = Simplify<ConfigWithDefaults<Config, typeof defaultConfig>>;

/**
 * The defaults `createEngine` fills in for every config key the caller leaves `undefined`: its features' merged
 * `defaultConfig`, the transmux feature's replacing the hls-audio engine's where they overlap.
 */
export const defaultConfig = composed.defaultConfig;

/** The state the engine starts with: its features' merged `initialState`. */
export const initialState = composed.initialState;

/**
 * Create an audio-only HLS playback engine that also plays MPEG-TS: `@videojs/spf/engines/hls-audio`'s engine with each
 * MPEG-TS audio rendition — an audio-only asset, the alternates of a video asset, or a video asset's default audio
 * carried in its video segments — transmuxed to fMP4 on the client. The Mux audio Media is built over it.
 */
export const createEngine = defineCompositionFactory(behaviors, { defaultConfig, initialState });
