import { SliderCore, SliderDataAttrs, type SliderProps } from '@videojs/core';
import {
  applyElementProps,
  applyStateDataAttrs,
  createSlider,
  getSliderCSSVars,
  type SliderApi,
  selectControls,
} from '@videojs/core/dom';
import { type Text, translateText } from '@videojs/core/i18n';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextProvider } from '@videojs/element/context';
import { applyStyles } from '@videojs/utils/dom';

import { i18nContext } from '../../i18n/context';
import { I18nController } from '../../i18n/controller';
import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { UIElement } from '../ui-element';
import { sliderContext } from './context';

/**
 * @fires value-change - Fired while the slider value changes during an interaction.
 * @fires value-commit - Fired when an interaction commits the slider value.
 * @fires drag-start - Fired when a pointer drag starts.
 * @fires drag-end - Fired when a pointer drag ends.
 */
export class SliderElement extends UIElement {
  static readonly tagName = 'media-slider';

  static override properties = {
    label: { type: String },
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    largeStep: { type: Number, attribute: 'large-step' },
    orientation: { type: String },
    disabled: { type: Boolean },
    thumbAlignment: { type: String, attribute: 'thumb-alignment' },
  } satisfies PropertyDeclarationMap<keyof SliderProps>;

  label: Text | string = '';
  value = SliderCore.defaultProps.value;
  min = SliderCore.defaultProps.min;
  max = SliderCore.defaultProps.max;
  step = SliderCore.defaultProps.step;
  largeStep = SliderCore.defaultProps.largeStep;
  orientation = SliderCore.defaultProps.orientation;
  disabled = SliderCore.defaultProps.disabled;
  thumbAlignment = SliderCore.defaultProps.thumbAlignment;

  readonly #core = new SliderCore();
  readonly #controlsState = new PlayerController(this, playerContext, selectControls);
  readonly #i18n = new I18nController(this, i18nContext);
  readonly #provider = new ContextProvider(this, { context: sliderContext });

  #slider: SliderApi | null = null;
  #disconnect: AbortController | null = null;
  #releaseControlsLock: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    this.#disconnect = new AbortController();
    const signal = this.#disconnect.signal;

    this.#slider = createSlider({
      getElement: () => this,
      getThumbElement: () => this.querySelector<HTMLElement>('media-slider-thumb'),
      getOrientation: () => this.orientation,
      isDisabled: () => this.disabled,
      getPercent: () => this.#core.percentFromValue(this.value),
      getStepPercent: () => this.#core.getStepPercent(),
      getLargeStepPercent: () => this.#core.getLargeStepPercent(),
      onValueChange: (percent) => {
        this.value = this.#core.valueFromPercent(percent);
        this.dispatchEvent(new CustomEvent('value-change', { detail: { value: this.value }, bubbles: true }));
      },
      onValueCommit: (percent) => {
        this.value = this.#core.valueFromPercent(percent);
        this.dispatchEvent(new CustomEvent('value-commit', { detail: { value: this.value }, bubbles: true }));
      },
      onPressStart: () => {
        this.#releaseControlsLock ??= this.#controlsState.value?.requestControlsLock() ?? null;
      },
      onPressEnd: () => this.#releaseControlsVisibilityLock(),
      onDragStart: () => {
        this.dispatchEvent(new CustomEvent('drag-start', { bubbles: true }));
      },
      onDragEnd: () => {
        this.dispatchEvent(new CustomEvent('drag-end', { bubbles: true }));
      },
      adjustPercent: (raw, thumbSize, trackSize) => this.#core.adjustPercentForAlignment(raw, thumbSize, trackSize),
      onResize: () => this.requestUpdate(),
    });

    applyElementProps(this, this.#slider.rootProps, { signal });
    applyStyles(this, this.#slider.rootStyle);
    this.#slider.input.subscribe(() => this.requestUpdate(), { signal });
  }

  override disconnectedCallback(): void {
    this.#releaseControlsVisibilityLock();
    super.disconnectedCallback();
    this.#disconnect?.abort();
    this.#disconnect = null;
  }

  override destroyCallback(): void {
    this.#releaseControlsVisibilityLock();
    this.#slider?.destroy();
    super.destroyCallback();
  }

  #releaseControlsVisibilityLock(): void {
    this.#releaseControlsLock?.();
    this.#releaseControlsLock = null;
  }

  protected override willUpdate(_changed: PropertyValues): void {
    super.willUpdate(_changed);
    this.#core.setProps(this);
  }

  protected override update(_changed: PropertyValues): void {
    super.update(_changed);

    if (!this.#slider) return;

    this.#core.setInput(this.#slider.input.current);
    const state = this.#core.getSliderState(this.value);

    const cssVars = getSliderCSSVars(this.#slider.adjustForAlignment(state));

    applyStyles(this, cssVars);

    // Apply state data attributes to the root element.
    applyStateDataAttrs(this, state, SliderDataAttrs);

    // Provide context to child elements (thumb, value, track, etc.).
    this.#provider.setValue({
      state,
      stateAttrMap: SliderDataAttrs,
      pointerValue: this.#core.valueFromPercent(state.pointerPercent),
      thumbAttrs: (() => {
        const attrs = this.#core.getAttrs(state);

        return { ...attrs, 'aria-label': translateText(attrs['aria-label'], this.#i18n.value) };
      })(),
      thumbProps: this.#slider.thumbProps,
    });
  }
}
