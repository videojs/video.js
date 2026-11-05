/**
 * CSS geometry local to each marker.
 *
 * @internal
 */
export const TimeSliderMarkerCSSVars = {
  /** Marker start as a percentage of the slider (0–100%). */
  start: '--media-slider-marker-start',
  /** Marker end as a percentage of the slider (0–100%). Equals the start for a point. */
  end: '--media-slider-marker-end',
  /** Marker size along the slider axis as a percentage of the slider; `0%` for a point. */
  width: '--media-slider-marker-width',
} as const;
