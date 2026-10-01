import type { MediaPlaybackState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { pauseText, playText, replayText } from '../../i18n/text/buttons';
import type { ButtonState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface PlayButtonProps {
  /** Custom label for the button. */
  label?: Text | string | ((state: PlayButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
}

export interface PlayButtonState extends Pick<MediaPlaybackState, 'paused' | 'ended' | 'started'>, ButtonState {}

/** @internal */
export class PlayButtonCore {
  static readonly defaultProps: NonNullableObject<PlayButtonProps> = {
    label: '',
    disabled: false,
  };

  readonly state = createState<PlayButtonState>({
    paused: true,
    ended: false,
    started: false,
    label: '',
  });

  #props = { ...PlayButtonCore.defaultProps };
  #media: MediaPlaybackState | null = null;

  constructor(props?: PlayButtonProps) {
    if (props) this.setProps(props);
  }

  setProps(props: PlayButtonProps): void {
    this.#props = defaults(props, PlayButtonCore.defaultProps);
  }

  getLabel(state: PlayButtonState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    if (state.ended) return replayText;

    return state.paused ? playText : pauseText;
  }

  getAttrs(state: PlayButtonState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': this.#props.disabled ? 'true' : undefined,
    };
  }

  setMedia(media: MediaPlaybackState): void {
    this.#media = media;
  }

  getState(): PlayButtonState {
    const media = this.#media!;

    this.state.patch({ paused: media.paused, ended: media.ended, started: media.started });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  async toggle(media: MediaPlaybackState): Promise<void> {
    if (this.#props.disabled) return;

    if (media.paused || media.ended) {
      return media.play();
    }

    media.pause();
  }
}

/** @internal */
export namespace PlayButtonCore {
  export type Props = PlayButtonProps;
  export type State = PlayButtonState;
}
