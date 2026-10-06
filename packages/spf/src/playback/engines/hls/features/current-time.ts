import { defineFeature } from '../../../../core/composition/define-feature';
import { trackCurrentTime } from '../../../behaviors/dom/track-current-time';

/** Mirrors the media element's `currentTime` into state, which segment loading reads to plan what to load next. */
export const currentTimeFeature = defineFeature({
  behaviors: [trackCurrentTime],
});
