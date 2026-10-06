import { defineExternalSignals } from '../../../../core/composition/define-external-signals';
import { defineFeature } from '../../../../core/composition/define-feature';
import { canPlayTrack } from '../../../../media/dom/capabilities';
import { loadVideoSegments } from '../../../behaviors/dom/load-segments';
import { setupVideoBufferActors } from '../../../behaviors/dom/setup-buffer-actors';
import { resolveVideoTrack } from '../../../behaviors/resolve-track';
import { switchVideoTrack, type UserTrackSelectionState } from '../../../behaviors/track-switching';
import { reportUnsupportedTrackConditions } from '../../../primitives/report-track-conditions';

/**
 * Plays video with adaptive bitrate: resolves the selected rendition's playlist, switches renditions as bandwidth
 * changes, and buffers and loads its segments. Honors the user's `userVideoTrackSelection`.
 *
 * Requires, from this or other features:
 *
 * - A writer of `context.mediaSource`, such as `mediaSourceFeature`; nothing loads without one.
 * - A writer of `state.currentTime`, such as `currentTimeFeature`; without one, loading stops after the first window.
 * - A writer of `state.loadActivated`, such as `initialLoadFeature`, or a seeded `loadActivated: true`; without one, only
 *   init segments load.
 */
export const videoFeature = defineFeature({
  behaviors: [
    resolveVideoTrack,
    switchVideoTrack,
    setupVideoBufferActors,
    loadVideoSegments,
    defineExternalSignals<UserTrackSelectionState<'video'>>()({ state: ['userVideoTrackSelection'] }),
  ],
  defaultConfig: { canPlayTrack, reportUnsupportedTrackConditions },
  initialState: {
    bandwidthState: {
      fastEstimate: 0,
      fastTotalWeight: 0,
      slowEstimate: 0,
      slowTotalWeight: 0,
      bytesSampled: 0,
    },
  },
});
