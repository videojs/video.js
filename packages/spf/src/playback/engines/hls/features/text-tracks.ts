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
export const textTracksFeature = defineFeature({
  behaviors: [
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
  ],
  defaultConfig: {
    resolveTextTrackSegment: resolveVttSegment,
    addSubtitlesTracksToMedia,
    getShowingSubtitlesTrackFromMedia,
    removeAllSubtitlesTracksFromMedia,
  },
});
