import type { TooltipGroupCore } from '../../../core/ui/tooltip/group';
import type { UIPointerEvent } from '../event';
import type { PopupGroup } from '../popover/group';
import {
  createPopover,
  type PopoverApi,
  type PopoverChangeDetails,
  type PopoverOpenChangeReason,
  type PopoverOptions,
  type PopoverPopupProps,
  type PopoverTriggerProps,
} from '../popover/popover';
import type { TransitionApi } from '../transition';

export type TooltipOpenChangeReason = 'hover' | 'focus' | 'escape' | 'blur' | 'imperative-action';

export interface TooltipChangeDetails {
  reason: TooltipOpenChangeReason;
  event?: Event;
}

/** @internal */
export interface TooltipOptions {
  transition: TransitionApi;
  onOpenChange: (open: boolean, details: TooltipChangeDetails) => void;
  onOpenChangeComplete?: (open: boolean) => void;
  delay?: () => number;
  closeDelay?: () => number;
  disableHoverablePopup?: () => boolean;
  disabled?: () => boolean;
  sticky?: () => boolean;
  /** @internal Supplied by the framework tooltip provider or group element to coordinate delays. */
  group?: () => TooltipGroupCore | undefined;
  popupGroup?: () => PopupGroup | undefined;
}

/** @internal */
export interface TooltipTriggerProps extends Omit<PopoverTriggerProps, 'onClick'> {
  onPointerDown: (event: UIPointerEvent) => void;
}

/** @internal */
export interface TooltipPopupProps extends PopoverPopupProps {}

/** @internal */
export interface TooltipApi extends Omit<PopoverApi, 'triggerProps' | 'popupProps' | 'open' | 'close'> {
  triggerProps: TooltipTriggerProps;
  popupProps: TooltipPopupProps;
  open: () => void;
  close: (reason?: TooltipOpenChangeReason) => void;
}

/** Map popover reasons to tooltip reasons, filtering out click/outside-click. */
const REASON_MAP: Partial<Record<PopoverOpenChangeReason, TooltipOpenChangeReason>> = {
  hover: 'hover',
  focus: 'focus',
  escape: 'escape',
  blur: 'blur',
  'imperative-action': 'imperative-action',
};

/** @internal */
export function createTooltip(options: TooltipOptions): TooltipApi {
  const popoverOpts: PopoverOptions = {
    transition: options.transition,
    onOpenChange(open: boolean, details: PopoverChangeDetails) {
      const reason = REASON_MAP[details.reason];
      if (!reason) return;

      const group = options.group?.();

      if (open) group?.notifyOpen();
      else group?.notifyClose();

      const tooltipDetails: TooltipChangeDetails = details.event ? { reason, event: details.event } : { reason };

      options.onOpenChange(open, tooltipDetails);
    },
    closeOnEscape: () => true,
    closeOnOutsideClick: () => false,
    openOnHover: () => true,
    delay: () => {
      const group = options.group?.();
      if (group?.shouldSkipDelay()) return 0;

      return options.delay?.() ?? group?.delay ?? 600;
    },
    closeDelay: () => {
      const group = options.group?.();

      return options.closeDelay?.() ?? group?.closeDelay ?? 0;
    },
  };

  if (options.onOpenChangeComplete) {
    popoverOpts.onOpenChangeComplete = options.onOpenChangeComplete;
  }

  const popover = createPopover(popoverOpts);

  // Track whether a pointer is currently down so focus-triggered opens can be
  // suppressed during tap. The browser fires pointerdown → focus → pointerup,
  // so the flag is true during tap-triggered focus but false during keyboard Tab.
  let isPointerDown = false;
  let popupGroup: PopupGroup | undefined;
  let unsubscribe: (() => void) | undefined;

  function isTriggerPopupOpen(): boolean {
    return popupGroup?.isOpenFor(popover.triggerElement) ?? false;
  }

  function isSticky(): boolean {
    return options.sticky?.() ?? false;
  }

  function syncPopupGroup(): void {
    const next = options.popupGroup?.();
    if (next === popupGroup) return;

    unsubscribe?.();
    popupGroup = next;
    unsubscribe = popupGroup?.subscribe(() => {
      if (isTriggerPopupOpen() && !isSticky()) popover.close('imperative-action');
    });
  }

  function setTriggerElement(el: HTMLElement | null): void {
    popover.setTriggerElement(el);
    syncPopupGroup();

    if (isTriggerPopupOpen() && !isSticky()) popover.close('imperative-action');
  }

  // Spread popover trigger props, omit onClick, guard disabled/touch on open handlers.
  const { onClick: _, ...baseTriggerProps } = popover.triggerProps;
  const triggerProps: TooltipTriggerProps = {
    ...baseTriggerProps,
    onPointerDown() {
      syncPopupGroup();
      isPointerDown = true;

      if (!isSticky()) popover.close('imperative-action');
    },
    onPointerEnter(event) {
      syncPopupGroup();

      if (options.disabled?.()) return;

      if (isTriggerPopupOpen() && !isSticky()) return;

      if (event.pointerType === 'touch') return;

      baseTriggerProps.onPointerEnter(event);
    },
    onFocusIn(event) {
      syncPopupGroup();

      if (options.disabled?.()) return;

      if (isTriggerPopupOpen() && !isSticky()) return;

      if (isPointerDown) {
        isPointerDown = false;
        return;
      }

      baseTriggerProps.onFocusIn(event);
    },
  };

  // Spread popover popup props, guard disableHoverablePopup on pointer enter.
  const popupProps: TooltipPopupProps = {
    ...popover.popupProps,
    onPointerEnter(event) {
      if (options.disableHoverablePopup?.()) return;

      popover.popupProps.onPointerEnter(event);
    },
  };

  return {
    ...popover,
    triggerProps,
    popupProps,
    get triggerElement() {
      return popover.triggerElement;
    },
    setTriggerElement,
    open: () => {
      syncPopupGroup();

      if (!isTriggerPopupOpen() || isSticky()) popover.open('hover');
    },
    close: (reason: TooltipOpenChangeReason = 'hover') => popover.close(reason),
    destroy() {
      unsubscribe?.();
      popover.destroy();
    },
  };
}
