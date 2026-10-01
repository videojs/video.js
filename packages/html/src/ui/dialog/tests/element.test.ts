import { flush } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { DialogBackdropElement } from '../backdrop';
import { DialogCloseElement } from '../close';
import { DialogElement } from '../element';
import { DialogPopupElement } from '../popup';

let tagCounter = 0;

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = `test-dialog-${tagCounter++}`;

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('DialogElement', () => {
  it('uses modal dialog semantics', async () => {
    const dialog = createElement(DialogElement);
    const popup = createElement(DialogPopupElement);

    dialog.open = true;
    dialog.append(popup);
    document.body.append(dialog);
    await dialog.updateComplete;
    await popup.updateComplete;

    expect(dialog.hasAttribute('role')).toBe(false);
    expect(popup.getAttribute('role')).toBe('dialog');
    expect(popup.getAttribute('aria-modal')).toBe('true');
    expect(popup.tabIndex).toBe(-1);
    expect(dialog.hasAttribute('data-open')).toBe(true);
  });

  it('opens from an adjacent trigger', async () => {
    const trigger = document.createElement('button');
    const dialog = createElement(DialogElement);
    const popup = createElement(DialogPopupElement);

    dialog.append(popup);
    document.body.append(trigger, dialog);
    await dialog.updateComplete;
    flush();

    trigger.click();
    await dialog.updateComplete;

    expect(dialog.open).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-controls')).toBe(popup.id);
  });

  it('closes only from the explicit close part', async () => {
    const dialog = createElement(DialogElement);
    const popup = createElement(DialogPopupElement);
    const playerControl = document.createElement('button');
    const close = createElement(DialogCloseElement);

    popup.append(playerControl, close);
    dialog.append(popup);
    dialog.open = true;
    document.body.append(dialog);
    await dialog.updateComplete;
    await close.updateComplete;
    flush();

    playerControl.click();
    expect(dialog.open).toBe(true);

    close.click();
    expect(dialog.open).toBe(false);
  });

  it('removes data-open attribute after close transition completes', async () => {
    const el = createElement(DialogElement);

    el.open = true;

    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.hasAttribute('data-open')).toBe(true);

    el.open = false;
    await el.updateComplete;

    expect(el.hasAttribute('data-open')).toBe(true);
    expect(el.hasAttribute('data-ending-style')).toBe(true);
    await vi.waitFor(() => {
      expect(el.hasAttribute('data-open')).toBe(false);
    });
  });

  it('dispatches open-change event on close', async () => {
    const el = createElement(DialogElement);

    el.open = true;

    document.body.appendChild(el);
    await el.updateComplete;
    flush();

    const spy = vi.fn();

    el.addEventListener('open-change', spy);

    // Escape triggers dismiss layer → onOpenChange(false) → open-change event.
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(el.open).toBe(false);
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0]![0] as CustomEvent).detail).toEqual({ open: false });
  });

  it('cleans up on disconnect', async () => {
    const el = createElement(DialogElement);

    el.open = true;

    document.body.appendChild(el);
    await el.updateComplete;
    flush();

    document.body.removeChild(el);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    // Dialog was destroyed on disconnect, so open should still be true.
    expect(el.open).toBe(true);
  });

  it('dispatches lifecycle events', async () => {
    const dialog = createElement(DialogElement);

    document.body.append(dialog);
    await dialog.updateComplete;

    const onOpenChange = vi.fn();

    dialog.addEventListener('open-change', onOpenChange);
    dialog.open = true;
    await dialog.updateComplete;

    expect(onOpenChange).toHaveBeenCalledOnce();
    expect((onOpenChange.mock.calls[0]![0] as CustomEvent).detail).toEqual({ open: true });
  });
});

describe('DialogBackdropElement', () => {
  it('is presentational and receives dialog state attributes', async () => {
    const dialog = createElement(DialogElement);
    const backdrop = createElement(DialogBackdropElement);

    dialog.open = true;
    dialog.append(backdrop);
    document.body.append(dialog);
    await dialog.updateComplete;

    await vi.waitFor(() => {
      expect(backdrop.getAttribute('role')).toBe('presentation');
      expect(backdrop.getAttribute('aria-hidden')).toBe('true');
      expect(backdrop.hasAttribute('data-open')).toBe(true);
    });
  });
});
