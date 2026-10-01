import type { AnyPlayerStore } from '@videojs/core/dom';
import { registerI18n, resetI18nRegistry } from '@videojs/core/i18n';
import { ContextConsumer, ContextProvider } from '@videojs/element/context';
import { MediaError, type MediaErrorState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MediaI18nProviderElement } from '../../../i18n';
import { containerContext, playerContext } from '../../../player/context';
import { DialogCloseElement } from '../../dialog/close';
import { dialogContext } from '../../dialog/context';
import { DialogDescriptionElement } from '../../dialog/description';
import { DialogPopupElement } from '../../dialog/popup';
import { DialogTitleElement } from '../../dialog/title';
import { UIElement } from '../../ui-element';
import { ErrorDialogElement } from '../element';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-el');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

function ensureDefined(tagName: string, Base: CustomElementConstructor): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, Base);
  }
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
  readonly store = createStore<unknown>()<MediaErrorState>({
    name: 'error',
    state: () => ({
      error: new MediaError(undefined, MediaError.MEDIA_ERR_NETWORK),
      dismissError: vi.fn(),
    }),
  });
  readonly provider = new ContextProvider(this, {
    context: playerContext,
    initialValue: this.store as unknown as AnyPlayerStore,
  });
}

class TestDialogConsumerElement extends UIElement {
  readonly consumer = new ContextConsumer(this, { context: dialogContext, subscribe: true });
}

afterEach(() => {
  resetI18nRegistry();
  document.documentElement.removeAttribute('lang');
  document.body.innerHTML = '';
});

describe('ErrorDialogElement', () => {
  it('provides dialogContext for child parts', async () => {
    ensureDefined(DialogTitleElement.tagName, DialogTitleElement);
    ensureDefined(DialogDescriptionElement.tagName, DialogDescriptionElement);
    ensureDefined(DialogCloseElement.tagName, DialogCloseElement);

    const el = createElement(ErrorDialogElement);
    const popup = createElement(DialogPopupElement);
    const title = document.createElement(DialogTitleElement.tagName) as DialogTitleElement;
    const desc = document.createElement(DialogDescriptionElement.tagName) as DialogDescriptionElement;
    const close = document.createElement(DialogCloseElement.tagName) as DialogCloseElement;

    popup.append(title, desc, close);
    el.append(popup);

    document.body.appendChild(el);
    await el.updateComplete;

    expect(title.isConnected).toBe(true);
    expect(desc.isConnected).toBe(true);
    expect(close.isConnected).toBe(true);
    expect(popup.getAttribute('aria-labelledby')).toBe(title.id);
    expect(popup.getAttribute('aria-describedby')).toBe(desc.id);
  });

  it('scopes dialog semantics to the provided container', async () => {
    const container = createElement(TestContainerProviderElement);
    const el = createElement(ErrorDialogElement);
    const popup = createElement(DialogPopupElement);

    el.append(popup);
    container.append(el);
    document.body.append(container);
    await el.updateComplete;
    await popup.updateComplete;
    await el.updateComplete;

    expect(popup.getAttribute('role')).toBe('alertdialog');
    expect(popup.hasAttribute('aria-modal')).toBe(false);
  });

  it('shows translated dialog copy when es locale is registered', async () => {
    registerI18n('es', {
      'errors.title': 'Algo salió mal.',
      'common.ok': 'Aceptar',
      'errors.unexpected': 'Ocurrió un error inesperado.',
    });
    ensureDefined(MediaI18nProviderElement.tagName, MediaI18nProviderElement);
    ensureDefined(DialogTitleElement.tagName, DialogTitleElement);
    ensureDefined(DialogDescriptionElement.tagName, DialogDescriptionElement);
    ensureDefined(DialogCloseElement.tagName, DialogCloseElement);

    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'es');
    const el = createElement(ErrorDialogElement);
    const popup = createElement(DialogPopupElement);
    const title = document.createElement(DialogTitleElement.tagName) as DialogTitleElement;
    const desc = document.createElement(DialogDescriptionElement.tagName) as DialogDescriptionElement;
    const close = document.createElement(DialogCloseElement.tagName) as DialogCloseElement;

    popup.append(title, desc, close);
    el.append(popup);
    provider.appendChild(el);
    document.body.append(provider);
    await Promise.resolve();
    await el.updateComplete;

    expect(title.textContent).toBe('Algo salió mal.');
    expect(desc.textContent).toBe('Ocurrió un error inesperado.');
    expect(close.textContent).toBe('Aceptar');
  });

  it('preserves authored title copy', async () => {
    registerI18n('es', {
      'errors.title': 'Algo salió mal.',
      'common.ok': 'Aceptar',
      'errors.unexpected': 'Ocurrió un error inesperado.',
    });
    ensureDefined(MediaI18nProviderElement.tagName, MediaI18nProviderElement);
    ensureDefined(DialogTitleElement.tagName, DialogTitleElement);
    ensureDefined(DialogDescriptionElement.tagName, DialogDescriptionElement);
    ensureDefined(DialogCloseElement.tagName, DialogCloseElement);

    const provider = new MediaI18nProviderElement();

    provider.setAttribute('lang', 'es');
    const el = createElement(ErrorDialogElement);
    const popup = createElement(DialogPopupElement);
    const title = document.createElement(DialogTitleElement.tagName) as DialogTitleElement;
    const desc = document.createElement(DialogDescriptionElement.tagName) as DialogDescriptionElement;
    const close = document.createElement(DialogCloseElement.tagName) as DialogCloseElement;

    title.textContent = 'Custom title';

    popup.append(title, desc, close);
    el.append(popup);
    provider.appendChild(el);
    document.body.append(provider);
    await Promise.resolve();
    await el.updateComplete;

    expect(title.textContent).toBe('Custom title');
    expect(desc.textContent).toBe('Ocurrió un error inesperado.');
    expect(close.textContent).toBe('Aceptar');
  });

  it('cleans up on disconnect', async () => {
    const provider = createElement(TestPlayerProviderElement);
    const el = createElement(ErrorDialogElement);
    const popup = createElement(DialogPopupElement);
    const consumer = createElement(TestDialogConsumerElement);
    const background = document.createElement('button');

    popup.append(consumer);
    el.append(popup);
    provider.append(background, el);
    document.body.append(provider);

    await vi.waitFor(() => {
      expect(consumer.consumer.value?.dialog.input.current).toEqual({ active: true, status: 'idle' });
      expect(background.hasAttribute('inert')).toBe(true);
    });

    const dialog = consumer.consumer.value!.dialog;

    el.remove();
    const input = { ...dialog.input.current };

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(dialog.input.current).toEqual(input);
    expect(background.hasAttribute('inert')).toBe(false);
  });
});
