import { ContextProvider } from '@videojs/element/context';
import { flush } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { containerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
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

class TestContainerProviderElement extends UIElement {
  readonly provider = new ContextProvider(this, {
    context: containerContext,
    initialValue: {
      container: this,
      registerContainer: () => () => {},
    },
  });
}

async function renderInContainer(scope?: DialogElement['scope']) {
  const container = createElement(TestContainerProviderElement);
  const dialog = createElement(DialogElement);
  const backdrop = createElement(DialogBackdropElement);
  const popup = createElement(DialogPopupElement);

  if (scope) dialog.scope = scope;

  dialog.open = true;
  dialog.append(backdrop, popup);
  container.append(dialog);
  document.body.append(container);
  await dialog.updateComplete;

  return { dialog, backdrop, popup };
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
    expect(popup.getAttribute('data-scope')).toBe('document');
  });

  it('confines a dialog to its player by default', async () => {
    const { backdrop, popup } = await renderInContainer();

    await vi.waitFor(() => {
      expect(popup.hasAttribute('aria-modal')).toBe(false);
      expect(popup.getAttribute('data-scope')).toBe('player');
      expect(backdrop.getAttribute('data-scope')).toBe('player');
    });
  });

  it('confines a dialog to its player when scope is player', async () => {
    const { popup } = await renderInContainer('player');

    await vi.waitFor(() => expect(popup.getAttribute('data-scope')).toBe('player'));
  });

  it('warns when a player-scoped dialog opens outside a player', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dialog = createElement(DialogElement);
    const popup = createElement(DialogPopupElement);

    dialog.scope = 'player';
    dialog.open = true;
    dialog.append(popup);
    document.body.append(dialog);
    await dialog.updateComplete;

    expect(popup.getAttribute('data-scope')).toBe('document');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('scope="player"'));

    warn.mockRestore();
  });

  it('does not warn when an auto-scoped dialog opens outside a player', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const dialog = createElement(DialogElement);

    dialog.open = true;
    document.body.append(dialog);
    await dialog.updateComplete;

    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('scope="player"'));

    warn.mockRestore();
  });

  it('connects parts defined before the dialog', async () => {
    const popup = createElement(DialogPopupElement);
    const dialogTag = `test-dialog-${tagCounter++}`;

    document.body.append(document.createElement(dialogTag));
    document.body.lastElementChild!.append(popup);
    customElements.define(dialogTag, class extends DialogElement {});

    // happy-dom upgrades into a new instance, so reach the dialog through its child.
    const dialog = popup.parentElement as DialogElement;

    dialog.open = true;
    await dialog.updateComplete;

    await vi.waitFor(() => {
      expect(popup.getAttribute('role')).toBe('dialog');
      expect(popup.hasAttribute('data-open')).toBe(true);
    });
  });

  it('confines a dialog to a player defined after it', async () => {
    const containerTag = `test-dialog-${tagCounter++}`;
    const container = document.createElement(containerTag);
    const dialog = createElement(DialogElement);
    const popup = createElement(DialogPopupElement);

    dialog.open = true;
    dialog.append(popup);
    container.append(dialog);
    document.body.append(container);
    await dialog.updateComplete;
    customElements.define(containerTag, class extends TestContainerProviderElement {});

    await vi.waitFor(() => {
      expect(popup.getAttribute('data-scope')).toBe('player');
      expect(popup.hasAttribute('aria-modal')).toBe(false);
    });
  });

  it('covers the document when scope is document', async () => {
    const { backdrop, popup } = await renderInContainer('document');

    await vi.waitFor(() => {
      expect(popup.getAttribute('aria-modal')).toBe('true');
      expect(popup.getAttribute('data-scope')).toBe('document');
      expect(backdrop.getAttribute('data-scope')).toBe('document');
    });
  });

  it('connects parts defined before the dialog', async () => {
    const popup = createElement(DialogPopupElement);
    const dialogTag = `test-dialog-${tagCounter++}`;

    document.body.append(document.createElement(dialogTag));
    document.body.lastElementChild!.append(popup);
    customElements.define(dialogTag, class extends DialogElement {});

    // happy-dom upgrades into a new instance, so reach the dialog through its child.
    const dialog = popup.parentElement as DialogElement;

    dialog.open = true;
    await dialog.updateComplete;

    await vi.waitFor(() => {
      expect(popup.getAttribute('role')).toBe('dialog');
      expect(popup.hasAttribute('data-open')).toBe(true);
    });
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
