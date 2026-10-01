import {
  type ButtonState,
  POPUP_HOST_ATTR,
  TooltipCore,
  TooltipCSSVars,
  TooltipDataAttrs,
  type TooltipInput,
  type TooltipProps,
} from '@videojs/core';
import {
  applyElementProps,
  applyStateDataAttrs,
  createTooltip,
  createTransition,
  HOTKEY_SHORTCUT_CHANGE_EVENT,
  type PositioningBoundary,
  type TooltipApi,
  type TooltipChangeDetails,
  type TooltipOpenChangeReason,
} from '@videojs/core/dom';
import { type Text, translateText } from '@videojs/core/i18n';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextConsumer } from '@videojs/element/context';
import type { State } from '@videojs/store';
import { SnapshotController } from '@videojs/store/html';
import { listen, tryHidePopover, tryShowPopover } from '@videojs/utils/dom';
import { isFunction } from '@videojs/utils/predicate';

import { i18nContext } from '../../i18n/context';
import { I18nController } from '../../i18n/controller';
import { containerContext } from '../../player/context';
import { popupGroupContext } from '../../player/popup-group-context';
import { PositionController } from '../position-controller';
import { UIElement } from '../ui-element';
import { tooltipGroupContext } from './context';
import { TooltipLabelElement } from './label';
import { TooltipShortcutElement } from './shortcut';

type TriggerElement = HTMLElement & {
  getLabel(): Text | string | undefined;
  getResolvedLabel?(): string | undefined;
  getShortcut?: (() => string | undefined) | undefined;
  $state: State<ButtonState>;
};

function isLabelTrigger(el: HTMLElement): el is TriggerElement {
  return '$state' in el;
}

/** @fires open-change - Fired when the tooltip's open state changes. */
export class TooltipElement extends UIElement {
  static readonly tagName = 'media-tooltip';

  static override properties = {
    open: { type: Boolean },
    defaultOpen: { type: Boolean, attribute: 'default-open' },
    side: { type: String },
    align: { type: String },
    delay: { type: Number },
    closeDelay: { type: Number, attribute: 'close-delay' },
    disableHoverablePopup: { type: Boolean, attribute: 'disable-hoverable-popup' },
    disabled: { type: Boolean },
    sticky: { type: Boolean },
    boundary: { type: String },
    trigger: { type: String },
  } satisfies PropertyDeclarationMap<keyof TooltipProps | 'trigger'>;

  open = TooltipCore.defaultProps.open;
  defaultOpen = TooltipCore.defaultProps.defaultOpen;
  side = TooltipCore.defaultProps.side;
  align = TooltipCore.defaultProps.align;
  delay = TooltipCore.defaultProps.delay;
  closeDelay = TooltipCore.defaultProps.closeDelay;
  disableHoverablePopup = TooltipCore.defaultProps.disableHoverablePopup;
  disabled = TooltipCore.defaultProps.disabled;
  sticky = TooltipCore.defaultProps.sticky;
  boundary: PositioningBoundary = 'container';
  trigger = '';

  readonly #core = new TooltipCore();
  readonly #i18n = new I18nController(this, i18nContext);
  readonly #groupConsumer = new ContextConsumer(this, { context: tooltipGroupContext });
  readonly #containerCtx = new ContextConsumer(this, { context: containerContext, subscribe: true });
  readonly #popupGroupCtx = new ContextConsumer(this, { context: popupGroupContext });
  readonly #position = new PositionController(this);
  #tooltip: TooltipApi | null = null;
  #snapshot: SnapshotController<TooltipInput> | null = null;

  // Cleanup controllers
  #disconnect: AbortController | null = null;
  #triggerAbort: AbortController | null = null;
  #currentTrigger: HTMLElement | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    this.setAttribute(POPUP_HOST_ATTR, '');

    this.#disconnect = new AbortController();

