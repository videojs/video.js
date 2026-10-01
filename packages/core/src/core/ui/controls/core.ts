import type { MediaControlsState } from '@videojs/media';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

export type ControlsVisibility = 'auto' | 'always';

export interface ControlsProps {
  /** Whether controls follow player visibility state or remain visible. */
  visibility?: ControlsVisibility | undefined;
}

export interface ControlsState {
  /** Whether the controls are visible. */
  visible: boolean;
  /** Whether the user has recently interacted with the player. */
  userActive: boolean;
}

/** @internal */
export class ControlsCore {
  static readonly defaultProps: NonNullableObject<ControlsProps> = {
    visibility: 'auto',
  };

  #props = { ...ControlsCore.defaultProps };
  #media: MediaControlsState | null = null;

  constructor(props?: ControlsProps) {
    if (props) this.setProps(props);
  }

  setProps(props: ControlsProps): void {
    this.#props = defaults(props, ControlsCore.defaultProps);
  }

  setMedia(media: MediaControlsState | null): void {
    this.#media = media;
  }

  getState(): ControlsState | null {
    const media = this.#media;
    if (!media) return this.#props.visibility === 'always' ? { visible: true, userActive: true } : null;

    return {
      visible: this.#props.visibility === 'always' || media.controlsVisible,
      userActive: media.userActive,
    };
  }
}

/** @internal */
export namespace ControlsCore {
  export type Props = ControlsProps;
  export type State = ControlsState;
}
