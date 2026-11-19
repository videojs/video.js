/**
 * The Media over the audio-only HLS engine. Sibling of `@videojs/spf/adapters/hls-video`; see that entry point for why
 * the Medias ship separately from the engine entry points.
 */
export type { CreateEngine, HlsAudioAdapterAPI, HlsAudioAdapterOptions, HlsAudioAdapterProps } from './mixin';
export { HlsAudioAdapterCore, HlsAudioMixin } from './mixin';
export { HlsAudioAdapter } from './adapter';
