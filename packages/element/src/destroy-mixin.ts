import { isKeptAlive } from '@videojs/utils/dom';

import type { ReactiveElement } from './reactive-element';
import type { ReactiveController } from './types';

export interface Destroyable {
  readonly destroyed: boolean;
  destroy(): void;
  destroyCallback(): void;
}

const destroyables = new WeakSet<Element>();

function destroyContents(element: Element): void {
  if (element.shadowRoot) destroyChildren(element.shadowRoot);

  destroyChildren(element);
}

function destroyChildren(parent: ParentNode): void {
  for (const child of Array.from(parent.children)) {
    // A destroyable child cascades into its own contents.
    if (destroyables.has(child)) (child as Element & Destroyable).destroy();
    else destroyContents(child);
  }
}

/**
 * Mixin that adds a deferred destruction lifecycle to a `ReactiveElement`.
 *
 * On disconnect, schedules destruction after two animation frames. If the element reconnects before the frames fire
 * (e.g. DOM shuffling, framework reconciliation), the `isConnected` check prevents destruction.
 *
 * The `keep-alive` attribute on the element or any composed ancestor, including a shadow host, prevents automatic
 * destruction entirely — call `destroy()` manually when done. Destroying an element also destroys the destroyable
 * elements inside it, including those in shadow roots and those with their own `keep-alive`, so one `destroy()` on the
 * kept-alive root releases the tree.
 *
 * Subclasses override `destroyCallback()` (calling `super.destroyCallback()`) to release heavy resources like stores or
 * imperative APIs.
 *
 * Mirrors `addController`/`removeController` to track controllers (needed because `ReactiveElement.#controllers` is
 * hard-private), calls `hostDestroyed()` on all tracked controllers in `destroyCallback`, and guards `performUpdate()`
 * so no updates run after destruction.
 */
export function DestroyMixin<Base extends new (...args: any[]) => ReactiveElement>(SuperClass: Base) {
  class DestroyableElement extends SuperClass {
    #destroyed = false;
    #trackedControllers = new Set<ReactiveController>();

    constructor(...args: any[]) {
      super(...args);
      destroyables.add(this);
    }

    get destroyed(): boolean {
      return this.#destroyed;
    }

    destroy(): void {
      if (this.#destroyed) return;

      this.#destroyed = true;

      // Descendants first, so they release resources before this element tears down what they depend on (e.g. a store).
      destroyContents(this);
      this.destroyCallback();
    }

    destroyCallback(): void {
      for (const c of this.#trackedControllers) {
        c.hostDestroyed?.();
      }
    }

    addController(controller: ReactiveController): void {
      super.addController(controller);
      this.#trackedControllers.add(controller);
    }

    removeController(controller: ReactiveController): void {
      super.removeController(controller);
      this.#trackedControllers.delete(controller);
    }

    connectedCallback(): void {
      if (this.#destroyed) return;

      super.connectedCallback();
    }

    disconnectedCallback(): void {
      super.disconnectedCallback();

      if (!this.#destroyed && !isKeptAlive(this)) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!this.isConnected) this.destroy();
          });
        });
      }
    }

    protected performUpdate(): void {
      if (this.#destroyed) return;

      super.performUpdate();
    }
  }

  return DestroyableElement as unknown as Base & (new (...args: any[]) => Destroyable);
}
