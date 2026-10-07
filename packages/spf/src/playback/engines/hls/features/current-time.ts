import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../../../core/composition/define-behavior';
import { defineFeature } from '../../../../core/composition/define-feature';
import { trackCurrentTime } from '../../../behaviors/dom/track-current-time';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [trackCurrentTime] as const;

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

/** Mirrors the media element's `currentTime` into state, which segment loading reads to plan what to load next. */
export const currentTimeFeature = defineFeature({ behaviors, defaultConfig, initialState });
