import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MenuItemDataAttrs } from '../../../../core/ui/menu/item';
import type { UIFocusEvent, UIKeyboardEvent } from '../../event';
import { createPopupGroup } from '../../popover/group';
import { getRootPositionOptions, isMenuNavigationKey } from '../menu';
import { cleanupElement, createItemElement, createTestMenu } from './helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKeyEvent(key: string, modifiers?: Partial<UIKeyboardEvent>): UIKeyboardEvent {
  return {
    key,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    target: document.body,
    currentTarget: document.body,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...modifiers,
  };
}

function makeFocusEvent(relatedTarget: EventTarget | null): UIFocusEvent {
  return {
    relatedTarget,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createMenu', () => {
  let items: HTMLButtonElement[] = [];

  beforeEach(() => {
    items = [];
  });

  afterEach(() => {
    for (const item of items) cleanupElement(item);

    items = [];
  });

  function addItem(text: string): HTMLButtonElement {
    const element = createItemElement(text);

    items.push(element);
    return element;
  }

  // -------------------------------------------------------------------------
  // open / close
  // -------------------------------------------------------------------------

  describe('open/close', () => {
    it('separates requested and committed open state', () => {
      const onOpenChange = vi.fn();
      const { menu } = createTestMenu({ onOpenChange });

      menu.open();

      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'click' });
      expect(menu.input.current).toEqual({ active: false, status: 'idle' });

      menu.syncOpen(true);

      expect(menu.input.current).toEqual({ active: true, status: 'starting' });

      menu.close();

      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'click' });
      expect(menu.input.current).toEqual({ active: true, status: 'starting' });

      menu.syncOpen(false);

      expect(menu.input.current).toEqual({ active: true, status: 'ending' });
    });

    it('resets registered descendant menus when a parent close is committed', () => {
      const parent = createTestMenu();
      const child = createTestMenu();
      const grandchild = createTestMenu();

      parent.menu.registerSubmenu(child.menu);
      child.menu.registerSubmenu(grandchild.menu);
      parent.menu.open();
      child.menu.open();
      grandchild.menu.open();
      child.onOpenChange.mockClear();
      grandchild.onOpenChange.mockClear();

      parent.menu.close();

      expect(child.onOpenChange).toHaveBeenCalledWith(false, { reason: 'imperative-action' });
      expect(grandchild.onOpenChange).toHaveBeenCalledWith(false, { reason: 'imperative-action' });
    });

    it('clears the parent highlight when a registered submenu opens', () => {
      const parent = createTestMenu();
      const child = createTestMenu();
      const item = addItem('Submenu');

      parent.menu.registerItem(item);
      parent.menu.registerSubmenu(child.menu);
      parent.menu.highlight(item, { focus: false });

      child.menu.open();

      expect(item.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
    });

    it('highlights the first DOM item when items register after opening', () => {
      vi.useFakeTimers();

      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.open();
      menu.registerItem(b);
      menu.registerItem(a);

      vi.runAllTimers();

      expect(a.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');

      vi.useRealTimers();
    });

    it('does not apply a pending initial highlight after it is cleared', () => {
      vi.useFakeTimers();

      const { menu } = createTestMenu();
      const item = addItem('Alpha');

      menu.registerItem(item);
      menu.open();
      menu.highlight(null);

      vi.runAllTimers();

      expect(item.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);

      vi.useRealTimers();
    });

    it('focuses the checked radio item when opening', () => {
      vi.useFakeTimers();

      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      b.setAttribute('role', 'menuitemradio');
      b.setAttribute('aria-checked', 'true');
      const focus = vi.spyOn(b, 'focus');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.open();

      vi.runAllTimers();

      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
      expect(a.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
      expect(focus).toHaveBeenCalledOnce();
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });

      vi.useRealTimers();
    });

    it('focuses the checked radio item when items register after opening', () => {
      vi.useFakeTimers();

      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      b.setAttribute('role', 'menuitemradio');
      b.setAttribute('aria-checked', 'true');
      const focus = vi.spyOn(b, 'focus');

      menu.open();
      menu.registerItem(a);
      menu.registerItem(b);

      vi.runAllTimers();

      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
      expect(a.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
      expect(focus).toHaveBeenCalledOnce();
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });

      vi.useRealTimers();
    });

    it('does not initially focus a checked checkbox item over a checked radio item', () => {
      vi.useFakeTimers();

      const { menu } = createTestMenu();
      const checkbox = addItem('Loop');
      const radio = addItem('Auto');

      checkbox.setAttribute('role', 'menuitemcheckbox');
      checkbox.setAttribute('aria-checked', 'true');
      radio.setAttribute('role', 'menuitemradio');
      radio.setAttribute('aria-checked', 'true');

      menu.registerItem(checkbox);
      menu.registerItem(radio);
      menu.open();

      vi.runAllTimers();

      expect(radio.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
      expect(checkbox.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);

      vi.useRealTimers();
    });

    it('highlights the selected item when opening', () => {
      vi.useFakeTimers();

      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      b.setAttribute('aria-selected', 'true');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.open();

      vi.runAllTimers();

      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
      expect(a.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);

      vi.useRealTimers();
    });

    it('closes when focus moves outside the menu and trigger', () => {
      const { menu, onOpenChange } = createTestMenu();
      const trigger = document.createElement('button');
      const content = document.createElement('div');
      const outside = document.createElement('button');

      menu.setTriggerElement(trigger);
      menu.setContentElement(content);
      menu.setPopupElement(content);
      menu.open();
      onOpenChange.mockClear();

      menu.contentProps.onFocusOut(makeFocusEvent(outside));

      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'blur' });
    });

    it('keeps the menu open when focus moves inside the menu', () => {
      const { menu, onOpenChange } = createTestMenu();
      const content = document.createElement('div');
      const child = document.createElement('button');

      content.append(child);
      menu.setContentElement(content);
      menu.setPopupElement(content);
      menu.open();
      onOpenChange.mockClear();

      menu.contentProps.onFocusOut(makeFocusEvent(child));

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('keeps the menu open when focus returns to the trigger', () => {
      const { menu, onOpenChange } = createTestMenu();
      const trigger = document.createElement('button');
      const content = document.createElement('div');

      menu.setTriggerElement(trigger);
      menu.setContentElement(content);
      menu.setPopupElement(content);
      menu.open();
      onOpenChange.mockClear();

      menu.contentProps.onFocusOut(makeFocusEvent(trigger));

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('waits for a closing submenu to restore focus before handling a null focus target', async () => {
      const parent = createTestMenu();
      const child = createTestMenu();
      const content = document.createElement('div');
      const trigger = document.createElement('button');
      const submenu = document.createElement('div');

      content.append(trigger, submenu);
      document.body.append(content);
      parent.menu.setContentElement(content);
      parent.menu.setPopupElement(content);
      child.menu.setTriggerElement(trigger);
      child.menu.setContentElement(submenu);
      child.menu.setPopupElement(submenu);
      parent.menu.registerSubmenu(child.menu);
      parent.menu.open();
      child.menu.open();
      parent.onOpenChange.mockClear();

      child.menu.close('escape');
      parent.menu.contentProps.onFocusOut(makeFocusEvent(null));

      expect(parent.onOpenChange).not.toHaveBeenCalledWith(false, expect.anything());

      await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      expect(parent.onOpenChange).not.toHaveBeenCalledWith(false, expect.anything());

      parent.menu.destroy();
      child.menu.destroy();
      content.remove();
    });
  });

  // -------------------------------------------------------------------------
  // triggerProps
  // -------------------------------------------------------------------------

  describe('triggerProps', () => {
    it('handles navigation keys while the open trigger has focus', () => {
      const { menu } = createTestMenu();
      const element = addItem('Auto');

      menu.registerItem(element);
      menu.open();

      const event = makeKeyEvent('ArrowDown');

      menu.triggerProps.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(element.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(true);
    });

    it('swallows left and right keys while the menu is open', () => {
      const { menu } = createTestMenu();

      menu.open();

      const event = makeKeyEvent('ArrowRight');

      menu.triggerProps.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it('lets Escape bubble while the menu is open', () => {
      const { menu } = createTestMenu();

      menu.open();

      const event = makeKeyEvent('Escape');

      menu.triggerProps.onKeyDown(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('lets navigation keys bubble while the menu is closed', () => {
      const { menu } = createTestMenu();

      const event = makeKeyEvent('ArrowRight');

      menu.triggerProps.onKeyDown(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
    });

    it('does not restore focus after closing for imperative-action', async () => {
      const { menu } = createTestMenu();
      const trigger = addItem('Trigger');
      const item = addItem('Item');
      const content = document.createElement('div');
      const focus = vi.spyOn(trigger, 'focus');

      trigger.after(content);
      content.append(item);
      menu.setTriggerElement(trigger);
      menu.setContentElement(content);
      menu.registerItem(item);
      menu.open();
      await vi.waitFor(() => expect(menu.input.current.status).toBe('idle'));
      item.focus();
      focus.mockClear();

      menu.close('imperative-action');
      await vi.waitFor(() => expect(menu.input.current.active).toBe(false));

      expect(focus).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(item);

      menu.open();
      await vi.waitFor(() => expect(menu.input.current.status).toBe('idle'));
      item.focus();
      menu.close('escape');
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
      expect(focus).toHaveBeenCalledOnce();

      menu.destroy();
      content.remove();
    });

    it('does not restore focus when Tab moves focus outside', async () => {
      const { menu } = createTestMenu();
      const trigger = document.createElement('button');
      const content = document.createElement('div');
      const outside = document.createElement('button');
      const focus = vi.spyOn(trigger, 'focus');

      menu.setTriggerElement(trigger);
      menu.setContentElement(content);
      menu.setPopupElement(content);
      menu.open();
      menu.contentProps.onFocusOut(makeFocusEvent(outside));

      await vi.waitFor(() => {
        expect(menu.input.current.active).toBe(false);
      });

      expect(focus).not.toHaveBeenCalled();
    });

    it('does not restore focus after closing for outside-click', async () => {
      const { menu } = createTestMenu();
      const trigger = addItem('Trigger');
      const item = addItem('Item');
      const content = document.createElement('div');
      const focus = vi.spyOn(trigger, 'focus');

      trigger.after(content);
      content.append(item);
      menu.setTriggerElement(trigger);
      menu.setContentElement(content);
      menu.registerItem(item);
      menu.open();
      await vi.waitFor(() => expect(menu.input.current.status).toBe('idle'));
      item.focus();
      focus.mockClear();

      menu.close('outside-click');
      await vi.waitFor(() => expect(menu.input.current.active).toBe(false));

      expect(focus).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(item);

      menu.open();
      await vi.waitFor(() => expect(menu.input.current.status).toBe('idle'));
      item.focus();
      menu.close('escape');
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger));
      expect(focus).toHaveBeenCalledOnce();

      menu.destroy();
      content.remove();
    });

    it('does not restore focus when another grouped popup opens', async () => {
      const group = createPopupGroup();
      const first = createTestMenu({ group: () => group });
      const second = createTestMenu({ group: () => group });
      const trigger = addItem('Trigger');
      const item = addItem('Item');
      const content = document.createElement('div');
      const focus = vi.spyOn(trigger, 'focus');

      trigger.after(content);
      content.append(item);
      first.menu.setTriggerElement(trigger);
      first.menu.setContentElement(content);
      first.menu.registerItem(item);
      first.menu.open();
      await vi.waitFor(() => expect(first.menu.input.current.status).toBe('idle'));
      item.focus();
      focus.mockClear();

      second.menu.open();
      await vi.waitFor(() => expect(first.menu.input.current.active).toBe(false));

      expect(first.onOpenChange).toHaveBeenCalledWith(false, { reason: 'group-open' });
      expect(focus).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(item);

      first.menu.destroy();
      second.menu.destroy();
      content.remove();
    });
  });

  // -------------------------------------------------------------------------
  // registerItem
  // -------------------------------------------------------------------------

  describe('registerItem', () => {
    it('sets tabIndex to -1 on registration', () => {
      const { menu } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      expect(element.tabIndex).toBe(-1);
    });

    it('sets data-item attribute on registration', () => {
      const { menu } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      expect(element.hasAttribute(MenuItemDataAttrs.item)).toBe(true);
    });

    it('highlights an item when it receives focus', () => {
      const { menu } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);
      element.focus();

      expect(element.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(true);
      expect(element.tabIndex).toBe(0);
    });

    it('removes item from navigation on cleanup', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      const cleanup = menu.registerItem(a);

      menu.registerItem(b);
      menu.open();
      menu.highlight(a);

      cleanup();

      // After cleanup, a is no longer in the set — ArrowDown should wrap to b
      const event = makeKeyEvent('ArrowDown');

      menu.contentProps.onKeyDown(event);

      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
      expect(a.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
    });

    it('removes highlight DOM state when highlighted item is unregistered', () => {
      const { menu, onHighlightChange } = createTestMenu();
      const element = addItem('Alpha');

      const cleanup = menu.registerItem(element);

      menu.highlight(element);
      onHighlightChange.mockClear();

      cleanup();

      expect(element.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
      expect(element.tabIndex).toBe(-1);
      expect(onHighlightChange).toHaveBeenCalledWith(null);
    });
  });

  // -------------------------------------------------------------------------
  // highlight
  // -------------------------------------------------------------------------

  describe('highlight', () => {
    it('sets data-highlighted attribute and tabIndex=0 on highlighted item', () => {
      const { menu } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      menu.highlight(element);

      expect(element.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
      expect(element.tabIndex).toBe(0);
    });

    it('sets the highlight type for pointer highlights', () => {
      const { menu } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      menu.highlight(element, { focus: false, pointer: true });
      expect(element.getAttribute(MenuItemDataAttrs.highlighted)).toBe('pointer');

      menu.highlight(element);
      expect(element.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('removes data-highlighted and resets tabIndex on previously highlighted item', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(a);
      menu.registerItem(b);

      menu.highlight(a);
      menu.highlight(b);

      expect(a.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
      expect(a.tabIndex).toBe(-1);
      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('lays out an earlier pointer highlight before removing the previous highlight', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.highlight(b, { focus: false, pointer: true });
      const setHighlight = vi.spyOn(a, 'setAttribute');
      const layout = vi.spyOn(document.body, 'getBoundingClientRect');
      const removeHighlight = vi.spyOn(b, 'removeAttribute');

      menu.highlight(a, { focus: false, pointer: true });

      expect(setHighlight).toHaveBeenCalledWith(MenuItemDataAttrs.highlighted, 'pointer');
      expect(layout).toHaveBeenCalledOnce();
      expect(removeHighlight).toHaveBeenCalledWith(MenuItemDataAttrs.highlighted);
      expect(setHighlight.mock.invocationCallOrder[0]).toBeLessThan(layout.mock.invocationCallOrder[0] ?? 0);
      expect(layout.mock.invocationCallOrder[0]).toBeLessThan(removeHighlight.mock.invocationCallOrder[0] ?? 0);
      layout.mockRestore();
    });

    it('calls onHighlightChange with the new element', () => {
      const { menu, onHighlightChange } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      menu.highlight(element);

      expect(onHighlightChange).toHaveBeenCalledWith(element);
    });

    it('calls onHighlightChange with null when cleared', () => {
      const { menu, onHighlightChange } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      menu.highlight(element);
      onHighlightChange.mockClear();

      menu.highlight(null);

      expect(onHighlightChange).toHaveBeenCalledWith(null);
    });

    it('is a no-op when same item is already highlighted', () => {
      const { menu, onHighlightChange } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      menu.highlight(element);
      onHighlightChange.mockClear();

      menu.highlight(element);

      expect(onHighlightChange).not.toHaveBeenCalled();
    });

    describe.each(['highlightFirstItem', 'highlightInitialItem'] as const)('%s', (method) => {
      it.each([
        { hiddenFirst: false, preventScroll: false },
        { hiddenFirst: true, preventScroll: false },
        { hiddenFirst: false, preventScroll: true },
      ])(
        'highlights the initial navigable DOM item: $hiddenFirst / $preventScroll',
        ({ hiddenFirst, preventScroll }) => {
          const { menu } = createTestMenu();
          const a = addItem('Alpha');
          const b = addItem('Beta');
          const expected = hiddenFirst ? b : a;
          const other = hiddenFirst ? a : b;
          const focus = vi.spyOn(expected, 'focus');

          a.hidden = hiddenFirst;
          menu.registerItem(b);
          menu.registerItem(a);
          menu[method]({ preventScroll });

          expect(expected.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
          expect(other.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
          expect(focus).toHaveBeenCalledOnce();

          if (preventScroll) expect(focus).toHaveBeenCalledWith({ preventScroll: true });

          menu.destroy();
        }
      );
    });

    it('falls back to the first navigable item when the selected item is hidden', () => {
      const { menu } = createTestMenu();
      const back = addItem('Back');
      const hiddenSelected = addItem('Selected');

      hiddenSelected.setAttribute('role', 'menuitemradio');
      hiddenSelected.setAttribute('aria-checked', 'true');
      hiddenSelected.setAttribute('aria-hidden', 'true');
      menu.registerItem(back);
      menu.registerItem(hiddenSelected);

      menu.highlightInitialItem({ preventScroll: true });

      expect(back.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(true);
      expect(hiddenSelected.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
    });

    it('can highlight an item without moving focus', () => {
      const { menu } = createTestMenu();
      const element = addItem('Alpha');
      const focus = vi.spyOn(element, 'focus');

      menu.registerItem(element);

      menu.highlight(element, { focus: false });

      expect(element.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
      expect(focus).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // contentProps — keyboard navigation
  // -------------------------------------------------------------------------

  describe('contentProps.onKeyDown', () => {
    it('ArrowDown highlights first item when nothing highlighted', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(a);
      menu.registerItem(b);

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowDown'));

      expect(a.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ArrowDown follows DOM order when items register out of order', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(b);
      menu.registerItem(a);

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowDown'));

      expect(a.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ArrowDown advances to next item', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.highlight(a);

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowDown'));

      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ArrowDown skips items marked data-hidden', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const hidden = addItem('Beta');
      const c = addItem('Gamma');

      hidden.setAttribute('data-hidden', '');
      menu.registerItem(a);
      menu.registerItem(hidden);
      menu.registerItem(c);
      menu.highlight(a);

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowDown'));

      expect(hidden.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
      expect(c.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it.each(['unavailable', 'unsupported'])('ArrowDown skips %s items', (availability) => {
      const { menu } = createTestMenu();
      const hidden = addItem('Hidden');
      const visible = addItem('Visible');

      hidden.setAttribute('data-availability', availability);
      menu.registerItem(hidden);
      menu.registerItem(visible);

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowDown'));

      expect(hidden.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
      expect(visible.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ArrowDown preserves position when the highlighted item becomes hidden', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');
      const c = addItem('Gamma');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.registerItem(c);
      menu.highlight(b);
      b.setAttribute('data-hidden', '');

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowDown'));

      expect(c.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ArrowDown wraps from last to first', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.highlight(b);

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowDown'));

      expect(a.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ArrowUp highlights last item when nothing highlighted', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(a);
      menu.registerItem(b);

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowUp'));

      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ArrowUp moves to previous item', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.highlight(b);

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowUp'));

      expect(a.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ArrowUp preserves position when the highlighted item becomes hidden', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');
      const c = addItem('Gamma');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.registerItem(c);
      menu.highlight(b);
      b.hidden = true;

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowUp'));

      expect(a.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ArrowUp wraps from first to last', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.highlight(a);

      menu.contentProps.onKeyDown(makeKeyEvent('ArrowUp'));

      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('Home highlights first item', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');
      const c = addItem('Gamma');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.registerItem(c);
      menu.highlight(c);

      menu.contentProps.onKeyDown(makeKeyEvent('Home'));

      expect(a.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('End highlights last item', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');
      const c = addItem('Gamma');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.registerItem(c);
      menu.highlight(a);

      menu.contentProps.onKeyDown(makeKeyEvent('End'));

      expect(c.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('Enter calls click on highlighted item', () => {
      const { menu } = createTestMenu();
      const element = addItem('Alpha');
      const onClick = vi.fn();

      element.addEventListener('click', onClick);
      menu.registerItem(element);
      menu.highlight(element);

      menu.contentProps.onKeyDown(makeKeyEvent('Enter'));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('Space calls click on highlighted item', () => {
      const { menu } = createTestMenu();
      const element = addItem('Alpha');
      const onClick = vi.fn();

      element.addEventListener('click', onClick);
      menu.registerItem(element);
      menu.highlight(element);

      menu.contentProps.onKeyDown(makeKeyEvent(' '));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('ArrowDown calls preventDefault', () => {
      const { menu } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      const event = makeKeyEvent('ArrowDown');

      menu.contentProps.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('consumes navigation keys without highlighting when open content is empty', () => {
      const { menu, onHighlightChange } = createTestMenu();
      const event = makeKeyEvent('ArrowDown');

      menu.open();
      menu.contentProps.onKeyDown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onHighlightChange).not.toHaveBeenCalled();
      menu.destroy();
    });
  });

  // -------------------------------------------------------------------------
  // Type-ahead
  // -------------------------------------------------------------------------

  describe('type-ahead', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('highlights item matching typed character', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');

      menu.registerItem(a);
      menu.registerItem(b);

      menu.contentProps.onKeyDown(makeKeyEvent('b'));

      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('ignores aria-hidden type-ahead matches', () => {
      const { menu } = createTestMenu();
      const hidden = addItem('Beta');
      const visible = addItem('Bravo');

      hidden.setAttribute('aria-hidden', 'true');
      menu.registerItem(hidden);
      menu.registerItem(visible);

      menu.contentProps.onKeyDown(makeKeyEvent('b'));

      expect(hidden.hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
      expect(visible.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('cycles through matching items when the same character is pressed repeatedly', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Beta');
      const br = addItem('Bravo');
      const bu = addItem('Button');

      menu.registerItem(a);
      menu.registerItem(b);
      menu.registerItem(br);
      menu.registerItem(bu);

      menu.contentProps.onKeyDown(makeKeyEvent('b'));
      expect(b.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');

      menu.contentProps.onKeyDown(makeKeyEvent('b'));
      expect(br.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');

      menu.contentProps.onKeyDown(makeKeyEvent('b'));
      expect(bu.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it('accumulates characters for multi-char match', () => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const al = addItem('Almond');

      menu.registerItem(a);
      menu.registerItem(al);
      menu.highlight(a);

      menu.contentProps.onKeyDown(makeKeyEvent('a'));
      menu.contentProps.onKeyDown(makeKeyEvent('l'));
      menu.contentProps.onKeyDown(makeKeyEvent('m'));

      expect(al.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
    });

    it.each([
      { initial: null, elapsed: 400, expired: false },
      { initial: null, elapsed: 600, expired: true },
      { initial: 'Alpha', elapsed: 400, expired: false },
      { initial: 'Alpha', elapsed: 600, expired: true },
    ])('expires a multi-character buffer after 500ms: $initial / $elapsed ms', ({ initial, elapsed, expired }) => {
      const { menu } = createTestMenu();
      const a = addItem('Alpha');
      const b = addItem('Almond');

      menu.registerItem(a);
      menu.registerItem(b);

      if (initial) menu.highlight(a);

      menu.contentProps.onKeyDown(makeKeyEvent('a'));
      menu.contentProps.onKeyDown(makeKeyEvent('l'));
      menu.contentProps.onKeyDown(makeKeyEvent(initial ? 'm' : 'p'));
      const current = initial ? b : a;
      const next = initial ? a : b;

      expect(current.getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
      vi.advanceTimersByTime(elapsed);
      menu.contentProps.onKeyDown(makeKeyEvent('a'));

      expect((expired ? next : current).getAttribute(MenuItemDataAttrs.highlighted)).toBe('');
      expect((expired ? current : next).hasAttribute(MenuItemDataAttrs.highlighted)).toBe(false);
      menu.destroy();
    });

    it('ignores printable chars with modifier keys', () => {
      const { menu, onHighlightChange } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);
      onHighlightChange.mockClear();

      menu.contentProps.onKeyDown(makeKeyEvent('a', { ctrlKey: true }));

      expect(onHighlightChange).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // destroy
  // -------------------------------------------------------------------------

  describe('destroy', () => {
    it('is idempotent', () => {
      const { menu } = createTestMenu();

      menu.destroy();
      expect(() => menu.destroy()).not.toThrow();
    });

    it('cancels the open RAF so highlight/focus do not fire after destroy', () => {
      vi.useFakeTimers();

      const { menu, onHighlightChange } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      menu.open();
      menu.destroy();
      onHighlightChange.mockClear();

      // Flush all pending timers and animation frames
      vi.runAllTimers();

      expect(onHighlightChange).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------
  // open/close race conditions
  // -------------------------------------------------------------------------

  describe('open/close race conditions', () => {
    it('does not highlight when close is called before the open RAF fires', () => {
      vi.useFakeTimers();

      const { menu, onHighlightChange } = createTestMenu();
      const element = addItem('Alpha');

      menu.registerItem(element);

      menu.open();
      menu.close();
      onHighlightChange.mockClear();

      vi.runAllTimers();

      expect(onHighlightChange).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});

describe('isMenuNavigationKey', () => {
  it('matches keys owned by menu navigation and type-ahead', () => {
    expect(isMenuNavigationKey(makeKeyEvent('ArrowDown'))).toBe(true);
    expect(isMenuNavigationKey(makeKeyEvent('ArrowLeft'))).toBe(true);
    expect(isMenuNavigationKey(makeKeyEvent('Escape'))).toBe(true);
    expect(isMenuNavigationKey(makeKeyEvent('a'))).toBe(true);
  });

  it('ignores keys that should be allowed to bubble', () => {
    expect(isMenuNavigationKey(makeKeyEvent('Tab'))).toBe(false);
    expect(isMenuNavigationKey(makeKeyEvent('a', { metaKey: true }))).toBe(false);
  });
});

describe('getRootPositionOptions', () => {
  it('returns positioning options when side and align are available', () => {
    expect(getRootPositionOptions('bottom', 'start')).toEqual({ side: 'bottom', align: 'start' });
  });

  it('returns null when root positioning is unavailable', () => {
    expect(getRootPositionOptions(undefined, 'start')).toBeNull();
    expect(getRootPositionOptions('bottom', undefined)).toBeNull();
  });
});
