'use client';

import {
  type SliderSegmentRange,
  type SliderSegmentState,
  SliderSegmentsCore,
  TimeSliderChapterCSSVars,
} from '@videojs/core';
import { getStateDataAttrs } from '@videojs/core/dom';
import type { CSSProperties, ReactElement } from 'react';
import { Fragment, forwardRef, useMemo, useState } from 'react';

import type { HTMLProps, UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useSliderContext, useSliderPointerValue } from '../slider/context';

type SegmentProps = Omit<HTMLProps<HTMLElement>, 'ref'>;

interface SliderSegmentsProps extends Omit<UIComponentProps<'div', SliderSegmentState>, 'children'> {
  ranges: readonly SliderSegmentRange[];
  min: number;
  max: number;
  renderSegment: (props: SegmentProps, state: SliderSegmentState) => ReactElement;
}

/** Private React adapter for rendering normalized numeric slider segments. */
export const SliderSegments = forwardRef<HTMLDivElement, SliderSegmentsProps>(
  function SliderSegments(componentProps, ref) {
    const { ranges, min, max, renderSegment, render, className, style, ...elementProps } = componentProps;

    const slider = useSliderContext();
    const pointerValue = useSliderPointerValue();

    const [core] = useState(() => new SliderSegmentsCore());

    const geometry = useMemo(
      () => core.getGeometry({ ranges, min, max, orientation: slider.state.orientation }),
      [core, ranges, min, max, slider.state.orientation]
    );
    const sliderAttrs = getStateDataAttrs(slider.state, slider.stateAttrMap);

    const segments = geometry.map((segment) => {
      const state = core.getState(segment, slider.state, pointerValue);
      const segmentStyle = {
        [TimeSliderChapterCSSVars.start]: state.startPercent,
        [TimeSliderChapterCSSVars.end]: state.endPercent,
        [TimeSliderChapterCSSVars.width]: state.width ?? state.height,
        [TimeSliderChapterCSSVars.fill]: `${state.fillPercent}%`,
      } as CSSProperties;

      return (
        <Fragment key={state.key}>
          {renderSegment(
            {
              ...sliderAttrs,
              style: segmentStyle,
            },
            state
          )}
        </Fragment>
      );
    });

    const state = geometry.length > 0 ? core.getState(geometry[0]!, slider.state, pointerValue) : null;
    if (!state) return null;

    return renderElement(
      'div',
      { render, className, style },
      {
        state,
        ref,
        props: [{ 'aria-hidden': 'true' }, sliderAttrs, elementProps, { children: segments }],
      }
    );
  }
);
