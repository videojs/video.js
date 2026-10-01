import { SliderDataAttrs } from '../slider/data';
import type { StateAttrMap } from '../types';
import type { TimeSliderState } from './core';

/** @internal */
export const TimeSliderDataAttrs = {
  ...SliderDataAttrs,
  /** Present when a seek operation is in progress. */
  seeking: 'data-seeking',
} as const satisfies StateAttrMap<TimeSliderState>;
