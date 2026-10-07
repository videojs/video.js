import type { Simplify } from '@videojs/utils/types';

import {
  type ResolveBehaviorConfig,
  type ResolveBehaviorContext,
  type ResolveBehaviorState,
} from '../../../../core/composition/create-composition';
import { defineExternalSignals } from '../../../../core/composition/define-external-signals';
import { defineFeature } from '../../../../core/composition/define-feature';
import { resolveVttSegment } from '../../../../media/dom/text/resolve-vtt-segment';
import {
  addSubtitlesTracksToMedia,
  getShowingSubtitlesTrackFromMedia,
  removeAllSubtitlesTracksFromMedia,
} from '../../../../media/dom/text/text-track-slots';
import { loadTextTrackSegments } from '../../../behaviors/dom/load-segments';
import { setupTextTrackActors } from '../../../behaviors/dom/setup-text-track-actors';
import { syncTextTracks } from '../../../behaviors/dom/sync-text-tracks';
import { resolveTextTrack } from '../../../behaviors/resolve-track';
import { switchTextTrack, type UserTrackSelectionState } from '../../../behaviors/track-switching';

/** The behaviors the feature composes, in setup order. */
export const behaviors = [
  resolveTextTrack,
  // Resolves `userTextTrackSelection` intent (incl. 'off', or the configured
  // preferred-language / DEFAULT-track policy) against the failed-CDN-pruned,
  // active-CDN-scoped text renditions. Optional selection (captions are
  // opt-in), so it can resolve to none.
  switchTextTrack,
  syncTextTracks,
  setupTextTrackActors,
  loadTextTrackSegments,
  defineExternalSignals<UserTrackSelectionState<'text'>>()({ state: ['userTextTrackSelection'] }),
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
  resolveTextTrackSegment: resolveVttSegment,
  addSubtitlesTracksToMedia,
  getShowingSubtitlesTrackFromMedia,
  removeAllSubtitlesTracksFromMedia,
} satisfies Partial<Config>;

/** The state values the feature seeds. */
export const initialState = {} satisfies Partial<State>;

/**
 * Adds the source's subtitle and caption renditions to the media element as text tracks and loads the WebVTT cues of
 * the showing one. Honors the user's `userTextTrackSelection`, including `'off'`.
 *
 * Requires, from other features:
 *
 * - A writer of `state.currentTime`, such as `currentTimeFeature`; without one, cue loading stops after the first window.
 * - A writer of `state.loadActivated`, such as `initialLoadFeature`, or a seeded `loadActivated: true`.
 *
 * Content whose timestamps don't start at zero also needs `shiftTextTimestampsFeature`, or its cues are misaligned.
 */
export const textTracksFeature = defineFeature({ behaviors, defaultConfig, initialState });
