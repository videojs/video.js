import { defineExternalSignals } from '../../../../core/composition/define-external-signals';
import { defineFeature } from '../../../../core/composition/define-feature';
import { canPlayTrack } from '../../../../media/dom/capabilities';
import { loadAudioSegments } from '../../../behaviors/dom/load-segments';
import { setupAudioBufferActors } from '../../../behaviors/dom/setup-buffer-actors';
import { resolveAudioTrack } from '../../../behaviors/resolve-track';
import { switchAudioTrack, type UserTrackSelectionState } from '../../../behaviors/track-switching';
import { reportUnsupportedTrackConditions } from '../../../primitives/report-track-conditions';

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
export const audioFeature = defineFeature({
  behaviors: [
    resolveAudioTrack,
    switchAudioTrack,
    setupAudioBufferActors,
    loadAudioSegments,
    defineExternalSignals<UserTrackSelectionState<'audio'>>()({ state: ['userAudioTrackSelection'] }),
  ],
  defaultConfig: { canPlayTrack, reportUnsupportedTrackConditions },
});
