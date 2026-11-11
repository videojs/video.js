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
    | 'ratechange'
    | 'contentdatachange';
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

/**
 * Metadata the content itself carries. A key is present only when the content supplies it; nothing set through the
 * native APIs is reported.
 */
export type PlayerContentData = Readonly<{
  title?: string;
  /** A URL, or a `data:` URI when the content embeds the artwork. */
  poster?: string;
}>;

/**
 * Commands run synchronously on the JS thread: each writes the state it will produce into the snapshot, then posts the
 * work to the player's thread and returns. They return `true` when the snapshot already reflects the command, and
 * `false` when there is no player for the handle yet (it is built one player-thread hop after `createPlayer`) or any
 * more; a command against a handle not yet built still takes effect, its state appearing once it runs. A command must
 * return a value to run synchronously at all — TurboModule `void` methods run asynchronously on the module's queue.
 *
 * Getters are synchronous and never wait on the player's thread: they read that same snapshot. Besides commands, the
 * player writes what it reports into it before emitting the `onPlayerEvent` that announces it, so a getter called while
 * handling an event sees state at least as new as the event. Against an unknown or destroyed handle, getters return a
 * media element's initial values.
 */
export interface Spec extends TurboModule {
  createPlayer(source: string | null): CodegenTypes.Int32;
  destroyPlayer(handle: CodegenTypes.Int32): void;
  setSource(handle: CodegenTypes.Int32, source: string): boolean;
  /** Reloads the current source from scratch. */
  load(handle: CodegenTypes.Int32): boolean;
  play(handle: CodegenTypes.Int32): boolean;
  pause(handle: CodegenTypes.Int32): boolean;
  /** Seconds. Ignored with no source. */
  setCurrentTime(handle: CodegenTypes.Int32, time: CodegenTypes.Double): boolean;

  /** Seconds. */
  getCurrentTime(handle: CodegenTypes.Int32): CodegenTypes.Double;
  /** Seconds; `NaN` until known and `Infinity` for live. */
  getDuration(handle: CodegenTypes.Int32): CodegenTypes.Double;
  getBuffered(handle: CodegenTypes.Int32): ReadonlyArray<PlayerTimeRange>;
  getSeekable(handle: CodegenTypes.Int32): ReadonlyArray<PlayerTimeRange>;
  /** The last error for the current source. */
  getError(handle: CodegenTypes.Int32): PlayerError | null;
  isPaused(handle: CodegenTypes.Int32): boolean;
  isEnded(handle: CodegenTypes.Int32): boolean;
  isSeeking(handle: CodegenTypes.Int32): boolean;
  /** The source last passed to `setSource`, or `''`. */
  getSource(handle: CodegenTypes.Int32): string;
  /** An `HTMLMediaElement.readyState` value, `0`–`4`. */
  getReadyState(handle: CodegenTypes.Int32): CodegenTypes.Int32;
  getContentData(handle: CodegenTypes.Int32): PlayerContentData;
  getPlaybackRate(handle: CodegenTypes.Int32): CodegenTypes.Double;

  readonly onPlayerEvent: CodegenTypes.EventEmitter<PlayerEvent>;
}

// `get` rather than `getEnforcing` so importing the package doesn't throw
// before the native module is registered — callers surface a clearer error.
export default TurboModuleRegistry.get<Spec>('VideoJSEngineStore');
