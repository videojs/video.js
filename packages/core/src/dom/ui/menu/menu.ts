import type { State } from '@videojs/store';
import { containsComposed, getDeepActiveElement } from '@videojs/utils/dom';

import type { MenuInput, MenuState } from '../../../core/ui/menu/core';
import { MenuItemDataAttrs } from '../../../core/ui/menu/item';
import { MenuCSSVars } from '../../../core/ui/menu/vars';
import { PopoverCSSVars } from '../../../core/ui/popover/vars';
import { forceLayout } from '../../utils/layout';
import type { UIFocusEvent, UIKeyboardEvent } from '../event';
import type { PopupGroup } from '../popover/group';
import { createPopover, type PopoverChangeDetails, type PopoverOpenChangeReason } from '../popover/popover';
import type { PositioningCSSVars, PositioningOptions } from '../popover/positioning';
import type { TransitionApi } from '../transition';

export type MenuOpenChangeReason = PopoverOpenChangeReason;

export type MenuChangeDetails = PopoverChangeDetails;

/** @internal */
export interface MenuOptions {
  transition: TransitionApi;
  onOpenChange: (open: boolean, details: MenuChangeDetails) => void;
  /** Fires after open/close animations complete. */
  onOpenChangeComplete?: (open: boolean) => void;
  closeOnEscape: () => boolean;
  closeOnOutsideClick: () => boolean;
  /** Called when the highlighted item changes. */
  onHighlightChange?: (element: HTMLElement | null) => void;
  group?: () => PopupGroup | undefined;
}

export interface MenuTriggerProps {
  /** Called when the trigger is clicked. Uses the DOM `UIEvent` type to match the Popover API. */
  onClick: (event: UIEvent) => void;
  onKeyDown: (event: UIKeyboardEvent) => void;
}

export interface MenuContentProps {
  onKeyDown: (event: UIKeyboardEvent) => void;
  onFocusOut: (event: UIFocusEvent) => void;
}

export interface MenuHighlightOptions {
  focus?: boolean;
  preventScroll?: boolean;
  pointer?: boolean;
}

/** @internal */
export function isMenuNavigationKey(event: UIKeyboardEvent): boolean {
  const { key } = event;

  return (
    key === 'ArrowDown' ||
    key === 'ArrowUp' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'Home' ||
    key === 'End' ||
    key === 'Enter' ||
    key === ' ' ||
    key === 'Escape' ||
    (key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey)
  );
}

/** @internal */
export function getRootPositionOptions(side: MenuState['side'], align: MenuState['align']): PositioningOptions | null {
  if (!side || !align) return null;

  return { side, align };
}

/**
 * Uses Popover offset inputs while publishing Menu-owned available-size outputs.
 *
 * @internal
 */
export const MenuPositioningCSSVars = {
  ...PopoverCSSVars,
  availableWidth: MenuCSSVars.availableWidth,
  availableHeight: MenuCSSVars.availableHeight,
} as const satisfies PositioningCSSVars;

const parents = new WeakMap<MenuApi, MenuApi>();

export interface MenuApi {
  /** Reactive transition state for platforms to subscribe to. */
  input: State<MenuInput>;
  /** Attach to the trigger element. */
  triggerProps: MenuTriggerProps;
  /** Attach to the content element. */
  contentProps: MenuContentProps;
  /** The currently registered trigger element, if any. */
  readonly triggerElement: HTMLElement | null;
  /** The currently registered content element, if any. */
  readonly contentElement: HTMLElement | null;
  /** The root popup element that owns popover behavior, if any. */
  readonly popupElement: HTMLElement | null;
  setTriggerElement: (element: HTMLElement | null) => void;
  setContentElement: (element: HTMLElement | null) => void;
  setPopupElement: (element: HTMLElement | null) => void;
  /** Register a navigable item. Returns a cleanup function. */
  registerItem: (element: HTMLElement) => () => void;
  /** Register a directly nested menu so parent and child interaction state stays synchronized. */
  registerSubmenu: (menu: MenuApi) => () => void;
  /** Programmatically highlight an item (or clear highlight with `null`). */
  highlight: (element: HTMLElement | null, options?: MenuHighlightOptions) => void;
  /** Programmatically highlight the first registered item. */
  highlightFirstItem: (options?: MenuHighlightOptions) => void;
  /** Highlight the selected registered item, or the first navigable item. */
  highlightInitialItem: (options?: MenuHighlightOptions) => void;
  /** Return focus to the trigger when the close reason requires it. */
  restoreFocus: (options?: FocusOptions) => void;
  open: (reason?: MenuOpenChangeReason) => void;
  close: (reason?: MenuOpenChangeReason) => void;
  /** Commit the open state resolved by the platform adapter. */
  syncOpen: (open: boolean) => void;
  destroy: () => void;
}