    this.#tooltip = createTooltip({
      transition: createTransition(),
      onOpenChange: (nextOpen: boolean, details: TooltipChangeDetails) => {
        this.open = nextOpen;
        this.dispatchEvent(new CustomEvent('open-change', { detail: { open: nextOpen, ...details } }));
      },
      delay: () => this.delay,
      closeDelay: () => this.closeDelay,
      disableHoverablePopup: () => this.disableHoverablePopup,
      disabled: () => this.disabled,
      sticky: () => this.sticky,
      // Lazy getter — group may arrive after connect via context.
      group: () => this.#groupConsumer.value,
      popupGroup: () => this.#popupGroupCtx.value,
    });

    // Register self as the popup element — the element IS the popup.
    this.#tooltip.setPopupElement(this);

    // Apply popup event handlers (pointerenter/leave, focusout) to self.
    applyElementProps(this, this.#tooltip.popupProps, { signal: this.#disconnect.signal });

    // Subscribe to interaction state for reactive updates.
    if (this.#snapshot) {
      this.#snapshot.track(this.#tooltip.input);
    } else {
      this.#snapshot = new SnapshotController(this, this.#tooltip.input);
    }
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);

    // Uncontrolled mode: open if `defaultOpen` is set. Controlled `open`
    // is already synced by `willUpdate` on the first render cycle.
    if (this.defaultOpen && !this.open) {
      this.#tooltip?.open();
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#cleanupTrigger();
    this.#tooltip?.destroy();
    this.#tooltip = null;
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  close(reason: TooltipOpenChangeReason = 'imperative-action'): void {
    this.#tooltip?.close(reason);
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.#core.setProps(this);

    // Sync controlled open state
    if (this.#tooltip && changed.has('open')) {
      const { active: interactionOpen } = this.#tooltip.input.current;

      if (this.open !== interactionOpen) {
        if (this.open) {
          this.#tooltip.open();
        } else {
          this.#tooltip.close();
        }
      }
    }
  }

  protected override update(_changed: PropertyValues): void {
    super.update(_changed);

    if (!this.#tooltip) return;

    const triggerEl = this.#position.findTrigger(this.trigger);

    this.#syncTrigger(triggerEl);

    if (this.#currentTrigger && isLabelTrigger(this.#currentTrigger)) {
      this.#syncContent(this.#currentTrigger);
    }

    // Derive state from core + input.
    const input = this.#tooltip.input.current;

    this.#core.setInput(input);
    const state = this.#core.getState();

    // Apply popup ARIA and data attributes to self.
    applyElementProps(this, this.#core.getPopupAttrs(state));
    applyStateDataAttrs(this, state, TooltipDataAttrs);

    // Show/hide via Popover API AFTER data attributes are applied so
    // `data-starting-style` is present before the first visible frame.
    if (state.open) {
      tryShowPopover(this);
    } else {
      tryHidePopover(this);
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
      cssVars: TooltipCSSVars,
      onSideChange: (side) => this.setAttribute(TooltipDataAttrs.side, side),
    });
  }

  // --- Trigger management ---

  #syncTrigger(triggerEl: HTMLElement | null): void {
    if (triggerEl === this.#currentTrigger) return;

    this.#position.cleanup();
    this.#cleanupTrigger();
    this.#currentTrigger = triggerEl;
    this.#tooltip?.setTriggerElement(triggerEl);

    if (triggerEl && this.#tooltip) {
      this.#triggerAbort = new AbortController();
      applyElementProps(triggerEl, this.#tooltip.triggerProps, { signal: this.#triggerAbort.signal });

      if (isLabelTrigger(triggerEl)) {
        this.#syncContent(triggerEl);
        triggerEl.$state.subscribe(() => this.#syncContent(triggerEl), {
          signal: this.#triggerAbort.signal,
        });
        listen(triggerEl, HOTKEY_SHORTCUT_CHANGE_EVENT, () => this.#syncContent(triggerEl), {
          signal: this.#triggerAbort.signal,
        });
      }
    }
  }

  #syncContent(triggerEl: TriggerElement): void {
    const label = triggerEl.getLabel();
    let resolved = isFunction(triggerEl.getResolvedLabel) ? triggerEl.getResolvedLabel() : undefined;

    if (resolved === undefined && label) {
      resolved = translateText(label, this.#i18n.value);
    }

    const shortcut = triggerEl.getShortcut?.();

    let labelEl = TooltipLabelElement.findIn(this);
    let shortcutEl = TooltipShortcutElement.findIn(this);

    if (!labelEl && !shortcutEl) {
      if (this.#hostHasAuthoredTooltipContent()) return;

      labelEl = TooltipLabelElement.create();
      shortcutEl = TooltipShortcutElement.create();
      this.replaceChildren(labelEl, shortcutEl);
    }

    labelEl?.setSyncedText(resolved ?? '');
    shortcutEl?.setSyncedShortcut(shortcut);
  }

  #hostHasAuthoredTooltipContent(): boolean {
    return Array.from(this.childNodes).some((node) => !!node.textContent?.trim());
  }

  #cleanupTrigger(): void {
    this.#triggerAbort?.abort();
    this.#triggerAbort = null;
    this.#currentTrigger = null;
  }
}
