import type { MediaPlaybackRateState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import { isUndefined } from '@videojs/utils/predicate';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { customRateText, playbackRateText } from '../../i18n/text/menu';
import type { RadioOption, RadioOptionsState } from '../types';
import {
  filterPlaybackRates,
  getPlaybackRateRange,
  insertPlaybackRate,
  parsePlaybackRates,
} from '../utils/playback-rates';
import { resolveLabel } from '../utils/resolve-label';

export interface PlaybackRateRadioGroupProps {
  /** Custom label for the options group. */
  label?: Text | string | ((state: PlaybackRateRadioGroupState) => Text | string) | undefined;
  /** Custom formatter for visible playback rate labels. */
  formatRate?: ((rate: number) => string) | undefined;
  /** Whether playback rate selection is disabled. */
  disabled?: boolean | undefined;
  /**
   * Rates to offer, in order, in place of the player's `defaultPlaybackRates`. HTML takes a space-separated list, such
   * as `rates="1 1.5 2"`.
   */
  rates?: readonly number[] | string | undefined;
}

export interface PlaybackRateRadioGroupOption extends RadioOption {
  rate: number;
  /**
   * Whether the option is the current rate rather than one of the offered rates. The group adds it, slotted before the
   * first faster rate, when something other than the group set a rate it does not offer, such as the media API.
   */
  custom: boolean;
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
    rates: [],
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
  #mediaTarget: object | null = null;

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

  /**
   * The rates the group offers: its own `rates`, or the player's when none of them is usable. Rates the media does not
   * accept are left out.
   */
  getRates(media: MediaPlaybackRateState): readonly number[] {
    const own = parsePlaybackRates(this.#props.rates);
    const supported = own && filterPlaybackRates(own, getPlaybackRateRange(this.#mediaTarget));

    return supported?.length ? supported : media.playbackRates;
  }

  setMedia(media: MediaPlaybackRateState): void {
    this.#media = media;
  }

  /** The media element or adapter the player attached, whose rate range limits the control's own `rates`. */
  setMediaTarget(target: object | null | undefined): void {
    this.#mediaTarget = target ?? null;
  }

  getState(): PlaybackRateRadioGroupState {
    const media = this.#media!;
    const rates = this.getRates(media);

    const availability: PlaybackRateRadioGroupState['availability'] =
      media.playbackRateAvailability !== 'available'
        ? media.playbackRateAvailability
        : rates.length > 0
          ? 'available'
          : 'unavailable';

    const options = availability === 'available' ? insertPlaybackRate(rates, media.playbackRate) : rates;

    this.state.patch({
      rate: media.playbackRate,
      value: this.getRateValue(media.playbackRate),
      options: options.map((rate) => {
        const label = this.getRateLabel(rate);
        const custom = !rates.includes(rate);

        // The visible label shows only the rate, so the accessible name says why an unoffered rate is listed.
        return {
          rate,
          value: this.getRateValue(rate),
          label,
          ...(custom && { ariaLabel: customRateText, ariaLabelParams: { rate: label } }),
          disabled: false,
          custom,
        };
      }),
      disabled: this.#props.disabled || availability !== 'available',
      hidden: availability !== 'available',
      availability,
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  select(media: MediaPlaybackRateState, rate: number): void {
    if (this.#props.disabled || media.playbackRateAvailability !== 'available') return;

    if (!this.getRates(media).includes(rate) && rate !== media.playbackRate) return;

    media.setPlaybackRate(rate);
  }

  selectValue(media: MediaPlaybackRateState, value: string): void {
    const rate = insertPlaybackRate(this.getRates(media), media.playbackRate).find(
      (candidate) => this.getRateValue(candidate) === value
    );
    if (isUndefined(rate)) return;

    this.select(media, rate);
  }
}

/** @internal */
export namespace PlaybackRateRadioGroupCore {
  export type Props = PlaybackRateRadioGroupProps;
  export type State = PlaybackRateRadioGroupState;
}
