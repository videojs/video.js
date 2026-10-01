import type { SliderSegmentState } from '../../slider/segments';
import type { StateAttrMap } from '../../types';

/** @internal */
export const TimeSliderChapterDataAttrs = {
  /** Present when playback is within the chapter. */
  active: 'data-active',
  /** Present when pointer interaction highlights the chapter. */
  highlighted: 'data-highlighted',
} as const satisfies StateAttrMap<SliderSegmentState>;
