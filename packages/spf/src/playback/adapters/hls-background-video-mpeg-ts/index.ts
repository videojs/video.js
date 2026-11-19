/**
 * The Media over the MPEG-TS background-video engine (`@videojs/spf/engines/hls-background-video-mpeg-ts`). Sibling of
 * `@videojs/spf/adapters/hls-background-video`, whose types it shares: HLS content packaged as MPEG-TS plays here where
 * that Media refuses it.
 *
 * MPEG-TS support is a deliberately narrow subset: what Mux Video packages for on-demand playback. Other MPEG-TS may be
 * refused or may mis-play; `mpegTsTransmuxFeature` lists what is covered.
 */
export { HlsBackgroundVideoMpegTsAdapter } from './adapter';
