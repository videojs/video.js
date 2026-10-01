/**
 * The Media over the HLS engine — SPF's public playback surface.
 *
 * SPF differs from engines like hls.js in that it exposes no engine-shaped API of its own: the `@videojs/media` facade
 * _is_ how a composed engine is consumed. `HlsVideoAdapter` is that facade, and this entry point is separate from
 * `@videojs/spf/hls/video` so wiring the engine directly doesn't pull the Media (or `@videojs/media`) in with it.
 */
export type {
  HlsVideoAdapterAPI,
  HlsVideoAdapterOptions,
  HlsVideoAdapterProps,
  HlsVideoMediaError,
  HlsVideoMediaStreamType,
  HlsVideoSource,
} from './mixin';
export { HlsVideoAdapterCore, HlsVideoMixin } from './mixin';
export { HlsVideoAdapter } from './adapter';
export { HlsVideoMediaTracksMixin } from './media-tracks';
