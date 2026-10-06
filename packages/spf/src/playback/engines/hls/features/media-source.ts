import { defineFeature } from '../../../../core/composition/define-feature';
import { endOfStream } from '../../../behaviors/dom/end-of-stream';
import { setupMediaSource } from '../../../behaviors/dom/setup-mediasource';
import { updateMediaSourceDuration } from '../../../behaviors/dom/update-mediasource-duration';

/**
 * Plays through Media Source Extensions: attaches a MediaSource to the media element, keeps its duration current, and
 * ends the stream once every composed track type has loaded its last segment.
 */
export const mediaSourceFeature = defineFeature({
  behaviors: [setupMediaSource, updateMediaSourceDuration, endOfStream],
});
