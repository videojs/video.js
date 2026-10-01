import { describe, expect, it } from 'vite-plus/test';

import { findBox, iterateBoxes, iterateBoxesOfType, readFullBoxVersion, toDataView } from '../box';
import { box, concat, largeBox, u32 } from './synthetic-boxes';

const view = (data: Uint8Array) => toDataView(data);

describe('iterateBoxes', () => {
  it('yields top-level boxes with correct type and offsets', () => {
    const ftyp = box('ftyp', u32(0));
    const moov = box('moov', u32(0));
    const boxes = [...iterateBoxes(view(concat(ftyp, moov)))];

    expect(boxes.map((b) => b.type)).toEqual(['ftyp', 'moov']);
    expect(boxes[0]).toMatchObject({ start: 0, dataStart: 8, end: ftyp.length });
    expect(boxes[1]).toMatchObject({ start: ftyp.length, dataStart: ftyp.length + 8 });
  });

  it('reads a 64-bit largesize box (size field === 1)', () => {
    const big = largeBox('free', u32(0));
    const [b] = [...iterateBoxes(view(big))];

    expect(b).toMatchObject({ type: 'free', start: 0, dataStart: 16, end: big.length });
  });

  it('stops on a malformed size smaller than the header', () => {
    const bad = new Uint8Array(8);

    new DataView(bad.buffer).setUint32(0, 2); // size 2 < 8-byte header
    expect([...iterateBoxes(view(bad))]).toEqual([]);
  });
});

describe('iterateBoxesOfType', () => {
  it('yields only direct children of the given type', () => {
    const first = box('trak', u32(1));
    const container = box('moov', box('trak', u32(3)));
    const data = concat(first, container, box('trak', u32(2)));
    const traks = [...iterateBoxesOfType(view(data), 'trak')];

    expect(traks).toHaveLength(2);
    expect(traks.map((b) => ({ type: b.type, start: b.start }))).toEqual([
      { type: 'trak', start: 0 },
      { type: 'trak', start: first.length + container.length },
    ]);
  });
});

describe('readFullBoxVersion', () => {
  it('reads the version byte at the payload start', () => {
    for (const version of [0, 1] as const) {
      const dv = view(box('mdhd', new Uint8Array([version, 0, 0, 0])));
      const [b] = [...iterateBoxes(dv)];

      expect(readFullBoxVersion(dv, b!.dataStart)).toBe(version);
    }
  });
});

describe('findBox', () => {
  it('descends a nested path', () => {
    const data = box('moov', box('trak', box('mdia', box('mdhd', u32(90000)))));
    const found = findBox(view(data), ['moov', 'trak', 'mdia', 'mdhd']);

    expect(found?.type).toBe('mdhd');
  });

  it('skips non-matching siblings at each level', () => {
    const data = concat(box('free', u32(0)), box('moov', box('mvhd', u32(0)), box('trak', box('tkhd', u32(0)))));

    expect(findBox(view(data), ['moov', 'trak'])?.type).toBe('trak');
  });

  it('returns undefined when any path level is absent', () => {
    const data = box('moov', box('trak'));

    expect(findBox(view(data), ['moov', 'trak', 'mdia'])).toBeUndefined();
    expect(findBox(view(data), ['moof', 'traf'])).toBeUndefined();
  });
});
