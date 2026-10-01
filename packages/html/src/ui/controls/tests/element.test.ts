import { POPUP_HOST_ATTR } from '@videojs/core';
import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaControlsState } from '@videojs/media';
import { createStore, flush } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { MenuElement } from '../../menu/element';
import { PopoverElement } from '../../popover/element';
import { TooltipElement } from '../../tooltip/element';
import { UIElement } from '../../ui-element';
import { ControlsBackdropElement } from '../backdrop';
import { ControlsContentElement } from '../content';
import { ControlsElement } from '../element';

function ensureCustomElementDefined(Constructor: CustomElementConstructor & { readonly tagName: string }): void {
  const { tagName } = Constructor;

  if (!customElements.get(tagName)) {
    customElements.define(tagName, Constructor);
  }
}

function createDefinedElement<Class extends CustomElementConstructor & { readonly tagName: string }>(
  Constructor: Class
): InstanceType<Class> {
  ensureCustomElementDefined(Constructor);
  return document.createElement(Constructor.tagName) as InstanceType<Class>;
}

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, Base);
  }
}

function createControlsStore(): AnyPlayerStore {
  return createStore<unknown>()<MediaControlsState>({
    name: 'controls',
    state: ({ get, set }) => {
      return {
        userActive: true,
        controlsVisible: true,
        requestControlsLock: () => () => {},
        toggleControls() {
          const visible = !(get().controlsVisible as boolean);

          set({ userActive: visible, controlsVisible: visible });

          return visible;
        },
      };
    },
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  store = createControlsStore();

  readonly #provider = new ContextProvider(this, { context: playerContext, initialValue: this.store });

  override connectedCallback(): void {
    super.connectedCallback();
    this.#provider.setValue(this.store);
  }

  setVisible(visible: boolean): void {
    const state = this.store.state as MediaControlsState;
    if (state.controlsVisible === visible) return;

    state.toggleControls();
    flush();
  }
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

defineElement('test-controls-player-provider', TestPlayerProviderElement);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ControlsElement', () => {
  it('keeps controls visible without controls state when requested', async () => {
    const controls = createDefinedElement(ControlsElement);
    const content = createDefinedElement(ControlsContentElement);

    controls.visibility = 'always';
    controls.append(content);
    document.body.append(controls);

    await controls.updateComplete;

    expect(content.hasAttribute('data-visible')).toBe(true);
    expect(content.hasAttribute('data-user-active')).toBe(true);
  });

  it('keeps controls visible while preserving user activity when requested', async () => {
    const provider = document.createElement('test-controls-player-provider') as TestPlayerProviderElement;
    const controls = createDefinedElement(ControlsElement);
    const content = createDefinedElement(ControlsContentElement);

    controls.visibility = 'always';
    controls.append(content);
    document.body.append(provider);
    provider.append(controls);

    await controls.updateComplete;

    provider.setVisible(false);

    await waitForAssertion(() => {
      expect(content.hasAttribute('data-visible')).toBe(true);
      expect(content.hasAttribute('data-user-active')).toBe(false);
    });
  });

  it('keeps interactivity on the content rather than the context host', async () => {
    const provider = document.createElement('test-controls-player-provider') as TestPlayerProviderElement;
    const controls = createDefinedElement(ControlsElement);
    const content = createDefinedElement(ControlsContentElement);

    controls.append(content);

    document.body.append(provider);
    provider.append(controls);

    await controls.updateComplete;

    await waitForAssertion(() => {
      expect(controls.hasAttribute('data-interactive')).toBe(false);
      expect(content.hasAttribute('data-interactive')).toBe(true);
      expect(content.hasAttribute('data-visible')).toBe(true);
      expect(content.hasAttribute('data-user-active')).toBe(true);
    });
  });

  it('closes owned popovers, menus, and tooltips when controls hide', async () => {
    const provider = document.createElement('test-controls-player-provider') as TestPlayerProviderElement;
    const controls = createDefinedElement(ControlsElement);
    const popover = createDefinedElement(PopoverElement);
    const menu = createDefinedElement(MenuElement);
    const playbackRateMenu = createDefinedElement(MenuElement);
    const tooltip = createDefinedElement(TooltipElement);
    const dialog = document.createElement('dialog');
    const popoverClose = vi.spyOn(popover, 'close');
    const menuClose = vi.spyOn(menu, 'close');
    const playbackRateMenuClose = vi.spyOn(playbackRateMenu, 'close');
    const tooltipClose = vi.spyOn(tooltip, 'close');
    const dialogClose = vi.spyOn(dialog, 'close');

    controls.append(popover, menu, playbackRateMenu, tooltip, dialog);
    document.body.append(provider);
    provider.append(controls);

    await controls.updateComplete;

    expect(popover.hasAttribute(POPUP_HOST_ATTR)).toBe(true);
    expect(menu.hasAttribute(POPUP_HOST_ATTR)).toBe(true);
    expect(playbackRateMenu.hasAttribute(POPUP_HOST_ATTR)).toBe(true);
    expect(tooltip.hasAttribute(POPUP_HOST_ATTR)).toBe(true);

    provider.setVisible(false);

    await waitForAssertion(() => {
      expect(popoverClose).toHaveBeenCalledWith('imperative-action');
      expect(menuClose).toHaveBeenCalledWith('imperative-action');
      expect(playbackRateMenuClose).toHaveBeenCalledWith('imperative-action');
      expect(tooltipClose).toHaveBeenCalledWith('imperative-action');
    });

    expect(dialogClose).not.toHaveBeenCalled();
  });

  it('ignores popup host markers when close is missing or not a function', async () => {
    const provider = document.createElement('test-controls-player-provider') as TestPlayerProviderElement;
    const controls = createDefinedElement(ControlsElement);
    const withoutClose = document.createElement('div');

    withoutClose.setAttribute(POPUP_HOST_ATTR, '');
    const wrongClose = document.createElement('div');

    wrongClose.setAttribute(POPUP_HOST_ATTR, '');
    Object.assign(wrongClose, { close: 'not-callable' });

    controls.append(withoutClose, wrongClose);
    document.body.append(provider);
    provider.append(controls);

    await controls.updateComplete;

    expect(controls.hasAttribute('data-visible')).toBe(true);

    provider.setVisible(false);

    await expect(controls.updateComplete).resolves.toBe(true);
    expect(controls.hasAttribute('data-visible')).toBe(false);
  });
});

describe('ControlsBackdropElement', () => {
  it('is presentational and receives controls state attributes', async () => {
    const provider = document.createElement('test-controls-player-provider') as TestPlayerProviderElement;
    const controls = createDefinedElement(ControlsElement);
    const backdrop = createDefinedElement(ControlsBackdropElement);

    controls.append(backdrop);

    document.body.append(provider);
    provider.append(controls);
    await controls.updateComplete;

    await waitForAssertion(() => {
      expect(backdrop.getAttribute('role')).toBe('presentation');
      expect(backdrop.getAttribute('aria-hidden')).toBe('true');
      expect(backdrop.hasAttribute('data-visible')).toBe(true);
      expect(backdrop.hasAttribute('data-user-active')).toBe(true);
    });
  });
});
