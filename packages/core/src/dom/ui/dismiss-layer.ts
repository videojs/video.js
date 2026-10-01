import type { State, WritableState } from '@videojs/store';
import { listen } from '@videojs/utils/dom';

import type { TransitionState } from '../../core/ui/transition';
import type { TransitionApi, TransitionElement } from './transition';

/** @internal */
export interface DismissLayerOptions {
  /** Transition API for animated open/close. */
  transition: TransitionApi;
  /** Whether pressing Escape closes the layer. Defaults to `() => true`. */
  closeOnEscape?: (() => boolean) | undefined;
  /** Called when Escape should trigger a close. */
  onEscapeDismiss: (event: KeyboardEvent) => void;
  /** Register additional document listeners when the layer becomes active. Cleaned up via signal when inactive. */
  onDocumentActive?: (signal: AbortSignal) => void;
}

/** @internal */
export interface DismissLayerApi {
  /** Reactive transition state for platforms to subscribe to. */
  input: State<TransitionState>;
  /** Start the open transition. Returns animation promise, or `null` if already open or destroyed. */
  open(element?: TransitionElement): Promise<void> | null;
  /** Start the close transition. Returns animation promise, or `null` if already closed or destroyed. */
  close(element: HTMLElement | null): Promise<void> | null;
  /** Lifecycle signal. Aborted on destroy. */
  signal: AbortSignal;
  /** Tear down transition, listeners, and subscriptions. */
  destroy(): void;
}

/** @internal */
export function createDismissLayer(options: DismissLayerOptions): DismissLayerApi {
  const { transition } = options;
  const state: WritableState<TransitionState> = transition.state as WritableState<TransitionState>;

  const abort = new AbortController();
  let docAbort: AbortController | null = null;

  // --- Open/Close ---

  function open(element?: TransitionElement): Promise<void> | null {
    if (abort.signal.aborted) return null;

    const { active, status } = state.current;
    if (active && status !== 'ending') return null;

    if (status === 'ending') {
      transition.cancel();
    }

    return transition.open(element);
  }

  function close(element: HTMLElement | null): Promise<void> | null {
    const { active, status } = state.current;
    if (abort.signal.aborted || !active || status === 'ending') return null;

    return transition.close(element);
  }

  // --- Document listeners (scoped to active state) ---

  function setupDocumentListeners(): void {
    cleanupDocumentListeners();

    if (typeof document === 'undefined') return;

    docAbort = new AbortController();
    const { signal } = docAbort;

    listen(document, 'keydown', handleKeydown, { signal });
    options.onDocumentActive?.(signal);
  }

  function cleanupDocumentListeners(): void {
    docAbort?.abort();
    docAbort = null;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;

    if (event.defaultPrevented) return;

    if (!state.current.active) return;

    const shouldClose = options.closeOnEscape?.() ?? true;
    if (!shouldClose) return;

    options.onEscapeDismiss(event);
  }

  // --- Lifecycle ---

  const unsubscribe = state.subscribe(() => {
    if (state.current.active && state.current.status !== 'ending') {
      setupDocumentListeners();
    } else {
      cleanupDocumentListeners();
    }
  });

  abort.signal.addEventListener('abort', () => {
    unsubscribe();
    transition.destroy();
    cleanupDocumentListeners();
  });

  function destroy(): void {
    if (abort.signal.aborted) return;

    abort.abort();
  }

  return {
    input: state,
    open,
    close,
    signal: abort.signal,
    destroy,
  };
}
