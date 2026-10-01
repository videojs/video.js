// Values from SliderCSSVars — duplicated because the api-docs-builder extracts
// JSDoc from the object literal, so we need component-specific descriptions here.
/**
 * CSS custom property names for time slider visual state.
 *
 * @internal
 */
export const TimeSliderCSSVars = {
  /** Fill level percentage (0–100), representing current playback position. */
  fill: '--media-slider-fill',
  /** Pointer position percentage (0–100), tracking the cursor along the slider. */
  pointer: '--media-slider-pointer',
  /** Buffer level percentage (0–100), indicating how much media has been buffered. */
  buffer: '--media-slider-buffer',
} as const;
