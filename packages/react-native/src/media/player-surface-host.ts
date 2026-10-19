import type { EventLike, EventTargetLike } from '@videojs/media';
import { isUndefined } from '@videojs/utils/predicate';
import type { HostInstance } from 'react-native';

import type { NativeEvents } from './native-capability';

/**
 * The Fabric view's host instance — what a ref on `PlayerViewNativeComponent` hands back.
 *
 * Concrete on purpose: there is exactly one surface kind today. If a second appears (system chrome, an audio-only no-op
 * surface), introduce a `PlayerSurfaceLike` interface and make the host generic over `Target extends
 * PlayerSurfaceLike`, mirroring how `HTMLMediaElementHost` takes `Target extends HTMLMediaTargetLike`.
 */
export type PlayerSurface = HostInstance;

type Listener = (event: never) => void;

/**
 * Base for react-native media adapters: an `EventTargetLike` emitter plus the attach/detach/destroy lifecycle.
 *
 * Unlike `HTMLMediaElementHost`, this does not forward the media contract to its target. An `HTMLMediaElement` _is_ the
 * playback engine and owns `paused`/`currentTime`, so the web host can delegate reads to it. A Fabric view owns no
 * playback state — it renders frames for a handle — so subclasses mirror state from the native event channel instead.
 * Closest web analogue is `VimeoMedia`, which mirrors for the same reason.
 *
 * The emitter is hand-rolled rather than `TypedEventTarget()` from core: that returns the global `EventTarget`, whose
 * `dispatchEvent` demands a real `Event` instance, and `Event` is not available as a value under this package's
 * DOM-free `lib`. A plain map needs no globals and dispatches the `EventLike` objects the contract actually specifies.
 */
export class PlayerSurfaceHost<
  Events extends { [K in keyof Events]: EventLike } = NativeEvents,
> implements EventTargetLike<Events> {
  #listeners = new Map<string, Set<Listener>>();
  #surface: PlayerSurface | null = null;
  #destroyed = false;

  protected get surface(): PlayerSurface | null {
    return this.#surface;
  }

  protected get destroyed(): boolean {
    return this.#destroyed;
  }

  addEventListener<K extends keyof Events & string>(
    type: K,
    listener: (event: Events[K]) => void,
    options?: { signal?: AbortSignal }
  ): void {
    if (options?.signal?.aborted) return;

    let listeners = this.#listeners.get(type);

    if (isUndefined(listeners)) {
      listeners = new Set();
      this.#listeners.set(type, listeners);
    }

    listeners.add(listener as Listener);

    options?.signal?.addEventListener('abort', () => this.removeEventListener(type, listener), { once: true });
  }

  removeEventListener<K extends keyof Events & string>(type: K, listener: (event: Events[K]) => void): void {
    const listeners = this.#listeners.get(type);
    if (isUndefined(listeners)) return;

    listeners.delete(listener as Listener);

    if (listeners.size === 0) this.#listeners.delete(type);
  }

  dispatchEvent(event: EventLike): boolean {
    const listeners = this.#listeners.get(event.type);
    if (isUndefined(listeners)) return true;

    // Copy first so a listener that unsubscribes mid-dispatch doesn't mutate
    // the set being iterated.
    for (const listener of [...listeners]) {
      (listener as (event: EventLike) => void)(event);
    }

    return true;
  }

  /** Emit a contract event. Subclasses call this from their native event demux. */
  protected emit(type: keyof Events & string): void {
    this.dispatchEvent({ type, timeStamp: Date.now() });
  }

  /**
   * Record the surface rendering this player.
   *
   * Bookkeeping only today: native already binds surfaces itself when the Fabric view mounts with a `playerHandle` —
   * Android keeps a LIFO `ArrayDeque<SurfaceView>` in `PlayerEngine`, iOS has `attachLayer`/`detachLayer`, and neither
   * is exposed on the TurboModule. The seam exists for `EngineAdapter` conformance, parity with the web hooks, and as
   * the place any JS-side multi-surface policy would go.
   */
  attach(surface: PlayerSurface): void {
    if (this.#destroyed || this.#surface === surface) return;

    this.#surface = surface;
  }

  detach(): void {
    this.#surface = null;
  }

  destroy(): void {
    if (this.#destroyed) return;

    this.#destroyed = true;
    this.detach();
    this.#listeners.clear();
  }
}
