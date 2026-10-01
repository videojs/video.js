import type { RadioOption, RadioOptionsState } from '@videojs/core';
import { createTranslator } from '@videojs/core/i18n';
import type { PropertyValues } from '@videojs/element';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MenuItemIndicatorElement } from '../../menu/item-indicator';
import { MenuRadioGroupElement } from '../../menu/radio-group';
import { MenuRadioItemElement } from '../../menu/radio-item';
import { RadioOptionsController } from '../controller';

interface TestOption extends RadioOption {
  badge?: string | undefined;
}

function defineElement(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) customElements.define(tagName, Base);
}

class TestRadioOptionsElement extends MenuRadioGroupElement {
  static override readonly tagName = 'test-radio-options';

  state: RadioOptionsState<TestOption> = {
    label: '',
    value: 'one',
    options: [
      {
        value: 'one',
        label: { key: 'option.one', text: 'One ({detail})' },
        labelParams: { detail: 'HD' },
        disabled: false,
      },
      { value: 'two', label: 'Two', disabled: true },
    ],
    disabled: false,
    hidden: false,
    availability: 'available',
  };
  translator = createTranslator({ 'option.one': 'First ({detail})' }, 'en');
  readonly onValueChange = vi.fn();

  readonly #options = new RadioOptionsController<TestOption>(this, {
    renderItem: (item, label, option) => this.setItemLabel(item, `${label}${option.badge ?? ''}`),
    setItemAttributes: (item, option) => item.setAttribute('data-option', option.value),
    getOptionCacheKey: (option) => option.badge ?? '',
    onValueChange: (value) => this.onValueChange(value),
  });

  setState(state: RadioOptionsState<TestOption>): void {
    this.state = state;
    this.requestUpdate();
  }

  protected override update(changed: PropertyValues): void {
    this.#options.sync(this.state, this.translator, 'en');
    super.update(changed);
  }
}

class DefaultRadioOptionsElement extends MenuRadioGroupElement {
  static override readonly tagName = 'test-default-radio-options';

  readonly controller = new RadioOptionsController(this, { onValueChange: vi.fn() });
}

defineElement(MenuRadioItemElement.tagName, MenuRadioItemElement);
defineElement(MenuItemIndicatorElement.tagName, MenuItemIndicatorElement);
defineElement(TestRadioOptionsElement.tagName, TestRadioOptionsElement);
defineElement(DefaultRadioOptionsElement.tagName, DefaultRadioOptionsElement);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('RadioOptionsController', () => {
  it('renders template labels and checked indicators with the default renderer', async () => {
    const element = new DefaultRadioOptionsElement();
    const template = document.createElement('template');

    template.innerHTML =
      '<media-menu-radio-item class="custom-item"><span class="custom-label" data-part="label"></span><media-menu-item-indicator force-mount class="custom-indicator"></media-menu-item-indicator></media-menu-radio-item>';
    element.append(template);
    document.body.append(element);
    element.controller.sync(
      {
        label: 'Audio',
        value: 'one',
        options: [
          { value: 'one', label: 'English', disabled: false },
          { value: 'two', label: 'Spanish', disabled: false },
        ],
        disabled: false,
        hidden: false,
        availability: 'available',
      },
      createTranslator({}, 'en'),
      'en'
    );
    await element.updateComplete;

    const items = [...element.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];
    const indicators = [...element.querySelectorAll<MenuItemIndicatorElement>(MenuItemIndicatorElement.tagName)];

    expect(items.map((item) => item.className)).toEqual(['custom-item', 'custom-item']);
    expect(items.map((item) => item.querySelector('[data-part~="label"]')?.textContent)).toEqual([
      'English',
      'Spanish',
    ]);
    expect(indicators.map((indicator) => indicator.checked)).toEqual([true, false]);
    expect(element.querySelector('template')).toBe(template);
    expect(template.content.querySelector('.custom-label')?.textContent).toBe('');
  });

  it('renders translated options from a template and synchronizes item state', async () => {
    const element = new TestRadioOptionsElement();
    const template = document.createElement('template');

    template.innerHTML =
      '<media-menu-radio-item><span data-part="label"></span><media-menu-item-indicator force-mount></media-menu-item-indicator></media-menu-radio-item>';
    element.append(template);
    document.body.append(element);

    await element.updateComplete;

    const items = [...element.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];
    const indicators = [...element.querySelectorAll<MenuItemIndicatorElement>(MenuItemIndicatorElement.tagName)];

    expect(items.map((item) => item.textContent)).toEqual(['First (HD)', 'Two']);
    expect(items.map((item) => item.getAttribute('data-option'))).toEqual(['one', 'two']);
    expect(items.map((item) => item.disabled)).toEqual([false, true]);
    expect(indicators.map((indicator) => indicator.checked)).toEqual([true, false]);
    expect(element.querySelector('template')).toBe(template);
  });

  it('falls back to default items for an invalid template', async () => {
    const element = new TestRadioOptionsElement();
    const template = document.createElement('template');

    template.innerHTML = '<div class="invalid"></div><div></div>';
    element.append(template);
    document.body.append(element);

    await element.updateComplete;

    expect(element.querySelectorAll(MenuRadioItemElement.tagName)).toHaveLength(2);
    expect(element.querySelector('.invalid')).toBeNull();
    expect(element.querySelector('template')).toBe(template);
  });

  it('rebuilds specialized content and applies group disabled semantics', async () => {
    const element = new TestRadioOptionsElement();

    document.body.append(element);
    await element.updateComplete;

    element.setState({
      ...element.state,
      value: 'two',
      disabled: true,
      options: element.state.options.map((option) => (option.value === 'two' ? { ...option, badge: ' CC' } : option)),
    });
    await element.updateComplete;

    const items = [...element.querySelectorAll<MenuRadioItemElement>(MenuRadioItemElement.tagName)];

    expect(element.getAttribute('aria-disabled')).toBe('true');
    expect(items.map((item) => item.textContent)).toEqual(['First (HD)', 'Two CC']);
    expect(items.map((item) => item.disabled)).toEqual([true, true]);

    element.setState({ ...element.state, disabled: false });
    await element.updateComplete;

    expect(element.hasAttribute('aria-disabled')).toBe(false);
    expect(items.map((item) => item.disabled)).toEqual([false, true]);
  });

  it('applies native hidden semantics to unavailable groups', async () => {
    const element = new TestRadioOptionsElement();

    document.body.append(element);
    await element.updateComplete;

    element.setState({ ...element.state, hidden: true, availability: 'unavailable' });
    await element.updateComplete;

    expect(element.hidden).toBe(true);

    element.setState({ ...element.state, hidden: false, availability: 'available' });
    await element.updateComplete;

    expect(element.hidden).toBe(false);
  });

  it('connects and cleans up value-change handling with the host lifecycle', async () => {
    const element = new TestRadioOptionsElement();

    document.body.append(element);
    await element.updateComplete;

    element.dispatchEvent(new CustomEvent('value-change', { detail: { value: 'two' } }));
    expect(element.onValueChange).toHaveBeenCalledTimes(1);

    element.remove();
    element.dispatchEvent(new CustomEvent('value-change', { detail: { value: 'one' } }));
    expect(element.onValueChange).toHaveBeenCalledTimes(1);

    document.body.append(element);
    await element.updateComplete;
    element.dispatchEvent(new CustomEvent('value-change', { detail: { value: 'one' } }));
    expect(element.onValueChange).toHaveBeenCalledTimes(2);
  });
});
