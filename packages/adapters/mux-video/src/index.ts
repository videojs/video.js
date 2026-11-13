/**
 * The Mux Media — Mux identity in, playback out — over the SPF HLS engine, which is the default.
 *
 * The import path picks the engine, and nothing else about the Mux surface changes: `@videojs/mux-video/hls-js` is the
 * same Media over hls.js, and `@videojs/mux-video/spf` names this one explicitly.
 */
export * from './spf';
