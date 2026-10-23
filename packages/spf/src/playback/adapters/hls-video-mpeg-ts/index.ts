/**
 * The Media over the MPEG-TS HLS engine (`@videojs/spf/engines/hls-video-mpeg-ts`). Sibling of
 * `@videojs/spf/adapters/hls-video`, whose types it shares: HLS content packaged as MPEG-TS plays here where that Media
 * refuses it.
 *
 * MPEG-TS support is a deliberately narrow subset: what Mux Video packages for on-demand playback. Other MPEG-TS may be
 * refused or may mis-play; `mpegTsTransmuxFeature` lists what is covered. For general MPEG-TS, use
 * `@videojs/hlsjs-video`.
 */
export { HlsVideoMpegTsAdapter } from './adapter';
