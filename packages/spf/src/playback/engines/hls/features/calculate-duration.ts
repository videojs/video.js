import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../../../core/composition/define-behavior';
import { defineFeature } from '../../../../core/composition/define-feature';
import { getResolvedSelectedTrackDuration } from '../../../../media/utils/track-selection';
import { calculatePresentationDuration } from '../../../behaviors/calculate-presentation-duration';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [calculatePresentationDuration] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** The config defaults the feature contributes. */
export const defaultConfig = { resolveDuration: getResolvedSelectedTrackDuration } satisfies Partial<Config>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Calculates the presentation's duration from its selected tracks once they've loaded.
 *
 * Requires a writer of resolved, selected video or audio tracks, such as `videoFeature` or `audioFeature`; without one,
 * no duration is set.
 */
export const calculateDurationFeature = defineFeature({ behaviors, defaultConfig, initialState });
