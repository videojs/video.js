import type { AnyPlayerStore } from '@videojs/core/dom';
import { registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import { ContextProvider } from '@videojs/element/context';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MediaI18nProviderElement } from '../../../i18n';
import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { LiveButtonElement } from '../element';

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, Base);
  }
}

function createLiveStore(): AnyPlayerStore {
  return createStore<unknown>()({
    name: 'liveButton',
    state: () => ({
      liveEdgeStart: 90,
      targetLiveWindow: 0,
      currentTime: 80,
      duration: 100,
      seeking: false,
      seek: vi.fn(),
      buffered: [],
      seekable: [[0, 100]],
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  readonly #provider = new ContextProvider(this, { context: playerContext });

  setStore(store: AnyPlayerStore): void {
    this.#provider.setValue(store);
  }
}

defineElement(LiveButtonElement.tagName, LiveButtonElement);
defineElement(MediaI18nProviderElement.tagName, MediaI18nProviderElement);
defineElement('test-live-button-player', TestPlayerProviderElement);

function setup(locale: string, text?: string) {
  const i18n = new MediaI18nProviderElement();
  const player = document.createElement('test-live-button-player') as TestPlayerProviderElement;
  const button = document.createElement(LiveButtonElement.tagName) as LiveButtonElement;

  i18n.setAttribute('lang', locale);
  player.setStore(createLiveStore());

  if (text) button.textContent = text;

  player.append(button);
  i18n.append(player);
  document.body.append(i18n);

  return { i18n, button };
}

afterEach(() => {
  resetI18nRegistry();
  document.body.innerHTML = '';
});

describe('LiveButtonElement', () => {
  it('translates the default badge and updates when locale changes', async () => {
    registerI18n('es', { 'live.badge': 'En vivo' });
    registerI18n('fr', { 'live.badge': 'Direct' });
    const { i18n, button } = setup('es');

    await button.updateComplete;
    expect(button.textContent).toBe('En vivo');

    i18n.setAttribute('lang', 'fr');
    await vi.waitFor(() => {
      expect(button.textContent).toBe('Direct');
    });
  });

  it('preserves authored badge copy', async () => {
    registerI18n('es', { 'live.badge': 'En vivo' });
    const { button } = setup('es', 'On air');

    await button.updateComplete;
    expect(button.textContent).toBe('On air');
  });
});
