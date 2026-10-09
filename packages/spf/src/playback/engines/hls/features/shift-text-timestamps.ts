import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../../../core/composition/define-behavior';
import { defineFeature } from '../../../../core/composition/define-feature';
import type { setupTextTrackActors } from '../../../behaviors/dom/setup-text-track-actors';
import { relocatingTextPipelines } from '../../../primitives/relocation-pipelines';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** `setupTextTrackActors`, which reads `textMessagePipelines`; the feature has no behaviors of its own. */
type ConfigReaders = readonly [...Behaviors, typeof setupTextTrackActors];

/** The config defaults the feature contributes. */
export const defaultConfig = { textMessagePipelines: relocatingTextPipelines } satisfies Partial<
  ResolveBehaviorConfig<ConfigReaders>
>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Shifts text cues onto the playlist's zero-based timeline along with the audio and video, rebasing each cue by the
 * shift `shiftTimestampsFeature` establishes. Does nothing without a text feature, such as `textTracksFeature`.
 *
 * Requires a writer of each track's `startMediaTime` from its container timestamps, such as `shiftTimestampsFeature`;
 * without one, cues wait for an origin nothing establishes and never appear.
 */
export const shiftTextTimestampsFeature = defineFeature({ behaviors, defaultConfig, initialState });
