import { type EngineAdapter, type MediaContentData, MediaError, type TimeRangeLike } from '@videojs/media';
import { isNull, isUndefined } from '@videojs/utils/predicate';

import { type NativeEngineHandle, requireEngineStore, toEngineHandle } from './engine-store';
import type { NativeEvents, NativeMedia } from './native-capability';
import { NativeStateMirror } from './native-state-mirror';
import type { PlayerChange, PlayerError, PlayerEventType, PlayerTimeRange, PlayerUpdate } from './NativeEngineStore';
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

/**
 * Every `PlayerEventType`, checked as a record so that adding a member to the native union without listing it here
 * fails to compile, rather than becoming a silently dropped event.
 */
const PLAYER_EVENT_TYPES = {
  loadstart: true,
  emptied: true,
  loadedmetadata: true,
  durationchange: true,
  progress: true,
  canplay: true,
  canplaythrough: true,
  error: true,
  play: true,
  pause: true,
  playing: true,
  waiting: true,
  ended: true,
  seeking: true,
  seeked: true,
  timeupdate: true,
  ratechange: true,
  contentdatachange: true,
} satisfies Record<PlayerEventType, true>;

// The codegen payload carries `type` as a plain string, so native could emit one outside the union.
function isPlayerEventType(type: string): type is PlayerEventType {
  return Object.hasOwn(PLAYER_EVENT_TYPES, type);
}

/**
 * Media adapter over a native player addressed by a {@link NativeEngineHandle}.
 *
 * Readable properties never cross the bridge: they read a {@link NativeStateMirror}, kept by applying the
 * `PlayerUpdate`s native sends. Each command returns its own update, applied before the command returns, so `paused`
 * reads `false` straight after `play()` and `currentTime` reads the target straight after a seek, as on the web. Every
 * other update arrives on the handle-tagged `onPlayerChange` channel, which applies it and then re-emits its events, so
 * a listener reads state at least as new as the event.
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
  #mirror = new NativeStateMirror();
  #error: { native: PlayerError; value: MediaError } | null = null;
  #contentData: { native: object; value: MediaContentData } | null = null;

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

    this.#subscription = store.onPlayerChange((change) => {
      if (change.handle !== this.#handle) return;

      this.#handleNativeChange(change);
    });

    // An adopted player has state from before this adapter subscribed.
    if (!this.#ownsHandle) this.#mirror.apply(store.getState(this.#handle));
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

    this.#applyCommand(requireEngineStore().setSource(this.#handle, value));
    this.#resetPlaybackRate();
  }

  get loop(): boolean {
    return this.#loop;
  }

  set loop(value: boolean) {
    if (this.#loop === value) return;

    this.#loop = value;

    if (isNull(this.#handle)) return;

    this.#applyCommand(requireEngineStore().setLoop(this.#handle, value));
  }

  play(): Promise<void> {
    if (isNull(this.#handle)) {
      return Promise.reject(new Error('@videojs/react-native: the native player has been destroyed.'));
    }

    this.#applyCommand(requireEngineStore().play(this.#handle));
    return Promise.resolve();
  }

  pause(): void {
    if (isNull(this.#handle)) return;

    this.#applyCommand(requireEngineStore().pause(this.#handle));
  }

  /** Reloads the current source from scratch. */
  load(): void {
    if (isNull(this.#handle)) return;

    this.#applyCommand(requireEngineStore().load(this.#handle));
    this.#resetPlaybackRate();
  }

  get paused(): boolean {
    return this.#mirror.state.paused;
  }

  get ended(): boolean {
    return this.#mirror.state.ended;
  }

  /** Seconds. Setting it seeks, and reads back the target straight away while `seeking`. */
  get currentTime(): number {
    return this.#mirror.state.currentTime;
  }

  set currentTime(value: number) {
    if (isNull(this.#handle)) return;

    this.#applyCommand(requireEngineStore().setCurrentTime(this.#handle, value));
  }

  /** Seconds; `NaN` until known and `Infinity` for live. */
  get duration(): number {
    return this.#mirror.state.duration;
  }

  get buffered(): TimeRangeLike {
    return toTimeRanges(this.#mirror.state.buffered);
  }

  get seekable(): TimeRangeLike {
    return toTimeRanges(this.#mirror.state.seekable);
  }

  get playbackRate(): number {
    return this.#mirror.state.playbackRate;
  }

  /** Must be positive; native ignores anything else. */
  set playbackRate(value: number) {
    if (isNull(this.#handle)) return;

    this.#applyCommand(requireEngineStore().setPlaybackRate(this.#handle, value));
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
   * so it reads `null` until something else provides one. Stable until native reports a change, so the metadata feature
   * sees one bag rather than a new one per read.
   */
  get contentData(): MediaContentData {
    const native = this.#mirror.state.contentData;
    if (this.#contentData?.native === native) return this.#contentData.value;

    this.#contentData = { native, value: { ...native, storyboard: null } };
    return this.#contentData.value;
  }

  /**
   * Stable until native reports a change, so readers comparing by identity see one error rather than a new one per
   * read. An empty message falls back to `MediaError`'s default for the code.
   */
  get error(): MediaError | null {
    const native = this.#mirror.state.error;
    if (isNull(native)) return null;

    if (this.#error?.native === native) return this.#error.value;

    this.#error = { native, value: new MediaError(native.message, native.code) };
    return this.#error.value;
  }

  get seeking(): boolean {
    return this.#mirror.state.seeking;
  }

  /** An `HTMLMediaElement.readyState` value, `0`–`4`. */
  get readyState(): number {
    return this.#mirror.state.readyState;
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

    this.#applyCommand(requireEngineStore().setPlaybackRate(this.#handle, this.#defaultPlaybackRate));
  }

  // `null` means the handle has no player any more; nothing changed.
  #applyCommand(update: PlayerUpdate | null): void {
    if (!isNull(update)) this.#mirror.apply(update);
  }

  // State first, so a listener reads at least what the events announce.
  #handleNativeChange(change: PlayerChange): void {
    this.#mirror.apply(change);

    for (const type of change.events) {
      if (!isPlayerEventType(type)) {
        if (__DEV__) {
          console.warn(`@videojs/react-native: unrecognized native player event '${type}'.`);
        }

        continue;
      }

      this.emit(type);
    }
  }
}
