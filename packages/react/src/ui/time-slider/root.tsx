'use client';

import {
  SliderCSSVars,
  TimeSliderCore,
  TimeSliderDataAttrs,
  type TimeSliderProps,
  type TimeSliderState,
} from '@videojs/core';
import {
  createTimeSliderSeek,
  getTimeSliderCSSVars,
  logMissingFeature,
  selectBuffer,
  selectPlayback,
  selectTime,
} from '@videojs/core/dom';
import { translateText } from '@videojs/core/i18n';
import { hasTimeRange, isMediaPlaying } from '@videojs/media';
import { useSnapshot } from '@videojs/store/react';
import { formatTime } from '@videojs/utils/time';
import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useLocale, useTranslator } from '../../i18n/context';
import { usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { useLatestRef } from '../../utils/use-latest-ref';
import { renderElement } from '../../utils/use-render';
import { useSlider } from '../hooks/use-slider';
import { SliderProvider, type SliderContextValue } from '../slider/context';

const noopSeek = (): Promise<number> => Promise.resolve(0);

export interface TimeSliderRootProps extends UIComponentProps<'div', TimeSliderState>, TimeSliderProps {
  onDragStart?: (() => void) | undefined;
  onDragEnd?: (() => void) | undefined;
}

export const TimeSliderRoot = forwardRef<HTMLDivElement, TimeSliderRootProps>(
  function TimeSliderRoot(componentProps, forwardedRef) {
    const {
      render,
      className,
      style,
      label,
      changeThrottle = TimeSliderCore.defaultProps.changeThrottle,
      step = TimeSliderCore.defaultProps.step,
      largeStep = TimeSliderCore.defaultProps.largeStep,
      orientation,
      disabled,
      thumbAlignment,
      onDragStart,
      onDragEnd,
      pauseOnDrag,
      ...elementProps
    } = componentProps;

    const time = usePlayer(selectTime);
    const buffer = usePlayer(selectBuffer);
    const playback = usePlayer(selectPlayback);
    const [seek] = useState(() => createTimeSliderSeek(SliderCSSVars.fill));
    const target = useSnapshot(seek.state);
    const element = useRef<HTMLDivElement>(null);

    const translator = useTranslator();
    const locale = useLocale();

    const [core] = useState(() => new TimeSliderCore());

    core.setProps({
      label,
      step,
      largeStep,
      orientation,
      disabled,
      thumbAlignment,
      pauseOnDrag,
      changeThrottle,
    });
    core.setFormatLocale(locale);

    // `bufferFeature` is optional: compositions that omit it still get a working slider, with an empty buffer.
    const media = time ? { ...time, ...(buffer ?? { buffered: [], seekable: [] }) } : null;

    // Keep a ref to the latest media state for callbacks that fire outside the render cycle.
    const mediaRef = useLatestRef(media);
    const playbackRef = useLatestRef(playback);

    // Resume playback if the slider unmounts mid-drag — createSlider's destroy()
    // does not fire onDragEnd, so without this the player would stay paused.
    useEffect(() => {
      return () => core.endDrag(playbackRef.current);
    }, [core]);

    const { state, input, cssVars, rootRef, thumbRef, rootProps, rootStyle, thumbProps } = useSlider<TimeSliderState>({
      computeState: (input) => {
        core.setInput(input);

        core.setMedia(
          media ?? {
            currentTime: 0,
            duration: 0,
            seeking: false,
            seek: noopSeek,
            buffered: [],
            seekable: [],
          }
        );

        return core.getState();
      },
      getPercent: () => core.percentFromValue(time?.currentTime ?? 0),
      getStepPercent: () => core.getStepPercent(),
      getLargeStepPercent: () => core.getLargeStepPercent(),
      orientation,
      disabled: disabled || !media || !hasTimeRange(media),
      changeThrottle,
      adjustPercent: (rawPercent, thumbSize, trackSize) =>
        core.adjustPercentForAlignment(rawPercent, thumbSize, trackSize),
      getStyleState: (state) =>
        target.percent === undefined || state.dragging || state.disabled
          ? state
          : { ...state, fillPercent: target.percent },
      getCSSVars: getTimeSliderCSSVars,
      onValueCommit: (percent) => {
        const media = mediaRef.current;

        if (media) {
          const time = core.rawValueFromPercent(percent);

          seek.seek(percent);
          media.seek(time);
        }
      },
      onDragStart: () => {
        core.startDrag(playbackRef.current);
        onDragStart?.();
      },
      onDragEnd: () => {
        core.endDrag(playbackRef.current);
        onDragEnd?.();
      },
    });

    useLayoutEffect(() => {
      seek.update(!!time?.seeking, state.fillPercent, element.current);
    }, [seek, time?.seeking, state.fillPercent]);
    useEffect(() => () => seek.destroy(), [seek]);

    const playing =
      isMediaPlaying(playback) && !state.disabled && !state.dragging && !time?.seeking && target.percent === undefined;

    const context = useMemo<SliderContextValue>(
      () => ({
        state,
        pointerValue: core.rawValueFromPercent(state.pointerPercent),
        input,
        getPointerValue: (percent) => core.rawValueFromPercent(percent),
        thumbRef,
        thumbProps,
        stateAttrMap: TimeSliderDataAttrs,
        getAttrs: (sliderState) => {
          const attrs = core.getAttrs(sliderState as TimeSliderState);

          return {
            ...attrs,
            'aria-label': translateText(attrs['aria-label'], translator),
            'aria-valuetext': translateText(
              attrs['aria-valuetext'],
              translator,
              core.getValueTextParams(sliderState as TimeSliderState)
            ),
          };
        },
        formatValue: (value) => formatTime(value, state.duration, { locale }),
      }),
      [state, input, core, thumbRef, thumbProps, translator, locale, label]
    );

    if (!time) {
      if (__DEV__) logMissingFeature('TimeSlider', 'time');

      return null;
    }

    return (
      <SliderProvider value={context}>
        {renderElement(
          'div',
          { render, className, style },
          {
            state,
            stateAttrMap: TimeSliderDataAttrs,
            ref: [forwardedRef, rootRef, element],
            props: [
              { 'data-playing': playing ? '' : undefined, style: { ...cssVars, ...rootStyle } },
              rootProps,
              elementProps,
            ],
          }
        )}
      </SliderProvider>
    );
  }
);

export namespace TimeSliderRoot {
  export type Props = TimeSliderRootProps;
  export type State = TimeSliderState;
}
