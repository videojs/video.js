import { type AnyPlayerStore, createHotkey } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { containerContext, playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { AriaKeyShortcutsController } from '../aria-key-shortcuts-controller';
import { HotkeyElement } from '../element';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-el');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

afterEach(() => {
  document.body.innerHTML = '';
});

class TestHotkeyProviderElement extends UIElement {
  readonly store = { state: { volume: 0.5, muted: false, setVolume: vi.fn() }, subscribe: () => () => {} };
  readonly containerProvider = new ContextProvider(this, {
    context: containerContext,
    initialValue: { container: this, registerContainer: () => () => {} },
  });
  readonly playerProvider = new ContextProvider(this, {
    context: playerContext,
    initialValue: this.store as unknown as AnyPlayerStore,
  });
}

if (!customElements.get('test-hotkey-provider')) {
  customElements.define('test-hotkey-provider', TestHotkeyProviderElement);
}

describe('HotkeyElement', () => {
  it('has the correct tag name', () => {
    expect(HotkeyElement.tagName).toBe('media-hotkey');
  });

  it('initializes with default property values', () => {
    const el = createElement(HotkeyElement);

    expect(el.keys).toBe('');
    expect(el.action).toBe('');
    expect(el.value).toBeUndefined();
    expect(el.disabled).toBe(false);
    expect(el.target).toBe('player');
  });

  it('is hidden when connected', () => {
    const el = createElement(HotkeyElement);

    document.body.appendChild(el);

    expect(el.style.display).toBe('none');
  });

  it('registers the default ArrowDown volume step', async () => {
    const provider = document.createElement('test-hotkey-provider') as TestHotkeyProviderElement;
    const el = createElement(HotkeyElement);

    el.keys = 'ArrowDown';
    el.action = 'volumeStep';
    provider.append(el);
    document.body.append(provider);
    await el.updateComplete;

    provider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    expect(provider.store.state.setVolume).toHaveBeenCalledExactlyOnceWith(0.45);
  });
});

describe('AriaKeyShortcutsController', () => {
  class TestContainerProviderElement extends UIElement {
    readonly provider = new ContextProvider(this, {
      context: containerContext,
      initialValue: {
        container: this,
        registerContainer: () => () => {},
      },
    });
  }

  it('returns undefined without container context', () => {
    const el = createElement(HotkeyElement);

    document.body.appendChild(el);

    const controller = new AriaKeyShortcutsController(el, 'togglePaused');

    expect(controller.value).toBeUndefined();
  });

  it('connects when context is available during construction', async () => {
    const provider = createElement(TestContainerProviderElement);
    const el = createElement(HotkeyElement);

    provider.append(el);
    document.body.append(provider);
    await el.updateComplete;

    let controller!: AriaKeyShortcutsController;

    expect(() => {
      controller = new AriaKeyShortcutsController(el, 'togglePaused');
    }).not.toThrow();

    const requestUpdate = vi.spyOn(el, 'requestUpdate');
    const cleanup = createHotkey(provider, { keys: 'k', action: 'togglePaused', onActivate: vi.fn() });

    expect(requestUpdate).toHaveBeenCalledOnce();
    expect(controller.shortcut).toBe('K');

    cleanup();
  });
});
