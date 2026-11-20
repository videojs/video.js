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
export { MUX_ALTERNATIVE_MEDIA_SUGGESTION, MuxMixin } from './mixin';
export type { MuxSource, MuxVideoAdapterProps } from './adapter';
export { MuxVideoAdapter, SpfVideoAdapter } from './adapter';
export type { SpfAdapterLike, SpfPlaybackAPI, SpfPlaybackProps, SpfPlaybackSource, SpfPlaybackType } from './playback';
export { SpfPlaybackMixin } from './playback';
