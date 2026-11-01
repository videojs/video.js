import type { TransferRecord } from '../record.ts';
import { type CapacityTrace, generateTrace, type NetworkProfile, seededRandom } from './trace.ts';

export interface SimulationOptions {
  recording: string;
  profile: NetworkProfile;
  durationMs: number;
  seed: number;
  ladderBps?: readonly number[];
  segmentSeconds?: number;
}

const DEFAULT_LADDER = [974_600, 1_861_200, 2_953_500, 5_639_700, 7_519_600, 11_030_800, 18_393_100];

/**
 * One player-like session over a synthetic network: fetch segments sequentially while the buffer is under a randomly
 * re-drawn target, idle while it drains. Renditions wander a rung at a time so request sizes vary. Randomizing the
 * schedule keeps idle gaps from encoding the network state.
 */
export function simulateRecording(options: SimulationOptions): TransferRecord[] {
  const { recording, profile, durationMs, seed } = options;
  const ladder = options.ladderBps ?? DEFAULT_LADDER;
  const segmentSeconds = options.segmentSeconds ?? 4;
  const random = seededRandom(seed);
  const trace = generateTrace(profile, durationMs + 120_000, random);
  const records: TransferRecord[] = [];
  const touched = new Set<number>();

  let now = 0;
  let buffer = 0;
  let rung = Math.floor(random() * ladder.length);
  let target = 10 + random() * 30;
  let lastEnd: number | undefined;

  for (let index = 0; now < durationMs; index++) {
    if (random() < 0.25) rung = clamp(rung + (random() < 0.5 ? -1 : 1), 0, ladder.length - 1);

    if (random() < 0.1) target = 10 + random() * 30;

    const bytes = Math.round(((ladder[rung]! * segmentSeconds) / 8) * (0.7 + 0.6 * random()));
    const start = now;
    const firstByte = start + trace.latencyAt(start);
    const { end, chunks } = deliver(trace, firstByte, 8 * bytes);

    records.push({
      id: `${recording}-${index}`,
      recording,
      kind: 'segment',
      trackType: 'video',
      url: `https://synthetic.test/${rung}/${index}.m4s`,
      origin: { site: 'synthetic.test', cdn: 'synthetic', host: 'synthetic.test', role: 'segment' },
      renditionId: String(rung),
      segmentIndex: index,
      wall: 1_800_000_000_000 + start,
      t: { start, firstByte, end },
      chunks,
      bytes,
      status: 200,
      firstTouch: { rendition: !touched.has(rung), url: true },
      idleGapMs: lastEnd === undefined ? undefined : start - lastEnd,
      overlapping: [],
      env: { visibility: 'visible' },
    });
    touched.add(rung);

    buffer = Math.max(0, buffer - (end - start) / 1000) + segmentSeconds;
    now = end;
    lastEnd = end;

    if (buffer >= target) {
      const resumeAt = Math.max(0, target - segmentSeconds - random() * 4);
      const pause = random() < 0.05 ? random() * 60_000 : 0;
      const waitMs = (buffer - resumeAt) * 1000 + pause;

      buffer = resumeAt;
      now += waitMs;
    }
  }

  return records;
}

/** Fluid delivery of `bits` from `startMs`, one chunk per trace step. */
function deliver(
  trace: CapacityTrace,
  startMs: number,
  bits: number
): { end: number; chunks: Array<[number, number]> } {
  const chunks: Array<[number, number]> = [];
  let remaining = bits;
  let time = startMs;

  while (remaining > 0) {
    const step = Math.min(trace.bitsPerMs.length - 1, Math.floor(time / trace.stepMs));
    const stepEnd = (Math.floor(time / trace.stepMs) + 1) * trace.stepMs;
    const rate = trace.bitsPerMs[step]!;
    const sliceBits = Math.min(remaining, rate * (stepEnd - time));

    time += sliceBits / rate;
    remaining -= sliceBits;

    if (sliceBits > 0) chunks.push([time, Math.round(sliceBits / 8)]);
  }

  return { end: time, chunks };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
