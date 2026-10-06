import type { Simplify } from '@videojs/utils/types';

import {
  type ConfigWithDefaults,
  defineCompositionFactory,
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../core/composition/create-composition';
import { flattenFeatures } from '../../../core/composition/define-feature';
import { airPlayFeature } from './features/airplay';
import { airPlayFairPlayFeature } from './features/airplay-fairplay';
import { audioFeature } from './features/audio';
import { calculateDurationFeature } from './features/calculate-duration';
import { chaptersFeature } from './features/chapters';
import { currentTimeFeature } from './features/current-time';
import { drmFeature } from './features/drm';
import { endStallRecoveryFeature } from './features/end-stall-recovery';
import { errorFeature } from './features/error';
import { hlsLoadingFeature } from './features/hls-loading';
import { initialLoadFeature } from './features/initial-load';
import { liveFeature } from './features/live';
import { mediaSourceFeature } from './features/media-source';
import { monitorPlayerSizeFeature } from './features/monitor-player-size';
import { multiCdnFeature } from './features/multi-cdn';
import { shiftTextTimestampsFeature } from './features/shift-text-timestamps';
import { shiftTimestampsFeature } from './features/shift-timestamps';
import { startPositionFeature } from './features/start-position';
import { textTracksFeature } from './features/text-tracks';
import { videoFeature } from './features/video';

// ============================================================================
// HLS Engine State & Context
// ============================================================================

/**
 * The features the HLS playback engine composes, in order. A feature's behaviors compose in its position, and a later
 * feature's `defaultConfig` and `initialState` values replace an earlier one's.
 */
export const features = [
  initialLoadFeature,
  hlsLoadingFeature,
  multiCdnFeature,
  errorFeature,
  calculateDurationFeature,
  mediaSourceFeature,
  videoFeature,
  audioFeature,
  textTracksFeature,
  airPlayFairPlayFeature,
  drmFeature,
  shiftTimestampsFeature,
  shiftTextTimestampsFeature,
  airPlayFeature,
  currentTimeFeature,
  startPositionFeature,
  monitorPlayerSizeFeature,
  liveFeature,
  endStallRecoveryFeature,
  chaptersFeature,
] as const;

const composed = flattenFeatures(features);

/**
 * The behaviors the HLS playback engine composes, in setup order: its features' behaviors, each composed once. The
 * engine's state and context types are derived from this list, so adding or removing a feature changes them with no
 * separate type to update.
 */
export const behaviors = composed.behaviors;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read, before `defaultConfig` makes any optional. */
export type Config = ResolveBehaviorConfig<Behaviors>;

/** State shape for the HLS playback engine: every state key its features' behaviors and external signals declare. */
export type EngineState = Simplify<ResolveBehaviorState<Behaviors>>;

/** Context shape for the HLS playback engine: every context key its behaviors declare. */
export type EngineContext = Simplify<ResolveBehaviorContext<Behaviors>>;

/**
 * Configuration for the HLS playback engine: every config key its behaviors read, with each key `defaultConfig` covers
 * optional. Each field is documented on the config type of the behavior that reads it.
 */
export type EngineConfig = Simplify<ConfigWithDefaults<Config, typeof defaultConfig>>;

// ============================================================================
// HLS Playback Engine
// ============================================================================

/**
 * The defaults `createEngine` fills in for every config key the caller leaves `undefined`: its features' merged
 * `defaultConfig`. Each is optional in `EngineConfig`, so a caller may override it.
 */
export const defaultConfig = composed.defaultConfig;

/** The state the engine starts with: its features' merged `initialState`. */
export const initialState = composed.initialState;

/**
 * Create an HLS playback engine.
 *
 * Composes SPF behaviors into a reactive pipeline for HLS playback over MSE: manifest resolution, track selection, ABR,
 * segment loading, and end-of-stream coordination.
 *
 * @example
 *   ```ts
 *   const engine = createEngine({
 *     initialBandwidth: 2_000_000,
 *   });
 *
 *   engine.context.mediaElement.set(videoEl);
 *   engine.state.presentation.set({ url: 'https://example.com/stream.m3u8' });
 *
 *   videoEl.play();
 *
 *   await engine.destroy();
 *   ```;
 */
export const createEngine = defineCompositionFactory(behaviors, { defaultConfig, initialState });
