import { type EngineAdapter, type MediaContentData, MediaError, type TimeRangeLike } from '@videojs/media';
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

type PlayerEventType = PlayerEvent['type'];

const PLAYER_EVENT_TYPES: readonly PlayerEventType[] = [
  'loadstart',
  'emptied',
  'loadedmetadata',
  'durationchange',
  'progress',
  'canplay',
  'canplaythrough',
  'error',
  'play',
  'pause',
  'playing',
  'waiting',
  'ended',
  'seeking',
  'seeked',
  'timeupdate',
  'ratechange',
  'contentdatachange',
];

const isPlayerEventType = (type: string): type is PlayerEventType =>
  PLAYER_EVENT_TYPES.includes(type as PlayerEventType);

/**
 * Media adapter over a native player addressed by a {@link NativeEngineHandle}.
 *
 * Commands forward to the `VideoJSEngineStore` TurboModule, and every readable property reads its synchronous getters,
 * which return the native state snapshot without waiting on the player's thread. Commands write their effect into that
 * snapshot before returning, so `paused` reads `false` straight after `play()`, as on the web. Events from the
 * handle-tagged `onPlayerEvent` channel are re-emitted; their payloads are left to listeners that want a value without
 * a round trip, since an in-flight payload can be older than the snapshot.
 *
 * Satisfies `NativeMedia`, and at runtime `isMediaSourceCapable` too, which is what core's platform-neutral `playback`,
 * `time`, `buffer`, `error`, `metadata` and `playbackRate` features check for. `src` and `loop` are the adapter's own,
 * as attributes are an element's: it forwards them to native but doesn't read them back.
 */
export class ReactNativeMedia
  extends PlayerSurfaceHost<NativeEvents>
  implements NativeMedia<NativeEvents>, EngineAdapter<NativeEngineHandle, PlayerSurface>
{
  #handle: NativeEngineHandle | null;
  #ownsHandle: boolean;
  #subscription: { remove(): void } | null = null;
  #src = reactNativeMediaDefaultProps.src;
  #loop = false;
  #defaultPlaybackRate = 1;
  #error: { code: number; message: string; value: MediaError } | null = null;
  #contentData: MediaContentData | null = null;

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

      this.#handleNativeEvent(event.type);
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
    this.#resetPlaybackRate();
  }

  get loop(): boolean {
    return this.#loop;
  }

  set loop(value: boolean) {
    if (this.#loop === value) return;

    this.#loop = value;

    if (isNull(this.#handle)) return;

    requireEngineStore().setLoop(this.#handle, value);
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

  /** Reloads the current source from scratch. */
  load(): void {
    if (isNull(this.#handle)) return;

    requireEngineStore().load(this.#handle);
    this.#resetPlaybackRate();
  }

  get paused(): boolean {
    return isNull(this.#handle) ? true : requireEngineStore().isPaused(this.#handle);
  }

  get ended(): boolean {
    return isNull(this.#handle) ? false : requireEngineStore().isEnded(this.#handle);
  }

  /** Seconds. Setting it seeks, and reads back the target straight away while `seeking`. */
  get currentTime(): number {
    return isNull(this.#handle) ? 0 : requireEngineStore().getCurrentTime(this.#handle);
  }

  set currentTime(value: number) {
    if (isNull(this.#handle)) return;

    requireEngineStore().setCurrentTime(this.#handle, value);
  }

  /** Seconds; `NaN` until known and `Infinity` for live. */
  get duration(): number {
    return isNull(this.#handle) ? Number.NaN : requireEngineStore().getDuration(this.#handle);
  }

  get buffered(): TimeRangeLike {
    return isNull(this.#handle) ? EMPTY_TIME_RANGES : toTimeRanges(requireEngineStore().getBuffered(this.#handle));
  }

  get seekable(): TimeRangeLike {
    return isNull(this.#handle) ? EMPTY_TIME_RANGES : toTimeRanges(requireEngineStore().getSeekable(this.#handle));
  }

  get playbackRate(): number {
    return isNull(this.#handle) ? this.#defaultPlaybackRate : requireEngineStore().getPlaybackRate(this.#handle);
  }

  /** Must be positive; native ignores anything else. */
  set playbackRate(value: number) {
    if (isNull(this.#handle)) return;

    requireEngineStore().setPlaybackRate(this.#handle, value);
  }

  /** The rate a new source starts at. */
  get defaultPlaybackRate(): number {
    return this.#defaultPlaybackRate;
  }

  set defaultPlaybackRate(value: number) {
    this.#defaultPlaybackRate = value;
  }

  /**
   * What the content itself names: `title` and `poster` when it carries them. Nothing native can supply a `storyboard`,
   * so it reads `null` until something else provides one. Stable while native reports the same values, so the metadata
   * feature sees one bag rather than a new one per read.
   */
  get contentData(): MediaContentData {
    const native = isNull(this.#handle) ? {} : requireEngineStore().getContentData(this.#handle);
    const cached = this.#contentData;
    if (!isNull(cached) && cached.title === native.title && cached.poster === native.poster) return cached;

    this.#contentData = { ...native, storyboard: null };
    return this.#contentData;
  }

  /**
   * Stable while native reports the same error, so readers comparing by identity see one error rather than a new one
   * per read. An empty message falls back to `MediaError`'s default for the code.
   */
  get error(): MediaError | null {
    const native = isNull(this.#handle) ? null : requireEngineStore().getError(this.#handle);

    if (isNull(native)) {
      this.#error = null;
      return null;
    }

    if (this.#error?.code !== native.code || this.#error.message !== native.message) {
      this.#error = { ...native, value: new MediaError(native.message, native.code) };
    }

    return this.#error.value;
  }

  get seeking(): boolean {
    return isNull(this.#handle) ? false : requireEngineStore().isSeeking(this.#handle);
  }

  /** An `HTMLMediaElement.readyState` value, `0`–`4`. */
  get readyState(): number {
    return isNull(this.#handle) ? 0 : requireEngineStore().getReadyState(this.#handle);
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

  // A media element's load starts the new source at `defaultPlaybackRate`.
  #resetPlaybackRate(): void {
    if (isNull(this.#handle) || this.playbackRate === this.#defaultPlaybackRate) return;

    requireEngineStore().setPlaybackRate(this.#handle, this.#defaultPlaybackRate);
  }

  #handleNativeEvent(type: string): void {
    if (!isPlayerEventType(type)) {
      if (__DEV__) {
        console.warn(`@videojs/react-native: unrecognized native player event '${type}'.`);
      }

      return;
    }

    this.emit(type);
  }
}
