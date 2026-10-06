import { defineFeature } from '../../../../core/composition/define-feature';
import { getResolvedSelectedTrackDuration } from '../../../../media/utils/track-selection';
import { calculatePresentationDuration } from '../../../behaviors/calculate-presentation-duration';

/** Calculates the presentation's duration from its selected tracks once they've loaded. */
export const calculateDurationFeature = defineFeature({
  behaviors: [calculatePresentationDuration],
  defaultConfig: { resolveDuration: getResolvedSelectedTrackDuration },
});
