import { type CodegenTypes, type TurboModule, TurboModuleRegistry } from 'react-native';

/** Each is named after, and fires under the same conditions as, the `HTMLMediaElement` event of that name. */
export type PlayerEventType =
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

/**
 * The fields of a player's state that one write changed, each named for the `HTMLMediaElement` property it backs. A
 * field is present only when it changed; `error: null` clears the error.
 */
export type PlayerStatePatch = Readonly<{
  /** Seconds. */
  currentTime?: CodegenTypes.Double;
  /** Seconds; `NaN` until known and `Infinity` for live. */
  duration?: CodegenTypes.Double;
  /** Seconds, ascending and non-overlapping. */
  buffered?: ReadonlyArray<PlayerTimeRange>;
  seekable?: ReadonlyArray<PlayerTimeRange>;
  error?: PlayerError | null;
  paused?: boolean;
  ended?: boolean;
  seeking?: boolean;
  currentSrc?: string;
  /** An `HTMLMediaElement.readyState` value, `0`–`4`. */
  readyState?: CodegenTypes.Int32;
  playbackRate?: CodegenTypes.Double;
  contentData?: PlayerContentData;
}>;

/**
 * One write to a player's state: what changed and the events announcing it.
 *
 * `version` orders writes to one player. A command's own update reaches JS synchronously, as its return value, while
 * updates from earlier native writes can still be in flight behind it. So a mirror applies a field only when it holds
 * an older version of that field; a late update still fires its events but never rolls state back. On the web, too,
 * state can be newer than the event announcing it, which is why events carry no values.
 */
export type PlayerUpdate = Readonly<{
  version: CodegenTypes.Double;
  patch: PlayerStatePatch;
  /** `PlayerEventType`s, in firing order. Codegen can't type an array of a string union. */
  events: ReadonlyArray<string>;
}>;

/** One event channel for every player, tagged by handle; consumers filter on `handle`. */
export type PlayerChange = Readonly<{
  handle: CodegenTypes.Int32;
  version: CodegenTypes.Double;
  patch: PlayerStatePatch;
  events: ReadonlyArray<string>;
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
 * Commands run synchronously on the JS thread: each writes what it means into native state, posts the player work to
 * the player's thread, and returns its own {@link PlayerUpdate}. The update reflects the command, as a media element's
 * state does straight after one, and its events still arrive through `onPlayerChange` like any other. A command returns
 * `null` when there is no player for the handle (any more). A command must return a value to run synchronously at all —
 * TurboModule `void` methods run asynchronously on the module's queue.
 *
 * State otherwise reaches JS only as `onPlayerChange` updates. `getState` returns all of it as one update, for a mirror
 * starting late (adopting a handle); against an unknown or destroyed handle, it is a media element's initial state.
 */
export interface Spec extends TurboModule {
  createPlayer(source: string | null): CodegenTypes.Int32;
  destroyPlayer(handle: CodegenTypes.Int32): void;
  setSource(handle: CodegenTypes.Int32, source: string): PlayerUpdate | null;
  /** Reloads the current source from scratch. */
  load(handle: CodegenTypes.Int32): PlayerUpdate | null;
  play(handle: CodegenTypes.Int32): PlayerUpdate | null;
  pause(handle: CodegenTypes.Int32): PlayerUpdate | null;
  /** Seconds, clamped to `seekable`. Ignored with no source. */
  setCurrentTime(handle: CodegenTypes.Int32, time: CodegenTypes.Double): PlayerUpdate | null;
  /** Must be positive; others are ignored. */
  setPlaybackRate(handle: CodegenTypes.Int32, rate: CodegenTypes.Double): PlayerUpdate | null;
  /** Restarts from the beginning at the end instead of ending, without `ended`. */
  setLoop(handle: CodegenTypes.Int32, loop: boolean): PlayerUpdate | null;

  /** Every field, as one update. */
  getState(handle: CodegenTypes.Int32): PlayerUpdate;

  readonly onPlayerChange: CodegenTypes.EventEmitter<PlayerChange>;
}

// `get` rather than `getEnforcing` so importing the package doesn't throw
// before the native module is registered — callers surface a clearer error.
export default TurboModuleRegistry.get<Spec>('VideoJSEngineStore');
