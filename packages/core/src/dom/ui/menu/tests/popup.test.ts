import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MenuContentDataAttrs } from '../../../../core/ui/menu/data';
import { MenuCSSVars } from '../../../../core/ui/menu/vars';
import { createMenuPopup } from '../popup';
import { createTestMenu } from './helpers';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('createMenuPopup', () => {
  it('removes the child-open state after the closing submenu paints', async () => {
    const popupElement = document.createElement('div');
    const rootElement = document.createElement('div');
    const childElement = document.createElement('div');
    const { menu: rootMenu } = createTestMenu();
    const { menu: childMenu } = createTestMenu();
    const popup = createMenuPopup();

    popupElement.append(rootElement, childElement);
    document.body.append(popupElement);
    popup.setElement(popupElement);
    popup.registerContent({ menu: rootMenu, parent: null, element: rootElement });
    popup.registerContent({ menu: childMenu, parent: rootMenu, element: childElement });

    childMenu.open();
    popup.sync();
    expect(rootElement.hasAttribute(MenuContentDataAttrs.childOpen)).toBe(true);

    childMenu.close();
    popup.sync();
    expect(rootElement.hasAttribute(MenuContentDataAttrs.childOpen)).toBe(true);

    await vi.waitFor(() => expect(rootElement.hasAttribute(MenuContentDataAttrs.childOpen)).toBe(false));

    popup.destroy();
    rootMenu.destroy();
    childMenu.destroy();
  });

  it('keeps the child-open state when a closing submenu reopens', async () => {
    const popupElement = document.createElement('div');
    const rootElement = document.createElement('div');
    const childElement = document.createElement('div');
    const { menu: rootMenu } = createTestMenu();
    const { menu: childMenu } = createTestMenu();
    const popup = createMenuPopup();

    popupElement.append(rootElement, childElement);
    document.body.append(popupElement);
    popup.setElement(popupElement);
    popup.registerContent({ menu: rootMenu, parent: null, element: rootElement });
    popup.registerContent({ menu: childMenu, parent: rootMenu, element: childElement });

    childMenu.open();
    popup.sync();
    childMenu.close();
    childMenu.open();
    popup.sync();

    await vi.waitFor(() => expect(childMenu.input.current.status).toBe('idle'));
    expect(rootElement.hasAttribute(MenuContentDataAttrs.childOpen)).toBe(true);

    popup.destroy();
    rootMenu.destroy();
    childMenu.destroy();
  });

  it('includes the vertical scrollbar when sizing the popup', () => {
    const popupElement = document.createElement('div');
    const content = document.createElement('div');
    const item = document.createElement('div');
    const { menu } = createTestMenu();
    const popup = createMenuPopup();

    popupElement.style.paddingInlineStart = '4px';
    popupElement.style.paddingInlineEnd = '4px';
    popupElement.style.paddingBlockStart = '4px';
    popupElement.style.paddingBlockEnd = '4px';
    content.append(item);
    popupElement.append(content);
    document.body.append(popupElement);

    vi.spyOn(item, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 60, 266));
    Object.defineProperties(item, {
      scrollWidth: { configurable: true, value: 60 },
      scrollHeight: { configurable: true, value: 266 },
    });
    Object.defineProperties(content, {
      offsetWidth: { configurable: true, value: 64 },
      clientWidth: { configurable: true, value: 49 },
      scrollHeight: { configurable: true, value: 266 },
      clientHeight: { configurable: true, value: 209 },
    });

    popup.setElement(popupElement);
    popup.registerContent({ menu, parent: null, element: content });
    popup.sync();

    expect(popupElement.style.getPropertyValue(MenuCSSVars.width)).toBe('83px');
    expect(popupElement.style.getPropertyValue(MenuCSSVars.height)).toBe('274px');

    popup.destroy();
    menu.destroy();
  });

  it('restores focus before hiding a closing submenu page', () => {
    const popupElement = document.createElement('div');
    const parentContent = document.createElement('div');
    const parentTrigger = document.createElement('button');
    const childContent = document.createElement('div');
    const childItem = document.createElement('button');
    const shadowHost = document.createElement('div');
    const parent = createTestMenu();
    const child = createTestMenu();
    const popup = createMenuPopup();

    parent.menu.registerSubmenu(child.menu);
    parent.menu.setTriggerElement(document.createElement('button'));
    child.menu.setTriggerElement(parentTrigger);
    child.menu.registerItem(childItem);
    parentContent.append(parentTrigger, childContent);
    shadowHost.attachShadow({ mode: 'open' }).append(childItem);
    childContent.append(shadowHost);
    popupElement.append(parentContent);
    document.body.append(popupElement);

    popup.setElement(popupElement);
    popup.registerContent({ menu: parent.menu, parent: null, element: parentContent });
    popup.registerContent({ menu: child.menu, parent: parent.menu, element: childContent });
    parent.menu.open();
    child.menu.open();
    popup.sync();
    childItem.focus();

    child.menu.close();
    popup.sync();

    expect(document.activeElement).toBe(parentTrigger);
    expect(childContent.getAttribute('aria-hidden')).toBe('true');
    expect(childContent.hasAttribute('inert')).toBe(true);

    popup.destroy();
    parent.menu.destroy();
    child.menu.destroy();
  });

  it('does not focus the submenu trigger when the parent page is also closing', () => {
    const popupElement = document.createElement('div');
    const parentContent = document.createElement('div');
    const parentTrigger = document.createElement('button');
    const childContent = document.createElement('div');
    const childItem = document.createElement('button');
    const parent = createTestMenu();
    const child = createTestMenu();
    const popup = createMenuPopup();
    const focus = vi.spyOn(parentTrigger, 'focus');

    parent.menu.registerSubmenu(child.menu);
    child.menu.setTriggerElement(parentTrigger);
    child.menu.registerItem(childItem);
    parentContent.append(parentTrigger, childContent);
    childContent.append(childItem);
    popupElement.append(parentContent);
    document.body.append(popupElement);

    popup.setElement(popupElement);
    popup.registerContent({ menu: parent.menu, parent: null, element: parentContent });
    popup.registerContent({ menu: child.menu, parent: parent.menu, element: childContent });
    parent.menu.open();
    child.menu.open();
    popup.sync();
    childItem.focus();

    parent.menu.close('imperative-action');
    popup.sync();

    expect(focus).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(childItem);
    expect(childContent.getAttribute('aria-hidden')).toBe('true');

    popup.destroy();
    parent.menu.destroy();
    child.menu.destroy();
  });

  it('keeps focus in the parent menu when only the submenu closes imperatively', () => {
    const popupElement = document.createElement('div');
    const parentContent = document.createElement('div');
    const parentTrigger = document.createElement('button');
    const childContent = document.createElement('div');
    const childItem = document.createElement('button');
    const parent = createTestMenu();
    const child = createTestMenu();
    const popup = createMenuPopup();
    const focus = vi.spyOn(parentTrigger, 'focus');

    parent.menu.registerSubmenu(child.menu);
    child.menu.setTriggerElement(parentTrigger);
    child.menu.registerItem(childItem);
    parentContent.append(parentTrigger, childContent);
    childContent.append(childItem);
    popupElement.append(parentContent);
    document.body.append(popupElement);

    popup.setElement(popupElement);
    popup.registerContent({ menu: parent.menu, parent: null, element: parentContent });
    popup.registerContent({ menu: child.menu, parent: parent.menu, element: childContent });
    parent.menu.open();
    child.menu.open();
    popup.sync();
    childItem.focus();

    child.menu.close('imperative-action');
    popup.sync();

    expect(focus).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(parentTrigger);
    expect(parent.menu.input.current.active).toBe(true);
    expect(childContent.getAttribute('aria-hidden')).toBe('true');

    popup.destroy();
    parent.menu.destroy();
    child.menu.destroy();
  });

  it('does not restore focus again after the user moves it during submenu closing', async () => {
    const popupElement = document.createElement('div');
    const parentContent = document.createElement('div');
    const parentTrigger = document.createElement('button');
    const childContent = document.createElement('div');
    const childItem = document.createElement('button');
    const outside = document.createElement('button');
    const parent = createTestMenu();
    const child = createTestMenu({
      onOpenChangeComplete(open) {
        if (!open) outside.focus();
      },
    });
    const popup = createMenuPopup();
    const focus = vi.spyOn(parentTrigger, 'focus');

    parent.menu.registerSubmenu(child.menu);
    child.menu.setTriggerElement(parentTrigger);
    child.menu.setContentElement(childContent);
    child.menu.registerItem(childItem);
    parentContent.append(parentTrigger, childContent);
    childContent.append(childItem);
    popupElement.append(parentContent);
    document.body.append(popupElement, outside);

    popup.setElement(popupElement);
    popup.registerContent({ menu: parent.menu, parent: null, element: parentContent });
    popup.registerContent({ menu: child.menu, parent: parent.menu, element: childContent });
    parent.menu.open();
    child.menu.open();
    popup.sync();
    childItem.focus();

    child.menu.close('escape');
    popup.sync();
    expect(document.activeElement).toBe(parentTrigger);

    await vi.waitFor(() => expect(document.activeElement).toBe(outside));
    expect(focus).toHaveBeenCalledTimes(1);

    popup.destroy();
    parent.menu.destroy();
    child.menu.destroy();
  });
});
