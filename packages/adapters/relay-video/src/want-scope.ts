import type { SupervisedSubscriber, WantHandlers, WantOptions } from '@caprid/relay';

/**
 * What a relay video borrows from the application's supervised subscriber. The connection stays the application's:
 * `close` and `rotate` are left out so the adapter cannot end or replace it.
 *
 * @internal
 */
export type RelaySubscriberView = Pick<SupervisedSubscriber, 'want' | 'unwant' | 'catchUp' | 'status' | 'closed'>;

/**
 * The tracks one relay video wants.
 *
 * @internal
 */
export type WantName = 'catalog' | 'video' | 'audio';

/**
 * One relay video's wants on a borrowed subscriber. Every key is prefixed, so the application's own wants and other
 * elements on the same subscriber never collide with them, and only the keys this scope holds are ever unwanted.
 *
 * @internal
 */
export interface WantScope {
  /** Want a track, or move an existing want to another track make-before-break. */
  want(name: WantName, options: WantOptions, handlers: WantHandlers): void;
  unwant(name: WantName): void;
  catchUp(name: WantName): void;
  /** Unwant every track this scope holds. */
  clear(): void;
}

/** @internal */
export function createWantScope(subscriber: RelaySubscriberView, prefix: string): WantScope {
  const keys: Record<WantName, string> = {
    catalog: `${prefix}catalog`,
    video: `${prefix}video`,
    audio: `${prefix}audio`,
  };
  const held = new Set<WantName>();

  return {
    want(name, options, handlers) {
      subscriber.want(keys[name], options, handlers);
      held.add(name);
    },
    unwant(name) {
      if (!held.delete(name)) return;

      subscriber.unwant(keys[name]);
    },
    catchUp(name) {
      if (held.has(name)) subscriber.catchUp(keys[name]);
    },
    clear() {
      for (const name of held) subscriber.unwant(keys[name]);

      held.clear();
    },
  };
}
