'use client';

import {
  SliderCSSVars,
  TimeSliderCore,
  TimeSliderDataAttrs,
  type TimeSliderProps,
  type TimeSliderState,
} from '@videojs/core';
import {
  createTimeSliderProgress,
  getTimeSliderCSSVars,
  logMissingFeature,
  selectBuffer,
  selectPlayback,
  selectPlaybackRate,
  selectTime,
} from '@videojs/core/dom';
import { translateText } from '@videojs/core/i18n';
import { hasTimeRange, isMediaSeekCapable } from '@videojs/media';
import { useSnapshot } from '@videojs/store/react';
import { formatTime } from '@videojs/utils/time';
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useLocale, useTranslator } from '../../i18n/context';
import { useMedia, usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { useLatestRef } from '../../utils/use-latest-ref';
import { renderElement } from '../../utils/use-render';
import { useSlider } from '../hooks/use-slider';
import { SliderProvider } from '../slider/context';

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
    const rate = usePlayer(selectPlaybackRate);
    const mediaElement = useMedia();
    const [progress] = useState(() => createTimeSliderProgress(SliderCSSVars.fill));
    const visual = useSnapshot(progress.state);
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

        return core.getState(visual.currentTime);
      },
      getPercent: () => core.percentFromValue(time?.currentTime ?? 0),
      getStepPercent: () => core.getStepPercent(),
      getLargeStepPercent: () => core.getLargeStepPercent(),
      orientation,
      disabled: disabled || !media || !hasTimeRange(media),
      changeThrottle,
      adjustPercent: (rawPercent, thumbSize, trackSize) =>
        core.adjustPercentForAlignment(rawPercent, thumbSize, trackSize),
      getCSSVars: getTimeSliderCSSVars,
      onValueCommit: (percent) => {
        const media = mediaRef.current;

        if (media) {
          const time = core.rawValueFromPercent(percent);

          progress.seek(time);
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
      progress.update(
        core.getProgressState(playback, rate?.playbackRate ?? 1),
        () => (isMediaSeekCapable(mediaElement) ? mediaElement.currentTime : undefined),
        element.current
      );
    }, [
      progress,
      time?.currentTime,
      time?.duration,
      time?.seeking,
      rate?.playbackRate,
      core,
      playback,
      state.dragging,
      disabled,
      mediaElement,
    ]);
    useEffect(() => () => progress.destroy(), [progress]);

    if (!time) {
      if (__DEV__) logMissingFeature('TimeSlider', 'time');

      return null;
    }

    return (
      <SliderProvider
        value={{
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
        }}
      >
        {renderElement(
          'div',
          { render, className, style },
          {
            state,
            stateAttrMap: TimeSliderDataAttrs,
            ref: [forwardedRef, rootRef, element],
            props: [
              { 'data-playing': visual.advancing ? '' : undefined, style: { ...cssVars, ...rootStyle } },
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
