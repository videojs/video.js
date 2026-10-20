import { MuxBackgroundVideoAdapter } from '@videojs/mux-video/spf/background-video';

import { HlsBackgroundVideo } from '../hls-background-video';

/**
 * `<hls-background-video>` over the Mux Media, under the name the standalone `mux-background-video` package used.
 *
 * The surface is the base's: `src` is an HLS URL, and capping which rendition is fetched is a param on it rather than
 * an attribute. What the Mux Media adds is the MPEG-TS transmux, so a plus- or basic-tier Mux playback ID plays here
 * where the HLS-named element refuses it. `../hls-background-video` carries the whole surface.
 */
export class MuxBackgroundVideo extends HlsBackgroundVideo {
  static override readonly Adapter = MuxBackgroundVideoAdapter;
}
