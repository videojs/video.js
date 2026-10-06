import { defineFeature } from '../../../../core/composition/define-feature';
import { relocatingTextPipelines } from '../../../primitives/relocation-pipelines';

/**
 * Shifts text cues onto the playlist's zero-based timeline along with the audio and video, rebasing each cue by the
 * shift `shiftTimestampsFeature` establishes. Compose it only with both `shiftTimestampsFeature` and
 * `textTracksFeature`: without the shift, cues would wait for an origin nothing establishes.
 */
export const shiftTextTimestampsFeature = defineFeature({
  behaviors: [],
  defaultConfig: { textMessagePipelines: relocatingTextPipelines },
});
