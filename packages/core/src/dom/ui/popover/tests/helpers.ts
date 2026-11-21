import { vi } from 'vite-plus/test';

import { createTransition } from '../../transition';
import { createPopover, type PopoverChangeDetails } from '../popover';

export function createTestPopover(overrides?: Partial<Parameters<typeof createPopover>[0]>) {
  const onOpenChange = vi.fn<(open: boolean, details: PopoverChangeDetails) => void>();
  const transition = overrides?.transition ?? createTransition();
  const popover = createPopover({
    transition,
    onOpenChange,
    closeOnEscape: () => true,
    closeOnOutsideClick: () => true,
    ...overrides,
  });

  return { popover, onOpenChange, transition };
}

/**
 * Focus `trigger` and pin whether it matches `:focus-visible`. jsdom applies the browser heuristic that script focus
 * inherits visibility from the previously focused element, so tests state it rather than depend on test order.
 */
export function focusTrigger(trigger: HTMLElement, { visible }: { visible: boolean }): void {
  trigger.focus();
  vi.spyOn(trigger, 'matches').mockImplementation((selector) =>
    selector === ':focus-visible' ? visible : Element.prototype.matches.call(trigger, selector)
  );
}
