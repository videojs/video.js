'use client';

import { TimeSliderChaptersCore } from '@videojs/core';
import { selectTextTrack, selectTime } from '@videojs/core/dom';
import type { MediaTextCue } from '@videojs/media';
import { forwardRef, useMemo, useState } from 'react';

import { usePlayer } from '../../player/context';
import type { UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useSliderContext, useSliderPointerValue } from '../slider/context';

export interface TimeSliderChapterTitleState {
  /** Chapter at the current interaction value. */
  cue: MediaTextCue | null;
  /** Chapter cue text, or an empty string for an uncovered interval. */
  text: string;
}

export interface TimeSliderChapterTitleProps extends UIComponentProps<'span', TimeSliderChapterTitleState> {}

/** Displays the chapter title at the current pointer or keyboard position. */
export const TimeSliderChapterTitle = forwardRef<HTMLSpanElement, TimeSliderChapterTitleProps>(
  function TimeSliderChapterTitle(componentProps, ref) {
    const { render, className, style, ...elementProps } = componentProps;
    const slider = useSliderContext();
    const pointerValue = useSliderPointerValue();
    const textTrack = usePlayer(selectTextTrack);
    const time = usePlayer(selectTime);
    const [core] = useState(() => new TimeSliderChaptersCore());
    const { chapters } = useMemo(
      () => core.getRanges(textTrack?.chaptersCues ?? [], 0, time?.duration ?? 0),
      [core, textTrack?.chaptersCues, time?.duration]
    );
    const keyboard = slider.state.interactive && !slider.state.pointing && !slider.state.dragging;
    const value = slider.state.pointing || slider.state.dragging ? pointerValue : slider.state.value;
    const chapter = core.findChapter(chapters, value);
    const cue = chapter?.cue ?? null;
    const state = { cue, text: cue?.text ?? '' };

    return renderElement(
      'span',
      { render, className, style },
      {
        state,
        ref,
        props: [
          {
            'aria-hidden': keyboard ? undefined : true,
            'aria-live': keyboard ? 'polite' : undefined,
            children: state.text,
          },
          elementProps,
        ],
      }
    );
  }
);

export namespace TimeSliderChapterTitle {
  export type Props = TimeSliderChapterTitleProps;
  export type State = TimeSliderChapterTitleState;
}
