import type { Simplify } from '@videojs/utils/types';

import {
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../../core/composition/create-composition';
import { defineFeature } from '../../../../core/composition/define-feature';
import { trackPlayerResolution } from '../../../behaviors/dom/track-player-resolution';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [trackPlayerResolution] as const;

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
 * Monitors the player's rendered size, which enables capping video quality to it: the video selection rules' player
 * resolution cap reads the size and does nothing without it.
 */
export const monitorPlayerSizeFeature = defineFeature({ behaviors, defaultConfig, initialState });
