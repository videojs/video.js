import type { MediaTextCue } from '@videojs/media';
import { describe, expect, it } from 'vite-plus/test';

import { normalizeMarkerCues, TimeSliderMarkersCore } from '../core';

function cue(startTime: number, endTime: number, id = `${startTime}-${endTime}`): MediaTextCue {
  return { id, startTime, endTime, text: '' };
}

describe('normalizeMarkerCues', () => {
  it('keeps points as points and clamps ranges to the domain', () => {
    const point = cue(30, 30);
    const range = cue(-10, 40);
    const overflow = cue(80, 200);

    expect(normalizeMarkerCues([point, range, overflow], 0, 100)).toEqual([
      { key: 'cue--10-40', cue: range, start: 0, end: 40, point: false },
      { key: 'cue-30-30', cue: point, start: 30, end: 30, point: true },
      { key: 'cue-80-200', cue: overflow, start: 80, end: 100, point: false },
    ]);
  });

  it('orders markers by start and then end without reordering the input', () => {
    const late = cue(60, 60);
    const long = cue(10, 50);
    const short = cue(10, 20);
    const cues = [late, long, short];

    expect(normalizeMarkerCues(cues, 0, 100).map(({ cue }) => cue)).toEqual([short, long, late]);
    expect(cues).toEqual([late, long, short]);
  });

  it('leaves out cues outside the domain', () => {
    const atStart = cue(0, 0);
    const atEnd = cue(100, 100);

    expect(
      normalizeMarkerCues([cue(-1, -1), atStart, atEnd, cue(101, 101), cue(100, 120), cue(-20, 0)], 0, 100).map(
        ({ cue }) => cue
      )
    ).toEqual([atStart, atEnd]);
  });

  it('treats a cue that ends before it starts as a point', () => {
    expect(normalizeMarkerCues([cue(40, 10)], 0, 100)).toMatchObject([{ start: 40, end: 40, point: true }]);
  });

  it('skips cues without a finite start', () => {
    expect(normalizeMarkerCues([cue(Number.NaN, 10), cue(Number.POSITIVE_INFINITY, 10)], 0, 100)).toEqual([]);
  });

  it('draws nothing until the domain is known', () => {
    const cues = [cue(10, 10)];

    expect(normalizeMarkerCues(cues, 0, 0)).toEqual([]);
    expect(normalizeMarkerCues(cues, 0, Number.POSITIVE_INFINITY)).toEqual([]);
    expect(normalizeMarkerCues(cues, 0, Number.NaN)).toEqual([]);
  });

  it('tells apart cues from different tracks that share an id', () => {
    const [first, second] = normalizeMarkerCues([cue(10, 10, 'ad'), cue(20, 20, 'ad')], 0, 100);

    expect(first?.key).toBe('cue-ad');
    expect(second?.key).toBe('cue-ad-1');
  });

  it('keys markers by cue id, so fresh cue data keeps its keys', () => {
    const keys = (end: number) => normalizeMarkerCues([cue(10, end, 'ad')], 0, 100).map(({ key }) => key);

    expect(keys(30)).toEqual(keys(40));
  });
});

describe('TimeSliderMarkersCore', () => {
  it('places markers by percent of the domain', () => {
    const markers = new TimeSliderMarkersCore().getMarkers({
      cues: [cue(25, 25), cue(50, 75)],
      activeCues: [],
      min: 0,
      max: 200,
      orientation: 'horizontal',
    });

    expect(markers).toMatchObject([
      { index: 0, point: true, startPercent: '12.5%', endPercent: '12.5%', width: '0%', height: undefined },
      { index: 1, point: false, startPercent: '25%', endPercent: '37.5%', width: '12.5%', height: undefined },
    ]);
  });

  it('sizes markers along a vertical slider by height', () => {
    const [marker] = new TimeSliderMarkersCore().getMarkers({
      cues: [cue(0, 50)],
      activeCues: [],
      min: 0,
      max: 100,
      orientation: 'vertical',
    });

    expect(marker).toMatchObject({ orientation: 'vertical', width: undefined, height: '50%' });
  });

  it('marks the markers whose cues are active', () => {
    const first = cue(10, 10);
    const second = cue(20, 40);

    const markers = new TimeSliderMarkersCore().getMarkers({
      cues: [first, second],
      activeCues: [second],
      min: 0,
      max: 100,
      orientation: 'horizontal',
    });

    expect(markers.map(({ active }) => active)).toEqual([false, true]);
  });

  it('reuses markers until the input changes', () => {
    const core = new TimeSliderMarkersCore();
    const marker = cue(10, 10);
    const cues = [marker];
    const input = { cues, activeCues: [], min: 0, max: 100, orientation: 'horizontal' as const };
    const markers = core.getMarkers(input);

    expect(core.getMarkers({ ...input })).toBe(markers);
    expect(core.getMarkers({ ...input, activeCues: [marker] })[0]).toMatchObject({ active: true });
    expect(core.getMarkers({ ...input, max: 50 })[0]).toMatchObject({ startPercent: '20%' });
    expect(core.getMarkers({ ...input, cues: [] })).toEqual([]);
  });
});
