/**
 * Domain variant component (core).
 *
 * Exercises: domain variant components that share base logic (slider/)
 * but have their own directory under core/ui/. The builder discovers
 * components by directory — this file must exist for volume-slider to be found.
 * Also exercises defaultProps that spread the base core's defaultProps,
 * defaults that reference an imported constant, and an @internal override
 * whose inherited default does not apply.
 */

import { DEFAULT_VOLUME_STEP } from '../constants';
import { SliderCore, type SliderProps } from '../slider/core';

export interface VolumeSliderProps extends SliderProps {
  /** The orientation of the slider. */
  orientation: 'horizontal' | 'vertical';
  /** Step increment for keyboard changes. */
  step: number;
  /** @internal Always 0, not user-settable. */
  min: number;
}

export interface VolumeSliderState {
  /** Current volume (0–1). */
  volume: number;
}

export class VolumeSliderCore {
  static readonly defaultProps = {
    ...SliderCore.defaultProps,
    orientation: 'horizontal',
    step: DEFAULT_VOLUME_STEP,
  };
}
