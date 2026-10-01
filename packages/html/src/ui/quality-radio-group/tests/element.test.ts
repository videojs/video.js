import type { AnyPlayerStore } from '@videojs/core/dom';
import { registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import { ContextProvider } from '@videojs/element/context';
import type { MediaQualityState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MediaI18nProviderElement } from '../../../i18n/provider-element';
import { playerContext } from '../../../player/context';
import { MenuElement } from '../../menu/element';
import { MenuItemIndicatorElement } from '../../menu/item-indicator';
import { MenuRadioGroupElement } from '../../menu/radio-group';
import { MenuRadioItemElement } from '../../menu/radio-item';
import { UIElement } from '../../ui-element';
import { QualityRadioGroupElement } from '../element';

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

function createQualityStore({
  videoRenditionList = [
    { id: '0', height: 1080, selected: false },
    { id: '1', height: 720, selected: false },
  ],
  activeVideoRendition = null,
  selectVideoRendition = vi.fn(),
}: {
  videoRenditionList?: MediaQualityState['videoRenditionList'] | undefined;
  activeVideoRendition?: MediaQualityState['activeVideoRendition'] | undefined;
  selectVideoRendition?: MediaQualityState['selectVideoRendition'] | undefined;
} = {}): AnyPlayerStore {
  return createStore<unknown>()<MediaQualityState>({
    name: 'quality',
    state: () => ({
      videoRenditionList,
      activeVideoRendition,
      selectVideoRendition,
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  store: AnyPlayerStore = createQualityStore();

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
defineElement(QualityRadioGroupElement.tagName, QualityRadioGroupElement);
defineElement(MediaI18nProviderElement.tagName, MediaI18nProviderElement);
defineElement('test-quality-player', TestPlayerProviderElement);

function setup({
  videoRenditionList,
  activeVideoRendition,
  selectVideoRendition,
  template,
  locale,
}: {
  videoRenditionList?: MediaQualityState['videoRenditionList'] | undefined;
  activeVideoRendition?: MediaQualityState['activeVideoRendition'] | undefined;
  selectVideoRendition?: MediaQualityState['selectVideoRendition'] | undefined;
  template?: string | undefined;
  locale?: string | undefined;
} = {}) {
  const store = createQualityStore({ videoRenditionList, activeVideoRendition, selectVideoRendition });
  const i18n = new MediaI18nProviderElement();
  const provider = document.createElement('test-quality-player') as TestPlayerProviderElement;
  const menu = createElement(MenuElement);
  const options = createElement(QualityRadioGroupElement);

  if (locale) i18n.setAttribute('lang', locale);

  provider.setStore(store);

  if (template) {
    const templateElement = document.createElement('template');

    templateElement.innerHTML = template;
    options.append(templateElement);
  }

  menu.append(options);
  provider.append(menu);
  i18n.append(provider);
  document.body.append(i18n);

  return { menu, options };
}

async function waitForMenu(menu: MenuElement, options?: QualityRadioGroupElement): Promise<void> {
  await menu.updateComplete;
  await options?.updateComplete;

  const group = menu.querySelector<QualityRadioGroupElement>(QualityRadioGroupElement.tagName);

  await group?.updateComplete;

  const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];
  const indicators = [...menu.querySelectorAll<MenuItemIndicatorElement>(MenuItemIndicatorElement.tagName)];

  await Promise.all(items.map((item) => item.updateComplete));
  await Promise.all(indicators.map((indicator) => indicator.updateComplete));
}

afterEach(() => {
  resetI18nRegistry();
  document.body.innerHTML = '';
});

describe('QualityRadioGroupElement', () => {
  it('renders Auto and rendition radio items', async () => {
    const { menu, options } = setup();

    await waitForMenu(menu, options);

    const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

    expect(items.map((item) => item.textContent)).toEqual(['Auto', '1080p HD', '720p']);
    await waitForAssertion(() => {
      expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    });
  });

  it('renders the active rendition in the Auto label', async () => {
    const { menu, options } = setup({
      activeVideoRendition: { id: '1', height: 720, selected: false },
      template:
        '<media-menu-radio-item><span data-part="label"></span><media-menu-item-indicator force-mount></media-menu-item-indicator></media-menu-radio-item>',
    });

    await waitForMenu(menu, options);

    const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

    expect(items[0]?.querySelector('[data-part~="label"]')?.textContent).toBe('Auto (720p)');
  });

  it('refreshes translated items when registry strings load for the active locale', async () => {
    const { menu, options } = setup({ locale: 'x-test-quality' });

    await waitForMenu(menu, options);

    registerI18n('x-test-quality', { 'menu.auto': 'Automatique' });

    await waitForAssertion(() => {
      const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

      expect(items[0]?.textContent).toBe('Automatique');
    });
  });

  it('renders bitrate badges from a template', async () => {
    const { menu, options } = setup({
      videoRenditionList: [
        { id: '0', height: 1080, bitrate: 6_000_000, selected: false },
        { id: '1', height: 1080, bitrate: 3_000_000, selected: false },
        { id: '2', height: 720, bitrate: 1_500_000, selected: false },
      ],
      template:
        '<media-menu-radio-item><span data-part="label"></span><sup data-part="tier"></sup><span data-part="badge"></span><media-menu-item-indicator force-mount></media-menu-item-indicator></media-menu-radio-item>',
    });

    await waitForMenu(menu, options);

    const items = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];
    const tiers = items.map((item) => item.querySelector<HTMLElement>('[data-part~="tier"]'));
    const badges = items.map((item) => item.querySelector<HTMLElement>('[data-part~="badge"]'));

    expect(items.map((item) => item.querySelector('[data-part~="label"]')?.textContent)).toEqual([
      'Auto',
      '1080p',
      '1080p',
      '720p',
    ]);
    expect(tiers.map((tier) => tier?.textContent)).toEqual(['', 'HD', 'HD', '']);
    expect(tiers.map((tier) => tier?.hidden)).toEqual([true, false, false, true]);
    expect(badges.map((badge) => badge?.textContent)).toEqual(['', '6 Mbps', '3 Mbps', '']);
    expect(badges.map((badge) => badge?.hidden)).toEqual([true, false, false, true]);
  });

  it('sets the selected rendition', async () => {
    const selectVideoRendition = vi.fn();
    const { menu, options } = setup({ selectVideoRendition });

    await waitForMenu(menu, options);

    const item = [...menu.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)].find(
      (candidate) => candidate.value === '1'
    )!;

    item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(selectVideoRendition).toHaveBeenCalledWith('1');
  });
});
