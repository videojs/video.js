import type { MediaFullscreenState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { enterText, exitText } from '../../i18n/text/fullscreen';
import type { ButtonState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface FullscreenButtonProps {
  /** Custom label for the button. */
  label?: Text | string | ((state: FullscreenButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
}

export interface FullscreenButtonState extends ButtonState {
  /** Whether fullscreen mode is currently active. */
  fullscreen: boolean;
  /** Whether fullscreen can be requested on this platform. */
  availability: MediaFullscreenState['fullscreenAvailability'];
  /** Non-interactive but still focusable (mirrors `aria-disabled`). */
  disabled: boolean;
  /** Whether the button is hidden until fullscreen is available. */
  hidden: boolean;
}

export class FullscreenButtonCore {
  static readonly defaultProps: NonNullableObject<FullscreenButtonProps> = {
    label: '',
    disabled: false,
  };

  readonly state = createState<FullscreenButtonState>({
    fullscreen: false,
    availability: 'unavailable',
    disabled: true,
    hidden: true,
    label: '',
  });

  #props = { ...FullscreenButtonCore.defaultProps };
  #media: MediaFullscreenState | null = null;

  constructor(props?: FullscreenButtonProps) {
    if (props) this.setProps(props);
  }

  setProps(props: FullscreenButtonProps): void {
    this.#props = defaults(props, FullscreenButtonCore.defaultProps);
  }

  getLabel(state: FullscreenButtonState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    return state.fullscreen ? exitText : enterText;
  }

  getAttrs(state: FullscreenButtonState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    };
  }

  setMedia(media: MediaFullscreenState): void {
    this.#media = media;
  }

  getState(): FullscreenButtonState {
    const media = this.#media!;
    const availability = media.fullscreenAvailability;

    this.state.patch({
      fullscreen: media.isFullscreen,
      availability,
      disabled: this.#props.disabled || availability !== 'available',
      hidden: availability !== 'available',
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  async toggle(media: MediaFullscreenState): Promise<void> {
    this.setMedia(media);

    if (this.getState().disabled) return;

    return media.isFullscreen ? media.exitFullscreen() : media.requestFullscreen();
  }
}

export namespace FullscreenButtonCore {
  export type Props = FullscreenButtonProps;
  export type State = FullscreenButtonState;
}
