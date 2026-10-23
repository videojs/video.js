import type { Simplify } from '@videojs/utils/types';

import { type ConfigWithDefaults, defineCompositionFactory } from '../../core/composition/create-composition';
import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../core/composition/define-behavior';
import { flattenFeatures } from '../../core/composition/define-feature';
import { backgroundVideoFeature } from '../features/background-video';
import { calculateDurationFeature } from '../features/calculate-duration';
import { currentTimeFeature } from '../features/current-time';
import { errorFeature } from '../features/error';
import { hlsLoadingFeature } from '../features/hls-loading';
import { mediaSourceFeature } from '../features/media-source';
import { mpegTsTransmuxFeature } from '../features/mpeg-ts-transmux';
import { shiftTimestampsFeature } from '../features/shift-timestamps';

/**
 * The features the MPEG-TS background-video engine composes: the HLS background-video engine's, then
 * `mpegTsTransmuxFeature`, laid in last as it requires. The background engine composes `shiftTimestampsFeature`, which
 * the transmux needs to place MPEG-TS content, whose timestamps rarely start at zero, onto the playlist timeline.
 *
 * MPEG-TS support is a deliberately narrow subset, what Mux Video packages (see `mpegTsTransmuxFeature`), not every
 * MPEG-TS a general HLS source might carry; the container-neutral engine keeps refusing MPEG-TS, so a Media over it
 * keeps the unsupported-format verdict for content this one would mis-play.
 */
export const features = [
  hlsLoadingFeature,
  errorFeature,
  calculateDurationFeature,
  mediaSourceFeature,
  backgroundVideoFeature,
  shiftTimestampsFeature,
  currentTimeFeature,
  mpegTsTransmuxFeature,
] as const;

const composed = flattenFeatures(features);

/**
 * The behaviors the engine composes, in setup order: its features' behaviors, each composed once — the
 * hls-background-video engine's, since the transmux feature composes none of its own.
 */
export const behaviors = composed.behaviors;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read, before `defaultConfig` makes any optional. */
export type Config = ResolveBehaviorConfig<Behaviors>;

/** State shape for the engine: every state key its behaviors declare — the hls-background-video engine's. */
export type EngineState = Simplify<ResolveBehaviorState<Behaviors>>;

/** Context shape for the engine: every context key its behaviors declare — the hls-background-video engine's. */
export type EngineContext = Simplify<ResolveBehaviorContext<Behaviors>>;

/**
 * Configuration for the engine: every config key its behaviors read, with each key `defaultConfig` covers optional.
 * Each field is documented on the config type of the behavior that reads it.
 */
export type EngineConfig = Simplify<ConfigWithDefaults<Config, typeof defaultConfig>>;

/**
 * The defaults `createEngine` fills in for every config key the caller leaves `undefined`: its features' merged
 * `defaultConfig`, the transmux feature's replacing the hls-background-video engine's where they overlap.
 */
export const defaultConfig = composed.defaultConfig;

/**
 * The state the engine starts with: its features' merged `initialState`, plus the `loadActivated: true` the
 * background-video engine seeds in place of `initialLoadFeature` (see `./hls-background-video`).
 */
export const initialState = { ...composed.initialState, loadActivated: true };

/**
 * Create a background-video engine that also plays MPEG-TS: `@videojs/spf/engines/hls-background-video`'s engine with
 * each MPEG-TS segment transmuxed to fMP4 on the client. The Mux background-video Media is built over it.
 */
export const createEngine = defineCompositionFactory(behaviors, { defaultConfig, initialState });