/** @internal */
export function completeMenuItemSelection(menu: MenuApi): void {
  menu.close();
}

/** @internal */
export function createMenu(options: MenuOptions): MenuApi {
  // Items are stored in DOM order. Framework/component lifecycle ordering is
  // not always the same as visual order, especially across nested components.
  const items: HTMLElement[] = [];
  let highlightedItem: HTMLElement | null = null;
  let triggerElement: HTMLElement | null = null;
  let contentElement: HTMLElement | null = null;
  let popupElement: HTMLElement | null = null;
  const submenus = new Set<MenuApi>();
  const submenuUnsubscribes = new Map<MenuApi, () => void>();

  let typeaheadBuffer = '';
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingFocusOut: UIFocusEvent | null = null;

  let openRafId = 0;
  let lastCloseReason: MenuOpenChangeReason | null = null;
  let api: MenuApi;

  function isItemHidden(item: HTMLElement): boolean {
    const availability = item.getAttribute('data-availability');

    return Boolean(
      item.hidden ||
      item.hasAttribute('data-hidden') ||
      item.getAttribute('aria-hidden') === 'true' ||
      availability === 'unavailable' ||
      availability === 'unsupported'
    );
  }

  function getNavigableItems(): HTMLElement[] {
    return items.filter((item) => !isItemHidden(item));
  }

  function getAdjacentNavigableItem(direction: 1 | -1): HTMLElement | null {
    if (items.length === 0) return null;

    const currentIndex = highlightedItem ? items.indexOf(highlightedItem) : direction === 1 ? -1 : 0;

    for (let offset = 1; offset <= items.length; offset++) {
      const index = (currentIndex + direction * offset + items.length) % items.length;
      const candidate = items[index];
      if (candidate && !isItemHidden(candidate)) return candidate;
    }

    return null;
  }
  // --- Highlight ---

  function highlight(element: HTMLElement | null, highlightOptions?: MenuHighlightOptions): void {
    if (!element && openRafId) {
      cancelAnimationFrame(openRafId);
      openRafId = 0;
    }

    if (element && isItemHidden(element)) {
      if (element === highlightedItem) highlight(getAdjacentNavigableItem(1), highlightOptions);

      return;
    }

    if (highlightedItem === element) {
      element?.setAttribute(MenuItemDataAttrs.highlighted, highlightOptions?.pointer === true ? 'pointer' : '');
      return;
    }

    const previousItem = highlightedItem;

    if (previousItem) {
      previousItem.tabIndex = -1;
    }

    highlightedItem = element;

    if (element) {
      element.tabIndex = 0;
      element.setAttribute(MenuItemDataAttrs.highlighted, highlightOptions?.pointer === true ? 'pointer' : '');

      // Keep the later anchor resolved for one layout before moving upward.
      // Without a stable start inset, Chromium skips the anchor transition.
      if (previousItem && compareItems(element, previousItem) < 0 && highlightOptions?.pointer) {
        forceLayout(element.parentElement);
      }

      previousItem?.removeAttribute(MenuItemDataAttrs.highlighted);

      if (highlightOptions?.focus !== false) {
        if (highlightOptions?.preventScroll) {
          element.focus({ preventScroll: true });
        } else {
          element.focus();
        }
      }
    } else {
      previousItem?.removeAttribute(MenuItemDataAttrs.highlighted);
    }

    options.onHighlightChange?.(element);
  }

  function clearHighlight(): void {
    if (highlightedItem) {
      highlightedItem.tabIndex = -1;
      highlightedItem.removeAttribute(MenuItemDataAttrs.highlighted);
      highlightedItem = null;
      options.onHighlightChange?.(null);
    }
  }

  function highlightFirstItem(options?: MenuHighlightOptions): void {
    highlight(getNavigableItems()[0] ?? null, options);
  }

  function highlightInitialItem(options?: MenuHighlightOptions): void {
    highlight(getInitialHighlightItem(), options);
  }

  function restoreFocus(focusOptions?: FocusOptions): void {
    if (
      lastCloseReason === 'imperative-action' ||
      lastCloseReason === 'group-open' ||
      lastCloseReason === 'blur' ||
      lastCloseReason === 'outside-click'
    ) {
      return;
    }

    if (focusOptions) {
      triggerElement?.focus(focusOptions);
    } else {
      triggerElement?.focus();
    }
  }

  function getInitialHighlightItem(): HTMLElement | null {
    const navigableItems = getNavigableItems();

    return (
      navigableItems.find((item) =>
        item.matches('[role="menuitemradio"][aria-checked="true"], [aria-selected="true"]')
      ) ??
      navigableItems[0] ??
      null
    );
  }

  // --- Type-ahead ---

  function clearTypeahead(): void {
    if (typeaheadTimer !== null) {
      clearTimeout(typeaheadTimer);
      typeaheadTimer = null;
    }

    typeaheadBuffer = '';
  }

  function scheduleInitialHighlight(): void {
    cancelAnimationFrame(openRafId);
    openRafId = requestAnimationFrame(() => {
      openRafId = 0;

      // Guard against close() being called before the RAF fires — active
      // stays true during the closing animation, so also check status.
      if (!popover.input.current.active || popover.input.current.status === 'ending' || highlightedItem) return;

      highlight(getInitialHighlightItem(), { preventScroll: true });
    });
  }

  function handleTypeahead(char: string): void {
    const repeatedChar = typeaheadBuffer.length === 1 && typeaheadBuffer.toLowerCase() === char.toLowerCase();

    typeaheadBuffer = repeatedChar ? char : typeaheadBuffer + char;

    if (typeaheadTimer !== null) clearTimeout(typeaheadTimer);

    typeaheadTimer = setTimeout(clearTypeahead, 500);

    const navigableItems = getNavigableItems();
    const currentIdx = highlightedItem ? navigableItems.indexOf(highlightedItem) : -1;

    // Search from after the current item so repeated chars cycle through matches.
    const searchStart = currentIdx + 1;
    const candidates = [...navigableItems.slice(searchStart), ...navigableItems.slice(0, searchStart)];

    const needle = typeaheadBuffer.toLowerCase();
    const match = candidates.find((candidate) => {
      const text = candidate.textContent?.trim().toLowerCase() ?? '';

      return text.startsWith(needle);
    });

    if (match) highlight(match);
  }

  // --- Internal popover ---

  const popover = createPopover({
    transition: options.transition,
    deferOpenChanges: true,
    onOpenChange(open, details) {
      lastCloseReason = open ? null : details.reason;
      options.onOpenChange(open, details);

      if (open) {
        // Focus the selected item after the popover element becomes visible.
        // One RAF ensures the element has been shown via the Popover API.
        scheduleInitialHighlight();
      } else {
        clearHighlight();
        clearTypeahead();
      }
    },
    onOpenChangeComplete(open) {
      options.onOpenChangeComplete?.(open);

      // Return focus to the trigger after the close animation completes
      // if focus stayed in the closing page, so moved focus is not stolen.
      if (!open && contentElement) {
        const active = getDeepActiveElement(contentElement.ownerDocument);

        if (
          !(active instanceof Element) ||
          active === contentElement.ownerDocument.body ||
          containsComposed(contentElement, active)
        ) {
          restoreFocus();
        }
      }
    },
    closeOnEscape: options.closeOnEscape,
    closeOnOutsideClick: options.closeOnOutsideClick,
    ...(options.group ? { group: options.group } : {}),
  });

  // --- Content keyboard navigation ---

  const contentProps: MenuContentProps = {
    onFocusOut(event) {
      if (event.relatedTarget === null && hasClosingSubmenu()) {
        pendingFocusOut = event;
        return;
      }

      popover.popupProps.onFocusOut(event);
    },
    onKeyDown(event) {
      const { key } = event;
      const navigableItems = getNavigableItems();

      if (key !== 'Escape' && isMenuNavigationKey(event) && !event.defaultPrevented) {
        event.preventDefault();
      }

      if (navigableItems.length === 0) return;

      switch (key) {
        case 'ArrowDown': {
          event.preventDefault();
          highlight(getAdjacentNavigableItem(1));
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          highlight(getAdjacentNavigableItem(-1));
          break;
        }
        case 'Home': {
          event.preventDefault();
          highlight(navigableItems[0] ?? null);
          break;
        }
        case 'End': {
          event.preventDefault();
          highlight(navigableItems[navigableItems.length - 1] ?? null);
          break;
        }
        case 'Enter':
        case ' ': {
          event.preventDefault();

          if (highlightedItem && navigableItems.includes(highlightedItem)) highlightedItem.click();

          break;
        }
        default: {
          // Printable characters trigger type-ahead search.
          if (key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
            handleTypeahead(key);
          }
        }
      }
    },
  };

  function handleTriggerKeyDown(event: UIKeyboardEvent): void {
    const input = popover.input.current;
    if (!input.active || input.status === 'ending') return;

    if (event.key === 'Escape') return;

    if (!isMenuNavigationKey(event)) return;

    contentProps.onKeyDown(event);
    event.stopPropagation();
  }

  // --- Element setters ---

  function setTriggerElement(element: HTMLElement | null): void {
    triggerElement = element;
    popover.setTriggerElement(element);
  }

  function setContentElement(element: HTMLElement | null): void {
    contentElement = element;
  }

  function setPopupElement(element: HTMLElement | null): void {
    popupElement = element;
    popover.setPopupElement(element);
  }

  // --- Item registration ---

  function compareItems(a: HTMLElement, b: HTMLElement): number {
    if (a === b) return 0;

    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;

    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;

    return 0;
  }

  function registerItem(element: HTMLElement): () => void {
    const onFocus = () => highlight(element, { focus: false });

    element.tabIndex = -1;
    element.setAttribute(MenuItemDataAttrs.item, '');
    element.addEventListener('focus', onFocus);
    items.push(element);
    items.sort(compareItems);

    if (popover.input.current.active && popover.input.current.status !== 'ending' && !highlightedItem) {
      scheduleInitialHighlight();
    }

    return () => {
      element.removeEventListener('focus', onFocus);
      const index = items.indexOf(element);

      if (index !== -1) items.splice(index, 1);

      if (highlightedItem === element) clearHighlight();
    };
  }

  function registerSubmenu(menu: MenuApi): () => void {
    submenus.add(menu);
    parents.set(menu, api);
    const unsubscribe = menu.input.subscribe(handlePendingFocusOut);

    submenuUnsubscribes.set(menu, unsubscribe);

    return () => {
      submenus.delete(menu);

      if (parents.get(menu) === api) parents.delete(menu);

      submenuUnsubscribes.get(menu)?.();
      submenuUnsubscribes.delete(menu);
      handlePendingFocusOut();
    };
  }

  function hasClosingSubmenu(): boolean {
    return [...submenus].some(({ input }) => input.current.status === 'ending');
  }

  function handlePendingFocusOut(): void {
    if (!pendingFocusOut || hasClosingSubmenu()) return;

    const event = pendingFocusOut;

    pendingFocusOut = null;
    popover.popupProps.onFocusOut(event);
  }

  function syncOpen(open: boolean): void {
    if (open) {
      parents.get(api)?.highlight(null);
    } else {
      for (const submenu of submenus) submenu.close('imperative-action');
    }

    popover.syncOpen(open);
  }

  function destroy(): void {
    cancelAnimationFrame(openRafId);
    openRafId = 0;
    clearTypeahead();

    for (const unsubscribe of submenuUnsubscribes.values()) unsubscribe();

    for (const submenu of submenus) {
      if (parents.get(submenu) === api) parents.delete(submenu);
    }

    submenuUnsubscribes.clear();
    submenus.clear();
    parents.delete(api);
    pendingFocusOut = null;
    popover.destroy();
  }

  api = {
    input: popover.input as State<MenuInput>,
    // Menus open/close on trigger click — forward the popover's click handler.
    // Hover and focus-based open are disabled (openOnHover not set).
    triggerProps: {
      onClick: popover.triggerProps.onClick,
      onKeyDown: handleTriggerKeyDown,
    },
    contentProps,
    get triggerElement(): HTMLElement | null {
      return triggerElement;
    },
    get contentElement(): HTMLElement | null {
      return contentElement;
    },
    get popupElement(): HTMLElement | null {
      return popupElement;
    },
    setTriggerElement,
    setContentElement,
    setPopupElement,
    registerItem,
    registerSubmenu,
    highlight,
    highlightFirstItem,
    highlightInitialItem,
    restoreFocus,
    open: popover.open,
    close: popover.close,
    syncOpen,
    destroy,
  };

  return api;
}
