import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaControlsState } from '@videojs/media';
import { createStore, flush } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { ControlsElement } from '../../controls/element';
import { UIElement } from '../../ui-element';
import { MenuContentElement } from '../content';
import { MenuElement } from '../element';
import { MenuItemElement } from '../item';
import { MenuRadioGroupElement } from '../radio-group';
import { MenuRadioItemElement } from '../radio-item';

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) customElements.define(tagName, Base);
}

defineElement(MenuElement.tagName, MenuElement);
defineElement(MenuContentElement.tagName, MenuContentElement);
defineElement(MenuItemElement.tagName, MenuItemElement);
defineElement(MenuRadioGroupElement.tagName, MenuRadioGroupElement);
defineElement(MenuRadioItemElement.tagName, MenuRadioItemElement);

function createMenu(): { root: MenuElement; content: MenuContentElement } {
  const root = document.createElement(MenuElement.tagName) as MenuElement;
  const content = document.createElement(MenuContentElement.tagName) as MenuContentElement;

  root.append(content);
  return { root, content };
}

function createItem(label: string): MenuItemElement {
  const item = document.createElement(MenuItemElement.tagName) as MenuItemElement;

  item.textContent = label;
  return item;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function waitForAssertion(assertion: () => void): Promise<void> {
  let error: unknown;

  for (let index = 0; index < 10; index++) {
    try {
      assertion();
      return;
    } catch (caught) {
      error = caught;
      await nextFrame();
    }
  }

  throw error;
}

function setElementSize(element: HTMLElement, width: number, height: number): void {
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: width });
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: height });
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ width, height } as DOMRect);
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('MenuElement', () => {
  it('applies starting styles before showing the popup', async () => {
    const { root } = createMenu();
    const startingStates: boolean[] = [];
    const showPopover = vi.fn(() => {
      startingStates.push(root.hasAttribute('data-starting-style'));
    });

    Object.defineProperty(root, 'showPopover', { configurable: true, value: showPopover });
    document.body.append(root);
    await root.updateComplete;

    root.openMenu();
    await root.updateComplete;
    await Promise.resolve();

    expect(showPopover).toHaveBeenCalled();
    expect(startingStates.every(Boolean)).toBe(true);
  });

  it('owns popup state while Content owns menu semantics', async () => {
    const { root, content } = createMenu();

    root.defaultOpen = true;
    root.side = 'top';
    root.align = 'end';
    content.append(createItem('Auto'));
    document.body.append(root);

    await root.updateComplete;
    await content.updateComplete;

    expect(root.open).toBe(true);
    expect(root.getAttribute('popover')).toBe('manual');
    expect(root.getAttribute('data-side')).toBe('top');
    expect(root.getAttribute('data-align')).toBe('end');
    expect(root.hasAttribute('role')).toBe(false);
    expect(content.getAttribute('role')).toBe('menu');
    expect(content.getAttribute('tabindex')).toBe('-1');
    expect(content.hasAttribute('data-open')).toBe(true);
    expect(content.hasAttribute('data-side')).toBe(false);
  });

  it('links an external trigger to the root Content', async () => {
    const trigger = document.createElement('button');
    const { root, content } = createMenu();

    root.id = 'settings-menu';
    content.id = 'settings-content';
    trigger.setAttribute('commandfor', root.id);
    document.body.append(trigger, root);

    await root.updateComplete;
    await content.updateComplete;
    root.requestUpdate();
    await root.updateComplete;

    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-controls')).toBe(content.id);
  });

  it('opens nested Content as a sibling of its parent', async () => {
    const { root, content } = createMenu();
    const trigger = createItem('Quality');
    const submenu = document.createElement(MenuContentElement.tagName) as MenuContentElement;

    submenu.id = 'quality-menu';
    trigger.commandfor = submenu.id;
    submenu.append(createItem('Auto'));
    content.append(trigger, submenu);
    root.open = true;
    document.body.append(root);

    await root.updateComplete;
    await content.updateComplete;
    await submenu.updateComplete;

    expect(submenu.parentElement).toBe(root);
    expect(submenu.hidden).toBe(true);

    trigger.click();
    await waitForAssertion(() => expect(submenu.open).toBe(true));

    expect(submenu.hasAttribute('data-submenu')).toBe(true);
    expect(content.hasAttribute('data-child-open')).toBe(true);
    expect(content.getAttribute('aria-hidden')).toBe('true');
    expect(content.hasAttribute('inert')).toBe(true);
  });

  it('normalizes arbitrarily nested Contents under the Popup', async () => {
    const { root, content } = createMenu();
    const firstTrigger = createItem('Quality');
    const first = document.createElement(MenuContentElement.tagName) as MenuContentElement;
    const secondTrigger = createItem('Advanced');
    const second = document.createElement(MenuContentElement.tagName) as MenuContentElement;

    first.id = 'quality-menu';
    second.id = 'advanced-menu';
    firstTrigger.commandfor = first.id;
    secondTrigger.commandfor = second.id;
    second.append(createItem('HDR'));
    first.append(secondTrigger, second);
    content.append(firstTrigger, first);
    root.open = true;
    document.body.append(root);

    await waitForAssertion(() => {
      expect(first.parentElement).toBe(root);
      expect(second.parentElement).toBe(root);
    });

    firstTrigger.click();
    await waitForAssertion(() => expect(first.open).toBe(true));
    secondTrigger.click();
    await waitForAssertion(() => expect(second.open).toBe(true));

    expect(first.hasAttribute('data-child-open')).toBe(true);
    expect(content.hasAttribute('inert')).toBe(true);
    expect(first.hasAttribute('inert')).toBe(true);
  });

  it('sizes the Popup to the active Content and includes root padding', async () => {
    const { root, content } = createMenu();
    const rootItems = document.createElement('div');
    const trigger = createItem('Quality');
    const submenu = document.createElement(MenuContentElement.tagName) as MenuContentElement;
    const submenuItems = document.createElement('div');

    submenu.id = 'quality-menu';
    trigger.commandfor = submenu.id;
    rootItems.append(trigger);
    submenu.append(submenuItems);
    content.append(rootItems, submenu);
    root.open = true;
    root.style.paddingInlineStart = '6px';
    root.style.paddingInlineEnd = '6px';
    root.style.paddingBlockStart = '4px';
    root.style.paddingBlockEnd = '4px';
    setElementSize(rootItems, 180, 100);
    setElementSize(submenuItems, 220, 240);
    document.body.append(root);

    await waitForAssertion(() => {
      expect(root.style.getPropertyValue('--media-menu-width')).toBe('192px');
      expect(root.style.getPropertyValue('--media-menu-height')).toBe('108px');
    });
    trigger.click();
    await waitForAssertion(() => {
      expect(root.style.getPropertyValue('--media-menu-width')).toBe('220px');
      expect(root.style.getPropertyValue('--media-menu-height')).toBe('240px');
    });
  });

  it('returns to the parent Content when a nested item is selected', async () => {
    const { root, content } = createMenu();
    const trigger = createItem('Quality');
    const submenu = document.createElement(MenuContentElement.tagName) as MenuContentElement;
    const item = createItem('Auto');

    submenu.id = 'quality-menu';
    trigger.commandfor = submenu.id;
    submenu.append(item);
    content.append(trigger, submenu);
    root.open = true;
    document.body.append(root);

    await Promise.all([root.updateComplete, content.updateComplete, submenu.updateComplete]);
    await waitForAssertion(() => expect(trigger.hasAttribute('data-highlighted')).toBe(true));
    trigger.click();
    await waitForAssertion(() => expect(submenu.open).toBe(true));
    expect(trigger.hasAttribute('data-highlighted')).toBe(false);
    item.click();

    await waitForAssertion(() => {
      expect(submenu.hasAttribute('data-ending-style')).toBe(true);
      expect(submenu.hasAttribute('inert')).toBe(true);
    });
    await waitForAssertion(() => {
      expect(content.hasAttribute('data-child-open')).toBe(false);
      expect(content.hasAttribute('inert')).toBe(false);
    });
    expect(root.open).toBe(true);
    await waitForAssertion(() => expect(submenu.hidden).toBe(true));
    expect(trigger.hasAttribute('data-highlighted')).toBe(true);
  });

  it.each(['Escape', 'ArrowLeft'])('returns to the parent Content on %s', async (key) => {
    const { root, content } = createMenu();
    const trigger = createItem('Quality');
    const submenu = document.createElement(MenuContentElement.tagName) as MenuContentElement;

    submenu.id = 'quality-menu';
    trigger.commandfor = submenu.id;
    submenu.append(createItem('Auto'));
    content.append(trigger, submenu);
    root.open = true;
    document.body.append(root);

    await Promise.all([root.updateComplete, content.updateComplete, submenu.updateComplete]);
    trigger.click();
    await waitForAssertion(() => expect(submenu.open).toBe(true));
    submenu.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    await waitForAssertion(() => expect(submenu.hidden).toBe(true));
    expect(root.open).toBe(true);
  });

  it('resets open descendant Contents when the root closes', async () => {
    const { root, content } = createMenu();
    const trigger = createItem('Quality');
    const submenu = document.createElement(MenuContentElement.tagName) as MenuContentElement;

    submenu.id = 'quality-menu';
    trigger.commandfor = submenu.id;
    submenu.append(createItem('Auto'));
    content.append(trigger, submenu);
    root.open = true;
    document.body.append(root);

    await Promise.all([root.updateComplete, content.updateComplete, submenu.updateComplete]);
    trigger.click();
    await waitForAssertion(() => expect(submenu.open).toBe(true));
    root.close();

    await waitForAssertion(() => {
      expect(root.open).toBe(false);
      expect(submenu.open).toBe(false);
    });
  });

  it('closes when focus leaves the Popup', async () => {
    const { root, content } = createMenu();
    const outside = document.createElement('button');

    root.open = true;
    content.append(createItem('Auto'));
    document.body.append(root, outside);
    await root.updateComplete;

    root.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
    await waitForAssertion(() => expect(root.open).toBe(false));
  });

  it('supports keyboard navigation inside the active Content', async () => {
    const { root, content } = createMenu();
    const first = createItem('Quality');
    const second = createItem('Speed');

    root.open = true;
    content.append(first, second);
    document.body.append(root);

    await Promise.all([root.updateComplete, content.updateComplete, first.updateComplete, second.updateComplete]);
    await waitForAssertion(() => expect(first.hasAttribute('data-highlighted')).toBe(true));
    content.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

    await waitForAssertion(() => expect(second.hasAttribute('data-highlighted')).toBe(true));
  });

  it('highlights a checked radio item without first highlighting Back', async () => {
    const { root, content } = createMenu();
    const settingsTrigger = document.createElement('button');
    const trigger = createItem('Quality');
    const submenu = document.createElement(MenuContentElement.tagName) as MenuContentElement;
    const back = createItem('Back');
    const group = document.createElement(MenuRadioGroupElement.tagName) as MenuRadioGroupElement;
    const selected = document.createElement(MenuRadioItemElement.tagName) as MenuRadioItemElement;

    root.id = 'settings-menu-highlight';
    settingsTrigger.setAttribute('commandfor', root.id);
    submenu.id = 'quality-menu-highlight';
    trigger.commandfor = submenu.id;
    group.value = '1080p';
    selected.value = '1080p';
    selected.textContent = '1080p';
    group.append(selected);
    submenu.append(back, group);
    content.append(trigger, submenu);
    root.open = true;
    document.body.append(settingsTrigger, root);

    await Promise.all([
      root.updateComplete,
      content.updateComplete,
      trigger.updateComplete,
      submenu.updateComplete,
      group.updateComplete,
      selected.updateComplete,
    ]);
    trigger.click();

    await waitForAssertion(() => {
      expect(selected.hasAttribute('data-highlighted')).toBe(true);
      expect(back.hasAttribute('data-highlighted')).toBe(false);
    });
  });

  it('relays radio-group state to its nested trigger', async () => {
    class TestMenuRadioGroupElement extends MenuRadioGroupElement {
      publish(disabled: boolean, availability: 'available' | 'unavailable', hidden = false): void {
        this.publishMenuOptionState(disabled, hidden, availability);
      }
    }
    const testTag = 'test-menu-radio-group';

    defineElement(testTag, TestMenuRadioGroupElement);
    const { root, content } = createMenu();
    const settingsTrigger = document.createElement('button');
    const trigger = createItem('Quality');
    const value = document.createElement('span');
    const submenu = document.createElement(MenuContentElement.tagName) as MenuContentElement;
    const group = document.createElement(testTag) as TestMenuRadioGroupElement;
    const selected = document.createElement(MenuRadioItemElement.tagName) as MenuRadioItemElement;

    root.id = 'settings-menu';
    settingsTrigger.setAttribute('commandfor', root.id);
    submenu.id = 'quality-menu';
    trigger.commandfor = submenu.id;
    value.dataset.part = 'value';
    group.value = 'auto';
    selected.value = 'auto';
    selected.textContent = 'Auto';
    group.append(selected);
    submenu.append(group);
    trigger.append(value);
    content.append(trigger, submenu);
    root.open = true;
    document.body.append(settingsTrigger, root);

    await Promise.all([root.updateComplete, content.updateComplete, group.updateComplete, submenu.updateComplete]);
    trigger.click();
    await waitForAssertion(() => expect(submenu.open).toBe(true));
    group.publish(true, 'unavailable');
    await waitForAssertion(() => {
      expect(submenu.open).toBe(false);
      expect(content.hasAttribute('inert')).toBe(false);
      expect(value.textContent).toBe('Auto');
    });

    expect(trigger.getAttribute('data-availability')).toBe('unavailable');
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(settingsTrigger.getAttribute('data-availability')).toBe('unavailable');
  });

  it('keeps the root open when nested option contexts refresh', async () => {
    const { root, content } = createMenu();
    const settingsTrigger = document.createElement('button');
    const trigger = createItem('Quality');
    const submenu = document.createElement(MenuContentElement.tagName) as MenuContentElement;
    const group = document.createElement(MenuRadioGroupElement.tagName) as MenuRadioGroupElement;
    const selected = document.createElement(MenuRadioItemElement.tagName) as MenuRadioItemElement;

    root.id = 'settings-menu-refresh';
    settingsTrigger.setAttribute('commandfor', root.id);
    submenu.id = 'quality-menu-refresh';
    trigger.commandfor = submenu.id;
    group.value = 'auto';
    selected.value = 'auto';
    selected.textContent = 'Auto';
    group.append(selected);
    submenu.append(group);
    content.append(trigger, submenu);
    document.body.append(settingsTrigger, root);

    await Promise.all([root.updateComplete, content.updateComplete, group.updateComplete, submenu.updateComplete]);
    settingsTrigger.click();
    await waitForAssertion(() => expect(root.open).toBe(true));

    root.requestUpdate();
    await Promise.all([root.updateComplete, content.updateComplete, submenu.updateComplete]);

    expect(root.open).toBe(true);
    expect(settingsTrigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('requests open changes before committing them', async () => {
    const { root } = createMenu();
    const onOpenChange = vi.fn((event: Event) => event.preventDefault());

    root.addEventListener('open-change', onOpenChange);
    document.body.append(root);
    await root.updateComplete;

    root.openMenu();

    expect(onOpenChange).toHaveBeenCalledOnce();
    expect(root.open).toBe(false);
  });

  it('holds a controls visibility lock while open', async () => {
    class TestPlayerProviderElement extends UIElement {
      readonly releaseControlsLock = vi.fn();
      readonly requestControlsLock = vi.fn(() => this.releaseControlsLock);
      readonly store = createStore<unknown>()<MediaControlsState>({
        name: 'controls',
        state: () => ({
          userActive: true,
          controlsVisible: true,
          requestControlsLock: this.requestControlsLock,
          toggleControls: () => true,
        }),
      }) as unknown as AnyPlayerStore;
      readonly provider = new ContextProvider(this, { context: playerContext, initialValue: this.store });

      override connectedCallback(): void {
        super.connectedCallback();
        this.provider.setValue(this.store);
        flush();
      }
    }
    const providerTag = 'test-menu-player-provider';

    defineElement(providerTag, TestPlayerProviderElement);
    const provider = document.createElement(providerTag) as TestPlayerProviderElement;
    const controls = document.createElement(ControlsElement.tagName) as ControlsElement;
    const { root } = createMenu();

    root.open = true;
    controls.append(root);
    provider.append(controls);
    document.body.append(provider);

    await waitForAssertion(() => expect(provider.requestControlsLock).toHaveBeenCalledOnce());
    root.open = false;
    await waitForAssertion(() => expect(provider.releaseControlsLock).toHaveBeenCalledOnce());
  });
});
