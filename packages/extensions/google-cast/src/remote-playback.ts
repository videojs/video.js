import type { GoogleCastProvider } from './provider';
import { InvalidStateError, NotFoundError } from './utils';

export type RemotePlaybackState = 'disconnected' | 'connecting' | 'connected';

type AvailabilityCallback = (available: boolean) => void;

export type RemotePlaybackHooks = {
  setState(next: RemotePlaybackState): void;
  setAvailable(available: boolean): void;
};

const STATE_EVENTS = {
  connecting: 'connecting',
  connected: 'connect',
  disconnected: 'disconnect',
} satisfies Record<RemotePlaybackState, string>;

let callbackIdCount = 0;

/**
 * Implementation of the W3C [`RemotePlayback`](https://developer.mozilla.org/en-US/docs/Web/API/RemotePlayback)
 * interface backed by Google Cast.
 *
 * Surfaced via `host.remote` while the {@link GoogleCastProvider} is in the provider chain. The public API must
 * strictly conform to the W3C spec:
 *
 * - Properties: `state`
 * - Methods: `watchAvailability`, `cancelWatchAvailability`, `prompt`
 * - Events: `connecting`, `connect`, `disconnect`
 *
 * Internal state mutations are pushed by {@link GoogleCastProvider} through private callbacks registered via
 * `provider.bindHooks(...)` in the constructor — do not add public methods or properties that aren't part of the spec.
 */
export class RemotePlayback extends EventTarget {
  #provider: GoogleCastProvider;
  #state: RemotePlaybackState = 'disconnected';
  #available = false;
  #callbacks = new Map<number, AvailabilityCallback>();

  constructor(provider: GoogleCastProvider) {
    super();
    this.#provider = provider;
    provider.bindHooks({
      setState: (next) => this.#setState(next),
      setAvailable: (available) => this.#setAvailable(available),
    });
  }

  get state() {
    return this.#state;
  }

  async watchAvailability(callback: AvailabilityCallback) {
    this.#assertEnabled();
    const id = ++callbackIdCount;

    this.#callbacks.set(id, callback);
    queueMicrotask(() => callback(this.#provider.isAvailable()));
    return id;
  }

  async cancelWatchAvailability(callbackId?: number) {
    this.#assertEnabled();

    if (callbackId === undefined) {
      this.#callbacks.clear();
      return;
    }

    if (!this.#callbacks.delete(callbackId)) {
      throw new NotFoundError(`Callback not found for id ${callbackId}.`);
    }
  }

  async prompt() {
    this.#assertEnabled();
    await this.#provider.requestCastSession();
  }

  #assertEnabled() {
    if (this.#provider.target?.disableRemotePlayback) {
      throw new InvalidStateError('disableRemotePlayback attribute is present.');
    }
  }

  #setState(next: RemotePlaybackState) {
    if (this.#state === next) return;

    this.#state = next;
    this.dispatchEvent(new Event(STATE_EVENTS[next]));
  }

  #setAvailable(available: boolean) {
    if (this.#available === available) return;

    this.#available = available;

    for (const callback of this.#callbacks.values()) callback(available);
  }
}
