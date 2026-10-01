import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { TooltipGroupCore } from '../../../../core/ui/tooltip/group';
import { createPopupGroup } from '../../popover/group';
import { createTestPopover } from '../../popover/tests/helpers';
import { createTestTooltip } from './helpers';

describe('createTooltip', () => {
  describe('open/close', () => {
    it('updates input state and calls onOpenChange when opening', () => {
      const { tooltip, onOpenChange } = createTestTooltip();

      tooltip.open();

      expect(tooltip.input.current.active).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'hover' });
    });

    it('calls onOpenChange when closing', () => {
      const { tooltip, onOpenChange } = createTestTooltip();

      tooltip.open();
      onOpenChange.mockClear();

      tooltip.close();

      expect(tooltip.input.current.active).toBe(true);
      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'hover' });
    });

    it('supports imperative close reason', () => {
      const { tooltip, onOpenChange } = createTestTooltip();

      tooltip.open();
      onOpenChange.mockClear();

      tooltip.close('imperative-action');

      expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'imperative-action' });
    });
  });

  describe('onOpenChangeComplete', () => {
    it('fires after open animation completes', async () => {
      const onOpenChangeComplete = vi.fn();
      const { tooltip } = createTestTooltip({ onOpenChangeComplete });

      tooltip.open();

      // Not called synchronously — fires after transition resolves
      expect(onOpenChangeComplete).not.toHaveBeenCalled();
      await vi.waitFor(() => expect(onOpenChangeComplete).toHaveBeenCalledWith(true));
    });
  });

  describe('triggerProps', () => {
    it('does not expose onClick', () => {
      const { tooltip } = createTestTooltip();

      expect(tooltip.triggerProps).not.toHaveProperty('onClick');
    });

    describe('touch pointer suppression', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        // jsdom lacks matchMedia — stub so popover's canHover() and canOpenOnFocus()
        // return true, allowing us to test that the tooltip layer blocks touch independently.
        vi.stubGlobal('matchMedia', (query: string) => ({
          matches: query === '(hover: hover)' || query === '(pointer: fine)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }));
      });
      afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
      });

      it('does not open when disabled', () => {
        const { tooltip, onOpenChange } = createTestTooltip({
          disabled: () => true,
        });

        tooltip.triggerProps.onPointerEnter({
          clientX: 0,
          clientY: 0,
          pointerId: 1,
          pointerType: 'mouse',
          buttons: 0,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        });

        vi.advanceTimersByTime(600);

        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it('does not open via focus when disabled', () => {
        const { tooltip, onOpenChange } = createTestTooltip({
          disabled: () => true,
        });

        tooltip.triggerProps.onFocusIn({ relatedTarget: null, preventDefault: vi.fn(), stopPropagation: vi.fn() });

        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it.each([true, false])('preserves delayed closure with disableHoverablePopup=%s', (disabled) => {
        const { tooltip, onOpenChange } = createTestTooltip({
          disableHoverablePopup: () => disabled,
          closeDelay: () => 100,
        });
        const event = {
          clientX: 0,
          clientY: 0,
          pointerId: 1,
          pointerType: 'mouse' as const,
          buttons: 0,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        };

        tooltip.open();
        onOpenChange.mockClear();
        tooltip.triggerProps.onPointerLeave(event);
        tooltip.popupProps.onPointerEnter(event);
        vi.advanceTimersByTime(100);

        if (disabled) {
          expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'hover' });
        } else {
          expect(onOpenChange).not.toHaveBeenCalled();
        }

        tooltip.destroy();
      });

      it('does not open on touch pointer enter', () => {
        const { tooltip, onOpenChange } = createTestTooltip();

        tooltip.triggerProps.onPointerEnter({
          clientX: 0,
          clientY: 0,
          pointerId: 1,
          pointerType: 'touch',
          buttons: 0,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        });

        vi.advanceTimersByTime(600);

        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it('opens on mouse pointer enter', () => {
        const { tooltip, onOpenChange } = createTestTooltip();

        tooltip.triggerProps.onPointerEnter({
          clientX: 0,
          clientY: 0,
          pointerId: 1,
          pointerType: 'mouse',
          buttons: 0,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        });

        vi.advanceTimersByTime(600);

        expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'hover' });
      });

      it('closes on pointer down', () => {
        const { tooltip, onOpenChange } = createTestTooltip();

        tooltip.open();
        onOpenChange.mockClear();

        tooltip.triggerProps.onPointerDown({
          clientX: 0,
          clientY: 0,
          pointerId: 1,
          pointerType: 'mouse',
          buttons: 1,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        });

        expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'imperative-action' });
      });

      it('cancels a pending hover open on pointer down', () => {
        const { tooltip, onOpenChange } = createTestTooltip();
        const event = {
          clientX: 0,
          clientY: 0,
          pointerId: 1,
          pointerType: 'mouse' as const,
          buttons: 0,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        };

        tooltip.triggerProps.onPointerEnter(event);
        tooltip.triggerProps.onPointerDown(event);
        vi.advanceTimersByTime(600);

        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it('does not open while its trigger owns an open popup', () => {
        const group = createPopupGroup();
        const owner = createTestPopover({ group: () => group });
        const { tooltip, onOpenChange } = createTestTooltip({ popupGroup: () => group });
        const trigger = document.createElement('button');

        owner.popover.setTriggerElement(trigger);
        tooltip.setTriggerElement(trigger);
        owner.popover.open();

        tooltip.triggerProps.onPointerEnter({
          clientX: 0,
          clientY: 0,
          pointerId: 1,
          pointerType: 'mouse',
          buttons: 0,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        });
        tooltip.triggerProps.onFocusIn({ relatedTarget: null, preventDefault: vi.fn(), stopPropagation: vi.fn() });
        vi.advanceTimersByTime(600);

        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it('closes when its trigger opens another popup', () => {
        const group = createPopupGroup();
        const owner = createTestPopover({ group: () => group });
        const { tooltip, onOpenChange } = createTestTooltip({ popupGroup: () => group });
        const trigger = document.createElement('button');

        owner.popover.setTriggerElement(trigger);
        tooltip.setTriggerElement(trigger);
        tooltip.open();
        onOpenChange.mockClear();

        owner.popover.open();

        expect(onOpenChange).toHaveBeenCalledWith(false, { reason: 'imperative-action' });
      });

      it('stays open with its trigger popup when requested', () => {
        const group = createPopupGroup();
        const owner = createTestPopover({ group: () => group });
        const { tooltip, onOpenChange } = createTestTooltip({
          popupGroup: () => group,
          sticky: () => true,
        });
        const trigger = document.createElement('button');

        owner.popover.setTriggerElement(trigger);
        tooltip.setTriggerElement(trigger);
        tooltip.open();
        onOpenChange.mockClear();

        owner.popover.open();

        expect(onOpenChange).not.toHaveBeenCalled();
        expect(tooltip.input.current.active).toBe(true);
      });

      it('opens via focus when no pointer down (keyboard Tab)', () => {
        const { tooltip, onOpenChange } = createTestTooltip();

        // Simulate keyboard Tab: focusin without preceding pointerdown
        tooltip.triggerProps.onFocusIn({ relatedTarget: null, preventDefault: vi.fn(), stopPropagation: vi.fn() });

        expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'focus' });
      });

      it('opens via keyboard focus after tap-triggered focus was suppressed', () => {
        const { tooltip, onOpenChange } = createTestTooltip();
        const pointerEvent = {
          clientX: 0,
          clientY: 0,
          pointerId: 1,
          pointerType: 'touch' as const,
          buttons: 0,
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        };

        // Tap: pointerdown → focusin (suppressed, flag consumed)
        tooltip.triggerProps.onPointerDown(pointerEvent);
        tooltip.triggerProps.onFocusIn({ relatedTarget: null, preventDefault: vi.fn(), stopPropagation: vi.fn() });
        expect(onOpenChange).not.toHaveBeenCalled();

        // Later keyboard Tab: flag is clean, focus opens tooltip
        tooltip.triggerProps.onFocusIn({ relatedTarget: null, preventDefault: vi.fn(), stopPropagation: vi.fn() });
        expect(onOpenChange).toHaveBeenCalledWith(true, { reason: 'focus' });
      });
    });
  });

  describe('group integration', () => {
    it('notifies group on open/close', () => {
      const group = new TooltipGroupCore();
      const notifyOpen = vi.spyOn(group, 'notifyOpen');
      const notifyClose = vi.spyOn(group, 'notifyClose');

      const { tooltip } = createTestTooltip({ group: () => group });

      tooltip.open();
      expect(notifyOpen).toHaveBeenCalled();

      tooltip.close();
      expect(notifyClose).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('prevents further open/close calls', () => {
      const { tooltip, onOpenChange } = createTestTooltip();

      tooltip.destroy();
      tooltip.open();

      expect(onOpenChange).not.toHaveBeenCalled();
      expect(tooltip.input.current.active).toBe(false);
    });
  });
});
