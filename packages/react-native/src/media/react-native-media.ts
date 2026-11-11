import { type EngineAdapter, MediaError, type TimeRangeLike } from '@videojs/media';
import { isNull, isUndefined } from '@videojs/utils/predicate';

import { type NativeEngineHandle, requireEngineStore, toEngineHandle } from './engine-store';
import type { NativeEvents, NativeMedia } from './native-capability';
import type { PlayerEvent, PlayerTimeRange } from './NativeEngineStore';
import { type PlayerSurface, PlayerSurfaceHost } from './player-surface-host';

export interface ReactNativeMediaProps {
  src: string;
}

export const reactNativeMediaDefaultProps: ReactNativeMediaProps = {
  src: '',
};

/** The mirrored slice of playback state an incoming native event resolves to. */
export interface NativePlaybackState {
  paused: boolean;
  ended: boolean;
  currentTime: number;
  duration: number;
  buffered: TimeRangeLike;
  error: MediaError | null;
}

function toTimeRanges(ranges: readonly PlayerTimeRange[]): TimeRangeLike {
  return {
    length: ranges.length,
    start: (index) => rangeAt(ranges, index).start,
    end: (index) => rangeAt(ranges, index).end,
  };
}

// Out-of-range access throws on the web too (`IndexSizeError`).
function rangeAt(ranges: readonly PlayerTimeRange[], index: number): PlayerTimeRange {
  const range = ranges[index];
  if (isUndefined(range)) throw new RangeError(`Index ${index} is out of range for ${ranges.length} time ranges.`);

  return range;
}

const EMPTY_TIME_RANGES = toTimeRanges([]);

/** What a media element reports before, or between, sources. */
const initialSourceState = {
  ended: false,
  currentTime: 0,
  duration: Number.NaN,
  buffered: EMPTY_TIME_RANGES,
  error: null,
} satisfies Partial<NativePlaybackState>;

export const initialNativePlaybackState: NativePlaybackState = { paused: true, ...initialSourceState };

/**
 * Compile-time proof that every `PlayerEvent['type']` is handled. Adding a member to the native union without a
 * matching case makes this call fail to typecheck, so a new native event can't become a silently dropped one.
 */
function assertHandled(_type: never): void {}

/**
 * Translate one native event into the mirrored state it implies and the contract events to emit, given the state it
 * arrived in.
 *
 * Split out from the class so the mapping is inspectable and testable on its own. The `switch` is exhaustive over
 * `PlayerEvent['type']`, so adding a native event type without handling it here is a compile error rather than a
 * silently dropped event.
 */
export function resolveNativeEvent(
  event: PlayerEvent,
  previous: NativePlaybackState
): { state: NativePlaybackState; emit: (keyof NativeEvents & string)[] } | null {
  const { type } = event;

  switch (type) {
    case 'play':
    case 'playing':
      return { state: { ...previous, paused: false, ended: false }, emit: [type] };

    case 'pause':
      return { state: { ...previous, paused: true }, emit: [type] };

    case 'ended':
      return { state: { ...previous, paused: true, ended: true }, emit: [type] };

    // A new source starts over. Native keeps playing across the swap and
    // reports that through its own `play`/`pause`, so `paused` is left alone.
    // `emptied` only fires when replacing a source, so `loadstart` resets too.
    case 'emptied':
    case 'loadstart':
      return { state: { ...previous, ...initialSourceState }, emit: [type] };

    // A missing value means native broke the contract; keeping the previous
    // one beats mirroring `undefined`.
    case 'timeupdate':
      return { state: { ...previous, currentTime: event.currentTime ?? previous.currentTime }, emit: [type] };

    case 'durationchange':
      return { state: { ...previous, duration: event.duration ?? previous.duration }, emit: [type] };

    case 'progress':
      return {
        state: { ...previous, buffered: event.buffered ? toTimeRanges(event.buffered) : previous.buffered },
        emit: [type],
      };

    // An empty message falls back to `MediaError`'s default for the code.
    case 'error':
      return {
        state: {
          ...previous,
          error: new MediaError(event.error?.message, event.error?.code ?? MediaError.MEDIA_ERR_CUSTOM),
        },
        emit: [type],
      };

    // Native emits these under the same conditions as the media element, and
    // none of them touch the mirrored state yet.
    case 'loadedmetadata':
    case 'canplay':
    case 'canplaythrough':
    case 'waiting':
    case 'seeking':
    case 'seeked':
    case 'ratechange':
    case 'contentdatachange':
      return { state: previous, emit: [type] };

    default:
      // Statically unreachable. Still returns null at runtime, because the
      // codegen payload carries `type` as a plain string and native could emit
      // one outside the union.
      assertHandled(type);
      return null;
  }
}

