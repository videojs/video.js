import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { DialogCloseElement } from '../../dialog/close';
import { DialogDescriptionElement } from '../../dialog/description';
import { DialogPopupElement } from '../../dialog/popup';
import { DialogTitleElement } from '../../dialog/title';
import { AlertDialogElement } from '../element';

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
  if (!customElements.get(tagName)) customElements.define(tagName, Base);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('AlertDialogElement', () => {
  it('initializes with open set to false', () => {
    const el = createElement(AlertDialogElement);

    expect(el.open).toBe(false);
  });

  it('sets data-open attribute when open is true', async () => {
    const el = createElement(AlertDialogElement);

    el.open = true;

    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.hasAttribute('data-open')).toBe(true);
  });

  it('does not set data-open attribute when open is false', async () => {
    const el = createElement(AlertDialogElement);

    document.body.appendChild(el);
    await el.updateComplete;

    expect(el.hasAttribute('data-open')).toBe(false);
  });

  it('keeps dialog semantics on the popup rather than the context host', async () => {
    const el = createElement(AlertDialogElement);
    const popup = createElement(DialogPopupElement);

    el.open = true;
    el.append(popup);

    document.body.appendChild(el);
    await el.updateComplete;

    await vi.waitFor(() => {
      expect(el.hasAttribute('role')).toBe(false);
      expect(popup.getAttribute('role')).toBe('alertdialog');
      expect(popup.getAttribute('aria-modal')).toBe('true');
      expect(popup.getAttribute('tabindex')).toBe('-1');
    });
  });

  it('uses generic dialog parts for its accessible name, description, and close action', async () => {
    ensureDefined(DialogTitleElement.tagName, DialogTitleElement);
    ensureDefined(DialogDescriptionElement.tagName, DialogDescriptionElement);
    ensureDefined(DialogCloseElement.tagName, DialogCloseElement);

    const el = createElement(AlertDialogElement);
    const popup = createElement(DialogPopupElement);
    const title = document.createElement(DialogTitleElement.tagName) as DialogTitleElement;
    const description = document.createElement(DialogDescriptionElement.tagName) as DialogDescriptionElement;
    const close = document.createElement(DialogCloseElement.tagName) as DialogCloseElement;

    popup.append(title, description, close);
    el.append(popup);
    el.open = true;

    document.body.append(el);
    await el.updateComplete;
    await title.updateComplete;
    await description.updateComplete;

    expect(popup.getAttribute('aria-labelledby')).toBe(title.id);
    expect(popup.getAttribute('aria-describedby')).toBe(description.id);

    close.click();
    expect(el.open).toBe(false);
  });
});
