/**
 * The Mux Media over the SPF HLS engine — Mux identity in, playback out.
 *
 * The hls.js-backed counterpart lives at `@videojs/mux-video`. That is the PRD's three-import-paths design: the import
 * path picks the engine, and nothing else about the surface changes, so both flavors export a `MuxVideoAdapter`.
 *
 * `MuxMixin` and `MuxAdapterProps` are the Mux identity `@videojs/mux-audio/spf` shares with this entry, so they keep
 * the unqualified name.
 */
export type { MuxContentData, MuxSourceBase } from '@videojs/mux';
export type { MuxAdapterAPI, MuxAdapterProps } from './mixin';
export { MuxMixin } from './mixin';
export { MuxVideoAdapter, withMpegTsTransmux } from './adapter';
