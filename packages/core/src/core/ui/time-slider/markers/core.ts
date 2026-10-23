import type { MediaTextCue } from '@videojs/media';
import { shallowEqual } from '@videojs/utils/object';

import type { SliderState } from '../../slider/core';

/**
 * One cue placed on the slider domain.
 *
 * @internal
 */
export interface TimeSliderMarkerRange {
  /** Stable identity used by platform renderers. */
  key: string;
  /** The cue the marker draws. */
  cue: MediaTextCue;
  /** Where the marker starts in the slider domain, clamped to it. */
  start: number;
  /** Where the marker ends in the slider domain, clamped to it. Equals `start` for a point. */
  end: number;
  /** Whether the cue marks one moment, its end being its start, rather than a span. */
  point: boolean;
}

/**
 * A marker's geometry and state, as renderers draw it.
 *
 * @internal
 */
export interface TimeSliderMarkerState extends TimeSliderMarkerRange {
  /** Position among the drawn markers. */
  index: number;
  /** Whether the cue is active now, as its track's `activeCues` lists it. */
  active: boolean;
  /** Slider axis. */
  orientation: SliderState['orientation'];
  /** Marker start as a percentage of the slider domain. */
  startPercent: `${number}%`;
  /** Marker end as a percentage of the slider domain. */
  endPercent: `${number}%`;
  /** Horizontal marker size; `0%` for a point. */
  width: `${number}%` | undefined;
  /** Vertical marker size; `0%` for a point. */
  height: `${number}%` | undefined;
}

/** @internal */
export interface TimeSliderMarkersInput {
  /** Cues to draw, from every matching track. */
  cues: readonly MediaTextCue[];
  /** The cues active now, as the same objects `cues` holds. */
  activeCues: readonly MediaTextCue[];
  min: number;
  max: number;
  orientation: SliderState['orientation'];
}

/**
 * A key for a marker's cue: its id, counted when cues from several tracks share one, so each marker keeps its node
 * while the store hands out fresh cue lists.
 */
function getMarkerKey(cue: MediaTextCue, seen: Map<string, number>): string {
  const base = `cue-${cue.id}`;
  const count = seen.get(base) ?? 0;

  seen.set(base, count + 1);

  return count ? `${base}-${count}` : base;
}

/**
 * Places cues on the slider domain, ordered by start and then end. A point stays a point; a range is clamped to the
 * domain. Cues outside the domain, and every cue while the domain is unknown, are left out.
 *
 * @internal
 */
export function normalizeMarkerCues(cues: readonly MediaTextCue[], min: number, max: number): TimeSliderMarkerRange[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];

  const seen = new Map<string, number>();
  const sorted = cues
    .filter((cue) => Number.isFinite(cue.startTime))
    .sort((a, b) => a.startTime - b.startTime || a.endTime - b.endTime);

  const markers: TimeSliderMarkerRange[] = [];

  for (const cue of sorted) {
    // Same rule as `isCueActive`: anything that doesn't end after it starts is a point.
    const point = !(cue.endTime > cue.startTime);

    if (point) {
      if (cue.startTime < min || cue.startTime > max) continue;

      markers.push({ key: getMarkerKey(cue, seen), cue, start: cue.startTime, end: cue.startTime, point });
      continue;
    }

    const start = Math.max(min, cue.startTime);
    const end = Math.min(max, cue.endTime);
    if (end <= start) continue;

    markers.push({ key: getMarkerKey(cue, seen), cue, start, end, point });
  }

  return markers;
}

/**
 * Places text cues on a slider for platform renderers.
 *
 * @internal
 */
export class TimeSliderMarkersCore {
  #input: TimeSliderMarkersInput | null = null;
  #ranges: TimeSliderMarkerRange[] = [];
  #markers: TimeSliderMarkerState[] = [];

  /**
   * Markers for the cues. Readers build fresh cue lists on every read, so lists holding the same cues reuse the
   * previous markers.
   */
  getMarkers(input: TimeSliderMarkersInput): TimeSliderMarkerState[] {
    const { cues, activeCues, min, max, orientation } = input;
    const previous = this.#input;
    const sameRanges = !!previous && shallowEqual(previous.cues, cues) && previous.min === min && previous.max === max;

    if (sameRanges && shallowEqual(previous.activeCues, activeCues) && previous.orientation === orientation) {
      return this.#markers;
    }

    const active = new Set(activeCues);
    const domain = max - min;

    if (!sameRanges) this.#ranges = normalizeMarkerCues(cues, min, max);

    this.#input = input;
    this.#markers = this.#ranges.map((range, index) => {
      const startPercent = `${((range.start - min) / domain) * 100}%` as const;
      const endPercent = `${((range.end - min) / domain) * 100}%` as const;
      const size = `${((range.end - range.start) / domain) * 100}%` as const;

      return {
        ...range,
        index,
        active: active.has(range.cue),
        orientation,
        startPercent,
        endPercent,
        width: orientation === 'horizontal' ? size : undefined,
        height: orientation === 'vertical' ? size : undefined,
      };
    });

    return this.#markers;
  }
}

/** @internal */
export namespace TimeSliderMarkersCore {
  export type Input = TimeSliderMarkersInput;
  export type Range = TimeSliderMarkerRange;
  export type State = TimeSliderMarkerState;
}
