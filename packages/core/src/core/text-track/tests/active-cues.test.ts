import { describe, expect, it } from 'vite-plus/test';

import { findActiveCues, isCueActive } from '../active-cues';

describe('isCueActive', () => {
  it('is active from the start of a range up to its end', () => {
    const cue = { startTime: 10, endTime: 20 };

    expect(isCueActive(cue, 9.9)).toBe(false);
    expect(isCueActive(cue, 10)).toBe(true);
    expect(isCueActive(cue, 19.9)).toBe(true);
    expect(isCueActive(cue, 20)).toBe(false);
  });

  it('keeps a point active for one second', () => {
    const cue = { startTime: 10, endTime: 10 };

    expect(isCueActive(cue, 10)).toBe(true);
    expect(isCueActive(cue, 10.9)).toBe(true);
    expect(isCueActive(cue, 11)).toBe(false);
    expect(isCueActive(cue, 50)).toBe(false);
  });
});

describe('findActiveCues', () => {
  it('returns the active cues in list order', () => {
    const cues = [
      { startTime: 0, endTime: 10 },
      { startTime: 5, endTime: 5 },
      { startTime: 20, endTime: 30 },
    ];

    expect(findActiveCues(cues, 5.5)).toEqual([cues[0], cues[1]]);
  });

  it('counts cues playback passed since the last update', () => {
    const cues = [
      { startTime: 2, endTime: 2 },
      { startTime: 5, endTime: 5.5 },
      { startTime: 20, endTime: 30 },
    ];

    expect(findActiveCues(cues, 8, 1)).toEqual([cues[0], cues[1]]);
    expect(findActiveCues(cues, 8)).toEqual([]);
    // Going back, as a seek or a loop does, passes nothing.
    expect(findActiveCues(cues, 1, 8)).toEqual([]);
  });

  it('returns nothing before the time is known', () => {
    expect(findActiveCues([{ startTime: 0, endTime: 10 }], Number.NaN)).toEqual([]);
  });
});
