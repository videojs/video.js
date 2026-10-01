import type { MediaControlsState, MediaMetadataState } from '@videojs/media';

export interface TitleState {
  /** The resolved content title. Empty when no source supplied one. */
  title: MediaMetadataState['title'];
  /** Whether the component is hidden because no title is available. */
  hidden: boolean;
  /** Whether the player controls are visible. */
  visible: boolean;
}

/** @internal */
export class TitleCore {
  getState(media: MediaMetadataState, controls?: Pick<MediaControlsState, 'controlsVisible'> | null): TitleState {
    const { title } = media;

    return {
      title,
      hidden: title.length === 0,
      visible: controls?.controlsVisible ?? false,
    };
  }
}

/** @internal */
export namespace TitleCore {
  export type State = TitleState;
}
