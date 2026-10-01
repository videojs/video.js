import { POPUP_HOST_ATTR, PopoverCore, PopoverDataAttrs, type PopoverInput, type PopoverProps } from '@videojs/core';
import {
  applyElementProps,
  applyStateDataAttrs,
  createPopover,
  createTransition,
  type PopoverApi,
  type PopoverChangeDetails,
  type PopoverOpenChangeReason,
  type PositioningBoundary,
} from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextConsumer } from '@videojs/element/context';
import { SnapshotController } from '@videojs/store/html';
import { tryHidePopover, tryShowPopover } from '@videojs/utils/dom';

import { containerContext } from '../../player/context';
import { popupGroupContext } from '../../player/popup-group-context';
import { PositionController } from '../position-controller';
import { UIElement } from '../ui-element';

/** @fires open-change - Fired when the popover's open state changes. */
export class PopoverElement extends UIElement {
  static readonly tagName: string = 'media-popover';

  static override properties = {
    open: { type: Boolean },
    defaultOpen: { type: Boolean, attribute: 'default-open' },
    side: { type: String },
    align: { type: String },
    modal: { type: Boolean },
    closeOnEscape: { type: Boolean, attribute: 'close-on-escape' },
    closeOnOutsideClick: { type: Boolean, attribute: 'close-on-outside-click' },
    openOnHover: { type: Boolean, attribute: 'open-on-hover' },
    delay: { type: Number },
    closeDelay: { type: Number, attribute: 'close-delay' },
    boundary: { type: String },
  } satisfies PropertyDeclarationMap<keyof PopoverProps>;

  open = PopoverCore.defaultProps.open;
  defaultOpen = PopoverCore.defaultProps.defaultOpen;
  side = PopoverCore.defaultProps.side;
  align = PopoverCore.defaultProps.align;
  modal: PopoverProps['modal'] = PopoverCore.defaultProps.modal;
  closeOnEscape = PopoverCore.defaultProps.closeOnEscape;
  closeOnOutsideClick = PopoverCore.defaultProps.closeOnOutsideClick;
  openOnHover = PopoverCore.defaultProps.openOnHover;
  delay = PopoverCore.defaultProps.delay;
  closeDelay = PopoverCore.defaultProps.closeDelay;
  boundary: PositioningBoundary = 'container';

  readonly #core = new PopoverCore();
  readonly #containerCtx = new ContextConsumer(this, { context: containerContext, subscribe: true });
  readonly #popupGroupCtx = new ContextConsumer(this, { context: popupGroupContext });
  readonly #position = new PositionController(this);
  #popover: PopoverApi | null = null;
  #snapshot: SnapshotController<PopoverInput> | null = null;

  // Cleanup controllers
  #disconnect: AbortController | null = null;
  #triggerAbort: AbortController | null = null;
  #currentTrigger: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    this.setAttribute(POPUP_HOST_ATTR, '');

    this.#disconnect = new AbortController();

    this.#popover = createPopover({
      transition: createTransition(),
      onOpenChange: (nextOpen: boolean, details: PopoverChangeDetails) => {
        this.open = nextOpen;
        this.dispatchEvent(new CustomEvent('open-change', { detail: { open: nextOpen, ...details } }));
      },
      closeOnEscape: () => this.closeOnEscape,
      closeOnOutsideClick: () => this.closeOnOutsideClick,
      openOnHover: () => this.openOnHover,
      delay: () => this.delay,
      closeDelay: () => this.closeDelay,
      group: () => this.#popupGroupCtx.value,
    });

    // Register self as the popup element — the element IS the popup.
    this.#popover.setPopupElement(this);

    // Apply popup event handlers (pointerenter/leave, focusout) to self.
    applyElementProps(this, this.#popover.popupProps, { signal: this.#disconnect.signal });

    // Subscribe to interaction state for reactive updates.
    // Reuse the controller across connect/disconnect cycles to avoid
    // leaking stale controllers in the host's controller set.
    if (this.#snapshot) {
      this.#snapshot.track(this.#popover.input);
    } else {
      this.#snapshot = new SnapshotController(this, this.#popover.input);
    }
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);

    // Uncontrolled mode: open if `defaultOpen` is set. Controlled `open`
    // is already synced by `willUpdate` on the first render cycle.
    if (this.defaultOpen && !this.open) {
      this.#popover?.open();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  override destroyCallback(): void {
    this.#cleanupTrigger();
    this.#popover?.destroy();
    super.destroyCallback();
  }

  close(reason: PopoverOpenChangeReason = 'imperative-action'): void {
    this.#popover?.close(reason);
  }

  protected get triggerElement(): HTMLElement | null {
    return this.#currentTrigger;
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.#core.setProps(this);

    // Sync controlled open state
    if (this.#popover && changed.has('open')) {
      const { active: interactionOpen } = this.#popover.input.current;

      if (this.open !== interactionOpen) {
        if (this.open) {
          this.#popover.open();
        } else {
          this.#popover.close();
        }
      }
    }
  }

  protected override update(_changed: PropertyValues): void {
    super.update(_changed);

    if (!this.#popover) return;

    // Discover trigger via commandfor linkage.
    const triggerEl = this.#position.findTrigger();

    this.#syncTrigger(triggerEl);

    // Derive state from core + input.
    const input = this.#popover.input.current;

    this.#core.setInput(input);
    const state = this.#core.getState();

    // Apply popup ARIA and data attributes to self.
    applyElementProps(this, this.#core.getPopupAttrs(state));
    applyStateDataAttrs(this, state, PopoverDataAttrs);

    // Show/hide via Popover API AFTER data attributes are applied so
    // `data-starting-style` is present before the first visible frame.
    if (state.open) {
      tryShowPopover(this);
    } else {
      tryHidePopover(this);
    }

    // Apply trigger ARIA to the discovered trigger.
    if (this.#currentTrigger) {
      applyElementProps(this.#currentTrigger, this.#core.getTriggerAttrs(state, this.id));
    }

    // Skip positioning when closed — no rects to measure.
    if (!state.open) {
      this.#position.cleanup();
      return;
    }

    this.#position.sync({
      anchorName: this.id,
      position: { side: state.side, align: state.align },
      trigger: this.#currentTrigger,
      boundary: this.boundary,
      container: this.#containerCtx.value?.container ?? null,
      onSideChange: (side) => this.setAttribute(PopoverDataAttrs.side, side),
    });
  }

  // --- Trigger management ---

  #syncTrigger(triggerEl: HTMLElement | null): void {
    if (triggerEl === this.#currentTrigger) return;

    this.#position.cleanup();
    this.#cleanupTrigger();
    this.#currentTrigger = triggerEl;
    this.#popover?.setTriggerElement(triggerEl);

    if (triggerEl && this.#popover) {
      this.#triggerAbort = new AbortController();
      applyElementProps(triggerEl, this.#popover.triggerProps, { signal: this.#triggerAbort.signal });
    }
  }

  #cleanupTrigger(): void {
    if (this.#currentTrigger) {
      applyElementProps(this.#currentTrigger, {
        'aria-expanded': undefined,
        'aria-haspopup': undefined,
        'aria-controls': undefined,
      });
    }

    this.#triggerAbort?.abort();
    this.#triggerAbort = null;
    this.#currentTrigger = null;
  }
}
