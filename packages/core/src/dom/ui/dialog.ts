import { createState, type State } from '@videojs/store';
import { containsComposed, getDeepActiveElement, getTabbableElements, listen, walkAncestors } from '@videojs/utils/dom';

import type { DialogInput } from '../../core/ui/dialog/core';
import { createDismissLayer } from './dismiss-layer';
import { lockInteractions } from './interaction-lock';
import type { TransitionApi } from './transition';

/** @internal */
export interface DialogOptions {
  /** Transition API for animated open/close. */
  transition: TransitionApi;
  /** Called when the dialog open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Called after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void;
  /** Whether pressing Escape closes the dialog. Defaults to `true`. */
  closeOnEscape?: () => boolean;
}

/** @internal */
export interface DialogTriggerProps {
  onClick: (event: UIEvent) => void;
}

/** @internal */
export interface DialogApi {
  /** Reactive transition state that platforms subscribe to for rendering. */
  input: State<DialogInput>;
  /** Whether the active dialog currently prevents interaction with the entire document. */
  modality: State<DialogModality>;
  /** Props for a trigger that opens the dialog. */
  triggerProps: DialogTriggerProps;
  /** Open the dialog and save the currently focused element for restoration. */
  open(): void;
  /** Close the dialog and restore focus after the close animation completes. */
  close(): void;
  /** Register the trigger for focus restoration. */
  setTriggerElement(el: HTMLElement | null): void;
  /** Register the popup for focus management and transitions. */
  setPopupElement(el: HTMLElement | null): void;
  /** Limit modal interaction to this root. Pass `null` for document-wide modality. */
  setInteractionRoot(el: HTMLElement | null): void;
  /** Tear down all listeners and subscriptions. */
  destroy(): void;
}

/** @internal */
export interface DialogModality {
  documentModal: boolean;
}

/**
 * Manages modal dialog transitions, dismissal, initial focus, focus trapping, and focus restoration.
 *
 * @internal
 */
