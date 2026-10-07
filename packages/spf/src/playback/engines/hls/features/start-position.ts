import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../../../core/composition/define-behavior';
import { defineFeature } from '../../../../core/composition/define-feature';
import { applyStartPosition } from '../../../behaviors/dom/apply-start-position';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [applyStartPosition] as const;

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
 * Starts playback at `state.startPosition` instead of zero. Also performs the seeks other features request through
 * `state.startPosition`, such as the live edge and the AirPlay session-end restore.
 */
export const startPositionFeature = defineFeature({ behaviors, defaultConfig, initialState });
