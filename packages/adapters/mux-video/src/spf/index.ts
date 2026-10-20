/**
 * The Mux Media over the SPF HLS engine — Mux identity in, playback out.
 *
 * The hls.js-backed counterpart lives at `@videojs/mux-video`. That is the PRD's three-import-paths design: the import
 * path picks the engine, and nothing else about the surface changes, so both flavors export a `MuxVideoAdapter`.
 *
 * `MuxMixin` and `MuxAdapterProps` are the Mux identity `@videojs/mux-audio/spf` shares with this entry, so they keep
 * the unqualified name. The engine ships here too, shaped like `@videojs/spf/engines/hls-video`'s: the HLS video
 * engine's features plus the MPEG-TS transmux, for a consumer composing further or driving it directly.
 */
export type { MuxContentData, MuxSourceBase } from '@videojs/mux';
export type { MuxAdapterAPI, MuxAdapterProps } from './mixin';
export { MuxMixin } from './mixin';
export { MuxVideoAdapter } from './adapter';
export type { Behaviors, Config, EngineConfig, EngineContext, EngineState } from './engine';
export { behaviors, createEngine, defaultConfig, features, initialState } from './engine';
