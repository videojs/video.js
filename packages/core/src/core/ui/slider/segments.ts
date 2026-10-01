import { toPercent } from '@videojs/utils/number';

import type { SliderState } from './core';

/** A numeric range rendered as one segment of a slider. */
export interface SliderSegmentRange {
  /** Stable identity used by platform renderers. */
  key: string;
  /** Raw range start in the slider value domain, before percentage normalization. */
  start: number;
  /** Raw range end in the slider value domain, before percentage normalization. */
  end: number;
  /** Whether the range can be highlighted. @default true */
  highlight?: boolean;
}

export interface SliderSegmentGeometry extends SliderSegmentRange {
  /** Position in the normalized collection. */
  index: number;
  /** Whether this is the final segment. */
  last: boolean;
  /** Slider axis. */
  orientation: SliderState['orientation'];
  /** Horizontal segment size. */
  width: `${number}%` | undefined;
  /** Vertical segment size. */
  height: `${number}%` | undefined;
  /** Segment start as a percentage of the slider domain. */
  startPercent: `${number}%`;
  /** Segment end as a percentage of the slider domain. */
  endPercent: `${number}%`;
}

export interface SliderSegmentState extends Omit<SliderSegmentGeometry, 'last'> {
  /** Fill from 0–100 relative to this segment. */
  fillPercent: number;
  /** Whether the slider value is within this segment. */
  active: boolean;
  /** Whether the pointer value is within this segment. */
  pointing: boolean;
  /** Whether the drag value is within this segment. */
  dragging: boolean;
  /** Whether pointer interaction is highlighting this segment. */
  highlighted: boolean;
  /** Whether this segment is the current interaction target. */
  interactive: boolean;
}

/** @internal */
export interface SliderSegmentsGeometryInput {
  ranges: readonly SliderSegmentRange[];
  min: number;
  max: number;
  orientation: SliderState['orientation'];
}

/**
 * Localizes ordered numeric ranges into slider geometry and interaction state.
 *
 * @internal
 */
export class SliderSegmentsCore {
  getGeometry(input: SliderSegmentsGeometryInput): SliderSegmentGeometry[] {
    const { ranges, min, max, orientation } = input;
    const domain = max - min;
    if (!Number.isFinite(domain) || domain <= 0) return [];

    const valid = ranges.filter((segment) => {
      const size = (segment.end - segment.start) / domain;
      const offset = (segment.start - min) / domain;

      return Number.isFinite(size) && Number.isFinite(offset) && size > 0;
    });

    return valid.map((segment, index) => {
      const offset = (segment.start - min) / domain;
      const size = (segment.end - segment.start) / domain;

      const segmentSize = `${size * 100}%` as const;

      return {
        ...segment,
        index,
        last: index === valid.length - 1,
        orientation,
        width: orientation === 'horizontal' ? segmentSize : undefined,
        height: orientation === 'vertical' ? segmentSize : undefined,
        startPercent: `${offset * 100}%`,
        endPercent: `${(offset + size) * 100}%`,
      };
    });
  }

  getState(segment: SliderSegmentGeometry, slider: SliderState, pointerValue: number): SliderSegmentState {
    const { last, ...geometry } = segment;
    const contains = (value: number): boolean =>
      value >= segment.start && (value < segment.end || (last && value === segment.end));

    const active = contains(slider.value);
    const pointing = slider.pointing && contains(pointerValue);
    const dragging = slider.dragging && contains(pointerValue);
    const focused = slider.interactive && !slider.pointing && !slider.dragging;

    return {
      ...geometry,
      fillPercent: toPercent(slider.value, segment.start, segment.end),
      active,
      pointing,
      dragging,
      highlighted: segment.highlight !== false && pointing,
      interactive: pointing || dragging || (focused && active),
    };
  }
}

/** @internal */
export namespace SliderSegmentsCore {
  export type Range = SliderSegmentRange;
  export type Geometry = SliderSegmentGeometry;
  export type State = SliderSegmentState;
}
