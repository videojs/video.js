import { describe, expect, it } from 'vite-plus/test';

import type { VideoSample } from '../../h264';
import { toFragmentTiming } from '../avc';

const FRAME = 3000;

function sample(dts: number, pts: number, key = false): VideoSample {
  return { dts, pts, key, units: [], size: 1 };
}

/** Each sample's presentation time, recomputed from the fragment the way a demuxer reads it. */
function presentationTimes({ baseMediaDecodeTime, samples }: ReturnType<typeof toFragmentTiming>): number[] {
  let dts = baseMediaDecodeTime;

  return samples.map(({ duration, cts }) => {
    const pts = dts + cts;

    dts += duration;
    return pts;
  });
}

describe('toFragmentTiming', () => {
  // Decode order I P B B: the I frame presents two frames after it decodes.
  const bFrames = [
    sample(900_000, 900_000 + 2 * FRAME, true),
    sample(900_000 + FRAME, 900_000 + 5 * FRAME),
    sample(900_000 + 2 * FRAME, 900_000 + 3 * FRAME),
    sample(900_000 + 3 * FRAME, 900_000 + 4 * FRAME),
  ];

  it('starts decoding at the earliest presentation time', () => {
    expect(toFragmentTiming(bFrames).baseMediaDecodeTime).toBe(900_000 + 2 * FRAME);
  });

  it('presents every sample when it presented before', () => {
    expect(presentationTimes(toFragmentTiming(bFrames))).toEqual(bFrames.map(({ pts }) => pts));
  });

  it('leaves a stream without reordering unchanged', () => {
    const inOrder = [sample(0, 0, true), sample(FRAME, FRAME), sample(2 * FRAME, 2 * FRAME)];
    const timing = toFragmentTiming(inOrder);

    expect(timing.baseMediaDecodeTime).toBe(0);
    expect(timing.samples.map(({ cts }) => cts)).toEqual([0, 0, 0]);
  });
});
