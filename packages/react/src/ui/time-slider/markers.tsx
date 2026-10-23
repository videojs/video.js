'use client';

import {
  getActiveTextCues,
  getTextCues,
  type TextTrackDefinition,
  TimeSliderMarkerCSSVars,
  TimeSliderMarkerDataAttrs,
  TimeSliderMarkersCore,
  type TimeSliderMarkerState,
} from '@videojs/core';
import { getStateDataAttrs, selectBuffer, selectTime } from '@videojs/core/dom';
import { getTimeRangeEnd, type TextTrackFilter } from '@videojs/media';
import type { CSSProperties, ReactElement } from 'react';
import { Fragment, forwardRef, useMemo, useState } from 'react';

import { usePlayer } from '../../player/context';
import { useReadTextCues, useWatchTextCues } from '../../text-track/use-text-cues';
import type { HTMLProps, UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useSliderContext } from '../slider/context';

export type { TimeSliderMarkerState } from '@videojs/core';

type MarkerProps = Omit<HTMLProps<HTMLElement>, 'ref'>;

/** @internal */
export interface TimeSliderMarkersState {
  /** The markers drawn, ordered by where they start. */
  markers: readonly TimeSliderMarkerState[];
}

/** @internal */
export interface TimeSliderMarkersProps extends Omit<UIComponentProps<'div', TimeSliderMarkersState>, 'children'> {
  /**
   * Picks the text tracks whose cues are drawn, by kind, label, or language, or with a function; a track definition
   * works too. A function filter should keep its identity across renders.
   */
  filter: TextTrackFilter | TextTrackDefinition;
  /** Render one marker. Defaults to a `<div>`. */
  renderMarker?: ((props: MarkerProps, state: TimeSliderMarkerState) => ReactElement) | undefined;
}

function renderDefaultMarker(props: MarkerProps): ReactElement {
  return <div {...props} />;
}

/**
 * Draws a marker on the time slider for each cue on the text tracks a filter matches, such as ad breaks. A point cue is
 * a marker with no width; a range spans from its start to its end. The store reads the matching tracks while the
 * component is mounted, so tracks it doesn't read by default work too. Markers are decorative: the slider's own value
 * is what assistive technology reads.
 *
 * ```tsx
 * <TimeSlider.Markers filter={{ label: 'ads' }} />;
 * ```
 *
 * @internal
 */
export const TimeSliderMarkers = forwardRef<HTMLDivElement, TimeSliderMarkersProps>(
  function TimeSliderMarkers(componentProps, ref) {
    const { filter, renderMarker = renderDefaultMarker, render, className, style, ...elementProps } = componentProps;
    const slider = useSliderContext();
    const time = usePlayer(selectTime);
    const buffer = usePlayer(selectBuffer);

    useWatchTextCues(filter);

    const cues = useReadTextCues(filter, getTextCues);
    const activeCues = useReadTextCues(filter, getActiveTextCues);
    const [core] = useState(() => new TimeSliderMarkersCore());
    const max = getTimeRangeEnd({ duration: time?.duration ?? 0, seekable: buffer?.seekable ?? [] });
    const markers = core.getMarkers({ cues, activeCues, min: 0, max, orientation: slider.state.orientation });
    const state = useMemo(() => ({ markers }), [markers]);
    const sliderAttrs = getStateDataAttrs(slider.state, slider.stateAttrMap);

    const children = markers.map((marker) => {
      // SAFETY: `CSSProperties` has no keys for custom properties; React sets these names as CSS variables.
      const markerStyle = {
        [TimeSliderMarkerCSSVars.start]: marker.startPercent,
        [TimeSliderMarkerCSSVars.end]: marker.endPercent,
        [TimeSliderMarkerCSSVars.width]: marker.width ?? marker.height,
      } as CSSProperties;

      return (
        <Fragment key={marker.key}>
          {renderMarker(
            { ...sliderAttrs, ...getStateDataAttrs(marker, TimeSliderMarkerDataAttrs), style: markerStyle },
            marker
          )}
        </Fragment>
      );
    });

    return renderElement(
      'div',
      { render, className, style },
      {
        state,
        ref,
        props: [{ 'aria-hidden': 'true' }, sliderAttrs, elementProps, { children }],
      }
    );
  }
);

/** @internal */
export namespace TimeSliderMarkers {
  export type Props = TimeSliderMarkersProps;
  export type State = TimeSliderMarkersState;
}
