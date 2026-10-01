// Values from SliderCSSVars — duplicated because the api-docs-builder extracts
// JSDoc from the object literal, so we need component-specific descriptions here.
/**
 * CSS custom property names for volume slider visual state.
 *
 * @internal
 */
export const VolumeSliderCSSVars = {
  /** Fill level percentage (0–100), representing the current volume level. */
  fill: '--media-slider-fill',
  /** Pointer position percentage (0–100), tracking the cursor along the slider. */
  pointer: '--media-slider-pointer',
} as const;
