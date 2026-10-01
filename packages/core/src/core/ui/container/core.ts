import type { MediaControlsState } from '@videojs/media';

/** @internal */
export interface ContainerState {
  controlsVisible: boolean;
}

/** @internal */
export class ContainerCore {
  #media: MediaControlsState | null = null;

  setMedia(media: MediaControlsState): void {
    this.#media = media;
  }

  getState(): ContainerState {
    return {
      controlsVisible: this.#media!.controlsVisible,
    };
  }
}

/** @internal */
export namespace ContainerCore {
  export type State = ContainerState;
}