/**
 * Media adapter over a native player addressed by a {@link NativeEngineHandle}.
 *
 * Commands forward to the `VideoJSEngineStore` TurboModule; readable state is mirrored from the handle-tagged
 * `onPlayerEvent` channel. See `PlayerSurfaceHost` for why state is mirrored rather than delegated.
 *
 * Satisfies `NativeMedia` — `Media` plus `MediaPauseCapability` and `MediaErrorCapability` — which is the whole
 * capability surface today.
 *
 * # Reusing existing playerFeatures
 *
 * Would be possible in a fully-realized implementation. The TurboModule has the commands and queries; the adapter needs
 * to surface them:
 *
 * 1. Seek and source capability. `isMediaSeekCapable` wants a writable `currentTime` (`setCurrentTime`) and `seeking`
 *    (`isSeeking`); `isMediaSourceCapable` wants `currentSrc` (`getSource`), `readyState` (`getReadyState`) and
 *    `load()`.
 * 2. `seekable` (`getSeekable`) alongside `buffered`, so the adapter satisfies `isMediaBufferCapable`.
 */
export class ReactNativeMedia
  extends PlayerSurfaceHost<NativeEvents>
  implements NativeMedia<NativeEvents>, EngineAdapter<NativeEngineHandle, PlayerSurface>
{
  #handle: NativeEngineHandle | null;
  #ownsHandle: boolean;
  #subscription: { remove(): void } | null = null;
  #src = reactNativeMediaDefaultProps.src;
  #state: NativePlaybackState = initialNativePlaybackState;

  /**
   * @param options - Pass `handle` to adopt an externally owned native player; it will not be destroyed with this
   *   adapter. Omit it to create and own one.
   */
  constructor(options?: { handle?: NativeEngineHandle }) {
    super();

    const store = requireEngineStore();
    const adopted = options?.handle;

    this.#ownsHandle = isUndefined(adopted);
    this.#handle = this.#ownsHandle ? toEngineHandle(store.createPlayer(null)) : adopted!;

    this.#subscription = store.onPlayerEvent((event) => {
      if (event.handle !== this.#handle) return;

      this.#handleNativeEvent(event);
    });
  }

  /** The native player handle. `EngineAdapter`'s engine reference. */
  get engine(): NativeEngineHandle | null {
    return this.#handle;
  }

  /**
   * Readable during render — the handle is created in the constructor, so a surface can bind it on first paint with no
   * null pass.
   */
  get handle(): NativeEngineHandle | null {
    return this.#handle;
  }

  get src(): string {
    return this.#src;
  }

  get currentSrc(): string {
    // mirror src for now.  ReactNativeMedia doesn't support <source> elements yet
    return this.#src;
  }

  set src(value: string) {
    if (this.#src === value) return;

    this.#src = value;

    // An empty src has no native equivalent — the spec has no clear operation,
    // so an idle player stays idle rather than being handed ''.
    if (isNull(this.#handle) || value === '') return;

    requireEngineStore().setSource(this.#handle, value);
  }

  play(): Promise<void> {
    if (isNull(this.#handle)) {
      return Promise.reject(new Error('@videojs/react-native: the native player has been destroyed.'));
    }

    requireEngineStore().play(this.#handle);
    return Promise.resolve();
  }

  pause(): void {
    if (isNull(this.#handle)) return;

    requireEngineStore().pause(this.#handle);
  }

  get paused(): boolean {
    return this.#state.paused;
  }

  get ended(): boolean {
    return this.#state.ended;
  }

  /** Seconds, as of the last `timeupdate`. Read-only until native has a seek command. */
  get currentTime(): number {
    return this.#state.currentTime;
  }

  /** Seconds; `NaN` until known and `Infinity` for live. */
  get duration(): number {
    return this.#state.duration;
  }

  get buffered(): TimeRangeLike {
    return this.#state.buffered;
  }

  get error(): MediaError | null {
    return this.#state.error;
  }

  override destroy(): void {
    if (this.destroyed) return;

    this.#subscription?.remove();
    this.#subscription = null;

    if (!isNull(this.#handle) && this.#ownsHandle) {
      requireEngineStore().destroyPlayer(this.#handle);
    }

    this.#handle = null;
    super.destroy();
  }

  #handleNativeEvent(event: PlayerEvent): void {
    const resolved = resolveNativeEvent(event, this.#state);

    if (isNull(resolved)) {
      if (__DEV__) {
        console.warn(`@videojs/react-native: unrecognized native player event '${event.type}'.`);
      }

      return;
    }

    this.#state = resolved.state;

    for (const event of resolved.emit) {
      this.emit(event);
    }
  }
}
