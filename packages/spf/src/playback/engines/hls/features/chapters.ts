import { defineFeature } from '../../../../core/composition/define-feature';
import { loadChapters } from '../../../behaviors/dom/load-chapters';

/**
 * Adds the source's Apple JSON chapters (`EXT-X-SESSION-DATA`, `com.apple.hls.chapters`) to the media element as a
 * hidden `chapters` text track per language.
 */
export const chaptersFeature = defineFeature({
  behaviors: [loadChapters],
});
