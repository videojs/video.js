import { flush } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createDialog, type DialogOptions } from '../dialog';
import { isInteractionLocked } from '../interaction-lock';
import { createTransition } from '../transition';

const dialogs = new Set<ReturnType<typeof createDialog>>();

function createTestDialog(overrides?: Partial<DialogOptions>) {
  const onOpenChange = vi.fn();
  const dialog = createDialog({
    transition: createTransition(),
    onOpenChange,
    ...overrides,
  });

  dialogs.add(dialog);
  return { dialog, onOpenChange };
}

afterEach(() => {
  for (const dialog of dialogs) dialog.destroy();

  dialogs.clear();
  document.body.innerHTML = '';
});

describe('createDialog', () => {
  it('opens from its trigger', () => {
    const { dialog, onOpenChange } = createTestDialog();

    dialog.triggerProps.onClick(new MouseEvent('click'));

    expect(dialog.input.current).toEqual({ active: true, status: 'starting' });
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('focuses the first tabbable element on open', async () => {
    const { dialog } = createTestDialog();
    const popup = document.createElement('div');

    popup.tabIndex = -1;
    const first = document.createElement('button');

    popup.append(first);
    document.body.append(popup);
    dialog.setPopupElement(popup);

    dialog.open();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(document.activeElement).toBe(first);
  });

  it('traps Tab focus within the popup', () => {
    const { dialog } = createTestDialog();
    const popup = document.createElement('div');

    popup.tabIndex = -1;
    const first = document.createElement('button');
    const last = document.createElement('button');

    popup.append(first, last);
    document.body.append(popup);
    dialog.setPopupElement(popup);
    dialog.open();
    flush();

    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(document.activeElement).toBe(first);
  });

  it('traps Tab focus across open shadow roots', () => {
    const { dialog } = createTestDialog();
    const popup = document.createElement('div');

    popup.tabIndex = -1;
    const first = document.createElement('button');
    const skin = document.createElement('div');
    const shadow = skin.attachShadow({ mode: 'open' });
    const last = document.createElement('button');

    shadow.append(last);
    popup.append(first, skin);
    document.body.append(popup);
    dialog.setPopupElement(popup);
    dialog.open();
    flush();

    first.focus();
    const forward = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });

    document.dispatchEvent(forward);
    expect(forward.defaultPrevented).toBe(false);

    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);

    first.focus();
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })
    );
    expect(shadow.activeElement).toBe(last);
  });

  it('restores focus to the trigger after closing', async () => {
    const trigger = document.createElement('button');
    const popup = document.createElement('div');

    popup.tabIndex = -1;
    document.body.append(trigger, popup);

    const { dialog } = createTestDialog();

    dialog.setTriggerElement(trigger);
    dialog.setPopupElement(popup);
    trigger.focus();
    dialog.open();

    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.activeElement).toBe(popup);

    dialog.close();

    await vi.waitFor(() => expect(dialog.input.current.active).toBe(false));
    expect(document.activeElement).toBe(trigger);
  });

  it('makes content outside the popup inert while open', async () => {
    const trigger = document.createElement('button');
    const popup = document.createElement('div');

    document.body.append(trigger, popup);

    const { dialog } = createTestDialog();

    dialog.setTriggerElement(trigger);
    dialog.setPopupElement(popup);
    dialog.open();

    expect(trigger.hasAttribute('inert')).toBe(true);

    dialog.close();
    await vi.waitFor(() => expect(dialog.input.current.active).toBe(false));

    expect(trigger.hasAttribute('inert')).toBe(false);
  });

  it('makes composed-tree siblings inert while open', async () => {
    const background = document.createElement('button');
    const host = document.createElement('div');
    const popup = document.createElement('div');
    const slottedSibling = document.createElement('button');
    const shadow = host.attachShadow({ mode: 'open' });
    const slot = document.createElement('slot');
    const shadowSibling = document.createElement('button');

    host.append(popup, slottedSibling);
    shadow.append(slot, shadowSibling);
    document.body.append(background, host);

    const { dialog } = createTestDialog();

    dialog.setPopupElement(popup);
    dialog.open();

    expect(slottedSibling.hasAttribute('inert')).toBe(true);
    expect(shadowSibling.hasAttribute('inert')).toBe(true);
    expect(background.hasAttribute('inert')).toBe(true);

    dialog.close();
    await vi.waitFor(() => expect(dialog.input.current.active).toBe(false));

    expect(slottedSibling.hasAttribute('inert')).toBe(false);
    expect(shadowSibling.hasAttribute('inert')).toBe(false);
    expect(background.hasAttribute('inert')).toBe(false);
  });

  it('limits background isolation to an interaction root', async () => {
    const outside = document.createElement('button');
    const root = document.createElement('div');
    const sibling = document.createElement('button');
    const popup = document.createElement('div');

    root.append(sibling, popup);
    document.body.append(outside, root);

    const { dialog } = createTestDialog();

    dialog.setPopupElement(popup);
    dialog.setInteractionRoot(root);
    dialog.open();

    expect(dialog.modality.current.documentModal).toBe(false);
    expect(sibling.hasAttribute('inert')).toBe(true);
    expect(outside.hasAttribute('inert')).toBe(false);
    expect(isInteractionLocked(root)).toBe(true);

    dialog.close();
    await vi.waitFor(() => expect(dialog.input.current.active).toBe(false));

    expect(sibling.hasAttribute('inert')).toBe(false);
    expect(isInteractionLocked(root)).toBe(false);
  });

  it('falls back to document modality when the interaction root does not contain the popup', () => {
    const outside = document.createElement('button');
    const unrelatedRoot = document.createElement('div');
    const popup = document.createElement('div');

    document.body.append(outside, unrelatedRoot, popup);

    const { dialog } = createTestDialog();

    dialog.setPopupElement(popup);
    dialog.setInteractionRoot(unrelatedRoot);
    dialog.open();

    expect(dialog.modality.current.documentModal).toBe(true);
    expect(outside.hasAttribute('inert')).toBe(true);
    expect(unrelatedRoot.hasAttribute('inert')).toBe(true);
    expect(isInteractionLocked(unrelatedRoot)).toBe(false);
  });

  it('allows focus to move outside a scoped interaction root', () => {
    const outside = document.createElement('button');
    const root = document.createElement('div');
    const popup = document.createElement('div');

    popup.tabIndex = -1;
    root.append(popup);
    document.body.append(outside, root);

    const { dialog } = createTestDialog();

    dialog.setPopupElement(popup);
    dialog.setInteractionRoot(root);
    dialog.open();
    flush();
    outside.focus();

    expect(document.activeElement).toBe(outside);
  });

  it('does not restore focus into a scoped root after focus leaves it', async () => {
    const outside = document.createElement('button');
    const root = document.createElement('div');
    const trigger = document.createElement('button');
    const popup = document.createElement('div');

    root.append(trigger, popup);
    document.body.append(outside, root);

    const { dialog } = createTestDialog();

    dialog.setTriggerElement(trigger);
    dialog.setPopupElement(popup);
    dialog.setInteractionRoot(root);
    trigger.focus();
    dialog.open();
    flush();
    outside.focus();
    dialog.close();

    await vi.waitFor(() => expect(dialog.input.current.active).toBe(false));
    expect(document.activeElement).toBe(outside);
  });

  it('does not trap Tab within a scoped dialog', () => {
    const root = document.createElement('div');
    const popup = document.createElement('div');
    const button = document.createElement('button');

    popup.append(button);
    root.append(popup);
    document.body.append(root);

    const { dialog } = createTestDialog();

    dialog.setPopupElement(popup);
    dialog.setInteractionRoot(root);
    dialog.open();
    flush();
    button.focus();

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });

    button.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('closes on Escape', () => {
    const { dialog, onOpenChange } = createTestDialog();

    dialog.open();
    onOpenChange.mockClear();
    flush();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('only closes a scoped dialog on Escape from within its interaction root', () => {
    const outside = document.createElement('button');
    const root = document.createElement('div');
    const popup = document.createElement('div');

    root.append(popup);
    document.body.append(outside, root);

    const { dialog, onOpenChange } = createTestDialog();

    dialog.setPopupElement(popup);
    dialog.setInteractionRoot(root);
    dialog.open();
    onOpenChange.mockClear();
    flush();

    outside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onOpenChange).not.toHaveBeenCalled();

    popup.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close on Escape when disabled', () => {
    const { dialog, onOpenChange } = createTestDialog({ closeOnEscape: () => false });

    dialog.open();
    onOpenChange.mockClear();
    flush();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('does not close when an arbitrary button inside the dialog is clicked', () => {
    const { dialog, onOpenChange } = createTestDialog();
    const popup = document.createElement('div');
    const playerControl = document.createElement('button');

    popup.append(playerControl);
    document.body.append(popup);
    dialog.setPopupElement(popup);
    dialog.open();
    onOpenChange.mockClear();

    playerControl.click();

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(dialog.input.current.active).toBe(true);
  });

  it('restores pre-existing inert state after closing', async () => {
    const background = document.createElement('div');

    background.setAttribute('inert', '');
    const popup = document.createElement('div');

    document.body.append(background, popup);

    const { dialog } = createTestDialog();

    dialog.setPopupElement(popup);
    dialog.open();
    dialog.close();

    await vi.waitFor(() => expect(dialog.input.current.active).toBe(false));
    expect(background.hasAttribute('inert')).toBe(true);
  });

  it('restores background interaction when destroyed', () => {
    const background = document.createElement('button');
    const popup = document.createElement('div');

    document.body.append(background, popup);

    const { dialog } = createTestDialog();

    dialog.setPopupElement(popup);
    dialog.open();
    dialog.destroy();

    expect(background.hasAttribute('inert')).toBe(false);
  });
});
