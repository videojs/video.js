import type { MediaPictureInPictureState } from '@videojs/media';
import { createState } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { resolveText, type Text } from '../../i18n';
import { enterText, exitText } from '../../i18n/text/pip';
import type { ButtonState } from '../types';
import { resolveLabel } from '../utils/resolve-label';

export interface PiPButtonProps {
  /** Custom label for the button. */
  label?: Text | string | ((state: PiPButtonState) => Text | string) | undefined;
  /** Whether the button is disabled. */
  disabled?: boolean | undefined;
}

export interface PiPButtonState extends ButtonState {
  /** Whether picture-in-picture mode is currently active. */
  pip: boolean;
  /** Whether picture-in-picture can be requested on this platform. */
  availability: MediaPictureInPictureState['pictureInPictureAvailability'];
  /** Non-interactive but still focusable (mirrors `aria-disabled`). */
  disabled: boolean;
  /** Whether the button is hidden until picture-in-picture is available. */
  hidden: boolean;
}

/** @internal */
export class PiPButtonCore {
  static readonly defaultProps: NonNullableObject<PiPButtonProps> = {
    label: '',
    disabled: false,
  };

  readonly state = createState<PiPButtonState>({
    pip: false,
    availability: 'unavailable',
    disabled: true,
    hidden: true,
    label: '',
  });

  #props = { ...PiPButtonCore.defaultProps };
  #media: MediaPictureInPictureState | null = null;

  constructor(props?: PiPButtonProps) {
    if (props) this.setProps(props);
  }

  setProps(props: PiPButtonProps): void {
    this.#props = defaults(props, PiPButtonCore.defaultProps);
  }

  getLabel(state: PiPButtonState): Text | string {
    const label = resolveLabel(this.#props.label, state);
    if (label) return label;

    return state.pip ? exitText : enterText;
  }

  getAttrs(state: PiPButtonState) {
    return {
      'aria-label': this.getLabel(state),
      'aria-disabled': state.disabled ? 'true' : undefined,
      hidden: state.hidden ? '' : undefined,
    };
  }

  setMedia(media: MediaPictureInPictureState): void {
    this.#media = media;
  }

  getState(): PiPButtonState {
    const media = this.#media!;
    const availability = media.pictureInPictureAvailability;
    const actionable = media.isPictureInPicture || availability === 'available';

    this.state.patch({
      pip: media.isPictureInPicture,
      availability,
      disabled: this.#props.disabled || !actionable,
      hidden: !actionable,
    });
    this.state.patch({ label: resolveText(this.getLabel(this.state.current)) });

    return this.state.current;
  }

  async toggle(media: MediaPictureInPictureState): Promise<void> {
    this.setMedia(media);

    if (this.getState().disabled) return;

    return media.isPictureInPicture ? media.exitPictureInPicture() : media.requestPictureInPicture();
  }
}

/** @internal */
export namespace PiPButtonCore {
  export type Props = PiPButtonProps;
  export type State = PiPButtonState;
}
