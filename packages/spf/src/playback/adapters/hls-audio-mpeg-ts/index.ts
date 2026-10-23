/**
 * The Media over the MPEG-TS audio-only HLS engine (`@videojs/spf/engines/hls-audio-mpeg-ts`). Sibling of
 * `@videojs/spf/adapters/hls-audio`, whose types it shares: audio renditions packaged as MPEG-TS play here where that
 * Media refuses them.
 *
 * MPEG-TS support is a deliberately narrow subset: what Mux Video packages for on-demand playback. Other MPEG-TS may be
 * refused or may mis-play; `mpegTsTransmuxFeature` lists what is covered. For general MPEG-TS, use
 * `@videojs/hlsjs-video`.
 */
export { HlsAudioMpegTsAdapter } from './adapter';
