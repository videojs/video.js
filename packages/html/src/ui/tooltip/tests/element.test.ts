import type { ButtonState } from '@videojs/core';
import type { AnyPlayerStore, PlayerTarget } from '@videojs/core/dom';
import { HOTKEY_SHORTCUT_CHANGE_EVENT, playbackFeature } from '@videojs/core/dom';
import { registerI18n, resetI18nRegistry, resolveText, type Text } from '@videojs/core/i18n';
import { ContextProvider } from '@videojs/element/context';
import { createState, createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MediaI18nProviderElement } from '../../../i18n';
import { playerContext } from '../../../player/context';
import { PlayButtonElement } from '../../play-button/element';
import { UIElement } from '../../ui-element';
import { TooltipElement } from '../element';
import { TooltipLabelElement } from '../label';
import { TooltipShortcutElement } from '../shortcut';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-el');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
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

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, Base);
  }
}

function ensureDefined(ctor: CustomElementConstructor & { readonly tagName: string }): void {
  defineElement(ctor.tagName, ctor);
}

class TestTriggerElement extends HTMLElement {
  $state = createState<ButtonState>({ label: 'Play' });
  shortcut: string | undefined = 'K';

  getLabel(): string | undefined {
    return this.$state.current.label ? resolveText(this.$state.current.label) : undefined;
  }

  getShortcut(): string | undefined {
    return this.shortcut;
  }
}

class TestPlayerProviderElement extends UIElement {
  static readonly tagName = 'test-tooltip-player';

  store = createPlaybackStore();

  readonly #provider = new ContextProvider(this, { context: playerContext });

  override connectedCallback(): void {
    this.#provider.setValue(this.store);
    super.connectedCallback();
  }
}

function defineTestElements(): void {
  defineElement('test-tooltip-trigger', TestTriggerElement);
  ensureDefined(TooltipLabelElement);
  ensureDefined(TooltipShortcutElement);
}

function setup() {
  defineTestElements();

  const trigger = document.createElement('test-tooltip-trigger') as TestTriggerElement;
  const tooltip = createElement(TooltipElement);

  tooltip.id = 'tooltip';
  trigger.setAttribute('commandfor', tooltip.id);
  document.body.append(trigger, tooltip);

  return { tooltip, trigger };
}

defineElement(TestPlayerProviderElement.tagName, TestPlayerProviderElement);

afterEach(() => {
  vi.restoreAllMocks();
  resetI18nRegistry();
  document.body.innerHTML = '';
});

