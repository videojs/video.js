import { defineFeature } from '../../../../core/composition/define-feature';
import { relocatingTextPipelines } from '../../../primitives/relocation-pipelines';

/**
 * Shifts text cues onto the playlist's zero-based timeline along with the audio and video, rebasing each cue by the
 * shift `shiftTimestampsFeature` establishes. Does nothing without a text feature, such as `textTracksFeature`.
 *
 * Requires a writer of each track's `startMediaTime` from its container timestamps, such as `shiftTimestampsFeature`;
 * without one, cues wait for an origin nothing establishes and never appear.
 */
export const shiftTextTimestampsFeature = defineFeature({
  behaviors: [],
  defaultConfig: { textMessagePipelines: relocatingTextPipelines },
});
