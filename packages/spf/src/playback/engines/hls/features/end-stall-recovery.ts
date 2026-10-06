import { defineFeature } from '../../../../core/composition/define-feature';
import { recoverEndStall } from '../../../behaviors/dom/recover-end-stall';

/**
 * Fires the media element's `ended` when Chrome freezes the playhead a few frames short of the end of a stream whose
 * audio and video end at slightly different times. Inert otherwise.
 */
export const endStallRecoveryFeature = defineFeature({
  behaviors: [recoverEndStall],
});
