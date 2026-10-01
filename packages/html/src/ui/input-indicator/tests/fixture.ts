import type { HotkeyActionName } from '@videojs/core';
import { getHotkeyCoordinator, type PlayerTarget } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import { createStore } from '@videojs/store';
import { vi } from 'vite-plus/test';

import { containerContext, playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';

class IndicatorPlayer extends UIElement {
  readonly store = createStore<PlayerTarget>()({
    name: 'indicator',
    state: () => ({
      paused: true,
      ended: false,
      started: false,
      waiting: false,
      play: async () => {},
      pause: () => {},
      volume: 0.5,
      muted: false,
      setVolume: async () => {},
      setMuted: async () => {},
      currentTime: 30,
      duration: 120,
      seeking: false,
      seek: async () => {},
    }),
  });

  readonly #player = new ContextProvider(this, { context: playerContext });
  readonly #container = new ContextProvider(this, { context: containerContext });

  override connectedCallback(): void {
    this.#player.setValue(this.store);
    this.#container.setValue({ container: this, registerContainer: () => () => {} });
    super.connectedCallback();
  }
}

customElements.define('test-indicator-player', IndicatorPlayer);

export async function mountIndicator<Element extends UIElement>(element: Element, markup: string) {
  const player = new IndicatorPlayer();

  element.innerHTML = markup;
  player.append(element);
  document.body.append(player);
  await element.updateComplete;

  const unbind: (() => void)[] = [];
  const input = async (key: string, action: HotkeyActionName, value?: number) => {
    unbind.push(getHotkeyCoordinator(player).add({ keys: key, action, value, onActivate: () => {} }));
    player.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await element.updateComplete;
  };

  return {
    element,
    input,
    dispose() {
      for (const remove of unbind) remove();

      element.destroy();
      player.remove();
    },
  };
}

export function controlFrames() {
  let nextId = 0;
  const callbacks = new Map<number, FrameRequestCallback>();

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callbacks.set(++nextId, callback);
    return nextId;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));

  return async () => {
    const frame = [...callbacks.values()];

    callbacks.clear();

    for (const callback of frame) callback(0);

    await Promise.resolve();
  };
}
