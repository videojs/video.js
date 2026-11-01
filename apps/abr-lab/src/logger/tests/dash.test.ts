import { describe, expect, it } from 'vite-plus/test';

import { expandTemplate, expandTimeline, parseIsoDuration, parseSidx } from '../dash.ts';

describe('expandTemplate', () => {
  it('fills identifiers, zero-pads formatted ones, and keeps $$ as a dollar', () => {
    expect(expandTemplate('$RepresentationID$/seg-$Number%05d$.m4s', { RepresentationID: 'v1', Number: 42 })).toBe(
      'v1/seg-00042.m4s'
    );
    expect(expandTemplate('t$Time$-$$', { Time: 9000 })).toBe('t9000-$');
  });
});

describe('expandTimeline', () => {
  it('repeats entries and honors explicit start times', () => {
    expect(expandTimeline([{ t: 100, d: 10, r: 2 }, { d: 5 }, { t: 500, d: 7 }])).toEqual([
      { time: 100, duration: 10 },
      { time: 110, duration: 10 },
      { time: 120, duration: 10 },
      { time: 130, duration: 5 },
      { time: 500, duration: 7 },
    ]);
  });
});

describe('parseIsoDuration', () => {
  it('reads the forms MPDs use', () => {
    expect(parseIsoDuration('PT1H2M3.5S')).toBe(3723.5);
    expect(parseIsoDuration('PT634.566S')).toBeCloseTo(634.566);
    expect(parseIsoDuration('P1DT1S')).toBe(86_401);
    expect(parseIsoDuration('nonsense')).toBe(0);
  });
});

describe('parseSidx', () => {
  it('lays references out back to back after the box', () => {
    // Version 0 sidx: size, 'sidx', version+flags, reference_ID, timescale, earliest_pts, first_offset, reserved,
    // reference_count, then 12 bytes per reference.
    const references = [
      { size: 1000, duration: 4000 },
      { size: 1500, duration: 4000 },
    ];
    const size = 32 + 12 * references.length;
    const view = new DataView(new ArrayBuffer(size));

    view.setUint32(0, size);
    [...'sidx'].forEach((c, i) => view.setUint8(4 + i, c.charCodeAt(0)));
    view.setUint32(8, 0);
    view.setUint32(12, 1);
    view.setUint32(16, 1000);
    view.setUint32(20, 0);
    view.setUint32(24, 0);
    view.setUint16(30, references.length);
    references.forEach(({ size: s, duration }, i) => {
      view.setUint32(32 + 12 * i, s);
      view.setUint32(36 + 12 * i, duration);
    });

    expect(parseSidx(new Uint8Array(view.buffer), 800)).toEqual([
      { range: [800 + size, 800 + size + 999], seconds: 4 },
      { range: [800 + size + 1000, 800 + size + 2499], seconds: 4 },
    ]);
  });
});