describe('TooltipElement', () => {
  it('uses an explicit trigger that already controls another popup', async () => {
    defineTestElements();
    const trigger = document.createElement('test-tooltip-trigger') as TestTriggerElement;
    const tooltip = createElement(TooltipElement);

    trigger.id = 'settings-trigger';
    trigger.setAttribute('commandfor', 'settings-menu');
    tooltip.trigger = trigger.id;
    document.body.append(trigger, tooltip);

    await tooltip.updateComplete;

    expect(TooltipLabelElement.findIn(tooltip)?.textContent).toBe('Play');
  });

  it('exposes the positioned side on the popup', async () => {
    const { tooltip, trigger } = setup();

    tooltip.open = true;
    tooltip.side = 'top';
    tooltip.boundary = 'viewport';

    vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(new DOMRect(100, 10, 40, 20));
    vi.spyOn(tooltip, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 60));
    vi.spyOn(document.documentElement, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 300, 200));
    Object.defineProperty(tooltip, 'offsetWidth', { configurable: true, value: 100 });
    Object.defineProperty(tooltip, 'offsetHeight', { configurable: true, value: 60 });

    await tooltip.updateComplete;

    expect(tooltip.getAttribute('data-side')).toBe('bottom');
  });

  it('creates default label and shortcut elements for empty tooltips', async () => {
    const { tooltip } = setup();

    await tooltip.updateComplete;

    const label = TooltipLabelElement.findIn(tooltip);
    const shortcut = TooltipShortcutElement.findIn(tooltip);

    expect(label?.localName).toBe(TooltipLabelElement.tagName);
    expect(label?.textContent).toBe('Play');
    expect(shortcut?.localName).toBe(TooltipShortcutElement.tagName);
    expect(shortcut?.textContent).toBe('K');
    expect(shortcut?.hidden).toBe(false);
  });

  it('syncs label and shortcut onto existing compound parts', async () => {
    const { tooltip } = setup();
    const labelEl = TooltipLabelElement.create();
    const shortcutEl = TooltipShortcutElement.create();

    tooltip.replaceChildren(document.createTextNode('Action: '), labelEl, shortcutEl);

    await tooltip.updateComplete;

    const label = TooltipLabelElement.findIn(tooltip);

    expect(tooltip.textContent).toBe('Action: PlayK');
    expect(label?.textContent).toBe('Play');
    expect(TooltipShortcutElement.findIn(tooltip)?.textContent).toBe('K');
  });

  it('preserves authored label content', async () => {
    const { tooltip } = setup();
    const labelEl = TooltipLabelElement.create();
    const shortcutEl = TooltipShortcutElement.create();

    labelEl.textContent = 'Custom label';
    tooltip.replaceChildren(labelEl, shortcutEl);

    await tooltip.updateComplete;

    expect(TooltipLabelElement.findIn(tooltip)?.textContent).toBe('Custom label');
    expect(TooltipShortcutElement.findIn(tooltip)?.textContent).toBe('K');
  });

  it('preserves authored content without tooltip parts', async () => {
    const { tooltip } = setup();

    tooltip.textContent = 'Custom tooltip';

    await tooltip.updateComplete;

    expect(tooltip.textContent).toBe('Custom tooltip');
  });

  it('updates shortcut text when the trigger shortcut changes', async () => {
    const { tooltip, trigger } = setup();

    await tooltip.updateComplete;

    trigger.shortcut = 'P';
    trigger.dispatchEvent(new CustomEvent(HOTKEY_SHORTCUT_CHANGE_EVENT));

    expect(TooltipShortcutElement.findIn(tooltip)?.textContent).toBe('P');
  });

  it('hides shortcut part when the trigger shortcut is cleared', async () => {
    const { tooltip, trigger } = setup();

    await tooltip.updateComplete;

    trigger.shortcut = undefined;
    trigger.dispatchEvent(new CustomEvent(HOTKEY_SHORTCUT_CHANGE_EVENT));

    const shortcut = TooltipShortcutElement.findIn(tooltip);

    expect(shortcut?.textContent).toBe('');
    expect(shortcut?.hidden).toBe(true);
  });

  it('updates tooltip text when provider locale changes', async () => {
    registerI18n('es', { 'buttons.play': 'Reproducir' });
    registerI18n('fr', { 'buttons.play': 'Lire' });

    ensureDefined(TestPlayerProviderElement);
    ensureDefined(PlayButtonElement);
    ensureDefined(TooltipElement);
    ensureDefined(MediaI18nProviderElement);

    const player = document.createElement(TestPlayerProviderElement.tagName) as TestPlayerProviderElement;
    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'es');

    const button = document.createElement(PlayButtonElement.tagName) as PlayButtonElement;

    button.setAttribute('commandfor', 'tip');

    const tooltip = document.createElement(TooltipElement.tagName) as TooltipElement;

    tooltip.id = 'tip';
    tooltip.setAttribute('open', '');

    document.body.append(player);
    player.append(provider);
    provider.append(button, tooltip);

    await button.updateComplete;
    await tooltip.updateComplete;
    expect(TooltipLabelElement.findIn(tooltip)?.textContent).toBe('Reproducir');

    provider.setAttribute('lang', 'fr');
    await provider.updateComplete;
    await button.updateComplete;
    await tooltip.updateComplete;

    expect(TooltipLabelElement.findIn(tooltip)?.textContent).toBe('Lire');
  });

  it('falls back to translating Text from getLabel when getResolvedLabel is undefined', async () => {
    registerI18n('es', { 'buttons.play': 'Reproducir' });

    class StubTrigger extends HTMLElement {
      static readonly tagName = 'stub-tooltip-trigger';

      readonly $state = { subscribe: () => () => {} };

      getLabel(): Text {
        return { key: 'buttons.play', text: 'Play' };
      }

      getResolvedLabel(): undefined {
        return undefined;
      }
    }

    defineElement(StubTrigger.tagName, StubTrigger);
    ensureDefined(TooltipElement);
    ensureDefined(MediaI18nProviderElement);

    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'es');

    const trigger = document.createElement(StubTrigger.tagName) as StubTrigger;

    trigger.setAttribute('commandfor', 'tip');

    const tooltip = document.createElement(TooltipElement.tagName) as TooltipElement;

    tooltip.id = 'tip';
    tooltip.setAttribute('open', '');

    document.body.append(provider);
    provider.append(trigger, tooltip);

    await tooltip.updateComplete;

    expect(tooltip.textContent).toBe('Reproducir');
  });
});
