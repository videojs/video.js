/**
 * The Mux background video over SPF: the Media over `@videojs/spf/engines/hls-background-video-mpeg-ts`. The background
 * counterpart of `@videojs/mux-video/spf`, behind its own entry so neither bundles the other's engine.
 */
export { MuxBackgroundVideoAdapter } from './adapter';
