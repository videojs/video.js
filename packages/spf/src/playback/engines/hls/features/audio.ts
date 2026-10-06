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
