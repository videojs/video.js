import { noop } from '@videojs/utils/function';
import { shallowEqual } from '@videojs/utils/object';

export type StateChange = () => void;

export type UnknownState = Record<string, unknown>;

export interface SubscribeOptions {
  signal?: AbortSignal;
}

export interface State<T> {
  readonly current: Readonly<T>;
  subscribe(callback: StateChange, options?: SubscribeOptions): () => void;
}

/** @internal */
export interface WritableState<T> extends State<T> {
  patch: (partial: Partial<T>) => void;
  replace: (next: T) => void;
}

let isFlushScheduled = false;

function scheduleFlush(): void {
  if (isFlushScheduled) return;

  isFlushScheduled = true;
  queueMicrotask(flush);
}

const pendingContainers = new Set<StateContainer<any>>();

/** @internal */
export function flush(): void {
  isFlushScheduled = false;

  for (const container of pendingContainers) container.flush();

  pendingContainers.clear();
}

const hasOwnProp = Object.prototype.hasOwnProperty;

class StateContainer<T> implements WritableState<T> {
  #current: T;
  #listeners = new Set<StateChange>();
  #pending = false;

  constructor(initial: T) {
    this.#current = Object.freeze({ ...initial });
  }

  get current(): Readonly<T> {
    return this.#current;
  }

  patch(partial: Partial<T>): void {
    const next = { ...this.#current };

    let changed = false;

    for (const key of Reflect.ownKeys(partial as object) as (keyof T)[]) {
      if (!hasOwnProp.call(partial, key)) continue;

      const value = partial[key];

      if (!Object.is(this.#current[key], value)) {
        next[key] = value!;
        changed = true;
      }
    }

    if (changed) {
      this.#current = Object.freeze(next);
      this.#markPending();
    }
  }

  replace(next: T): void {
    // Example: media metadata can change under a user override while the
    // resolved title stays the same. Preserve the public snapshot in that case.
    if (shallowEqual(this.#current, next)) return;

    this.#current = Object.freeze({ ...next });
    this.#markPending();
  }

  subscribe(callback: StateChange, options?: SubscribeOptions): () => void {
    const signal = options?.signal;
    if (signal?.aborted) return noop;

    this.#listeners.add(callback);

    if (!signal) {
      return () => this.#listeners.delete(callback);
    }

    const onAbort = () => this.#listeners.delete(callback);

    signal.addEventListener('abort', onAbort, { once: true });

    return () => {
      signal.removeEventListener('abort', onAbort);
      this.#listeners.delete(callback);
    };
  }

  flush(): void {
    if (!this.#pending) return;

    this.#pending = false;

    for (const fn of this.#listeners) fn();
  }

  #markPending(): void {
    this.#pending = true;
    pendingContainers.add(this);
    scheduleFlush();
  }
}

/** @internal */
export function createState<T>(initial: T): WritableState<T> {
  return new StateContainer(initial);
}

/** @internal */
export function isState(value: unknown): value is State<object> {
  return value instanceof StateContainer;
}
