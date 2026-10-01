import { anyAbortSignal } from '@videojs/utils/events';

/** @internal */
export type SignalKey = PropertyKey;

/** @internal */
export class AbortControllerRegistry {
  // Created on first read. Runtimes such as Cloudflare Workers forbid constructing I/O-bound
  // objects during module evaluation, and registries can be created at module scope.
  #base: AbortController | undefined;
  #keys = new Map<SignalKey, AbortController>();

  /** The attach-scoped signal. Aborts on detach or reattach. */
  get base(): AbortSignal {
    return (this.#base ??= new AbortController()).signal;
  }

  /** Clears all keyed signals, leaving base intact. */
  clear(): void {
    for (const controller of this.#keys.values()) {
      controller.abort();
    }

    this.#keys.clear();
  }

  /** Resets base and clears all keyed signals. */
  reset(): void {
    this.clear();
    this.#base?.abort();
    this.#base = undefined;
  }

  /** Creates a new signal for the key, superseding any previous signal. */
  supersede(key: SignalKey): AbortSignal {
    this.#keys.get(key)?.abort();
    const controller = new AbortController();

    this.#keys.set(key, controller);
    return anyAbortSignal([this.base, controller.signal]);
  }
}
