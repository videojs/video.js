import { describe, expect, it } from 'vite-plus/test';

import { pointDistribution } from '../../distribution.ts';
import { createLognormal } from '../../predictors/lognormal.ts';
import type { Predictor } from '../../predictors/predictor.ts';
import type { TransferRecord } from '../../record.ts';
import { simulateRecording } from '../../synthetic/simulate.ts';
import { PROFILES } from '../../synthetic/trace.ts';
import { scoreRecords } from '../score.ts';

function transfer(id: string, start: number, end: number, overrides: Partial<TransferRecord> = {}): TransferRecord {
  return {
    id,
    recording: 'r',
    kind: 'segment',
    url: `https://cdn.test/${id}.m4s`,
    origin: { site: 'cdn.test', host: 'cdn.test', role: 'segment' },
    wall: 0,
    t: { start, firstByte: start + 20, end },
    chunks: [[end, 100_000]],
    bytes: 100_000,
    status: 200,
    firstTouch: { rendition: false, url: true },
    overlapping: [],
    env: { visibility: 'visible' },
    ...overrides,
  };
}

describe('scoreRecords', () => {
  it('only lets a predictor observe transfers that completed before the forecast', () => {
    const violations: string[] = [];
    const spy = (): Predictor => {
      const seen: TransferRecord[] = [];

      return {
        name: 'spy',
        observe: (record) => seen.push(record),
        forecast: ({ at }) => {
          for (const record of seen) if (record.t.end! > at) violations.push(record.id);

          return pointDistribution(100);
        },
      };
    };
    const records = [
      transfer('a', 0, 500),
      transfer('b', 100, 2000),
      transfer('c', 600, 900),
      transfer('d', 1000, 1400),
    ];

    scoreRecords(records, [spy]);

    expect(violations).toEqual([]);
  });

  it('excludes local-cache transfers from the scored targets', () => {
    const records = [
      transfer('a', 0, 500, { url: 'https://cdn.test/x.m4s', headers: { 'x-request-id': 'same' } }),
      transfer('b', 1000, 1200, {
        url: 'https://cdn.test/x.m4s',
        t: { start: 1000, firstByte: 1100, end: 1200 },
        headers: { 'x-request-id': 'same' },
      }),
    ];

    const result = scoreRecords(records, [() => createLognormal()]);

    expect(result.regimes).toEqual({ network: 1, local: 1 });
    expect(result.targets).toBe(1);
  });

  it('scores the lognormal seed as roughly calibrated on a synthetic steady network', () => {
    const records = simulateRecording({
      recording: 'steady',
      profile: PROFILES['wifi-steady']!,
      durationMs: 20 * 60_000,
      seed: 7,
    });

    const coverage = scoreRecords(records, [() => createLognormal()]).predictors['lognormal-seed']!.all!.coverage;

    expect(coverage[0]).toBeGreaterThan(0.03);
    expect(coverage[0]).toBeLessThan(0.2);
    expect(coverage[2]).toBeGreaterThan(0.8);
    expect(coverage[2]).toBeLessThan(0.97);
  });
});
