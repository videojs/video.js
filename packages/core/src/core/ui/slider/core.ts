import { clamp, roundToStep, toPercent } from '@videojs/utils/number';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import type { Text } from '../../i18n';
import { resolveLabel } from '../utils/resolve-label';

/** Configuration shared by all slider variants. */
export interface SliderProps {
  /** Custom label for the slider. */
  label?: Text | string | ((state: SliderState) => Text | string) | undefined;
  /** Step increment for value changes (arrow keys). */
  step?: number | undefined;
  /** Large step increment (Page Up/Down keys). */
  largeStep?: number | undefined;
  /** Axis of slider movement. */
  orientation?: 'horizontal' | 'vertical' | undefined;
  /** Whether the slider is non-interactive. */
  disabled?: boolean | undefined;
  /** How the thumb aligns at the track edges. `edge` constrains the thumb within track bounds. */
  thumbAlignment?: 'center' | 'edge' | undefined;
  /** Current slider value. */
  value?: number | undefined;
  /** Minimum value of the slider range. */
  min?: number | undefined;
  /** Maximum value of the slider range. */
  max?: number | undefined;
}

export type SliderPreviewOverflow = 'clamp' | 'visible';

export interface SliderPreviewProps {
  /** How the preview handles slider boundaries. `clamp` keeps it within bounds; `visible` lets it extend past them. */
  overflow?: SliderPreviewOverflow | undefined;
}

/** Current pointer/drag input state, typically provided by a DOM controller. */
export interface SliderInput {
  /** Pointer position as a percentage of the track (0–100). */
  pointerPercent: number;
  /** Drag position as a percentage of the track (0–100). */
  dragPercent: number;
  /** Whether the user is actively dragging. */
  dragging: boolean;
  /** Whether the pointer is over the slider. */
  pointing: boolean;
  /** Whether the slider has keyboard focus. */
  focused: boolean;
}

export interface SliderState {
  /** Current slider value in the min–max range. */
  value: number;
  /** Fill level as a percentage (0–100), derived from value. */
  fillPercent: number;
  /** Pointer position as a percentage of the track (0–100). */
  pointerPercent: number;
  /** Whether the user is actively dragging. */
  dragging: boolean;
  /** Whether the pointer is over the slider. */
  pointing: boolean;
  /** Whether dragging, pointing, or focus is active. */
  interactive: boolean;
  /** Axis of slider movement. */
  orientation: 'horizontal' | 'vertical';
  /** Whether the slider is non-interactive. */
  disabled: boolean;
  /** How the thumb aligns at the track edges. */
  thumbAlignment: 'center' | 'edge';
}

/**
 * Base slider logic: value mapping, ARIA attrs, and step calculations.
 *
 * @internal
 */
export class SliderCore {
  static readonly defaultProps: NonNullableObject<SliderProps> = {
    label: '',
    step: 1,
    largeStep: 10,
    orientation: 'horizontal',
    disabled: false,
    thumbAlignment: 'center',
    value: 0,
    min: 0,
    max: 100,
  };

  static readonly defaultInput: SliderInput = {
    pointerPercent: 0,
    dragPercent: 0,
    dragging: false,
    pointing: false,
    focused: false,
  };

  #props = { ...SliderCore.defaultProps };
  #input: SliderInput = { ...SliderCore.defaultInput };

  get props(): Readonly<NonNullableObject<SliderProps>> {
    return this.#props;
  }

  get input(): Readonly<SliderInput> {
    return this.#input;
  }

  constructor(props?: SliderProps) {
    if (props) this.setProps(props);
  }

  setProps(props: SliderProps): void {
    this.#props = defaults(props, SliderCore.defaultProps);
  }

  setInput(input: SliderInput): void {
    this.#input = input;
  }

  getSliderState(value: number): SliderState {
    const { orientation, disabled, thumbAlignment } = this.#props;
    const { pointerPercent, dragging, pointing, focused } = this.#input;

    return {
      value,
      fillPercent: this.percentFromValue(value),
      pointerPercent,
      dragging,
      pointing,
      interactive: dragging || pointing || focused,
      orientation,
      disabled,
      thumbAlignment,
    };
  }

  getLabel(state: SliderState): Text | string {
    return resolveLabel(this.#props.label, state) || '';
  }

  getAttrs(state: SliderState) {
    return {
      role: 'slider',
      tabIndex: state.disabled ? -1 : 0,
      autoComplete: 'off',
      'aria-label': this.getLabel(state),
      'aria-valuemin': this.#props.min,
      'aria-valuemax': this.#props.max,
      'aria-valuenow': state.value,
      'aria-orientation': state.orientation,
      'aria-disabled': state.disabled ? 'true' : undefined,
    };
  }

  valueFromPercent(percent: number): number {
    const { min, max, step } = this.#props;
    const raw = min + (percent / 100) * (max - min);

    return roundToStep(clamp(raw, min, max), step, min);
  }

  /** Convert percent to a clamped value without applying step rounding. */
  rawValueFromPercent(percent: number): number {
    const { min, max } = this.#props;

    return clamp(min + (percent / 100) * (max - min), min, max);
  }

  percentFromValue(value: number): number {
    const { min, max } = this.#props;

    return toPercent(value, min, max);
  }

  /** Step as a percentage of the slider range. */
  getStepPercent(): number {
    const { step, min, max } = this.#props;
    const range = max - min;

    return range > 0 ? (step / range) * 100 : 0;
  }

  /** Large step as a percentage of the slider range. */
  getLargeStepPercent(): number {
    const { largeStep, min, max } = this.#props;
    const range = max - min;

    return range > 0 ? (largeStep / range) * 100 : 0;
  }

  adjustPercentForAlignment(rawPercent: number, thumbSize: number, trackSize: number): number {
    if (this.#props.thumbAlignment === 'center' || trackSize === 0) {
      return rawPercent;
    }

    const thumbHalf = ((thumbSize / trackSize) * 100) / 2;
    const minPercent = thumbHalf;
    const maxPercent = 100 - thumbHalf;

    return minPercent + (rawPercent / 100) * (maxPercent - minPercent);
  }
}

/** @internal */
export namespace SliderCore {
  export type Props = SliderProps;
  export type State = SliderState;
  export type Input = SliderInput;
}
