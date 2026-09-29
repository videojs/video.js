import {
  type AttributeSnapshot,
  containsComposed,
  getDeepActiveElement,
  getBlockExtent,
  getElementChildren,
  getElementPadding,
  getInlineExtent,
  measureElement,
  measureElementChildren,
  observeElements,
  readCSSLength,
  restoreAttributes,
  snapshotAttributes,
  walkAncestors,
} from '@videojs/utils/dom';

import { MenuContentDataAttrs } from '../../../core/ui/menu/data';
import { MenuCSSVars } from '../../../core/ui/menu/vars';
import type { MenuApi } from './menu';

export interface MenuContentRegistration {
  menu: MenuApi;
  parent: MenuApi | null;
  element: HTMLElement;
}

export interface MenuPopupApi {
  readonly element: HTMLElement | null;
  setElement: (element: HTMLElement | null) => void;
  registerContent: (registration: MenuContentRegistration) => () => void;
  sync: () => void;
  destroy: () => void;
}

interface RegisteredContent extends MenuContentRegistration {
  accessibility: AttributeSnapshot;
  stopObserving: () => void;
  unsubscribe: () => void;
}

/** Coordinates sibling Contents and sizes their shared Popup. */
export function createMenuPopup(): MenuPopupApi {
  const contents = new Set<RegisteredContent>();
  const exitFrames = new Map<RegisteredContent, number>();
  let element: HTMLElement | null = null;
  let frame = 0;

  function scheduleSync(): void {
    cancelAnimationFrame(frame);
    sync();
    frame = requestAnimationFrame(sync);
  }

  function getChildren(parent: MenuApi): RegisteredContent[] {
    return [...contents].filter((content) => content.parent === parent);
  }

  function getActiveChild(parent: MenuApi): RegisteredContent | null {
    return (
      getChildren(parent).find(({ menu }) => {
        const input = menu.input.current;

        return input.active && input.status !== 'ending';
      }) ?? null
    );
  }

  function getClosingChild(parent: MenuApi): RegisteredContent | null {
    return (
      getChildren(parent).find(({ menu }) => {
        const input = menu.input.current;

        return input.active && input.status === 'ending';
      }) ?? null
    );
  }

  function cancelChildExit(content: RegisteredContent): void {
    cancelAnimationFrame(exitFrames.get(content) ?? 0);
    exitFrames.delete(content);
  }

  function scheduleChildExit(content: RegisteredContent): void {
    if (exitFrames.has(content)) return;

    // Keep the closing page current for one paint so the parent transitions
    // from its child-open styles instead of jumping to its resting styles.
    const exitFrame = requestAnimationFrame(() => {
      exitFrames.set(
        content,
        requestAnimationFrame(() => {
          exitFrames.delete(content);

          if (!contents.has(content) || getActiveChild(content.menu)) return;

          content.element.removeAttribute(MenuContentDataAttrs.childOpen);
          sync();
        })
      );
    });

    exitFrames.set(content, exitFrame);
  }

  function getCurrentContent(): RegisteredContent | null {
    let current = [...contents].find((content) => content.parent === null) ?? null;

    while (current) {
      const child = getActiveChild(current.menu) ?? (exitFrames.has(current) ? getClosingChild(current.menu) : null);
      if (!child) return current;

      current = child;
    }

    return null;
  }

  function setInactive(content: RegisteredContent, inactive: boolean): void {
    if (inactive) {
      content.element.setAttribute('aria-hidden', 'true');
      content.element.setAttribute('inert', '');
    } else {
      restoreAttributes(content.element, content.accessibility);
    }
  }

  function restoreFocusBeforeHiding(content: RegisteredContent): void {
    const hasFocus = (): boolean => {
      const active = getDeepActiveElement(content.element.ownerDocument);

      return active instanceof Element && containsComposed(content.element, active);
    };
    if (!hasFocus()) return;

    // Let the menu decide whether this close reason should restore focus.
    content.menu.restoreFocus();

    const parentInput = content.parent?.input.current;

    if (hasFocus() && parentInput?.active && parentInput.status !== 'ending') {
      content.menu.triggerElement?.focus();
    }

    // Close reasons that do not restore focus still must not leave it in a hidden page.
    const active = getDeepActiveElement(content.element.ownerDocument);

    if (hasFocus() && active instanceof HTMLElement) active.blur();
  }

  function getAvailableWidth(popup: HTMLElement): number | null {
    return (
      walkAncestors(popup, (ancestor) => {
        const width = readCSSLength(ancestor, MenuCSSVars.availableWidth);

        return width !== null && width > 0 ? width : undefined;
      }) ?? null
    );
  }

  function getVerticalScrollbarWidth(content: HTMLElement): number {
    if (content.scrollHeight <= content.clientHeight) return 0;

    const style = getComputedStyle(content);
    const inlineBorder =
      (Number.parseFloat(style.borderInlineStartWidth) || 0) + (Number.parseFloat(style.borderInlineEndWidth) || 0);

    return Math.max(0, content.offsetWidth - content.clientWidth - inlineBorder);
  }

  function measureContent(content: HTMLElement, availableWidth: number | null) {
    const children = getElementChildren(
      content,
      (child): child is HTMLElement => child instanceof HTMLElement && !child.hidden
    );

    if (children.length === 0) {
      return measureElement(content, {
        overflow: 'both',
        styles: { width: 'max-content', height: 'auto', minWidth: '0px', maxWidth: 'none' },
      });
    }

    return measureElementChildren(content, {
      children,
      includePadding: true,
      maxWidth: availableWidth,
      measure: (child, width) =>
        measureElement(child, {
          overflow: 'both',
          styles: {
            insetInlineStart: '0px',
            insetInlineEnd: 'auto',
            width: width === undefined ? 'max-content' : `${width}px`,
            height: 'auto',
            minWidth: '0px',
            maxWidth: 'none',
          },
        }),
    });
  }

  function sync(): void {
    if (!element) return;

    const inactiveContents = new Map<RegisteredContent, boolean>();

    // Reactivate parent pages first so a closing submenu can return focus to its trigger.
    for (const content of contents) {
      const activeChild = getActiveChild(content.menu);

      if (activeChild) {
        cancelChildExit(content);
        content.menu.highlight(null);
        content.element.setAttribute(MenuContentDataAttrs.childOpen, '');
      } else if (getClosingChild(content.menu) && content.element.hasAttribute(MenuContentDataAttrs.childOpen)) {
        scheduleChildExit(content);
      } else {
        cancelChildExit(content);
        content.element.removeAttribute(MenuContentDataAttrs.childOpen);
      }

      const input = content.menu.input.current;
      const isExitingPage = content.parent !== null && input.active && input.status === 'ending';

      inactiveContents.set(content, activeChild !== null || isExitingPage);
      setInactive(content, false);
    }

    // Move focus out before hiding an exiting page from assistive technology.
    for (const [content, inactive] of inactiveContents) {
      const input = content.menu.input.current;
      const isExitingPage = content.parent !== null && input.active && input.status === 'ending';

      if (isExitingPage) restoreFocusBeforeHiding(content);

      setInactive(content, inactive);
    }

    const current = getCurrentContent();
    if (!current) return;

    // Root Content sits inside Popup padding. Positioned nested Contents own their padding.
    const popupPadding = current.parent === null ? getElementPadding(element) : null;
    const inlinePadding = popupPadding ? getInlineExtent(popupPadding) : 0;
    const blockPadding = popupPadding ? getBlockExtent(popupPadding) : 0;
    const availableWidth = getAvailableWidth(element);
    const contentAvailableWidth = availableWidth === null ? null : Math.max(0, availableWidth - inlinePadding);
    const size = measureContent(current.element, contentAvailableWidth);

    const width = Math.ceil(size.width + inlinePadding);
    const height = Math.ceil(size.height + blockPadding);

    element.style.setProperty(MenuCSSVars.width, `${width}px`);
    element.style.setProperty(MenuCSSVars.height, `${height}px`);

    const scrollbarWidth = getVerticalScrollbarWidth(current.element);

    if (scrollbarWidth > 0) element.style.setProperty(MenuCSSVars.width, `${width + scrollbarWidth}px`);
  }

  function setElement(next: HTMLElement | null): void {
    element = next;
    scheduleSync();
  }

  function registerContent(registration: MenuContentRegistration): () => void {
    const registered: RegisteredContent = {
      ...registration,
      accessibility: snapshotAttributes(registration.element, ['aria-hidden', 'inert']),
      stopObserving: () => {},
      unsubscribe: () => {},
    };

    registered.unsubscribe = registration.menu.input.subscribe(scheduleSync);
    registered.stopObserving = observeElements({
      root: registration.element,
      getElements: () => [registration.element],
      mutations: { childList: true, subtree: true, characterData: true },
      onChange: scheduleSync,
    });
    contents.add(registered);
    registration.menu.setContentElement(registration.element);
    scheduleSync();

    return () => {
      cancelChildExit(registered);
      contents.delete(registered);
      registered.unsubscribe();
      registered.stopObserving();
      restoreAttributes(registration.element, registered.accessibility);
      registration.element.removeAttribute(MenuContentDataAttrs.childOpen);

      if (registration.menu.contentElement === registration.element) registration.menu.setContentElement(null);

      scheduleSync();
    };
  }

  function destroy(): void {
    cancelAnimationFrame(frame);

    for (const exitFrame of exitFrames.values()) cancelAnimationFrame(exitFrame);

    exitFrames.clear();

    for (const content of contents) {
      content.unsubscribe();
      content.stopObserving();
      restoreAttributes(content.element, content.accessibility);
      content.element.removeAttribute(MenuContentDataAttrs.childOpen);

      if (content.menu.contentElement === content.element) content.menu.setContentElement(null);
    }

    contents.clear();
    element = null;
  }

  return {
    get element(): HTMLElement | null {
      return element;
    },
    setElement,
    registerContent,
    sync,
    destroy,
  };
}
