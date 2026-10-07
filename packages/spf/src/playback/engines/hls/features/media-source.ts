import type { Simplify } from '@videojs/utils/types';

import {
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../../core/composition/create-composition';
import { defineFeature } from '../../../../core/composition/define-feature';
import { endOfStream } from '../../../behaviors/dom/end-of-stream';
import { setupMediaSource } from '../../../behaviors/dom/setup-mediasource';
import { updateMediaSourceDuration } from '../../../behaviors/dom/update-mediasource-duration';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [setupMediaSource, updateMediaSourceDuration, endOfStream] as const;

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
 * Plays through Media Source Extensions: attaches a MediaSource to the media element, keeps its duration current, and
 * ends the stream once every composed track type has loaded its last segment.
 *
 * Requires:
 *
 * - A writer of `presentation.duration`, such as `calculateDurationFeature`; without one, the MediaSource keeps its
 *   default duration, and a live stream never gets its infinite duration and stalls.
 * - A writer of `state.currentTime`, such as `currentTimeFeature`; without one, the stream never ends.
 */
export const mediaSourceFeature = defineFeature({ behaviors, defaultConfig, initialState });
