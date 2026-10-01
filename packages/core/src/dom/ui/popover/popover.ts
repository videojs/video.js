import type { State } from '@videojs/store';
import { getDeepActiveElement, listen, tryHidePopover, tryShowPopover } from '@videojs/utils/dom';

import type { PopoverInput } from '../../../core/ui/popover/core';
import { createDismissLayer } from '../dismiss-layer';
import type { UIFocusEvent, UIPointerEvent } from '../event';
import type { TransitionApi } from '../transition';
import type { PopupGroup, PopupGroupCloseReason } from './group';

export type PopoverOpenChangeReason =
  | 'click'
  | 'hover'
  | 'focus'
  | 'escape'
  | 'outside-click'
  | 'blur'
  | 'imperative-action'
  | 'group-open';

export interface PopoverChangeDetails {
  reason: PopoverOpenChangeReason;
  event?: Event;
}

/** @internal */
export interface PopoverOptions {
  transition: TransitionApi;
  onOpenChange: (open: boolean, details: PopoverChangeDetails) => void;
  /** Fires after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void;
  closeOnEscape: () => boolean;
  closeOnOutsideClick: () => boolean;
  openOnHover?: () => boolean;
  delay?: () => number;
  closeDelay?: () => number;
  group?: () => PopupGroup | undefined;
  /** Request open changes without applying them until `syncOpen` is called. */
  deferOpenChanges?: boolean;
}

/** @internal */
export interface PopoverTriggerProps {
  onClick: (event: UIEvent) => void;
  onPointerEnter: (event: UIPointerEvent) => void;
  onPointerLeave: (event: UIPointerEvent) => void;
  onFocusIn: (event: UIFocusEvent) => void;
  onFocusOut: (event: UIFocusEvent) => void;
}

/** @internal */
export interface PopoverPopupProps {
  onPointerEnter: (event: UIPointerEvent) => void;
  onPointerLeave: (event: UIPointerEvent) => void;
  onGotPointerCapture: (event: UIPointerEvent) => void;
  onLostPointerCapture: (event: UIPointerEvent) => void;
  onFocusOut: (event: UIFocusEvent) => void;
}

/** @internal */
export interface PopoverApi {
  input: State<PopoverInput>;
  triggerProps: PopoverTriggerProps;
  popupProps: PopoverPopupProps;
  readonly triggerElement: HTMLElement | null;
  setTriggerElement: (el: HTMLElement | null) => void;
  setPopupElement: (el: HTMLElement | null) => void;
  open: (reason?: PopoverOpenChangeReason) => void;
  close: (reason?: PopoverOpenChangeReason) => void;
  /** Apply a resolved open state when `deferOpenChanges` is enabled. */
  syncOpen: (open: boolean) => void;
  destroy: () => void;
}

