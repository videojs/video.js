import { LazyMediaElement } from '../lazy-media';
import { audio } from '../lazy/audio';
import { hlsAudio } from '../lazy/hls-audio';
import { muxAudio } from '../lazy/mux-audio';
import { soundcloudAudio } from '../lazy/soundcloud-audio';
import { spotifyAudio } from '../lazy/spotify-audio';

/**
 * Plays audio from any supported source by rendering the media element for it, and loads only that element's code once
 * the source is known.
 *
 * Resolves files to a native `<audio>`, HLS to a native `<audio>` on Safari and `<hls-audio>` elsewhere, Mux sources to
 * `<mux-audio>`, Spotify sources to `<spotify-audio>`, and SoundCloud sources to `<soundcloud-audio>`. Other attributes
 * are passed to the resolved element, so switching to it directly only changes the tag name. Use
 * `createLazyAudioElement` to add your own media or leave some out.
 *
 * @experimental
 */
export class LazyAudio extends LazyMediaElement {
  /** @internal */
  protected override readonly medias = [audio, hlsAudio, muxAudio, spotifyAudio, soundcloudAudio];
}
