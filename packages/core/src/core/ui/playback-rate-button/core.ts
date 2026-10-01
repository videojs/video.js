import type { MediaPlaybackRateState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { rateText } from '../../i18n/text/playback';
import type { ButtonState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface PlaybackRateButtonProps {
  /** Custom label for the button. */
  label?: Text | string | ((state: PlaybackRateButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
  /** When true, pointer activation opens a menu instead of cycling. React sets this automatically inside `Menu.Trigger`. */
  menuTrigger?: boolean | undefined;
}

export interface PlaybackRateButtonState extends ButtonState {
  rate: number;
}

/** @internal */
export class PlaybackRateButtonCore {
  static readonly defaultProps: NonNullableObject<PlaybackRateButtonProps> = {
    label: '',
    disabled: false,
    menuTrigger: false,
  };

  readonly state = createState<PlaybackRateButtonState>({
    rate: 1,
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

  getLabelParams(state: PlaybackRateButtonState): { rate: number } | undefined {
    if (resolveLabel(this.#props.label, state) !== undefined) return undefined;

    return { rate: state.rate };
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

    this.state.patch({ rate: media.playbackRate });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  cycle(media: MediaPlaybackRateState): void {
    if (this.#props.disabled) return;

    if (this.#props.menuTrigger) return;

    const { playbackRates, playbackRate } = media;
    if (playbackRates.length === 0) return;

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
