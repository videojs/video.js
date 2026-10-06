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
import { audioFeature } from './features/audio';
import { calculateDurationFeature } from './features/calculate-duration';
import { chaptersFeature } from './features/chapters';
import { currentTimeFeature } from './features/current-time';
import { endStallRecoveryFeature } from './features/end-stall-recovery';
import { errorFeature } from './features/error';
import { hlsLoadingFeature } from './features/hls-loading';
import { initialLoadFeature } from './features/initial-load';
import { mediaSourceFeature } from './features/media-source';
import { multiCdnFeature } from './features/multi-cdn';
import { shiftTimestampsFeature } from './features/shift-timestamps';
import { startPositionFeature } from './features/start-position';

// ============================================================================
// Audio-Only HLS Engine State & Context
// ============================================================================

/**
 * The features the audio-only HLS playback engine composes, in order. A feature's behaviors compose in its position,
 * and a later feature's `defaultConfig` and `initialState` values replace an earlier one's.
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

/** State shape for the audio-only HLS playback engine: every state key its behaviors and external signals declare. */
export type EngineState = Simplify<ResolveBehaviorState<Behaviors>>;

/** Context shape for the audio-only HLS playback engine: every context key its behaviors declare. */
export type EngineContext = Simplify<ResolveBehaviorContext<Behaviors>>;

/**
 * Configuration for the audio-only HLS playback engine: every config key its behaviors read, with each key
 * `defaultConfig` covers optional. Each field is documented on the config type of the behavior that reads it.
 */
export type EngineConfig = Simplify<ConfigWithDefaults<Config, typeof defaultConfig>>;

// ============================================================================
// Audio-Only HLS Playback Engine
// ============================================================================

/**
 * The defaults `createEngine` fills in for every config key the caller leaves `undefined`: its features' merged
 * `defaultConfig`. Each is optional in `EngineConfig`, so a caller may override it.
 */
export const defaultConfig = composed.defaultConfig;

/** The state the engine starts with: its features' merged `initialState`. */
export const initialState = composed.initialState;

/**
 * Create an audio-only HLS playback engine.
 *
 * Subtractive composition variant of the HLS video engine (`./engine`): omits video-side behaviors
 * (`resolveVideoTrack`, `switchVideoTrack`, `setupVideoBufferActors`, `loadVideoSegments`) and subtitle behaviors
 * (`switchTextTrack`, `resolveTextTrack`, `syncTextTracks`, `setupTextTrackActors`, `loadTextTrackSegments`). Chapters
 * (`loadChapters`) stay: they are session data, not a subtitle rendition. The remaining audio pipeline composes
 * unchanged.
 *
 * Handles both truly audio-only HLS sources (no video stream-inf) and mixed-AV HLS sources where the audio rendition is
 * selected and video / subtitle renditions are ignored at composition time. The variant decision is encoded by adapter
 * choice; this engine does not branch on source shape.
 *
 * @example
 *   ```ts
 *   const engine = createEngine();
 *
 *   engine.context.mediaElement.set(audioEl);
 *   engine.state.presentation.set({ url: 'https://example.com/stream.m3u8' });
 *   ```;
 */
export const createEngine = defineCompositionFactory(behaviors, { defaultConfig, initialState });
