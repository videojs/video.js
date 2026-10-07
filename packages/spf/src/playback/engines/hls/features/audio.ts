import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../../../core/composition/define-behavior';
import { defineExternalSignals } from '../../../../core/composition/define-external-signals';
import { defineFeature } from '../../../../core/composition/define-feature';
import { canPlayTrack } from '../../../../media/dom/capabilities';
import { loadAudioSegments } from '../../../behaviors/dom/load-segments';
import { setupAudioBufferActors } from '../../../behaviors/dom/setup-buffer-actors';
import { resolveAudioTrack } from '../../../behaviors/resolve-track';
import { switchAudioTrack, type UserTrackSelectionState } from '../../../behaviors/track-switching';
import { reportUnsupportedTrackConditions } from '../../../primitives/report-track-conditions';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [
  resolveAudioTrack,
  switchAudioTrack,
  setupAudioBufferActors,
  loadAudioSegments,
  defineExternalSignals<UserTrackSelectionState<'audio'>>()({ state: ['userAudioTrackSelection'] }),
] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** The config defaults the feature contributes. */
export const defaultConfig = { canPlayTrack, reportUnsupportedTrackConditions } satisfies Partial<Config>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Plays audio: resolves the selected rendition's playlist, switches renditions, and buffers and loads its segments.
 * Honors the user's `userAudioTrackSelection`, such as a language.
 *
 * Requires, from this or other features:
 *
 * - A writer of `context.mediaSource`, such as `mediaSourceFeature`; nothing loads without one.
 * - A writer of `state.currentTime`, such as `currentTimeFeature`; without one, loading stops after the first window.
 * - A writer of `state.loadActivated`, such as `initialLoadFeature`, or a seeded `loadActivated: true`; without one, only
 *   init segments load.
 */
export const audioFeature = defineFeature({ behaviors, defaultConfig, initialState });
