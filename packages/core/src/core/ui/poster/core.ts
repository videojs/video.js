import type { MediaMetadataState, MediaPlaybackState } from '@videojs/media';

/**
 * The player state a poster reads.
 *
 * @internal
 */
export type PosterMediaState = Pick<MediaPlaybackState, 'started'> & Pick<MediaMetadataState, 'poster'>;

/**
 * How the poster image is faring, as the binding holding it sees it. `none` means there is no image, or nothing for it
 * to fetch.
 *
 * @internal
 */
export type PosterImageLoadState = 'none' | 'loading' | 'loaded' | 'error';

export interface PosterState {
  /** Whether the poster should be shown, which it is until playback starts. */
  visible: boolean;
  /** Resolved poster URL, empty when nothing supplied one. */
  src: string;
  /** Whether the poster image is fetching. */
  loading: boolean;
  /** Whether the poster image has decoded. */
  loaded: boolean;
  /** Whether the poster image failed. */
  error: boolean;
}

/**
 * Framework-neutral poster image props.
 *
 * @internal
 */
export interface PosterImageProps {
  src?: string | undefined;
}

/**
 * Turns playback and metadata into poster presentation state.
 *
 * Owns no image of its own: a binding finds one, supplies how it is faring through {@link PosterCore.setImageLoadState},
 * and paints the result.
 *
 * @internal
 */
export class PosterCore {
  #media: PosterMediaState | null = null;
  #loadState: PosterImageLoadState = 'none';

  /** Supply the latest player state. Call before reading {@link PosterCore.getState}. */
  setMedia(media: PosterMediaState): void {
    this.#media = media;
  }

  /** Supply how the binding's image is faring. */
  setImageLoadState(loadState: PosterImageLoadState): void {
    this.#loadState = loadState;
  }

  /** Derive the presentation state to paint. */
  getState(): PosterState {
    const media = this.#media!;

    return {
      visible: !media.started,
      src: media.poster,
      loading: this.#loadState === 'loading',
      loaded: this.#loadState === 'loaded',
      error: this.#loadState === 'error',
    };
  }
}

/** @internal */
export namespace PosterCore {
  export type State = PosterState;
  export type MediaState = PosterMediaState;
  export type ImageLoadState = PosterImageLoadState;
}
