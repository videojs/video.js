/** @internal */
export interface PublicPromise<T> extends Promise<T> {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

/**
 * A promise that can be settled from outside its executor.
 *
 * Useful as a barrier that one piece of code waits on and another settles — for example an in-flight load that callers
 * await until whichever event finishes it resolves.
 *
 * @example
 *   ```ts
 *   const ready = createPublicPromise<void>();
 *   element.addEventListener('load', () => ready.resolve(), { once: true });
 *   await ready;
 *   ```;
 *
 * @internal
 */
export function createPublicPromise<T>(): PublicPromise<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  }) as PublicPromise<T>;

  promise.resolve = resolve;
  promise.reject = reject;
  return promise;
}
