import type { Simplify } from '@videojs/utils/types';

import {
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../../core/composition/create-composition';
import { defineFeature } from '../../../../core/composition/define-feature';
import { deriveSharedMinStartMediaTime, establishStartMediaTime } from '../../../behaviors/establish-start-media-time';
import { relocationPipelinesFor } from '../../../primitives/relocation-pipelines';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [establishStartMediaTime] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/**
 * The config defaults the feature contributes. The pipelines are read by the track features' buffer actors, not by this
 * feature's own behavior, so the object is not checked against `Config`.
 */
export const defaultConfig = {
  // The coordination seam the reactor (model `startMediaTime`) and the
  // loader stamps (buffer `timestampOffset`) both read from config, so they
  // apply the SAME derive. Shared-`min` across selected A/V (subsumes
  // per-type).
  deriveStartMediaTime: deriveSharedMinStartMediaTime,
  // The discover/stamp steps `establishStartMediaTime` pairs with.
  videoMessagePipelines: relocationPipelinesFor('video'),
  audioMessagePipelines: relocationPipelinesFor('audio'),
};

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Plays HLS content whose segment timestamps don't start at zero, by shifting them onto the playlist's zero-based
 * timeline. Without it, such content strands the playhead outside the buffered ranges; content that starts at zero
 * doesn't need it. Text cues shift with `shiftTextTimestampsFeature`, composed alongside it and `textTracksFeature`.
 */
export const shiftTimestampsFeature = defineFeature({ behaviors, defaultConfig, initialState });
