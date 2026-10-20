/**
 * The Mux background video over SPF: the engine composition and the Media over it. The background counterpart of
 * `@videojs/mux-video/spf`, behind its own entry so neither bundles the other's engine.
 */
export type { Behaviors, Config, EngineConfig, EngineContext, EngineState } from './engine';
export { behaviors, createEngine, defaultConfig, features, initialState } from './engine';
export { MuxBackgroundVideoAdapter } from './adapter';
