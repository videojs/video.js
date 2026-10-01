import type { ReactiveController, ReactiveControllerHost } from '@videojs/element';
import type { Context } from '@videojs/element/context';
import { ContextConsumer } from '@videojs/element/context';
import { noop } from '@videojs/utils/function';

import type { AnyStore } from '../core/store';
import { isStore } from '../core/store';

export type StoreSource<Store extends AnyStore> = Store | Context<unknown, Store>;

/** @internal */
export type StoreAccessorHost = ReactiveControllerHost & HTMLElement;

/**
 * Resolves a store from either a direct instance or context.
 *
 * When given a direct store, provides immediate access. When given a context, sets up a ContextConsumer to receive the
 * store.
 *
 * @example
 *   Direct store
 *   ```ts
 *   const accessor = new StoreAccessor(host, store, (s) => console.log('available', s));
 *   accessor.value; // Store (immediately available)
 *   ```
 *
 * @example
 *   Context source
 *   ```ts
 *   const accessor = new StoreAccessor(host, context, (s) => console.log('available', s));
 *   accessor.value; // null until context provides store
 *   ```
 *
 * @internal
 */
export class StoreAccessor<Store extends AnyStore> implements ReactiveController {
  readonly #onAvailable: (store: Store) => void;
  readonly #consumer: ContextConsumer<Context<unknown, Store>, StoreAccessorHost> | null;

  #directStore: Store | null;

  constructor(host: StoreAccessorHost, source: StoreSource<Store>, onAvailable?: (store: Store) => void) {
    this.#onAvailable = onAvailable ?? noop;

    // Check if source is a store (object with subscribe) or context (symbol/string)
    if (isStore(source)) {
      this.#directStore = source as Store;
      this.#consumer = null;
    } else {
      this.#directStore = null;
      this.#consumer = new ContextConsumer(host, {
        context: source,
        callback: (store) => this.#onAvailable(store),
        subscribe: false,
      });
    }

    host.addController(this);
  }

  /** Returns the store, or null if not yet available from context. */
  get value(): Store | null {
    if (this.#consumer) {
      return this.#consumer.value ?? null;
    }

    return this.#directStore;
  }

  hostConnected(): void {
    // For direct store, trigger onAvailable on connect/reconnect
    // Context consumer handles its own reconnect via callback
    if (this.#directStore) {
      this.#onAvailable(this.#directStore);
    }
  }
}
