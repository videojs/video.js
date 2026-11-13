/**
 * The Mux Media over the SPF HLS engine — Mux identity in, playback out. This is the flavor `@videojs/mux-video` itself
 * exports, so the two paths are one module.
 *
 * The hls.js-backed counterpart lives at `@videojs/mux-video/hls-js`. That is the PRD's three-import-paths design: the
 * import path picks the engine, and nothing else about the surface changes, so both flavors export a
 * `MuxVideoAdapter`.
 *
 * `MuxMixin` and `MuxAdapterProps` are the Mux identity `@videojs/mux-audio/spf` shares with this entry, so they keep
 * the unqualified name. The engine ships here too, shaped like `@videojs/spf/engines/hls-video`'s: the HLS video
 * engine's features plus the MPEG-TS transmux, for a consumer composing further or driving it directly.
 */
export type { MuxContentData, MuxDrmParams, MuxPosterFitMode, MuxSourceBase } from '@videojs/mux';
export type { MuxAdapterAPI, MuxAdapterProps } from './mixin';
export { MuxMixin } from './mixin';
export { MuxVideoAdapter } from './adapter';
