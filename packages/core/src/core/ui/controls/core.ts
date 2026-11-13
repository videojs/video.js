import type { MediaControlsState, MediaPlaybackState } from '@videojs/media';
import { defaults } from '@videojs/utils/object';
import type { NonNullableObject } from '@videojs/utils/types';

import { hasPlaybackStarted } from '../playback';

export type ControlsVisibility = 'auto' | 'always';

export interface ControlsProps {
  /** Whether controls follow player visibility state or remain visible. */
  visibility?: ControlsVisibility | undefined;
}

/**
 * The playback state the controls read.
 *
 * @internal
 */
export type ControlsPlaybackState = Pick<MediaPlaybackState, 'started' | 'autoplaying'>;

export interface ControlsState {
  /** Whether the controls are visible. */
  visible: boolean;
  /** Whether the user has recently interacted with the player. */
  userActive: boolean;
  /** Whether playback has started or the media is trying to autoplay. */
  started: boolean;
}

/** @internal */
export class ControlsCore {
  static readonly defaultProps: NonNullableObject<ControlsProps> = {
    visibility: 'auto',
  };

  #props = { ...ControlsCore.defaultProps };
  #media: MediaControlsState | null = null;
  #playback: ControlsPlaybackState | null = null;

  constructor(props?: ControlsProps) {
    if (props) this.setProps(props);
  }

  setProps(props: ControlsProps): void {
    this.#props = defaults(props, ControlsCore.defaultProps);
  }

  setMedia(media: MediaControlsState | null): void {
    this.#media = media;
  }

  setPlayback(playback: ControlsPlaybackState | null): void {
    this.#playback = playback;
  }

  getState(): ControlsState | null {
    const media = this.#media;
    const playback = this.#playback;

    const started = !!playback && hasPlaybackStarted(playback);

    if (!media) return this.#props.visibility === 'always' ? { visible: true, userActive: true, started } : null;

    return {
      visible: this.#props.visibility === 'always' || media.controlsVisible,
      userActive: media.userActive,
      started,
    };
  }
}

/** @internal */
export namespace ControlsCore {
  export type Props = ControlsProps;
  export type State = ControlsState;
  export type PlaybackState = ControlsPlaybackState;
}
