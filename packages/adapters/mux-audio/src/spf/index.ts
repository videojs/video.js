/**
 * The Mux Media over the SPF audio-only HLS engine. Sibling of `@videojs/mux-video/spf`; see that entry point for the
 * three-import-paths design the two share, and `@videojs/spf/adapters/hls-video` for why the Medias ship separately
 * from `@videojs/spf/hls`.
 *
 * Named for the flavor, not the composition underneath: the engine is the audio-only variant, but `mux-audio` is what
 * this plays and what the element and component are called.
 *
 * `MuxAdapterProps` is the same Mux identity both flavors take, re-exported here so consuming this Media costs no
 * second import. The engine ships here too, shaped like `@videojs/spf/engines/hls-audio`'s: the HLS audio engine's
 * features plus the audio-only MPEG-TS transmux.
 */
export type { MuxContentData, MuxSourceBase } from '@videojs/mux-video';
export type { MuxAdapterAPI, MuxAdapterProps } from '@videojs/mux-video/spf';
export { MuxAudioAdapter } from './adapter';
