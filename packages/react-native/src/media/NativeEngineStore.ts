import { type CodegenTypes, type TurboModule, TurboModuleRegistry } from 'react-native';

/**
 * One event channel for every player, tagged by handle. Codegen rejects a discriminated union as an event payload (the
 * parser accepts it, the native generators do not), so the payload stays flat and consumers filter on `handle` before
 * narrowing on `type`.
 *
 * Each `type` is named after, and fires under the same conditions as, the `HTMLMediaElement` event of that name. Events
 * that report a value carry it in the optional field named for the media element property it updates.
 */
export type PlayerEvent = Readonly<{
  handle: CodegenTypes.Int32;
  type:
    | 'loadstart'
    | 'emptied'
    | 'loadedmetadata'
    | 'durationchange'
    | 'progress'
    | 'canplay'
    | 'canplaythrough'
    | 'error'
    | 'play'
    | 'pause'
    | 'playing'
    | 'waiting'
    | 'ended'
    | 'seeking'
    | 'seeked'
    | 'timeupdate'
    | 'ratechange';
  /** Set on `timeupdate`. Seconds. */
  currentTime?: CodegenTypes.Double;
  /** Set on `durationchange`. Seconds; `Infinity` for live. */
  duration?: CodegenTypes.Double;
  /** Set on `progress`. Seconds, ascending and non-overlapping. */
  buffered?: ReadonlyArray<PlayerTimeRange>;
  /** Set on `error`. */
  error?: PlayerError;
}>;

export type PlayerTimeRange = Readonly<{
  start: CodegenTypes.Double;
  end: CodegenTypes.Double;
}>;

/**
 * `code` is a `MediaError` code; native errors that don't correspond to one use `MEDIA_ERR_CUSTOM`. `message` carries
 * the native description and may be empty.
 */
export type PlayerError = Readonly<{
  code: CodegenTypes.Int32;
  message: string;
}>;

export interface Spec extends TurboModule {
  createPlayer(source: string | null): CodegenTypes.Int32;
  destroyPlayer(handle: CodegenTypes.Int32): void;
  setSource(handle: CodegenTypes.Int32, source: string): void;
  play(handle: CodegenTypes.Int32): void;
  pause(handle: CodegenTypes.Int32): void;
  readonly onPlayerEvent: CodegenTypes.EventEmitter<PlayerEvent>;
}

// `get` rather than `getEnforcing` so importing the package doesn't throw
// before the native module is registered — callers surface a clearer error.
export default TurboModuleRegistry.get<Spec>('VideoJSEngineStore');
