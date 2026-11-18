import type { StateAttrMap } from '../../types';
import type { TimeSliderMarkerState } from './core';

/** @internal */
export const TimeSliderMarkerDataAttrs = {
  /** Present when the marker's cue is active now. */
  active: 'data-active',
  /** Present when the cue marks one moment rather than a span. */
  point: 'data-point',
} as const satisfies StateAttrMap<TimeSliderMarkerState>;
