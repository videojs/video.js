import { VolumeSliderCore, VolumeSliderDataAttrs } from '@videojs/core';
import {
  applyElementProps,
  applyStateDataAttrs,
  createSlider,
  createWheelStep,
  getSliderCSSVars,
  logMissingFeature,
  type SliderApi,
  selectControls,
  selectVolume,
} from '@videojs/core/dom';
import { type Text, translateText } from '@videojs/core/i18n';
import type { PropertyDeclarationMap, PropertyValues } from '@videojs/element';
import { ContextProvider } from '@videojs/element/context';
import { applyStyles } from '@videojs/utils/dom';

import { i18nContext } from '../../i18n/context';
import { I18nController } from '../../i18n/controller';
import { playerContext } from '../../player/context';
import { PlayerController } from '../../player/controller';
import { sliderContext } from '../slider/context';
import { UIElement } from '../ui-element';

/**
 * @fires drag-start - Fired when a pointer drag starts.
 * @fires drag-end - Fired when a pointer drag ends.
 */
export class VolumeSliderElement extends UIElement {
  static readonly tagName = 'media-volume-slider';

  static override properties = {
    label: { type: String },
    step: { type: Number },
    largeStep: { type: Number, attribute: 'large-step' },
    wheelStep: { type: Number, attribute: 'wheel-step' },
    orientation: { type: String },
    disabled: { type: Boolean },
    thumbAlignment: { type: String, attribute: 'thumb-alignment' },
  } satisfies PropertyDeclarationMap<Exclude<keyof VolumeSliderCore.Props, 'value' | 'min' | 'max'>>;

  label: Text | string = '';
  step = VolumeSliderCore.defaultProps.step;
  largeStep = VolumeSliderCore.defaultProps.largeStep;
  wheelStep = VolumeSliderCore.defaultProps.wheelStep;
  orientation = VolumeSliderCore.defaultProps.orientation;
  disabled = VolumeSliderCore.defaultProps.disabled;
  thumbAlignment = VolumeSliderCore.defaultProps.thumbAlignment;

  readonly #core = new VolumeSliderCore();
  readonly #controlsState = new PlayerController(this, playerContext, selectControls);
  readonly #provider = new ContextProvider(this, { context: sliderContext });
  readonly #volumeState = new PlayerController(this, playerContext, selectVolume);
  readonly #i18n = new I18nController(this, i18nContext);

  #slider: SliderApi | null = null;
  #disconnect: AbortController | null = null;
  #releaseControlsLock: (() => void) | null = null;

  override connectedCallback(): void {
    super.connectedCallback();

    if (this.destroyed) return;

    this.#disconnect = new AbortController();
    const signal = this.#disconnect.signal;

    const isDisabled = () => {
      const volume = this.#volumeState.value;

      return this.disabled || !volume || volume.volumeAvailability !== 'available';
    };

    const getPercent = () => (this.#volumeState.value?.volume ?? 0) * 100;
    const getStepPercent = () => this.#core.getStepPercent();
    const setVolume = (percent: number) => this.#setVolume(percent);

    this.#slider = createSlider({
      getElement: () => this,
      getThumbElement: () => this.querySelector<HTMLElement>('media-slider-thumb'),
      getOrientation: () => this.orientation,
      isDisabled,
      getPercent,
      getStepPercent,
      getLargeStepPercent: () => this.#core.getLargeStepPercent(),
      onValueChange: setVolume,
      onValueCommit: setVolume,
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

    const wheelProps = createWheelStep({
      isDisabled,
      getPercent,
      getStepPercent: () => this.#core.getWheelStepPercent(),
      onValueChange: (percent) => this.#volumeState.value?.setVolume(this.#core.rawValueFromPercent(percent) / 100),
    });

    applyElementProps(this, this.#slider.rootProps, { signal });
    applyElementProps(this, wheelProps, { signal });
    applyStyles(this, this.#slider.rootStyle);
    this.#slider.input.subscribe(() => this.requestUpdate(), { signal });

    if (__DEV__ && !this.#volumeState.value) {
      logMissingFeature(this.localName, this.#volumeState.displayName!);
    }
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
    this.#core.setFormatLocale(this.#i18n.locale);
  }

  protected override update(_changed: PropertyValues): void {
    super.update(_changed);

    if (!this.#slider) return;

    const media = this.#volumeState.value;
    if (!media) return;

    this.#core.setInput(this.#slider.input.current);
    this.#core.setMedia(media);
    const state = this.#core.getState();

    const cssVars = getSliderCSSVars(this.#slider.adjustForAlignment(state));
    const thumbAttrs = this.#core.getAttrs(state);

    applyStyles(this, cssVars);

    // Apply data attributes to root.
    applyStateDataAttrs(this, state, VolumeSliderDataAttrs);
    applyElementProps(this, { hidden: state.hidden ? '' : undefined });

    // Provide context to child elements.
    this.#provider.setValue({
      state,
      stateAttrMap: VolumeSliderDataAttrs,
      pointerValue: this.#core.valueFromPercent(state.pointerPercent),
      thumbAttrs: {
        ...thumbAttrs,
        'aria-label': translateText(thumbAttrs['aria-label'], this.#i18n.value),
        'aria-valuetext': translateText(
          thumbAttrs['aria-valuetext'],
          this.#i18n.value,
          this.#core.getValueTextParams(state)
        ),
      },
      thumbProps: this.#slider.thumbProps,
      formatValue: (value) => `${Math.round(value)}%`,
    });
  }

  #setVolume(percent: number): void {
    const media = this.#volumeState.value;

    media?.setVolume(this.#core.valueFromPercent(percent) / 100);
  }
}