/** @internal */
export function createPopover(options: PopoverOptions): PopoverApi {
  const { onOpenChange, closeOnOutsideClick } = options;

  let triggerEl: HTMLElement | null = null;
  let popupEl: HTMLElement | null = null;

  let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
  const capturedPointers = new Set<number>();

  let ignoreNextBlurClose = false;
  let blurGuardTimeout: ReturnType<typeof setTimeout> | null = null;

  const layer = createDismissLayer({
    transition: options.transition,
    closeOnEscape: options.closeOnEscape,
    onEscapeDismiss(event) {
      event.preventDefault();
      applyClose('escape', event);
    },
    onDocumentActive(signal) {
      listen(document, 'pointerdown', handleDocumentPointerdown, { capture: true, signal });
    },
  });

  const state = layer.input;
  const groupMember = {
    close(reason: PopupGroupCloseReason) {
      applyClose(reason);
    },
    get triggerElement() {
      return triggerEl;
    },
  };

  // --- Hover management ---

  function clearHoverTimeout(): void {
    if (hoverTimeout !== null) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  }

  function canHover(): boolean {
    return globalThis.matchMedia?.('(hover: hover)')?.matches ?? false;
  }

  function canOpenOnFocus(): boolean {
    if (!canHover()) return false;

    return globalThis.matchMedia?.('(pointer: fine)')?.matches ?? false;
  }

  function canToggleOnClick(): boolean {
    if (!options.openOnHover?.()) return true;

    return canHover();
  }

  function clearBlurGuard(): void {
    ignoreNextBlurClose = false;

    if (blurGuardTimeout !== null) {
      clearTimeout(blurGuardTimeout);
      blurGuardTimeout = null;
    }
  }

  function armBlurGuard(): void {
    // Trusted pointer gestures can transiently retarget focus to the shadow host
    // or body before the click handler runs. Let inside menu actions decide.
    ignoreNextBlurClose = true;

    if (blurGuardTimeout !== null) clearTimeout(blurGuardTimeout);

    blurGuardTimeout = setTimeout(clearBlurGuard, 500);
  }

  function consumeBlurGuard(): boolean {
    if (!ignoreNextBlurClose) return false;

    clearBlurGuard();
    return true;
  }

  function isTriggerDisabled(): boolean {
    if (!triggerEl) return false;

    if (triggerEl.hasAttribute('disabled')) return true;

    return triggerEl.getAttribute('aria-disabled') === 'true';
  }

  // --- Open/close ---

  /**
   * The transition handler manages animation lifecycle via `createState`:
   *
   * **Open:** `transition.open()` patches `{ active: true, status: 'starting' }`. After a double-RAF it patches `{
   * status: 'idle' }`, then waits for the resulting element animations before the promise resolves. Frameworks render
   * `data-starting-style` / `data-ending-style` via `getPopupAttrs(state)` — no imperative DOM mutation needed.
   *
   * **Close:** `transition.close(el)` patches `{ status: 'ending' }` (keeping `active: true` so the element stays
   * mounted). After a double-RAF it waits for `getAnimations()` to settle, then patches `{ active: false, status:
   * 'idle' }`.
   *
   * `onOpenChange` fires immediately (before animations). `onOpenChangeComplete` fires after animations finish.
   */
  function commitOpen(): void {
    // React content can mount after this commit begins, so resolve the popup
    // element only when the transition is ready to collect animations.
    const opening = layer.open(() => popupEl);
    if (!opening) return;

    // Let platform adapters commit `data-starting-style` before exposing an
    // already-mounted popup. Showing synchronously starts the transition from
    // its visible styles before reactive HTML updates can apply the start state.
    queueMicrotask(() => {
      if (layer.signal.aborted || !state.current.active || state.current.status === 'ending') return;

      tryShowPopover(popupEl);
    });

    options.group?.()?.open(groupMember);

    opening.then(() => {
      if (layer.signal.aborted || !state.current.active || state.current.status !== 'idle') return;

      options.onOpenChangeComplete?.(true);
    });
  }

  function commitClose(): void {
    const closing = layer.close(popupEl);
    if (!closing) return;

    options.group?.()?.close(groupMember);

    closing.then(() => {
      // A close can be cancelled by reopening while the exit animation is
      // running. Only complete the close if the layer actually became inactive.
      if (layer.signal.aborted || state.current.active) return;

      tryHidePopover(popupEl);
      options.onOpenChangeComplete?.(false);
    });
  }

  function applyOpen(reason: PopoverOpenChangeReason, event?: Event): void {
    if (layer.signal.aborted) return;

    const { active, status } = state.current;
    if (active && status !== 'ending') return;

    const details: PopoverChangeDetails = event ? { reason, event } : { reason };

    onOpenChange(true, details);

    if (!options.deferOpenChanges) commitOpen();
  }

  function applyClose(reason: PopoverOpenChangeReason, event?: Event): void {
    if (layer.signal.aborted) return;

    const { active, status } = state.current;
    if (!active || status === 'ending') return;

    const details: PopoverChangeDetails = event ? { reason, event } : { reason };

    onOpenChange(false, details);

    if (!options.deferOpenChanges) commitClose();
  }

  // --- Imperative API ---

  function open(reason: PopoverOpenChangeReason = 'click'): void {
    applyOpen(reason);
  }

  function close(reason: PopoverOpenChangeReason = 'click'): void {
    clearHoverTimeout();
    applyClose(reason);
  }

  function syncOpen(open: boolean): void {
    if (!options.deferOpenChanges) return;

    if (open) commitOpen();
    else commitClose();
  }

  // --- Outside-click handler ---

  function handleDocumentPointerdown(event: PointerEvent): void {
    if (!closeOnOutsideClick() || !state.current.active) return;

    // Use composedPath so the check works when the popup lives inside a
    // Shadow DOM tree. event.target is retargeted to the shadow host when
    // the listener is on document, so contains() would always fail.
    const path = event.composedPath();

    if ((triggerEl && path.includes(triggerEl)) || (popupEl && path.includes(popupEl))) {
      armBlurGuard();
      return;
    }

    clearBlurGuard();

    applyClose('outside-click', event);
  }

  // Cleanup hover timeout on destroy.
  layer.signal.addEventListener('abort', () => {
    options.group?.()?.close(groupMember);
    clearHoverTimeout();
    clearBlurGuard();
    capturedPointers.clear();
    triggerEl = null;
    popupEl = null;
  });

  // --- Trigger props ---

  const triggerProps: PopoverTriggerProps = {
    onClick(event) {
      if (!canToggleOnClick()) return;

      if (isTriggerDisabled()) return;

      // During a close animation (open=true, status=ending), treat
      // the click as a re-open rather than a second close attempt.
      if (state.current.active && state.current.status !== 'ending') {
        applyClose('click', event);
      } else {
        applyOpen('click', event);
      }
    },

    onPointerEnter(_event) {
      if (!options.openOnHover?.()) return;

      if (!canHover()) return;

      clearHoverTimeout();

      if (state.current.active) return;

      const delay = options.delay?.() ?? 300;

      hoverTimeout = setTimeout(() => applyOpen('hover'), delay);
    },

    onPointerLeave(_event) {
      if (!options.openOnHover?.()) return;

      if (!canHover()) return;

      clearHoverTimeout();

      if (!state.current.active) return;

      const closeDelay = options.closeDelay?.() ?? 0;

      hoverTimeout = setTimeout(() => applyClose('hover'), closeDelay);
    },

    onFocusIn(_event) {
      if (options.openOnHover?.()) {
        if (!canOpenOnFocus()) return;

        applyOpen('focus');
      }
    },

    onFocusOut(event) {
      const relatedTarget = event.relatedTarget as Node | null;
      // Don't close if focus moved within trigger or popup
      if (relatedTarget && (triggerEl?.contains(relatedTarget) || popupEl?.contains(relatedTarget))) return;

      if (options.openOnHover?.()) {
        applyClose('blur');
      }
    },
  };

  // --- Popup props ---

  const popupProps: PopoverPopupProps = {
    onPointerEnter(_event) {
      if (!options.openOnHover?.()) return;

      // Cancel any pending close when pointer enters popup
      clearHoverTimeout();
    },

    onPointerLeave(_event) {
      if (!options.openOnHover?.()) return;

      // A descendant has pointer capture (e.g. slider drag). The leave is
      // synthetic — the pointer hasn't actually left — so don't close.
      if (capturedPointers.size > 0) return;

      clearHoverTimeout();

      if (!state.current.active) return;

      const closeDelay = options.closeDelay?.() ?? 0;

      hoverTimeout = setTimeout(() => applyClose('hover'), closeDelay);
    },

    onGotPointerCapture(event) {
      capturedPointers.add(event.pointerId);
    },

    onLostPointerCapture(event) {
      capturedPointers.delete(event.pointerId);
    },

    onFocusOut(event) {
      const relatedTarget = event.relatedTarget as Node | null;
      if (relatedTarget && (triggerEl?.contains(relatedTarget) || popupEl?.contains(relatedTarget))) return;

      if (consumeBlurGuard()) return;

      if (relatedTarget !== null) {
        applyClose('blur');
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!state.current.active || state.current.status === 'ending' || state.current.status === 'starting') {
            return;
          }

          const active = getDeepActiveElement(popupEl?.ownerDocument);
          if (active && (triggerEl?.contains(active) || popupEl?.contains(active))) return;

          applyClose('blur');
        });
      });
    },
  };

  // --- Element setters ---

  function setTriggerElement(el: HTMLElement | null): void {
    triggerEl = el;
  }

  function setPopupElement(el: HTMLElement | null): void {
    // Hide the old element before clearing the reference so it
    // doesn't remain visually shown via the Popover API.
    if (!el && popupEl && state.current.active) {
      tryHidePopover(popupEl);
    }

    popupEl = el;

    if (el) {
      // If the popover is already open (e.g., React mount after state
      // change), show the popover now. In `applyOpen` the element may not
      // have been in the DOM yet, so the earlier `tryShowPopover` was a no-op.
      if (state.current.active) {
        tryShowPopover(el);
      }
    }
  }

  return {
    input: state,
    triggerProps,
    popupProps,
    get triggerElement() {
      return triggerEl;
    },
    setTriggerElement,
    setPopupElement,
    open,
    close,
    syncOpen,
    destroy: layer.destroy,
  };
}
