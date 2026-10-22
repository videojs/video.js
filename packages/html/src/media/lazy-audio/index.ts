import { LazyMediaElement } from '../lazy-media';
import { audio } from './audio';
import { hlsAudio } from './hls-audio';
import { muxAudio } from './mux-audio';
import { spotifyAudio } from './spotify-audio';

/**
 * Plays audio from any supported source by rendering the media element for it, and loads only that element's code once
 * the source is known.
 *
 * Resolves files to a native `<audio>`, HLS to a native `<audio>` on Safari and `<hls-audio>` elsewhere, Mux sources to
 * `<mux-audio>`, and Spotify sources to `<spotify-audio>`. Other attributes are passed to the resolved element, so
 * switching to it directly only changes the tag name. Use `createLazyAudioElement` to add your own media or leave some
 * out.
 *
 * @experimental
 */
export class LazyAudio extends LazyMediaElement {
  /** @internal */
  protected override readonly medias = [audio, hlsAudio, muxAudio, spotifyAudio];
}
