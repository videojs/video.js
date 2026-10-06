import { defineFeature } from '../../../../core/composition/define-feature';
import { trackPlayerResolution } from '../../../behaviors/dom/track-player-resolution';

/**
 * Monitors the player's rendered size, which enables capping video quality to it: the video selection rules' player
 * resolution cap reads the size and does nothing without it.
 */
export const monitorPlayerSizeFeature = defineFeature({
  behaviors: [trackPlayerResolution],
});
