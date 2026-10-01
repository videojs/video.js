import { createState, type State } from '@videojs/store';
import { noop } from '@videojs/utils/function';

import type { TransitionState } from '../../core/ui/transition';

/** @internal */
export interface TransitionApi {
  state: State<TransitionState>;
  open(el?: TransitionElement): Promise<void>;
  close(el: HTMLElement | null): Promise<void>;
  cancel(): void;
  destroy(): void;
}

/** @internal */
export type TransitionElement = HTMLElement | null | (() => HTMLElement | null);

/**
 * Manages open/close transition lifecycle via `createState`.
 *
 * **Open:** patches `{ active: true, status: 'starting' }`, then after a double-RAF patches `{ status: 'idle' }` so the
 * browser paints the initial ("from") state before transitioning. It then waits for the resulting element animations to
 * finish. Reopening an active transition flushes styles first so CSS transitions can restart.
 *
 * **Close:** patches `{ status: 'ending' }` (keeping `active: true` so the element stays mounted), then after a
 * double-RAF waits for `getAnimations()` to settle before patching `{ active: false, status: 'idle' }`.
 *
 * @internal
 */
export function createTransition(): TransitionApi {
  const state = createState<TransitionState>({ active: false, status: 'idle' });

  let destroyed = false;
  let rafId1 = 0;
  let rafId2 = 0;
  let operationId = 0;
  let resolvePending: (() => void) | null = null;

  function cancelFrames(): void {
    cancelAnimationFrame(rafId1);
    cancelAnimationFrame(rafId2);
    rafId1 = 0;
    rafId2 = 0;
  }

  function beginOperation(): number {
    operationId++;
    cancelFrames();
    resolvePending?.();
    resolvePending = null;
    return operationId;
  }

  function finishOperation(id: number): void {
    if (id !== operationId) return;

    const resolve = resolvePending;

    resolvePending = null;
    resolve?.();
  }

  function open(el: TransitionElement = null): Promise<void> {
    if (destroyed) return Promise.resolve();

    const id = beginOperation();

    const restarting = state.current.active;

    if (restarting) {
      state.patch({ status: 'idle' });
    }

    state.patch({ active: true, status: 'starting' });

    return new Promise<void>((resolve) => {
      resolvePending = resolve;
      rafId1 = requestAnimationFrame(() => {
        rafId1 = 0;

        if (restarting) {
          const element = resolveElement(el);

          cancelAnimations(element);
          flushStyles(element);
        }

        rafId2 = requestAnimationFrame(() => {
          rafId2 = 0;

          if (destroyed || id !== operationId || !state.current.active) return finishOperation(id);

          state.patch({ status: 'idle' });
          // Wait one more frame for framework adapters to remove the starting
          // style attribute before collecting the resulting CSS animations.
          rafId1 = requestAnimationFrame(() => {
            rafId1 = 0;

            if (destroyed || id !== operationId || !state.current.active) return finishOperation(id);

            waitForAnimations(resolveElement(el)).finally(() => finishOperation(id));
          });
        });
      });
    });
  }

  function close(el: HTMLElement | null): Promise<void> {
    if (destroyed) return Promise.resolve();

    const id = beginOperation();

    state.patch({ status: 'ending' });

    return new Promise<void>((resolve) => {
      resolvePending = resolve;
      rafId1 = requestAnimationFrame(() => {
        rafId1 = 0;
        rafId2 = requestAnimationFrame(() => {
          rafId2 = 0;

          if (destroyed || id !== operationId) return finishOperation(id);

          waitForAnimations(el).finally(() => {
            if (destroyed || id !== operationId || state.current.status !== 'ending') return finishOperation(id);

            state.patch({ active: false, status: 'idle' });
            finishOperation(id);
          });
        });
      });
    });
  }

  function cancel(): void {
    operationId++;
    cancelFrames();
    resolvePending?.();
    resolvePending = null;

    if (state.current.status !== 'idle') {
      state.patch({ status: 'idle' });
    }
  }

  return {
    state,
    open,
    close,
    cancel,
    destroy() {
      if (destroyed) return;

      destroyed = true;
      cancel();
    },
  };
}

function resolveElement(element: TransitionElement): HTMLElement | null {
  return typeof element === 'function' ? element() : element;
}

function flushStyles(el: HTMLElement | null): void {
  if (!el) return;

  void el.offsetHeight;
}

function cancelAnimations(el: HTMLElement | null): void {
  const animations = el?.getAnimations?.({ subtree: true }) ?? [];

  for (const animation of animations) {
    animation.cancel();
  }
}

function waitForAnimations(el: HTMLElement | null): Promise<void> {
  if (!el) return Promise.resolve();

  const animations = el.getAnimations?.() ?? [];
  if (animations.length === 0) return Promise.resolve();

  return Promise.all(animations.map((a) => a.finished)).then(noop, noop);
}
