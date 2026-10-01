import {
  createInputIndicatorLabels,
  getVolumeIndicatorDisplayValue,
  VolumeIndicatorCore,
  VolumeIndicatorCSSVars,
  VolumeIndicatorDataAttrs,
  type VolumeIndicatorState,
} from '@videojs/core';
import { createTransition } from '@videojs/core/dom';
import type { PropertyDeclarationMap } from '@videojs/element';

import { i18nContext } from '../../i18n/context';
import { I18nController } from '../../i18n/controller';
import { InputIndicatorElement, type InputIndicatorOptions } from '../input-indicator/element';
import { LiveIndicator } from '../input-indicator/live-indicator';

export class VolumeIndicatorElement extends InputIndicatorElement<VolumeIndicatorState> {
  static readonly tagName = 'media-volume-indicator';

  static override properties = {
    closeDelay: { type: Number, attribute: 'close-delay' },
  } satisfies PropertyDeclarationMap<'closeDelay'>;

  closeDelay: number | undefined;

  readonly #i18n = new I18nController(this, i18nContext);
  readonly #core = new VolumeIndicatorCore();
  readonly #transition = createTransition();
  readonly #liveIndicator = new LiveIndicator({
    host: this,
    dataAttrs: VolumeIndicatorDataAttrs,
    render: renderVolumeIndicator,
  });
  readonly #options = { replayOnUpdate: false } satisfies InputIndicatorOptions;

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
      closeDelay: this.closeDelay,
      labels: createInputIndicatorLabels(this.#i18n.value),
    });
  }
}

function renderVolumeIndicator(element: HTMLElement, state: VolumeIndicatorState): void {
  const fill = element.querySelector<HTMLElement>('media-volume-indicator-fill');
  const value = element.querySelector('media-volume-indicator-value');

  if (state.fill) {
    fill?.style.setProperty(VolumeIndicatorCSSVars.fill, state.fill);
  } else {
    fill?.style.removeProperty(VolumeIndicatorCSSVars.fill);
  }

  if (value) {
    value.textContent = getVolumeIndicatorDisplayValue(state);
  }
}
