import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../../../core/composition/define-behavior';
import { defineFeature } from '../../../../core/composition/define-feature';
import { recoverEndStall } from '../../../behaviors/dom/recover-end-stall';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [recoverEndStall] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** The config defaults the feature contributes. */
export const defaultConfig = {} satisfies Partial<Config>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Fires the media element's `ended` when Chrome freezes the playhead a few frames short of the end of a stream whose
 * audio and video end at slightly different times. Inert otherwise.
 */
export const endStallRecoveryFeature = defineFeature({ behaviors, defaultConfig, initialState });
