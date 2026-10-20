import {
  HlsBackgroundVideoAdapter,
  type HlsBackgroundVideoAdapterOptions,
} from '@videojs/spf/adapters/hls-background-video';
import { defaultConfig as mpegTsTransmux } from '@videojs/spf/features/mpeg-ts-transmux';

import { withMpegTsTransmux } from './transmux';

/**
 * The Mux Media over the SPF background-video engine: `HlsBackgroundVideoAdapter` with the MPEG-TS transmux laid under
 * the consumer's config (see {@link withMpegTsTransmux}), so a plus- or basic-tier Mux playback ID plays where the
 * HLS-named Media refuses it. No other Mux identity: `src` is still an HLS URL, and capping which rendition is fetched
 * is a param on it (`?max_resolution=720p`), as on the element this replaces.
 *
 * The background engine relocates nothing, so transmuxed segments keep their native timestamps — the same treatment
 * Mux's CMAF gets there, which Chromium starts at the first buffered time.
 *
 * Its own entry (`@videojs/mux-video/spf/background-video`) so that `@videojs/mux-video/spf` never bundles the
 * background engine, nor this the video engine.
 */
export class MuxBackgroundVideoAdapter extends HlsBackgroundVideoAdapter {
  constructor(options?: HlsBackgroundVideoAdapterOptions) {
    super(withMpegTsTransmux(options, mpegTsTransmux));
  }
}
