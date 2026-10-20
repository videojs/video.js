import type { AnyPlayerStore, PlayerTarget } from '@videojs/core/dom';
import { createHotkey, HOTKEY_SHORTCUT_CHANGE_EVENT, playbackFeature } from '@videojs/core/dom';
import { registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import { ContextProvider } from '@videojs/element/context';
import { createStore, flush } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MediaI18nProviderElement } from '../../i18n';
import { containerContext, playerContext } from '../../player/context';
import { PlayButtonElement } from '../play-button/element';
import { UIElement } from '../ui-element';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-el');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

function ensureDefined(ctor: CustomElementConstructor & { readonly tagName: string }): void {
  if (!customElements.get(ctor.tagName)) {
    customElements.define(ctor.tagName, ctor);
  }
}

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, Base);
  }
}

function createPlaybackStore(): AnyPlayerStore {
  const store = createStore<PlayerTarget>()(playbackFeature) as unknown as AnyPlayerStore;
  const video = document.createElement('video');

  Object.defineProperty(video, 'paused', { value: true, configurable: true });
  Object.defineProperty(video, 'ended', { value: false, configurable: true });
  Object.defineProperty(video, 'readyState', {
    value: HTMLMediaElement.HAVE_ENOUGH_DATA,
    configurable: true,
  });
  store.attach({ media: video, container: null });
  return store;
}

class TestContainerProviderElement extends UIElement {
  readonly provider = new ContextProvider(this, {
    context: containerContext,
    initialValue: {
      container: this,
      registerContainer: () => () => {},
    },
  });
}

class TestPlayerProviderElement extends UIElement {
  static readonly tagName = 'test-media-button-player';

  store = createPlaybackStore();

  readonly #provider = new ContextProvider(this, { context: playerContext });

  override connectedCallback(): void {
    this.#provider.setValue(this.store);
    super.connectedCallback();
  }
}

defineElement(TestPlayerProviderElement.tagName, TestPlayerProviderElement);

afterEach(() => {
  resetI18nRegistry();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('lang');
  vi.restoreAllMocks();
});

/** Runs `action`, then collects any rejection it left unhandled. */
async function collectUnhandledRejections(action: () => void): Promise<unknown[]> {
  // SAFETY: tests run on Node, and the test types omit Node's globals.
  const { process } = globalThis as unknown as {
    process: {
      on(type: string, fn: (reason: unknown) => void): void;
      off(type: string, fn: (reason: unknown) => void): void;
    };
  };
  const reasons: unknown[] = [];
  const onRejection = (reason: unknown) => reasons.push(reason);

  process.on('unhandledRejection', onRejection);

  try {
    action();
    await new Promise((resolve) => setTimeout(resolve, 0));
  } finally {
    process.off('unhandledRejection', onRejection);
  }

  return reasons;
}

describe('MediaButtonElement', () => {
  it('absorbs a refused play request instead of leaving it unhandled', async () => {
    ensureDefined(PlayButtonElement);

    const player = document.createElement(TestPlayerProviderElement.tagName) as TestPlayerProviderElement;
    const button = document.createElement(PlayButtonElement.tagName) as PlayButtonElement;
    const video = player.store.target!.media as HTMLVideoElement;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Not a `vi.fn`: Vitest attaches handlers to a mock's results, which would mark the rejection handled.
    video.play = () => Promise.reject(new DOMException('Autoplay refused', 'NotAllowedError'));

    document.body.append(player);
    player.append(button);
    await button.updateComplete;

    const reasons = await collectUnhandledRejections(() => button.click());

    expect(reasons).toEqual([]);
    expect(error).toHaveBeenCalledWith(`[${PlayButtonElement.tagName}]`, expect.any(DOMException));
  });

  it('resolves its label before the first update', () => {
    ensureDefined(PlayButtonElement);

    const player = document.createElement(TestPlayerProviderElement.tagName) as TestPlayerProviderElement;
    const button = document.createElement(PlayButtonElement.tagName) as PlayButtonElement;

    document.body.append(player);
    player.append(button);

    expect(button.getResolvedLabel()).toBe('Play');
  });

  it('emits shortcut changes before media is attached', async () => {
    const provider = createElement(TestContainerProviderElement);
    const button = createElement(PlayButtonElement);
    const onShortcutChange = vi.fn();

    button.addEventListener(HOTKEY_SHORTCUT_CHANGE_EVENT, onShortcutChange);
    provider.append(button);
    document.body.append(provider);

    await button.updateComplete;

    createHotkey(provider, {
      keys: 'k',
      action: 'togglePaused',
      onActivate: () => {},
    });

    await button.updateComplete;

    expect(onShortcutChange).toHaveBeenCalledTimes(1);
    expect(button.getShortcut()).toBe('K');
  });

  it('applies translated aria-label and updates on locale change', async () => {
    registerI18n('es', { 'buttons.play': 'Reproducir' });
    registerI18n('fr', { 'buttons.play': 'Lire' });

    ensureDefined(PlayButtonElement);
    ensureDefined(MediaI18nProviderElement);

    const player = document.createElement(TestPlayerProviderElement.tagName) as TestPlayerProviderElement;
    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'es');
    const button = document.createElement(PlayButtonElement.tagName) as PlayButtonElement;

    document.body.append(player);
    player.append(provider);
    provider.append(button);

    await button.updateComplete;
    expect(button.getAttribute('aria-label')).toBe('Reproducir');

    provider.setAttribute('lang', 'fr');
    await vi.waitFor(() => {
      expect(button.getAttribute('aria-label')).toBe('Lire');
    });

    flush();
  });
});
