'use client';

import { audio } from '../lazy/audio';
import { createLazyAudio, type LazyAudioProps } from '../lazy/create';
import { hlsAudio } from '../lazy/hls-audio';
import { muxAudio } from '../lazy/mux-audio';
import { soundcloudAudio } from '../lazy/soundcloud-audio';
import { spotifyAudio } from '../lazy/spotify-audio';

export type { LazyAudioProps, LazyMediaProps } from '../lazy/create';

/**
 * Plays audio from any supported source by rendering the media component for it, and loads only that component's code
 * once the source is known.
 *
 * Resolves files to a native `<audio>`, HLS to a native `<audio>` on Safari and `HlsAudio` elsewhere, Mux sources to
 * `MuxAudio`, Spotify sources to `SpotifyAudio`, and SoundCloud sources to `SoundCloudAudio`. Renders nothing for a
 * source it can't resolve. Props are passed to the resolved media, so switching to that component directly only changes
 * the import. Use `createLazyAudio` to add your own media or leave some out.
 *
 * @experimental
 */
export const LazyAudio = createLazyAudio([audio, hlsAudio, muxAudio, spotifyAudio, soundcloudAudio]);

/** @experimental */
export namespace LazyAudio {
  export type Props = LazyAudioProps;
}
