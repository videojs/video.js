import type { Simplify } from '@videojs/utils/types';

import {
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../../core/composition/create-composition';
import { defineFeature } from '../../../../core/composition/define-feature';
import { setupAirPlayFairPlay } from '../../../behaviors/dom/setup-airplay-fairplay';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [setupAirPlayFairPlay] as const;

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
 * Plays FairPlay-protected content on an AirPlay receiver, negotiating the receiver's keys while a session holds.
 *
 * Requires the `drm` and `keySystems` config, such as `drmFeature` sets; without them it throws once a session starts.
 * Does nothing without a writer of `state.loadingSuspended`, such as `airPlayFeature`, which signals the session.
 */
export const airPlayFairPlayFeature = defineFeature({ behaviors, defaultConfig, initialState });
