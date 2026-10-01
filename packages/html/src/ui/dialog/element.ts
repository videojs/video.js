import {
  DialogCore,
  DialogDataAttrs,
  type DialogInput,
  type DialogState,
  type StateAttrMap,
  type DialogProps,
} from '@videojs/core';
import {
  applyElementProps,
  applyStateDataAttrs,
  createDialog,
  createTransition,
  type DialogApi,
} from '@videojs/core/dom';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextProvider } from '@videojs/element/context';
import { SnapshotController } from '@videojs/store/html';

import { PositionController } from '../position-controller';
import { UIElement } from '../ui-element';
import { dialogContext } from './context';

let idCounter = 0;

export interface DialogElementBaseOptions {
  /** @internal */
  core?: DialogCore;
  /** @internal */
  stateAttrMap?: StateAttrMap<DialogState>;
  idPrefix?: string;
  bindTrigger?: boolean;
}

export class DialogElementBase extends UIElement {
  static override properties = {
    open: { type: Boolean },
    defaultOpen: { type: Boolean, attribute: 'default-open' },
    closeOnEscape: { type: Boolean, attribute: 'close-on-escape' },
  } satisfies PropertyDeclarationMap<keyof DialogProps>;

  open = DialogCore.defaultProps.open;
  defaultOpen = DialogCore.defaultProps.defaultOpen;
  closeOnEscape = DialogCore.defaultProps.closeOnEscape;

  readonly #core: DialogCore;
  readonly #stateAttrMap: StateAttrMap<DialogState>;
  readonly #provider = new ContextProvider(this, { context: dialogContext });
  readonly #position = new PositionController(this);
  readonly #popupId: string;
  readonly #titleId: string;
  readonly #descriptionId: string;
  readonly #bindTrigger: boolean;

  #dialog: DialogApi | null = null;
  #snapshot: SnapshotController<DialogInput> | null = null;
  #triggerAbort: AbortController | null = null;
  #triggerElement: HTMLElement | null = null;

  constructor({
    core = new DialogCore(),
    stateAttrMap = DialogDataAttrs,
    idPrefix = 'dialog',
    bindTrigger = true,
  }: DialogElementBaseOptions = {}) {
    super();
    this.#core = core;
    this.#stateAttrMap = stateAttrMap;
    this.#bindTrigger = bindTrigger;
    this.#popupId = `vjs-${idPrefix}-popup-${idCounter++}`;
    this.#titleId = `vjs-${idPrefix}-title-${idCounter++}`;
    this.#descriptionId = `vjs-${idPrefix}-desc-${idCounter++}`;
    this.#core.setTitleId(this.#titleId);
    this.#core.setDescriptionId(this.#descriptionId);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    this.#dialog = createDialog({
      transition: createTransition(),
      closeOnEscape: () => this.closeOnEscape,
      onOpenChange: (nextOpen: boolean) => {
        this.open = nextOpen;
        this.dispatchEvent(new CustomEvent('open-change', { detail: { open: nextOpen } }));
      },
      onOpenChangeComplete: (nextOpen: boolean) => {
        this.dispatchEvent(new CustomEvent('open-change-complete', { detail: { open: nextOpen } }));
      },
    });

    if (this.#snapshot) {
      this.#snapshot.track(this.#dialog.input);
    } else {
      this.#snapshot = new SnapshotController(this, this.#dialog.input);
    }
  }

  protected override firstUpdated(changed: PropertyValues): void {
    super.firstUpdated(changed);

    if (this.defaultOpen && !this.open) this.#dialog?.open();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#cleanupTrigger();
    this.#dialog?.destroy();
    this.#dialog = null;
  }

  close(): void {
    this.#dialog?.close();
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed);
    this.#core.setProps(this);

    if (this.#dialog && changed.has('open')) {
      const { active: inputOpen } = this.#dialog.input.current;

      if (this.open !== inputOpen) {
        if (this.open) this.#dialog.open();
        else this.#dialog.close();
      }
    }
  }

  protected override update(_changed: PropertyValues): void {
    super.update(_changed);

    if (!this.#dialog) return;

    const triggerElement = this.#bindTrigger ? this.#position.findTrigger() : null;

    this.#syncTrigger(triggerElement);

    const input = this.#dialog.input.current;

    this.#core.setInput(input);
    const state = this.#core.getState();

    applyStateDataAttrs(this, state, this.#stateAttrMap);

    if (this.#triggerElement) {
      applyElementProps(this.#triggerElement, this.#core.getTriggerAttrs(state, this.#popupId));
    }

    this.#provider.setValue({
      state,
      stateAttrMap: this.#stateAttrMap,
      dialog: this.#dialog,
      popupId: this.#popupId,
      popupAttrs: this.#core.getPopupAttrs(state),
      close: () => this.#dialog?.close(),
    });
  }

  #syncTrigger(triggerElement: HTMLElement | null): void {
    if (triggerElement === this.#triggerElement) return;

    this.#cleanupTrigger();
    this.#triggerElement = triggerElement;
    this.#dialog?.setTriggerElement(triggerElement);

    if (triggerElement && this.#dialog) {
      this.#triggerAbort = new AbortController();
      applyElementProps(triggerElement, this.#dialog.triggerProps, { signal: this.#triggerAbort.signal });
    }
  }

  #cleanupTrigger(): void {
    if (this.#triggerElement) {
      applyElementProps(this.#triggerElement, {
        'aria-expanded': undefined,
        'aria-haspopup': undefined,
        'aria-controls': undefined,
      });
    }

    this.#triggerAbort?.abort();
    this.#triggerAbort = null;
    this.#triggerElement = null;
    this.#dialog?.setTriggerElement(null);
  }
}

export class DialogElement extends DialogElementBase {
  static readonly tagName = 'media-dialog';
}
