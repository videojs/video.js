import { describe, expect, it } from 'vite-plus/test';

import type { TransferRecord } from '../../record.ts';
import { classifyTransfer } from '../../regime.ts';
import { createDashJs, createHlsJs, createShaka, createVhs } from '../reference.ts';

/** Steady 8 Mbps (8000 bits/ms) after 50 ms of latency: 1 MB bodies take 1000 ms, delivered in 10 even chunks. */
function steadyTransfer(i: number): TransferRecord {
  const start = i * 2000;
  const firstByte = start + 50;

  return {
    id: String(i),
    recording: 'r',
    kind: 'segment',
    trackType: 'video',
    url: `https://cdn.test/${i}.m4s`,
    origin: { site: 'cdn.test', host: 'cdn.test', role: 'segment' },
    wall: 0,
    t: { start, firstByte, end: firstByte + 1000 },
    chunks: Array.from({ length: 10 }, (_, c) => [firstByte + (c + 1) * 100, 100_000] as [number, number]),
    bytes: 1_000_000,
    status: 200,
    firstTouch: { rendition: false, url: true },
    overlapping: [],
    env: { visibility: 'visible' },
  };
}

describe('reference estimators', () => {
  const cases = [
    // hls.js and dash.js exclude latency from rate and add it back: ≈ 50 + 1000.
    { create: createHlsJs, expected: 1050, tolerance: 60 },
    { create: createDashJs, expected: 1050, tolerance: 60 },
    // VHS folds latency into the rate: 1 MB over 1050 ms.
    { create: createVhs, expected: 1050, tolerance: 5 },
    // Shaka's first interval includes the 50 ms of latency, so its rate reads slightly low.
    { create: createShaka, expected: 1000, tolerance: 60 },
  ];

  for (const { create, expected, tolerance } of cases) {
    it(`${create().name} converges on a steady link`, () => {
      const predictor = create();

      for (let i = 0; i < 20; i++) {
        const record = steadyTransfer(i);

        predictor.observe(record, classifyTransfer(record));
      }

      const forecast = predictor.forecast({ bytes: 1_000_000, host: 'cdn.test', at: 40_000 }).quantile(0.5);

      expect(Math.abs(forecast - expected)).toBeLessThan(tolerance);
    });
  }
});
