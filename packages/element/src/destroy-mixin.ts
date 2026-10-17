import type { ReactiveElement } from './reactive-element';
import type { ReactiveController } from './types';

export interface Destroyable {
  readonly destroyed: boolean;
  destroy(): void;
  destroyCallback(): void;
}

function hasKeepAlive(element: Element): boolean {
  if (element.hasAttribute('keep-alive')) return true;

  const root = element.getRootNode();

  return typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot && hasKeepAlive(root.host);
}

/**
 * Mixin that adds a deferred destruction lifecycle to a `ReactiveElement`.
 *
 * On disconnect, schedules destruction after two animation frames. If the element reconnects before the frames fire
 * (e.g. DOM shuffling, framework reconciliation), the `isConnected` check prevents destruction.
 *
 * The `keep-alive` attribute prevents automatic destruction entirely — call `destroy()` manually when done.
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

    get destroyed(): boolean {
      return this.#destroyed;
    }

    destroy(): void {
      if (this.#destroyed) return;

      this.#destroyed = true;
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

      if (!this.#destroyed && !hasKeepAlive(this)) {
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
