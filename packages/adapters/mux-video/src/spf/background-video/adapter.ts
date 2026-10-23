import { HlsBackgroundVideoMpegTsAdapter } from '@videojs/spf/adapters/hls-background-video-mpeg-ts';

/**
 * The Mux Media over the SPF background-video engine: `HlsBackgroundVideoMpegTsAdapter`, whose engine
 * (`hls-background-video-mpeg-ts`) composes the MPEG-TS transmux, so a plus- or basic-tier Mux playback ID plays where
 * the HLS-named Media refuses it. No other Mux identity: `src` is still an HLS URL, and capping which rendition is
 * fetched is a param on it (`?max_resolution=720p`), as on the element this replaces.
 *
 * Its own entry (`@videojs/mux-video/spf/background-video`) so that `@videojs/mux-video/spf` never bundles the
 * background engine, nor this the video engine.
 */
export class MuxBackgroundVideoAdapter extends HlsBackgroundVideoMpegTsAdapter {}
