import {
  createInputIndicatorLabels,
  type DeriveCustomStatus,
  getStatusIndicatorDisplayValue,
  type InputAction,
  StatusIndicatorCore,
  StatusIndicatorDataAttrs,
  type StatusIndicatorState,
} from '@videojs/core';
import { createTransition } from '@videojs/core/dom';
import type { PropertyDeclarationMap } from '@videojs/element';

import { i18nContext } from '../../i18n/context';
import { I18nController } from '../../i18n/controller';
import { InputIndicatorElement, type InputIndicatorOptions } from '../input-indicator/element';
import { LiveIndicator } from '../input-indicator/live-indicator';

export class StatusIndicatorElement extends InputIndicatorElement<StatusIndicatorState> {
  static readonly tagName = 'media-status-indicator';

  static override properties = {
    actions: { type: String },
    closeDelay: { type: Number, attribute: 'close-delay' },
  } satisfies PropertyDeclarationMap<'actions' | 'closeDelay'>;

  actions: string | undefined;
  closeDelay: number | undefined;

  readonly #i18n = new I18nController(this, i18nContext);
  readonly #core = new StatusIndicatorCore();
  readonly #transition = createTransition();
  readonly #liveIndicator = new LiveIndicator({
    host: this,
    dataAttrs: StatusIndicatorDataAttrs,
    render: renderStatusIndicator,
  });
  readonly #options = { replayOnUpdate: false } satisfies InputIndicatorOptions;
  #deriveCustomStatus: DeriveCustomStatus | undefined;

  /**
   * Derives display details for actions without built-in feedback, such as custom hotkey actions. Called only when the
   * built-in derivation returns `null`. Set as a JavaScript property; it has no attribute.
   */
  get deriveCustomStatus(): DeriveCustomStatus | undefined {
    return this.#deriveCustomStatus;
  }

  set deriveCustomStatus(value: DeriveCustomStatus | undefined) {
    this.#deriveCustomStatus = value;
    this.requestUpdate();
  }

  protected get core() {
    return this.#core;
  }

  protected get transition() {
    return this.#transition;
  }

  protected get liveIndicator() {
    return this.#liveIndicator;
  }

  protected override get options() {
    return this.#options;
  }

  protected override syncCoreProps(): void {
    this.#core.setProps({
      actions: parseActions(this.actions),
      closeDelay: this.closeDelay,
      labels: createInputIndicatorLabels(this.#i18n.value),
      deriveCustomStatus: this.#deriveCustomStatus,
    });
  }
}

function parseActions(actions: string | undefined): readonly InputAction[] | undefined {
  return actions?.split(/[\s,]+/).filter(Boolean) as readonly InputAction[] | undefined;
}

function renderStatusIndicator(element: HTMLElement, state: StatusIndicatorState): void {
  const value = element.querySelector('media-status-indicator-value');
  if (!value) return;

  value.textContent = getStatusIndicatorDisplayValue(state);
}
