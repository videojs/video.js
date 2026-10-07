import type { Simplify } from '@videojs/utils/types';

import type {
  ResolveBehaviorConfig,
  ResolveBehaviorContext,
  ResolveBehaviorState,
} from '../../../../core/composition/define-behavior';
import { defineFeature } from '../../../../core/composition/define-feature';
import { canPlayTrack } from '../../../../media/dom/capabilities';
import { SVTA_NO_SUPPORTED_VIDEO_TRACK } from '../../../../media/errors';
import { reportAbsentTrackType } from '../../../behaviors/collect-errors';
import { loadVideoSegments } from '../../../behaviors/dom/load-segments';
import { setupVideoBufferActors } from '../../../behaviors/dom/setup-buffer-actors';
import { trackScreenResolution } from '../../../behaviors/dom/track-screen-resolution';
import { resolveVideoTrack } from '../../../behaviors/resolve-track';
import {
  preferHighestResolution,
  type SelectVideoTrackConfig,
  screenResolutionCap,
  selectVideoTrack,
} from '../../../behaviors/select-tracks';
import { reportUnsupportedTrackConditions } from '../../../primitives/report-track-conditions';
import { excludeUnplayableTracks } from '../../../primitives/selection-rules';

// Prune what this environment can't decode, then report 2011 if nothing is left: this engine composes only video, so a
// source with none playable can never play.
// SAFETY: `reportAbsentTrackType` also reads the optional `errors` state, which the config's rule type doesn't
// declare; `collectErrors` provides it in this composition, and the rule no-ops without it.
const videoConstraints = [excludeUnplayableTracks, reportAbsentTrackType(SVTA_NO_SUPPORTED_VIDEO_TRACK)] as NonNullable<
  SelectVideoTrackConfig['videoConstraints']
>;
// Narrow to the renditions that fit the screen, then take the largest.
const videoRules: NonNullable<SelectVideoTrackConfig['videoRules']> = [screenResolutionCap, preferHighestResolution];

/** The behaviors the feature composes, in setup order. */
export const behaviors = [
  selectVideoTrack,
  resolveVideoTrack,
  setupVideoBufferActors,
  loadVideoSegments,
  trackScreenResolution,
] as const;

export type Behaviors = typeof behaviors;
/** Every config key the behaviors read. */
export type Config = ResolveBehaviorConfig<Behaviors>;
/** Every state key the behaviors and external signals declare. */
export type State = Simplify<ResolveBehaviorState<Behaviors>>;
/** Every context key the behaviors declare. */
export type Context = Simplify<ResolveBehaviorContext<Behaviors>>;

/** The config defaults the feature contributes. */
export const defaultConfig = {
  videoConstraints,
  videoRules,
  canPlayTrack,
  reportUnsupportedTrackConditions,
} satisfies Partial<Config>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Plays one video rendition for the whole session: the largest that fits the screen, picked once rather than adapted to
 * bandwidth. For ambient, hero, and GIF-replacement video. Reports when no rendition is playable.
 *
 * Requires, from this or other features:
 *
 * - A writer of `context.mediaSource`, such as `mediaSourceFeature`; nothing loads without one.
 * - A writer of `state.currentTime`, such as `currentTimeFeature`; without one, loading stops after the first window.
 * - A writer of `state.loadActivated`, such as `initialLoadFeature`, or a seeded `loadActivated: true`; without one, only
 *   init segments load.
 */
export const backgroundVideoFeature = defineFeature({ behaviors, defaultConfig, initialState });