export function createDialog(options: DialogOptions): DialogApi {
  let popupElement: HTMLElement | null = null;
  let triggerElement: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;
  let requestedInteractionRoot: HTMLElement | null = null;
  let activeInteractionRoot: HTMLElement | null = null;
  let releaseInteractionLock: (() => void) | null = null;
  let focusFrame = 0;
  const isolatedElements = new Map<HTMLElement, boolean>();
  const modality = createState<DialogModality>({ documentModal: true });

  const layer = createDismissLayer({
    transition: options.transition,
    closeOnEscape: options.closeOnEscape,
    onEscapeDismiss(event) {
      if (!shouldHandleScopedEvent(event)) return;

      event.preventDefault();
      event.stopPropagation();
      applyClose();
    },
    onDocumentActive(signal) {
      listen(document, 'keydown', handleDocumentKeydown, { capture: true, signal });
      listen(document, 'focusin', handleDocumentFocusin, { signal });
    },
  });

  const state = layer.input;

  function applyOpen(): void {
    previousFocus = getDeepActiveElement() as HTMLElement | null;

    const opening = layer.open(() => popupElement);
    if (!opening) return;

    resolveInteractionRoot();
    isolateBackground();
    options.onOpenChange(true);
    scheduleInitialFocus();

    opening.then(() => {
      if (layer.signal.aborted || !state.current.active || state.current.status !== 'idle') return;

      options.onOpenChangeComplete?.(true);
    });
  }

  function applyClose(): void {
    const closing = layer.close(popupElement);
    if (!closing) return;

    cancelAnimationFrame(focusFrame);
    focusFrame = 0;
    options.onOpenChange(false);

    closing.then(() => {
      if (layer.signal.aborted || state.current.active) return;

      const active = getDeepActiveElement();
      const focusLeftScope =
        activeInteractionRoot && active instanceof Element && !containsComposed(activeInteractionRoot, active);

      restoreBackground();
      const restoreTarget = triggerElement?.isConnected ? triggerElement : previousFocus;

      if (!focusLeftScope && restoreTarget?.isConnected) restoreTarget.focus();

      previousFocus = null;

      options.onOpenChangeComplete?.(false);
    });
  }

  function scheduleInitialFocus(): void {
    cancelAnimationFrame(focusFrame);
    focusFrame = requestAnimationFrame(() => {
      focusFrame = 0;

      if (layer.signal.aborted || !state.current.active || !popupElement) return;

      const autofocus = popupElement.querySelector<HTMLElement>('[autofocus]');
      const target = autofocus ?? getTabbableElements(popupElement)[0] ?? popupElement;

      target.focus();
    });
  }

  function handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || !state.current.active || !popupElement || !modality.current.documentModal) return;

    const tabbable = getTabbableElements(popupElement);

    if (tabbable.length === 0) {
      event.preventDefault();
      popupElement.focus();
      return;
    }

    const active = getDeepActiveElement();
    const first = tabbable[0]!;
    const last = tabbable[tabbable.length - 1]!;

    if (event.shiftKey && (active === first || !active || !containsComposed(popupElement, active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !active || !containsComposed(popupElement, active))) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleDocumentFocusin(event: FocusEvent): void {
    if (!state.current.active || !popupElement) return;

    if (event.target instanceof Element && containsComposed(popupElement, event.target)) return;

    if (
      activeInteractionRoot &&
      event.target instanceof Element &&
      !containsComposed(activeInteractionRoot, event.target)
    ) {
      return;
    }

    const target = getTabbableElements(popupElement)[0] ?? popupElement;

    target.focus();
  }

  function setTriggerElement(el: HTMLElement | null): void {
    triggerElement = el;
  }

  function setPopupElement(el: HTMLElement | null): void {
    if (popupElement !== el) restoreBackground();

    popupElement = el;
    resolveInteractionRoot();

    if (el && state.current.active) isolateBackground();

    const active = getDeepActiveElement();

    if (el && state.current.active && (!active || !containsComposed(el, active))) {
      scheduleInitialFocus();
    }
  }

  function setInteractionRoot(el: HTMLElement | null): void {
    if (requestedInteractionRoot === el) return;

    restoreBackground();
    requestedInteractionRoot = el;
    resolveInteractionRoot();

    if (popupElement && state.current.active) isolateBackground();
  }

  layer.signal.addEventListener('abort', () => {
    cancelAnimationFrame(focusFrame);
    focusFrame = 0;
    restoreBackground();
    popupElement = null;
    triggerElement = null;
    previousFocus = null;
    requestedInteractionRoot = null;
    activeInteractionRoot = null;
  });

  return {
    input: state,
    modality,
    triggerProps: {
      onClick() {
        applyOpen();
      },
    },
    open: applyOpen,
    close: applyClose,
    setTriggerElement,
    setPopupElement,
    setInteractionRoot,
    destroy: layer.destroy,
  };

  function isolateBackground(): void {
    if (!popupElement?.isConnected || isolatedElements.size > 0 || releaseInteractionLock) return;

    resolveInteractionRoot();

    walkAncestors(
      popupElement,
      (current) => {
        if (current === activeInteractionRoot || current === popupElement?.ownerDocument.body) return true;

        if (current.assignedSlot) {
          for (const sibling of current.assignedSlot.assignedElements({ flatten: true })) {
            if (sibling !== current && sibling instanceof HTMLElement) makeInert(sibling);
          }

          return undefined;
        }

        const parent = current.parentElement;

        if (parent) {
          for (const sibling of parent.children) {
            if (sibling !== current && sibling instanceof HTMLElement) makeInert(sibling);
          }

          return undefined;
        }

        const root = current.getRootNode();
        if (!(root instanceof ShadowRoot)) return undefined;

        for (const sibling of root.children) {
          if (sibling !== current && sibling instanceof HTMLElement) makeInert(sibling);
        }

        return undefined;
      },
      { composed: true }
    );

    if (activeInteractionRoot) releaseInteractionLock = lockInteractions(activeInteractionRoot);
  }

  function makeInert(element: HTMLElement): void {
    isolatedElements.set(element, element.hasAttribute('inert'));
    element.setAttribute('inert', '');
  }

  function restoreBackground(): void {
    for (const [element, wasInert] of isolatedElements) {
      if (!wasInert) element.removeAttribute('inert');
    }

    isolatedElements.clear();
    releaseInteractionLock?.();
    releaseInteractionLock = null;
  }

  function resolveInteractionRoot(): void {
    activeInteractionRoot =
      requestedInteractionRoot && popupElement && containsComposed(requestedInteractionRoot, popupElement)
        ? requestedInteractionRoot
        : null;

    modality.patch({ documentModal: !activeInteractionRoot });
  }

  function shouldHandleScopedEvent(event: Event): boolean {
    if (!activeInteractionRoot) return true;

    const target = event.target instanceof Element ? event.target : getDeepActiveElement();

    return target instanceof Element && containsComposed(activeInteractionRoot, target);
  }
}
