import type { MediaTextCue } from '@videojs/media';
import { describe, expect, it } from 'vite-plus/test';

import { SliderSegmentsCore } from '../../../slider/segments';
import { normalizeChapterCues, TimeSliderChaptersCore } from '../core';

function cue(startTime: number, endTime: number, text: string, id = ''): MediaTextCue {
  return { startTime, endTime, text, id } as MediaTextCue;
}

describe('normalizeChapterCues', () => {
  it('sorts, clamps, fills gaps, and gives overlaps to the earlier cue', () => {
    const second = cue(30, 80, 'Second', 'second');
    const first = cue(-10, 40, 'First', 'first');
    const result = normalizeChapterCues([second, first], 0, 100);

    expect(result).toMatchObject([
      { start: 0, end: 40, cue: first },
      { start: 40, end: 80, cue: second },
      { start: 80, end: 100, cue: null },
    ]);
    expect(result[0]?.key).toContain('cue-first-');
    expect(result[1]?.key).toContain('cue-second-');
  });

  it('keys cues by content, so fresh cue data keeps its keys across syncs', () => {
    // The store hands out new cue objects whenever it re-syncs (a duration
    // change re-clamps ends); the segments they render must not be rebuilt.
    const chapterKeys = (end: number) =>
      normalizeChapterCues([cue(0, end, 'Chapter')], 0, 100)
        .filter(({ cue: chapter }) => chapter !== null)
        .map(({ key }) => key);

    expect(chapterKeys(100)).toEqual(chapterKeys(50));
  });

  it('tells apart cues that share a start and a title', () => {
    const [first, second] = normalizeChapterCues([cue(0, 20, 'Same'), cue(0, 40, 'Same')], 0, 100);

    expect(first?.key).not.toBe(second?.key);
  });

  it('returns one full-domain gap when there are no usable cues', () => {
    expect(normalizeChapterCues([], 10, 20)).toEqual([{ key: 'gap-start-end', start: 10, end: 20, cue: null }]);
  });
});

describe('TimeSliderChaptersCore', () => {
  it('creates highlightable chapter ranges with non-highlightable gaps', () => {
    const chapter = cue(0, 40, 'First');
    const result = new TimeSliderChaptersCore().getRanges([chapter], 0, 100);

    expect(result).toMatchObject({ max: 100 });
    expect(result.ranges).toMatchObject([
      { start: 0, end: 40, highlight: true },
      { start: 40, end: 100, highlight: false },
    ]);
  });

  it('normalizes unavailable chapters to one full-domain range', () => {
    expect(new TimeSliderChaptersCore().getRanges([], 0, 0)).toMatchObject({
      chapters: [{ key: 'gap-start-end', start: 0, end: 1, cue: null }],
      ranges: [{ key: 'gap-start-end', start: 0, end: 1, highlight: false }],
      max: 1,
    });
  });

  it('ignores chapter cues until the slider domain is available', () => {
    expect(new TimeSliderChaptersCore().getRanges([cue(0, 40, 'First')], 0, 0)).toMatchObject({
      chapters: [{ key: 'gap-start-end', start: 0, end: 1, cue: null }],
      ranges: [{ key: 'gap-start-end', start: 0, end: 1, highlight: false }],
      max: 1,
    });
  });

  it('uses the real duration for ranges under one second', () => {
    const result = new TimeSliderChaptersCore().getRanges([cue(0, 0.5, 'Short')], 0, 0.5);

    expect(result.max).toBe(0.5);
    expect(result.ranges).toMatchObject([{ start: 0, end: 0.5 }]);
  });

  it('reuses normalized ranges until cues or bounds change', () => {
    const core = new TimeSliderChaptersCore();
    const cues = [cue(0, 50, 'First')];
    const result = core.getRanges(cues, 0, 100);

    expect(core.getRanges(cues, 0, 100)).toBe(result);
    expect(core.getRanges(cues, 0, 80)).toMatchObject({
      max: 80,
      ranges: [
        { start: 0, end: 50 },
        { start: 50, end: 80 },
      ],
    });
    expect(core.getRanges(cues, 10, 80)).toMatchObject({
      max: 80,
      ranges: [
        { start: 10, end: 50 },
        { start: 50, end: 80 },
      ],
    });
    expect(core.getRanges([], 10, 80).ranges).toMatchObject([{ start: 10, end: 80, highlight: false }]);
  });

  it('finds the chapter at a value including the final endpoint', () => {
    const core = new TimeSliderChaptersCore();
    const first = cue(0, 50, 'First');
    const second = cue(50, 100, 'Second');
    const { chapters } = core.getRanges([first, second], 0, 100);

    expect(core.findChapter(chapters, 50)?.cue).toBe(second);
    expect(core.findChapter(chapters, 100)?.cue).toBe(second);
    expect(core.findChapter(chapters, 101)).toBeUndefined();
  });

  it('adds the chapter cue and local buffer percentage to segment state', () => {
    const core = new TimeSliderChaptersCore();
    const chapter = cue(20, 60, 'Middle');
    const result = core.getRanges([chapter], 0, 100);
    const segments = new SliderSegmentsCore();
    const geometry = segments.getGeometry({
      ranges: result.ranges,
      min: 0,
      max: result.max,
      orientation: 'horizontal',
    });
    const segment = segments.getState(
      geometry[1]!,
      {
        value: 40,
        fillPercent: 40,
        pointerPercent: 0,
        dragging: false,
        pointing: false,
        interactive: false,
        orientation: 'horizontal',
        disabled: false,
        thumbAlignment: 'center',
      },
      0
    );

    expect(core.getState(segment, result.chapters, 50)).toMatchObject({
      cue: chapter,
      bufferPercent: 75,
    });
  });
});
