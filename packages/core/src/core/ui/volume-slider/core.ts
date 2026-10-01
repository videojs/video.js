import type { MediaFeatureAvailability, MediaVolumeState } from '@videojs/media';
import { defaults } from '@videojs/utils/object';
import { formatPercent } from '@videojs/utils/percent';
import type { NonNullableObject } from '@videojs/utils/types';

import type { Text } from '../../i18n';
import { labelText, mutedValueText } from '../../i18n/text/volume';
import { DEFAULT_VOLUME_STEP } from '../constants';
import { SliderCore, type SliderProps, type SliderState } from '../slider/core';

export interface VolumeSliderProps extends SliderProps {
  /** Step increment for wheel scrolling. */
  wheelStep?: number | undefined;
  /** @internal Derived from `volume` (0–100) — not user-settable. */
  value?: number | undefined;
  /** @internal Always 0 — not user-settable. */
  min?: number | undefined;
  /** @internal Always 100 — not user-settable. */
  max?: number | undefined;
}

export interface VolumeSliderState extends SliderState, Pick<MediaVolumeState, 'volume' | 'muted'> {
  availability: MediaFeatureAvailability;
  hidden: boolean;
}

/** Volume-domain slider: maps media volume/mute state to slider state. */
export class VolumeSliderCore extends SliderCore {
  static override readonly defaultProps: NonNullableObject<VolumeSliderProps> = {
    ...SliderCore.defaultProps,
    label: '',
    step: DEFAULT_VOLUME_STEP,
    wheelStep: DEFAULT_VOLUME_STEP,
  };

  #wheelStep = VolumeSliderCore.defaultProps.wheelStep;
  #media: MediaVolumeState | null = null;
  #formatLocale: string | string[] | undefined;

  constructor(props?: VolumeSliderProps) {
    super();

    if (props) this.setProps(props);
  }

  override setProps(props: VolumeSliderProps): void {
    const resolvedProps = defaults(props, VolumeSliderCore.defaultProps);

    this.#wheelStep = resolvedProps.wheelStep;
    super.setProps(resolvedProps);
  }

  setMedia(media: MediaVolumeState): void {
    this.#media = media;
  }

  /** @internal Platform adapters set the active i18n locale for `aria-valuetext` percent formatting. */
  setFormatLocale(locale: string | string[] | undefined): void {
    this.#formatLocale = locale;
  }

  getState(): VolumeSliderState {
    const media = this.#media!;
    const { volume, muted } = media;
    const effectivelyMuted = muted || volume === 0;

    const { dragging, dragPercent } = this.input;
    const volumePercent = volume * 100;
    const value = dragging ? this.valueFromPercent(dragPercent) : volumePercent;
    const base = super.getSliderState(value);
    const availability = media.volumeAvailability;

    return {
      ...base,
      disabled: base.disabled || availability !== 'available',
      fillPercent: effectivelyMuted ? 0 : base.fillPercent,
      volume,
      muted: effectivelyMuted,
      availability,
      hidden: availability !== 'available',
    };
  }

  /** Wheel step as a percentage of the slider range. */
  getWheelStepPercent(): number {
    const { min, max } = this.props;
    const range = max - min;

    return range > 0 ? (this.#wheelStep / range) * 100 : 0;
  }

  override getLabel(state: SliderState): Text | string {
    return super.getLabel(state) || labelText;
  }

  getValueText(state: VolumeSliderState): Text | string {
    return state.muted ? mutedValueText : this.getValueTextParams(state).percent;
  }

  getValueTextParams(state: VolumeSliderState): { percent: string } {
    return { percent: formatPercent(state.value / 100, this.#formatLocale) };
  }

  override getAttrs(state: VolumeSliderState) {
    const base = super.getAttrs(state);

    return {
      ...base,
      'aria-valuetext': this.getValueText(state),
    };
  }
}

export namespace VolumeSliderCore {
  export type Props = VolumeSliderProps;
  export type State = VolumeSliderState;
}
