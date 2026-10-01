'use client';

import { VolumeSliderCore, VolumeSliderDataAttrs, type VolumeSliderProps, type VolumeSliderState } from '@videojs/core';
import { createWheelStep, getSliderCSSVars, logMissingFeature, selectVolume } from '@videojs/core/dom';
import { translateText } from '@videojs/core/i18n';
import { listen } from '@videojs/utils/dom';
import { forwardRef, useCallback, useRef, useState } from 'react';

import { useLocale, useTranslator } from '../../i18n/context';
import { usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { useLatestRef } from '../../utils/use-latest-ref';
import { renderElement } from '../../utils/use-render';
import { useSlider } from '../hooks/use-slider';
import { SliderProvider } from '../slider/context';

const noopVolume = {
  volume: 0,
  muted: false,
  volumeAvailability: 'unsupported' as const,
  mutedAvailability: 'unsupported' as const,
  setVolume: () => 0,
  setMuted: () => false,
};

export interface VolumeSliderRootProps extends UIComponentProps<'div', VolumeSliderState>, VolumeSliderProps {
  onDragStart?: (() => void) | undefined;
  onDragEnd?: (() => void) | undefined;
}

export const VolumeSliderRoot = forwardRef<HTMLDivElement, VolumeSliderRootProps>(
  function VolumeSliderRoot(componentProps, forwardedRef) {
    const {
      render,
      className,
      style,
      label,
      orientation,
      step = VolumeSliderCore.defaultProps.step,
      largeStep = VolumeSliderCore.defaultProps.largeStep,
      wheelStep = VolumeSliderCore.defaultProps.wheelStep,
      disabled,
      thumbAlignment,
      onDragStart,
      onDragEnd,
      ...elementProps
    } = componentProps;

    const volume = usePlayer(selectVolume);
    const translator = useTranslator();
    const locale = useLocale();

    const isUnavailable = volume?.volumeAvailability !== 'available';
    const isDisabled = Boolean(disabled) || isUnavailable;

    const [core] = useState(() => new VolumeSliderCore());

    core.setProps({ label, orientation, step, largeStep, wheelStep, disabled, thumbAlignment });
    core.setFormatLocale(locale);

    // Keep refs to the latest dynamic values for stable closures.
    const volumeRef = useLatestRef(volume);
    const disabledRef = useLatestRef(isDisabled);

    const getPercent = () => (volumeRef.current?.volume ?? 0) * 100;
    const getStepPercent = () => core.getStepPercent();
    const setVolume = (percent: number) => volumeRef.current?.setVolume(core.valueFromPercent(percent) / 100);

    const { state, input, cssVars, rootRef, thumbRef, rootProps, rootStyle, thumbProps } = useSlider<VolumeSliderState>(
      {
        computeState: (input) => {
          core.setInput(input);
          core.setMedia(volume ?? noopVolume);
          return core.getState();
        },
        getPercent,
        getStepPercent,
        getLargeStepPercent: () => core.getLargeStepPercent(),
        orientation,
        disabled: isDisabled,
        adjustPercent: (rawPercent, thumbSize, trackSize) =>
          core.adjustPercentForAlignment(rawPercent, thumbSize, trackSize),
        getCSSVars: getSliderCSSVars,
        onValueChange: setVolume,
        onValueCommit: setVolume,
        onDragStart,
        onDragEnd,
      }
    );

    const [wheelHandler] = useState(() =>
      createWheelStep({
        isDisabled: () => disabledRef.current,
        getPercent: () => (volumeRef.current?.volume ?? 0) * 100,
        getStepPercent: () => core.getWheelStepPercent(),
        onValueChange: (percent) => volumeRef.current?.setVolume(core.rawValueFromPercent(percent) / 100),
      })
    );

    // Attach non-passive wheel listener via callback ref so it covers
    // late-mounted elements (null → mounted after volume appears).
    const wheelCleanupRef = useRef<(() => void) | null>(null);
    const wheelRef = useCallback(
      (element: HTMLDivElement | null) => {
        wheelCleanupRef.current?.();
        wheelCleanupRef.current = null;

        if (element) {
          wheelCleanupRef.current = listen(element, 'wheel', wheelHandler.onWheel, { passive: false });
        }
      },
      [wheelHandler]
    );

    if (!volume) {
      if (__DEV__) logMissingFeature('VolumeSlider', 'volume');

      return null;
    }

    if (state.hidden) return null;

    return (
      <SliderProvider
        value={{
          state,
          pointerValue: core.valueFromPercent(state.pointerPercent),
          input,
          getPointerValue: (percent) => core.valueFromPercent(percent),
          thumbRef,
          thumbProps,
          stateAttrMap: VolumeSliderDataAttrs,
          getAttrs: (sliderState) => {
            const attrs = core.getAttrs(sliderState as VolumeSliderState);

            return {
              ...attrs,
              'aria-label': translateText(attrs['aria-label'], translator),
              'aria-valuetext': translateText(
                attrs['aria-valuetext'],
                translator,
                core.getValueTextParams(sliderState as VolumeSliderState)
              ),
            };
          },
          formatValue: (value) => `${Math.round(value)}%`,
        }}
      >
        {renderElement(
          'div',
          { render, className, style },
          {
            state,
            stateAttrMap: VolumeSliderDataAttrs,
            ref: [forwardedRef, rootRef, wheelRef],
            props: [{ style: { ...cssVars, ...rootStyle } }, rootProps, elementProps],
          }
        )}
      </SliderProvider>
    );
  }
);

export namespace VolumeSliderRoot {
  export type Props = VolumeSliderRootProps;
  export type State = VolumeSliderState;
}
