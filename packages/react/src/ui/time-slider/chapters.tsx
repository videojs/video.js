'use client';

import {
  type SliderSegmentState,
  TimeSliderChapterCSSVars,
  TimeSliderChapterDataAttrs,
  type TimeSliderChapterRange,
  TimeSliderChaptersCore,
} from '@videojs/core';
import { getStateDataAttrs, selectBuffer, selectTextTrack, selectTime } from '@videojs/core/dom';
import { isFunction } from '@videojs/utils/predicate';
import type { CSSProperties, ReactElement } from 'react';
import { forwardRef, useMemo, useState } from 'react';

import { usePlayer } from '../../player/context';
import type { HTMLProps, UIComponentProps } from '../../utils/types';
import { SliderSegments } from './segments';

export type TimeSliderChapterState = TimeSliderChaptersCore.State;

export interface TimeSliderChaptersState {
  /** Normalized ranges spanning the full slider domain. */
  chapters: readonly TimeSliderChapterRange[];
}

export interface TimeSliderChaptersProps extends Omit<UIComponentProps<'div', TimeSliderChaptersState>, 'children'> {
  /** Render one consumer-owned subtree for every normalized chapter range. */
  renderChapter: (props: Omit<HTMLProps<HTMLElement>, 'ref'>, state: TimeSliderChapterState) => ReactElement;
}

/** Renders normalized chapter ranges across the full slider, including one full range when chapter cues are absent. */
export const TimeSliderChapters = forwardRef<HTMLDivElement, TimeSliderChaptersProps>(
  function TimeSliderChapters(componentProps, ref) {
    const { renderChapter, className, style, render, ...props } = componentProps;
    const textTrack = usePlayer(selectTextTrack);
    const buffer = usePlayer(selectBuffer);
    const time = usePlayer(selectTime);
    const duration = time?.duration ?? 0;
    const [core] = useState(() => new TimeSliderChaptersCore());
    const { chapters, ranges, max } = useMemo(
      () => core.getRanges(textTrack?.chaptersCues ?? [], 0, duration),
      [core, textTrack?.chaptersCues, duration]
    );
    const bufferedEnd = buffer?.buffered.length ? buffer.buffered[buffer.buffered.length - 1]![1] : 0;
    const getChapterState = (segment: SliderSegmentState) => core.getState(segment, chapters, bufferedEnd);
    const state = useMemo(() => ({ chapters }), [chapters]);

    return (
      <SliderSegments
        ref={ref}
        {...props}
        className={isFunction(className) ? className(state) : className}
        style={isFunction(style) ? style(state) : style}
        render={isFunction(render) ? (renderProps) => render(renderProps, state) : render}
        ranges={ranges}
        min={0}
        max={max}
        renderSegment={(segmentProps, segment) => {
          const state = getChapterState(segment);
          const chapterProps = {
            ...segmentProps,
            ...getStateDataAttrs(state, TimeSliderChapterDataAttrs),
            style: {
              ...segmentProps.style,
              pointerEvents: state.cue ? undefined : 'none',
              [TimeSliderChapterCSSVars.buffer]: `${state.bufferPercent}%`,
            } as CSSProperties,
          };

          return renderChapter(chapterProps, state);
        }}
      />
    );
  }
);

export namespace TimeSliderChapters {
  export type Props = TimeSliderChaptersProps;
  export type State = TimeSliderChaptersState;
}
