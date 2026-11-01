import { describe, expect, it } from 'vite-plus/test';

import { scoreRecords } from '../../scorer/score.ts';
import { simulateRecording } from '../../synthetic/simulate.ts';
import { PROFILES } from '../../synthetic/trace.ts';
import { createLearned, trainModel } from '../model.ts';

const session = (recording: string, seed: number) =>
  simulateRecording({ recording, profile: PROFILES['cable-evening']!, durationMs: 15 * 60_000, seed });

describe('createLearned', () => {
  it('forecasts quantiles that never cross', () => {
    const predictor = createLearned(trainModel(session('train', 1)));

    for (const bytes of [10_000, 1_000_000, 10_000_000]) {
      const q = [0.1, 0.5, 0.9].map((p) => predictor.forecast({ bytes, host: 'synthetic.test', at: 0 }).quantile(p));

      expect(q[0]).toBeLessThanOrEqual(q[1]!);
      expect(q[1]).toBeLessThanOrEqual(q[2]!);
    }
  });

  it('stays roughly calibrated on a held-out session from the same kind of network', () => {
    const model = trainModel([...session('train-a', 1), ...session('train-b', 2)]);

    const coverage = scoreRecords(session('held-out', 3), [() => createLearned(model)]).predictors['learned']!.all!
      .coverage;

    expect(coverage[0]).toBeLessThan(0.25);
    expect(coverage[1]).toBeGreaterThan(0.35);
    expect(coverage[1]).toBeLessThan(0.65);
    expect(coverage[2]).toBeGreaterThan(0.75);
  });
});
