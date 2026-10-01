import { type Locale, registerI18n, resetI18nRegistry, type Text, type Translator } from '@videojs/core/i18n';
import { type PropertyValues, ReactiveElement } from '@videojs/element';
import { ContextProvider } from '@videojs/element/context';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { SkinElement } from '../../presets/skin';
import { i18nContext, MediaI18nProviderElement, MediaTextElement } from '../index';

const skinTemplate = document.createElement('template');

skinTemplate.innerHTML =
  '<button aria-labelledby="settings-label"><media-text id="settings-label" token="menu.settings">Settings</media-text></button>';

const firstUpdateTemplate = document.createElement('template');

class TestSkinElement extends SkinElement {
  static override readonly template = skinTemplate;
}

class TestFirstUpdateElement extends SkinElement {
  static override readonly template = firstUpdateTemplate;
}

class TestFirstTextElement extends MediaTextElement {
  firstText: string | undefined;

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    this.firstText ??= this.textContent ?? '';
  }
}

class TestI18nProviderElement extends ReactiveElement {
  readonly provider = new ContextProvider(this, {
    context: i18nContext,
    initialValue: {
      translator: ((value: string | Text) => {
        const key = typeof value === 'string' ? value : value.key;

        return key === 'menu.settings' ? 'Ancestor settings' : typeof value === 'string' ? value : value.text;
      }) as Translator,
      locale: 'xx' as Locale,
    },
  });
}

if (!customElements.get('test-skin-i18n')) {
  customElements.define('test-skin-i18n', TestSkinElement);
}

if (!customElements.get('test-skin-i18n-first-text')) {
  customElements.define('test-skin-i18n-first-text', TestFirstTextElement);
}

firstUpdateTemplate.innerHTML = '<test-skin-i18n-first-text token="menu.settings">Settings</test-skin-i18n-first-text>';

if (!customElements.get('test-skin-i18n-first-update')) {
  customElements.define('test-skin-i18n-first-update', TestFirstUpdateElement);
}

if (!customElements.get('test-skin-i18n-provider')) {
  customElements.define('test-skin-i18n-provider', TestI18nProviderElement);
}

if (!customElements.get(MediaI18nProviderElement.tagName)) {
  customElements.define(MediaI18nProviderElement.tagName, MediaI18nProviderElement);
}

if (!customElements.get(MediaTextElement.tagName)) {
  customElements.define(MediaTextElement.tagName, MediaTextElement);
}

describe('MediaTextElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    resetI18nRegistry();
  });

  it('uses an ancestor translator for shadow labels', async () => {
    registerI18n('xx', { 'menu.settings': 'Skin settings' });
    const root = document.createElement('div');

    root.innerHTML = /*html*/ `
      <test-skin-i18n-provider>
        <test-skin-i18n lang="xx"></test-skin-i18n>
      </test-skin-i18n-provider>
    `;
    document.body.append(root);

    const skin = root.querySelector<TestSkinElement>('test-skin-i18n')!;

    await skin.updateComplete;
    const text = skin.shadowRoot!.querySelector(MediaTextElement.tagName) as MediaTextElement;

    await text.updateComplete;

    expect(text.textContent).toBe('Ancestor settings');
  });

  it('uses English fallback for shadow labels without a provider', async () => {
    registerI18n('xx', { 'menu.settings': 'Skin settings' });
    const skin = document.createElement('test-skin-i18n') as TestSkinElement;

    skin.lang = 'xx';
    document.body.append(skin);

    await skin.updateComplete;
    const text = skin.shadowRoot!.querySelector(MediaTextElement.tagName) as MediaTextElement;

    await text.updateComplete;

    expect(text.textContent).toBe('Settings');
  });

  it('updates shadow labels when provider lang changes', async () => {
    registerI18n('xx', { 'menu.settings': 'Skin settings' });
    registerI18n('yy', { 'menu.settings': 'Other settings' });
    const provider = new MediaI18nProviderElement();
    const skin = document.createElement('test-skin-i18n') as TestSkinElement;

    provider.lang = 'xx';
    provider.append(skin);
    document.body.append(provider);

    await skin.updateComplete;
    const text = skin.shadowRoot!.querySelector(MediaTextElement.tagName) as MediaTextElement;

    await text.updateComplete;

    expect(text.textContent).toBe('Skin settings');

    provider.lang = 'yy';

    await vi.waitFor(() => expect(text.textContent).toBe('Other settings'));
  });

  it('publishes provider lang before child text updates', async () => {
    registerI18n('xx', { 'menu.settings': 'Skin settings' });
    const provider = new MediaI18nProviderElement();
    const skin = document.createElement('test-skin-i18n-first-update') as TestFirstUpdateElement;

    provider.lang = 'xx';
    provider.append(skin);
    document.body.append(provider);

    await skin.updateComplete;
    const text = skin.shadowRoot!.querySelector('test-skin-i18n-first-text') as TestFirstTextElement;

    await text.updateComplete;

    expect(text.firstText).toBe('Skin settings');
    expect(text.textContent).toBe('Skin settings');
  });
});
