import { flush } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createPopupGroup } from '../group';
import { createTestPopover } from './helpers';

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createPopover', () => {
  describe('open/close', () => {
    it('can defer open changes until the owner commits them', () => {
      const { popover, onOpenChange } = createTestPopover({ deferOpenChanges: true });

      popover.open();

      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'click' });
      expect(popover.input.current).toEqual({ active: false, status: 'idle' });

      popover.syncOpen(true);

      expect(popover.input.current).toEqual({ active: true, status: 'starting' });

      popover.close();

      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'click' });
      expect(popover.input.current).toEqual({ active: true, status: 'starting' });

      popover.syncOpen(false);

      expect(popover.input.current).toEqual({ active: true, status: 'ending' });
    });

    it('shows an already-mounted popup after a deferred open is committed', async () => {
      const { popover } = createTestPopover({ deferOpenChanges: true });
      const popup = document.createElement('div');
      const showPopover = vi.fn();

      Object.defineProperty(popup, 'showPopover', { value: showPopover });
      popover.setPopupElement(popup);

      popover.open();
      expect(showPopover).not.toHaveBeenCalled();

      popover.syncOpen(true);
      expect(showPopover).not.toHaveBeenCalled();

      await Promise.resolve();

      expect(showPopover).toHaveBeenCalledOnce();
    });

    it('does not show a deferred popup that closes before the opening microtask', async () => {
      const { popover } = createTestPopover({ deferOpenChanges: true });
      const popup = document.createElement('div');
      const showPopover = vi.fn();

      Object.defineProperty(popup, 'showPopover', { value: showPopover });
      popover.setPopupElement(popup);

      popover.open();
      popover.syncOpen(true);
      popover.close();
      popover.syncOpen(false);

      await Promise.resolve();

      expect(showPopover).not.toHaveBeenCalled();
    });

    it('updates input state and calls onOpenChange when opening', () => {
      const { popover, onOpenChange } = createTestPopover();

      popover.open();

      expect(popover.input.current).toEqual({ active: true, status: 'starting' });
      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'click' });
    });

    it('calls onOpenChange when closing', () => {
      const { popover, onOpenChange } = createTestPopover();

      popover.open();
      onOpenChange.mockClear();

      popover.close();

      // active stays true until close animation completes
      expect(popover.input.current).toEqual({ active: true, status: 'ending' });
      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'click' });
    });

    it('does not call onOpenChange if already open', () => {
      const { popover, onOpenChange } = createTestPopover();

      popover.open();
      onOpenChange.mockClear();

      popover.open();

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('does not call onOpenChange if already closed', () => {
      const { popover, onOpenChange } = createTestPopover();

      popover.close();

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('supports custom reason', () => {
      const { popover, onOpenChange } = createTestPopover();

      popover.open('hover');

      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'hover' });
    });

    it('supports imperative close reason', () => {
      const { popover, onOpenChange } = createTestPopover();

      popover.open();
      onOpenChange.mockClear();

      popover.close('imperative-action');

      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'imperative-action' });
    });

    it('closes the previously open grouped popover when another opens', () => {
      const group = createPopupGroup();
      const first = createTestPopover({ group: () => group });
      const second = createTestPopover({ group: () => group });

      first.popover.open();
      first.onOpenChange.mockClear();

      second.popover.open();

      expect(first.onOpenChange).toHaveBeenCalledWith(false, { reason: 'group-open' });
      expect(second.onOpenChange).toHaveBeenCalledWith(true, { reason: 'click' });
    });

    it('does not close popovers in a different group', () => {
      const firstGroup = createPopupGroup();
      const secondGroup = createPopupGroup();
      const first = createTestPopover({ group: () => firstGroup });
      const second = createTestPopover({ group: () => secondGroup });

      first.popover.open();
      first.onOpenChange.mockClear();

      second.popover.open();

      expect(first.onOpenChange).not.toHaveBeenCalled();
    });

    it('clears the grouped popover when destroyed', () => {
      const group = createPopupGroup();
      const first = createTestPopover({ group: () => group });
      const second = createTestPopover({ group: () => group });

      first.popover.open();
      const onGroupChange = vi.fn();
      const unsubscribe = group.subscribe(onGroupChange);

      first.popover.destroy();
      expect(onGroupChange).toHaveBeenCalledOnce();
      unsubscribe();
      first.onOpenChange.mockClear();

      second.popover.open();

      expect(first.onOpenChange).not.toHaveBeenCalled();
      expect(second.onOpenChange).toHaveBeenCalledWith(true, { reason: 'click' });
    });
  });

  describe('onOpenChangeComplete', () => {
    it('fires after open animation completes', async () => {
      const onOpenChangeComplete = vi.fn();
      const { popover } = createTestPopover({ onOpenChangeComplete });
      const popup = document.createElement('div');
      let finishAnimation!: () => void;
      const finished = new Promise<void>((resolve) => {
        finishAnimation = resolve;
      });
      const getAnimations = vi.fn(() => [{ finished }] as unknown as Animation[]);

      Object.defineProperty(popup, 'getAnimations', { value: getAnimations });
      popover.setPopupElement(popup);

      popover.open();

      await vi.waitFor(() => expect(getAnimations).toHaveBeenCalled());
      expect(onOpenChangeComplete).not.toHaveBeenCalled();

      finishAnimation();

      await vi.waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
    });

    it('does not complete a close that is cancelled by reopening', async () => {
      const onOpenChangeComplete = vi.fn();
      const { popover } = createTestPopover({ onOpenChangeComplete });

      popover.open();
      popover.close();
      popover.open();
      await Promise.resolve();

      expect(onOpenChangeComplete).not.toHaveBeenCalledWith(false);
    });
  });

  describe('triggerProps', () => {
    it('opens on click when closed', () => {
      const { popover, onOpenChange } = createTestPopover();
      const event = { preventDefault: vi.fn() } as unknown as UIEvent;

      popover.triggerProps.onClick(event);

      expect(popover.input.current.active).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'click' }));
    });

    it('does not open on click when trigger is aria-disabled', () => {
      const { popover, onOpenChange } = createTestPopover();
      const trigger = document.createElement('button');

      trigger.setAttribute('aria-disabled', 'true');
      popover.setTriggerElement(trigger);

      popover.triggerProps.onClick({ preventDefault: vi.fn() } as unknown as UIEvent);

      expect(popover.input.current.active).toBe(false);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('closes on click when open', () => {
      const { popover, onOpenChange } = createTestPopover();

      popover.open();
      onOpenChange.mockClear();

      popover.triggerProps.onClick({ preventDefault: vi.fn() } as unknown as UIEvent);

      // active stays true until close animation completes
      expect(popover.input.current.active).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'click' }));
    });

    it('re-opens on click during close animation', () => {
      const { popover, onOpenChange } = createTestPopover();

      popover.open();
      popover.close();
      onOpenChange.mockClear();

      // Click during close animation should re-open
      popover.triggerProps.onClick({ preventDefault: vi.fn() } as unknown as UIEvent);

      expect(popover.input.current.active).toBe(true);
      expect(popover.input.current.status).not.toBe('ending');
      expect(onOpenChange).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'click' }));
    });

    it('does not open on click on touch devices when openOnHover is enabled', () => {
      const matchMedia = vi.fn(() => ({
        matches: false,
      }));

      vi.stubGlobal('matchMedia', matchMedia);

      const { popover, onOpenChange } = createTestPopover({
        openOnHover: () => true,
      });

      popover.triggerProps.onClick({ preventDefault: vi.fn() } as unknown as UIEvent);

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(popover.input.current.active).toBe(false);
    });

    it('does not open via focus on touch devices when openOnHover is enabled', () => {
      const matchMedia = vi.fn(() => ({
        matches: false,
      }));

      vi.stubGlobal('matchMedia', matchMedia);

      const { popover, onOpenChange } = createTestPopover({
        openOnHover: () => true,
      });

      popover.triggerProps.onFocusIn({ relatedTarget: null, preventDefault: vi.fn(), stopPropagation: vi.fn() });

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('does not open via focus when pointer is not fine', () => {
      const matchMedia = vi.fn((query: string) => ({
        matches: query === '(hover: hover)',
      }));

      vi.stubGlobal('matchMedia', matchMedia);

      const { popover, onOpenChange } = createTestPopover({
        openOnHover: () => true,
      });

      popover.triggerProps.onFocusIn({ relatedTarget: null, preventDefault: vi.fn(), stopPropagation: vi.fn() });

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('opens via focus when hover and fine pointer are supported', () => {
      const matchMedia = vi.fn((query: string) => ({
        matches: query === '(hover: hover)' || query === '(pointer: fine)',
      }));

      vi.stubGlobal('matchMedia', matchMedia);

      const { popover, onOpenChange } = createTestPopover({
        openOnHover: () => true,
      });

      popover.triggerProps.onFocusIn({ relatedTarget: null, preventDefault: vi.fn(), stopPropagation: vi.fn() });

      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'focus' });
    });
  });

  describe('outside-click', () => {
    it('does not close when clicking inside the popup', () => {
      const { popover, onOpenChange } = createTestPopover();
      const popup = document.createElement('div');
      const child = document.createElement('button');

      popup.appendChild(child);
      document.body.appendChild(popup);

      popover.setPopupElement(popup);
      popover.open();
      flush();
      onOpenChange.mockClear();

      child.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));

      expect(onOpenChange).not.toHaveBeenCalled();

      popover.destroy();
      popup.remove();
    });

    it('closes when clicking outside the popup', () => {
      const { popover, onOpenChange } = createTestPopover();
      const popup = document.createElement('div');
      const outside = document.createElement('div');

      document.body.appendChild(popup);
      document.body.appendChild(outside);

      popover.setPopupElement(popup);
      popover.open();
      flush();
      onOpenChange.mockClear();

      outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));

      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'outside-click' }));

      popover.destroy();
      popup.remove();
      outside.remove();
    });

    it('does not close when clicking inside the trigger', () => {
      const { popover, onOpenChange } = createTestPopover();
      const trigger = document.createElement('button');

      document.body.appendChild(trigger);

      popover.setTriggerElement(trigger);
      popover.open();
      flush();
      onOpenChange.mockClear();

      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));

      expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything());

      popover.destroy();
      trigger.remove();
    });

    it('uses composedPath to detect clicks inside a Shadow DOM popup', () => {
      const { popover, onOpenChange } = createTestPopover();
      const host = document.createElement('div');
      const shadow = host.attachShadow({ mode: 'open' });
      const popup = document.createElement('div');
      const child = document.createElement('button');

      popup.appendChild(child);
      shadow.appendChild(popup);
      document.body.appendChild(host);

      popover.setPopupElement(popup);
      popover.open();
      flush();
      onOpenChange.mockClear();

      // Clicking the child inside the shadow tree — event.target at
      // document level is the shadow host, but composedPath includes popup.
      child.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));

      expect(onOpenChange).not.toHaveBeenCalled();

      popover.destroy();
      host.remove();
    });
  });

  describe('focusout', () => {
    it('keeps the popover open when blur follows an inside pointerdown', async () => {
      const { popover, onOpenChange } = createTestPopover();
      const popup = document.createElement('div');
      const child = document.createElement('button');

      popup.appendChild(child);
      document.body.appendChild(popup);

      popover.setPopupElement(popup);
      popover.open();
      flush();
      onOpenChange.mockClear();

      child.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
      popover.popupProps.onFocusOut({
        relatedTarget: null,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });

      await nextFrame();
      await nextFrame();

      expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything());

      popover.destroy();
      popup.remove();
    });

    it('closes after focus settles outside the popover', async () => {
      const { popover, onOpenChange } = createTestPopover();
      const popup = document.createElement('div');

      document.body.appendChild(popup);

      popover.setPopupElement(popup);
      popover.open();
      flush();
      onOpenChange.mockClear();

      popover.popupProps.onFocusOut({
        relatedTarget: null,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
      await nextFrame();
      await nextFrame();

      expect(onOpenChange).toHaveBeenCalledWith(false, expect.objectContaining({ reason: 'blur' }));

      popover.destroy();
      popup.remove();
    });

    it('keeps the popover open when focus settles inside a Shadow DOM popup', async () => {
      const { popover, onOpenChange } = createTestPopover();
      const host = document.createElement('div');
      const shadow = host.attachShadow({ mode: 'open' });
      const popup = document.createElement('div');
      const child = document.createElement('button');

      popup.append(child);
      shadow.append(popup);
      document.body.append(host);
      popover.setPopupElement(popup);
      popover.open();
      flush();
      child.focus();
      onOpenChange.mockClear();

      popover.popupProps.onFocusOut({
        relatedTarget: null,
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      });
      await nextFrame();
      await nextFrame();

      expect(document.activeElement).toBe(host);
      expect(shadow.activeElement).toBe(child);
      expect(onOpenChange).not.toHaveBeenCalledWith(false, expect.anything());

      popover.destroy();
      host.remove();
    });
  });

  describe('destroy', () => {
    it('prevents further open/close calls', () => {
      const { popover, onOpenChange } = createTestPopover();

      popover.destroy();
      popover.open();

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(popover.input.current.active).toBe(false);
    });
  });
});
