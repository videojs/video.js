import { type CodegenTypes, type TurboModule, TurboModuleRegistry } from 'react-native';

/**
 * One event channel for every player, tagged by handle. Codegen rejects a
 * discriminated union as an event payload (the parser accepts it, the native
 * generators do not), so the payload stays flat and consumers filter on
 * `handle` before narrowing on `type`.
 */
export type PlayerEvent = Readonly<{
  handle: CodegenTypes.Int32;
  type: 'playing' | 'paused' | 'ended';
}>;

export interface Spec extends TurboModule {
  createPlayer(source: string): CodegenTypes.Int32;
  destroyPlayer(handle: CodegenTypes.Int32): void;
  play(handle: CodegenTypes.Int32): void;
  pause(handle: CodegenTypes.Int32): void;
  readonly onPlayerEvent: CodegenTypes.EventEmitter<PlayerEvent>;
}

// `get` rather than `getEnforcing` so importing the package doesn't throw
// before the native module is registered — callers surface a clearer error.
export default TurboModuleRegistry.get<Spec>('VideoJSPlayerStore');
