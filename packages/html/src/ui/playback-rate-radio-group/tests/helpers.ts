import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaFeatureAvailability, MediaPlaybackRateState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { MenuElement } from '../../menu/element';
import { MenuItemIndicatorElement } from '../../menu/item-indicator';
import { MenuRadioGroupElement } from '../../menu/radio-group';
import { MenuRadioItemElement } from '../../menu/radio-item';
import { PlaybackRateButtonElement } from '../../playback-rate-button/element';
import { UIElement } from '../../ui-element';
import { PlaybackRateRadioGroupElement } from '../element';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-el');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, Base);
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function waitForAssertion(assertion: () => void): Promise<void> {
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

interface PlaybackRateStoreOptions {
  playbackRates?: readonly number[] | undefined;
  playbackRate?: number | undefined;
  playbackRateAvailability?: MediaFeatureAvailability | undefined;
  setPlaybackRate?: ((rate: number) => void) | undefined;
}

function createPlaybackRateStore({
  playbackRates = [0.5, 1, 1.5, 2],
  playbackRate = 1.5,
  playbackRateAvailability = 'available',
  setPlaybackRate = vi.fn(),
}: PlaybackRateStoreOptions = {}): AnyPlayerStore {
  return createStore<unknown>()<MediaPlaybackRateState>({
    name: 'playbackRate',
    state: () => {
      return {
        playbackRates,
        playbackRate,
        playbackRateAvailability,
        setPlaybackRate,
      };
    },
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  store: AnyPlayerStore = createPlaybackRateStore();

  readonly #provider = new ContextProvider(this, { context: playerContext });

  override connectedCallback(): void {
    this.#provider.setValue(this.store);
    super.connectedCallback();
  }

  setStore(store: AnyPlayerStore): void {
    this.store = store;
    this.#provider.setValue(store);
  }
}

defineElement(MenuElement.tagName, MenuElement);
defineElement(MenuRadioGroupElement.tagName, MenuRadioGroupElement);
defineElement(MenuRadioItemElement.tagName, MenuRadioItemElement);
defineElement(MenuItemIndicatorElement.tagName, MenuItemIndicatorElement);
defineElement(PlaybackRateRadioGroupElement.tagName, PlaybackRateRadioGroupElement);
defineElement(PlaybackRateButtonElement.tagName, PlaybackRateButtonElement);
defineElement('test-playback-rate-player', TestPlayerProviderElement);

export function setup(storeOptions: PlaybackRateStoreOptions = {}) {
  const store = createPlaybackRateStore(storeOptions);
  const provider = document.createElement('test-playback-rate-player') as TestPlayerProviderElement;
  const trigger = createElement(PlaybackRateButtonElement);
  const menu = createElement(MenuElement);
  const options = createElement(PlaybackRateRadioGroupElement);

  provider.setStore(store);
  menu.id = 'playback-rate-menu';
  trigger.setAttribute('commandfor', 'playback-rate-menu');

  menu.append(options);
  provider.append(trigger, menu);
  document.body.append(provider);

  return { menu, options, provider, store, trigger };
}

export async function waitForMenu(
  menu: MenuElement,
  trigger?: PlaybackRateButtonElement,
  options?: PlaybackRateRadioGroupElement
): Promise<void> {
  await trigger?.updateComplete;
  await menu.updateComplete;
  await options?.updateComplete;

  const group = menu.querySelector<PlaybackRateRadioGroupElement>(PlaybackRateRadioGroupElement.tagName);

  await group?.updateComplete;

  const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];
  const indicators = [...menu.querySelectorAll<MenuItemIndicatorElement>(MenuItemIndicatorElement.tagName)];

  await Promise.all(items.map((item) => item.updateComplete));
  await Promise.all(indicators.map((indicator) => indicator.updateComplete));
}
