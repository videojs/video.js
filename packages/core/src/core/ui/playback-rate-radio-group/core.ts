import type { MediaPlaybackRateState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import { isUndefined } from '@videojs/utils/predicate';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { playbackRateText } from '../../i18n/text/menu';
import type { RadioOption, RadioOptionsState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface PlaybackRateRadioGroupProps {
  /** Custom label for the options group. */
  label?: Text | string | ((state: PlaybackRateRadioGroupState) => Text | string) | undefined;
  /** Custom formatter for visible playback rate labels. */
  formatRate?: ((rate: number) => string) | undefined;
  /** Whether playback rate selection is disabled. */
  disabled?: boolean | undefined;
}

export interface PlaybackRateRadioGroupOption extends RadioOption {
  rate: number;
}

export interface PlaybackRateRadioGroupState extends RadioOptionsState<PlaybackRateRadioGroupOption> {
  rate: number;
}

function formatPlaybackRate(rate: number): string {
  return `${rate}×`;
}

/** @internal */
export class PlaybackRateRadioGroupCore {
  static readonly defaultProps: NonNullableObject<PlaybackRateRadioGroupProps> = {
    label: '',
    formatRate: formatPlaybackRate,
    disabled: false,
  };

  readonly state = createState<PlaybackRateRadioGroupState>({
    rate: 1,
    value: '1',
    options: [],
    disabled: true,
    hidden: true,
    availability: 'unavailable',
    label: '',
  });

  #props = { ...PlaybackRateRadioGroupCore.defaultProps };
  #media: MediaPlaybackRateState | null = null;

  constructor(props?: PlaybackRateRadioGroupProps) {
    if (props) this.setProps(props);
  }

  setProps(props: PlaybackRateRadioGroupProps): void {
    this.#props = defaults(props, PlaybackRateRadioGroupCore.defaultProps);
  }

  getLabel(state: PlaybackRateRadioGroupState): Text | string {
    const custom = resolveLabel(this.#props.label, state);
    if (custom !== undefined) return custom;

    return playbackRateText;
  }

  getLabelParams(_state: PlaybackRateRadioGroupState): undefined {
    return undefined;
  }

  getRateLabel(rate: number): string {
    return this.#props.formatRate(rate);
  }

  getRateValue(rate: number): string {
    return String(rate);
  }

  getAttrs(state: PlaybackRateRadioGroupState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    };
  }

  setMedia(media: MediaPlaybackRateState): void {
    this.#media = media;
  }

  getState(): PlaybackRateRadioGroupState {
    const media = this.#media!;

    const availability: PlaybackRateRadioGroupState['availability'] =
      media.playbackRates.length > 0 ? 'available' : 'unavailable';

    this.state.patch({
      rate: media.playbackRate,
      value: this.getRateValue(media.playbackRate),
      options: media.playbackRates.map((rate) => ({
        rate,
        value: this.getRateValue(rate),
        label: this.getRateLabel(rate),
        disabled: false,
      })),
      disabled: this.#props.disabled || media.playbackRates.length === 0,
      hidden: availability === 'unavailable',
      availability,
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  select(media: MediaPlaybackRateState, rate: number): void {
    if (this.#props.disabled) return;

    if (!media.playbackRates.includes(rate)) return;

    media.setPlaybackRate(rate);
  }

  selectValue(media: MediaPlaybackRateState, value: string): void {
    const rate = media.playbackRates.find((candidate) => this.getRateValue(candidate) === value);
    if (isUndefined(rate)) return;

    this.select(media, rate);
  }
}

/** @internal */
export namespace PlaybackRateRadioGroupCore {
  export type Props = PlaybackRateRadioGroupProps;
  export type State = PlaybackRateRadioGroupState;
}
