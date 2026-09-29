import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaFullscreenState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { containerContext, playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { FullscreenButtonElement } from '../element';

class TestFullscreenProvider extends UIElement {
  readonly requestFullscreen = vi.fn();
  readonly store = createStore<unknown>()<MediaFullscreenState>({
    name: 'fullscreen',
    state: () => ({
      isFullscreen: false,
      fullscreenAvailability: 'available',
      requestFullscreen: this.requestFullscreen,
      exitFullscreen: vi.fn(),
    }),
  }) as unknown as AnyPlayerStore;
  readonly containerProvider: ContextProvider<typeof containerContext> = new ContextProvider(this, {
    context: containerContext,
    initialValue: { container: this, registerContainer: () => () => {} },
  });
  readonly playerProvider = new ContextProvider(this, { context: playerContext });

  override connectedCallback(): void {
    this.playerProvider.setValue(this.store);
    super.connectedCallback();
  }
}

beforeAll(() => {
  customElements.define('test-fullscreen-provider', TestFullscreenProvider);
  customElements.define(FullscreenButtonElement.tagName, FullscreenButtonElement);
});

afterEach(() => {
  document.body.innerHTML = '';
});

function setup() {
  const provider = document.createElement('test-fullscreen-provider') as TestFullscreenProvider;
  const button = document.createElement(FullscreenButtonElement.tagName) as FullscreenButtonElement;

  provider.tabIndex = 0;
  document.body.append(provider);
  provider.append(button);

  return { provider, button };
}

describe('FullscreenButtonElement', () => {
  it('returns pointer focus to the player container', () => {
    const { provider, button } = setup();

    button.focus();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));

    expect(document.activeElement).toBe(provider);
    expect(provider.requestFullscreen).toHaveBeenCalledOnce();
  });

  it('preserves button focus for keyboard activation', () => {
    const { provider, button } = setup();

    button.focus();
    button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));

    expect(document.activeElement).toBe(button);
    expect(provider.requestFullscreen).toHaveBeenCalledOnce();
  });

  it('preserves button focus for virtual activation', () => {
    const { provider, button } = setup();

    button.focus();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 }));

    expect(document.activeElement).toBe(button);
    expect(provider.requestFullscreen).toHaveBeenCalledOnce();
  });
});
