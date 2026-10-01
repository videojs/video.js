import { describe, expect, it } from 'vite-plus/test';

import { findMediaTrack, readBaseMediaDecodeTime } from '../timestamp-origin';
import { box, hdlr, initSegment, mediaSegment, tfhd, tkhd, trak } from './synthetic-boxes';

// Mirrors the Apple bipbop advanced example: a video init/segment that muxes a
// closed-caption (`clcp`) track alongside the `vide` track, each with its own
// timescale and baseMediaDecodeTime.
const muxedVideoInit = initSegment(
  trak({ handler: 'vide', trackId: 1, timescale: 6000 }),
  trak({ handler: 'clcp', trackId: 2, timescale: 30000 })
);
const muxedVideoSegment = mediaSegment(
  { trackId: 1, baseMediaDecodeTime: 60000 }, // video → 60000/6000 = 10.0s
  { trackId: 2, baseMediaDecodeTime: 300000 } // captions → 300000/30000 = 10.0s
);

describe('findMediaTrack', () => {
  it('returns undefined when a matching track has no mdhd or the init structure is absent', () => {
    const missingMdhd = initSegment(box('trak', tkhd(1), box('mdia', hdlr('vide'))));

    expect(findMediaTrack(missingMdhd, 'vide')).toBeUndefined();
    expect(findMediaTrack(box('ftyp'), 'vide')).toBeUndefined();
    expect(findMediaTrack(box('moov', box('mvhd')), 'vide')).toBeUndefined();
  });

  it('selects an audio track by handler', () => {
    const audioInit = initSegment(trak({ handler: 'soun', trackId: 1, timescale: 48000 }));

    expect(findMediaTrack(audioInit, 'soun')).toEqual({ trackId: 1, timescale: 48000 });
  });

  it('handles v1 tkhd/mdhd (wider date fields)', () => {
    const init = initSegment(trak({ handler: 'vide', trackId: 7, timescale: 90000, mdhdVersion: 1, tkhdVersion: 1 }));

    expect(findMediaTrack(init, 'vide')).toEqual({ trackId: 7, timescale: 90000 });
  });

  it('returns undefined when no track matches the handler', () => {
    expect(findMediaTrack(muxedVideoInit, 'soun')).toBeUndefined();
  });
});

describe('readBaseMediaDecodeTime', () => {
  it('reads a matching track’s 64-bit v1 decode time beyond the 32-bit range', () => {
    const large = 2 ** 33 + 12345;
    const segment = mediaSegment({ trackId: 1, baseMediaDecodeTime: large, version: 1 });

    expect(readBaseMediaDecodeTime(segment, 1)).toBe(large);
  });

  it('returns undefined when moof, traf, or a matching track’s tfdt is absent', () => {
    expect(readBaseMediaDecodeTime(box('styp'), 1)).toBeUndefined();
    expect(readBaseMediaDecodeTime(box('moof'), 1)).toBeUndefined();
    expect(readBaseMediaDecodeTime(box('moof', box('traf', tfhd(1))), 1)).toBeUndefined();
  });

  it('selects the traf matching track_id in a muxed segment', () => {
    expect(readBaseMediaDecodeTime(muxedVideoSegment, 1)).toBe(60000);
    expect(readBaseMediaDecodeTime(muxedVideoSegment, 2)).toBe(300000);
  });

  it('returns undefined when no traf matches track_id', () => {
    expect(readBaseMediaDecodeTime(muxedVideoSegment, 99)).toBeUndefined();
  });
});
