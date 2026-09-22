import type { EngineAdapter } from '@videojs/media';
import { isNull, isUndefined } from '@videojs/utils/predicate';

import { type NativeEngineHandle, requireEngineStore, toEngineHandle } from './engine-store';
import type { NativeEvents, NativeMedia } from './native-capability';
import type { PlayerEvent } from './NativeEngineStore';
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
}

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
  type: PlayerEvent['type'],
  previous: NativePlaybackState
): { state: NativePlaybackState; emit: (keyof NativeEvents & string)[] } | null {
  switch (type) {
    case 'playing':
      return {
        state: { paused: false, ended: false },
        // `play` marks the transition; `playing` marks playback actually running.
        emit: previous.paused ? ['play', 'playing'] : ['playing'],
      };

    case 'paused':
      // Native says `paused`, the contract event is `pause`.
      return { state: { ...previous, paused: true }, emit: ['pause'] };

    case 'ended':
      return { state: { paused: true, ended: true }, emit: ['ended'] };

    // TODO: emit `waiting` once native reports buffering. `NativeEvents`
    // already declares it, but no native event maps to it today, so it is
    // never emitted. Both platforms observe the signal and collapse it:
    //   - Android `PlayerEngine.onPlaybackStateChanged` handles only
    //     `Player.STATE_ENDED`; `Player.STATE_BUFFERING` is the missing case.
    //   - iOS `VideoJSPlayerEngine` KVO-observes `timeControlStatus` but maps
    //     `playing ? Playing : Paused`, folding
    //     `AVPlayerTimeControlStatusWaitingToPlayAtSpecifiedRate` into paused.
    // Adding it means a fourth case on each side plus a `'waiting'` member on
    // `PlayerEvent['type']` — a codegen spec change, so it needs a native rebuild.

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
 * Satisfies `NativeMedia` — `Media` plus `MediaPauseCapability` — which is the whole capability surface today. Two gaps
 * keep the shared store features out of reach, and closing them is what would let react-native drop its own feature
 * variants in favour of `packages/core/src/dom/store/features/`:
 *
 * - TODO: add seek and source capability. `isMediaSeekCapable` wants `currentTime`, `duration` and `seeking`;
 *   `isMediaSourceCapable` wants `currentSrc`, `readyState` and `load()` on top of the `src` that already exists.
 *   Core's `playbackFeature` guards on both and returns early without them, so it would attach and then do nothing. The
 *   TurboModule has to report position and duration before any of this can be mirrored.
 * - TODO: emit the rest of the standard media events. `resolveNativeEvent` covers `play`, `playing`, `pause` and `ended`;
 *   the shared features also listen for `emptied`, `timeupdate`, `canplay`, `seeking`, `seeked` and `waiting`. Each
 *   needs a native counterpart, which means extending `PlayerEvent['type']` — a codegen spec change.
 */
export class ReactNativeMedia
  extends PlayerSurfaceHost<NativeEvents>
  implements NativeMedia<NativeEvents>, EngineAdapter<NativeEngineHandle, PlayerSurface>
{
  #handle: NativeEngineHandle | null;
  #ownsHandle: boolean;
  #subscription: { remove(): void } | null = null;
  #src = reactNativeMediaDefaultProps.src;
  #state: NativePlaybackState = { paused: true, ended: false };

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

  set src(value: string) {
    if (this.#src === value) return;

    this.#src = value;

    // An empty src has no native equivalent — the spec has no clear operation,
    // so an idle player stays idle rather than being handed ''.
    if (isNull(this.#handle) || value === '') return;

    requireEngineStore().setSource(this.#handle, value);
  }

  /**
   * Resolves as soon as the command is dispatched, not when playback begins. Native `play` returns void and there is no
   * error channel to reject on, so waiting for the next `playing` event could hang indefinitely.
   */
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

  #handleNativeEvent(type: PlayerEvent['type']): void {
    const resolved = resolveNativeEvent(type, this.#state);

    if (isNull(resolved)) {
      if (__DEV__) {
        console.warn(`@videojs/react-native: unrecognized native player event '${type}'.`);
      }

      return;
    }

    this.#state = resolved.state;

    for (const event of resolved.emit) {
      this.emit(event);
    }
  }
}
