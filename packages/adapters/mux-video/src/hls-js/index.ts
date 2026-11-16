/**
 * The Mux Media over hls.js — the explicit engine choice, for what the default SPF-backed Media at `@videojs/mux-video`
 * does not cover: the `engine` config, `preferPlayback` and native HLS playback, the rendition caps, and general
 * MPEG-TS.
 *
 * Same Mux identity as the default: both entries export a `MuxVideoAdapter`, and the import path picks the engine.
 */
export * from './adapter';
// The Mux identity types the framework façades read off this adapter. `@videojs/mux` is bundled here, so this is
// the public path to them.
export type { MuxContentData, MuxDrmParams, MuxPosterFitMode, MuxSourceBase } from '@videojs/mux';
