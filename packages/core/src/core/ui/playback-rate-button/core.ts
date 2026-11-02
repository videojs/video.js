import type { MediaFeatureAvailability, MediaPlaybackRateState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { playbackRateText } from '../../i18n/text/menu';
import { rateText } from '../../i18n/text/playback';
import type { ButtonState } from '../types';
import { parsePlaybackRates } from '../utils/playback-rates';
import { resolveLabel } from '../utils/resolve-label';
import { PlaybackRateButtonCSSVars } from './vars';

export interface PlaybackRateButtonProps {
  /** Custom label for the button. */
  label?: Text | string | ((state: PlaybackRateButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
  /** When true, pointer activation opens a menu instead of cycling. React sets this automatically inside `Menu.Trigger`. */
  menuTrigger?: boolean | undefined;
  /**
   * Rates to cycle through, in order, in place of the player's `defaultPlaybackRates`. HTML takes a space-separated
   * list, such as `rates="1 1.5 2"`.
   */
  rates?: readonly number[] | string | undefined;
}

export interface PlaybackRateButtonState extends ButtonState {
  rate: number;
  /** Whether the media can change its playback rate. */
  availability: MediaFeatureAvailability;
  /** Whether the button is hidden because the media has no playback rate to change. */
  hidden: boolean;
}

/** @internal */
export class PlaybackRateButtonCore {
  static readonly defaultProps: NonNullableObject<PlaybackRateButtonProps> = {
    label: '',
    disabled: false,
    menuTrigger: false,
    rates: [],
  };

  readonly state = createState<PlaybackRateButtonState>({
    rate: 1,
    availability: 'unavailable',
    hidden: true,
    label: '',
  });

  #props = { ...PlaybackRateButtonCore.defaultProps };
  #media: MediaPlaybackRateState | null = null;

  constructor(props?: PlaybackRateButtonProps) {
    if (props) this.setProps(props);
  }

  setProps(props: PlaybackRateButtonProps): void {
    this.#props = defaults(props, PlaybackRateButtonCore.defaultProps);
  }

  getLabel(state: PlaybackRateButtonState): Text | string {
    const custom = resolveLabel(this.#props.label, state);
    if (custom !== undefined) return custom;

    return rateText;
  }

  /** Tooltip text: the control's name without the current rate, which the button already shows. */
  getTooltipLabel(state: PlaybackRateButtonState): Text | string {
    const custom = resolveLabel(this.#props.label, state);
    if (custom !== undefined) return custom;

    return playbackRateText;
  }

  getLabelParams(state: PlaybackRateButtonState): { rate: number } | undefined {
    if (resolveLabel(this.#props.label, state) !== undefined) return undefined;

    return { rate: state.rate };
  }

  /** CSS custom properties for the button, so a skin can fit the rate label without measuring it. */
  getCSSVars(state: PlaybackRateButtonState): Record<string, string> {
    return { [PlaybackRateButtonCSSVars.length]: String(String(state.rate).length) };
  }

  getAttrs(state: PlaybackRateButtonState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': this.#props.disabled ? 'true' : undefined,
    };
  }

  setMedia(media: MediaPlaybackRateState): void {
    this.#media = media;
  }

  getState(): PlaybackRateButtonState {
    const media = this.#media!;
    const availability = media.playbackRateAvailability;

    this.state.patch({
      rate: media.playbackRate,
      availability,
      hidden: availability !== 'available',
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  /**
   * The rates the button cycles through: its own `rates`, or the player's when none of them is usable. Its own rates
   * are taken as given; `setPlaybackRate` clamps one the media does not accept.
   */
  getRates(media: MediaPlaybackRateState): readonly number[] {
    return parsePlaybackRates(this.#props.rates) ?? media.playbackRates;
  }

  cycle(media: MediaPlaybackRateState): void {
    if (this.#props.disabled || media.playbackRateAvailability !== 'available') return;

    if (this.#props.menuTrigger) return;

    const playbackRates = this.getRates(media);
    if (playbackRates.length === 0) return;

    const { playbackRate } = media;

    const idx = playbackRates.indexOf(playbackRate);
    const next =
      idx === -1
        ? (playbackRates.find((r) => r > playbackRate) ?? playbackRates[0]!)
        : playbackRates[(idx + 1) % playbackRates.length]!;

    media.setPlaybackRate(next);
  }
}

/** @internal */
export namespace PlaybackRateButtonCore {
  export type Props = PlaybackRateButtonProps;
  export type State = PlaybackRateButtonState;
}
