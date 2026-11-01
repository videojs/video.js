import { describe, expect, it } from 'vite-plus/test';

import { seededRandom } from '../../synthetic/trace.ts';
import { fitGaussianRegression, predictGaussian } from '../regression.ts';

describe('fitGaussianRegression', () => {
  it('recovers a known slope and an input-dependent spread', () => {
    const random = seededRandom(3);
    const gaussian = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
    const rows: number[][] = [];
    const targets: number[] = [];

    for (let i = 0; i < 2000; i++) {
      const x = random() * 4;

      rows.push([x]);
      targets.push(1 + 0.5 * x + Math.exp(-2 + 0.25 * x) * gaussian());
    }

    const model = fitGaussianRegression(['x'], rows, targets, { meanPenalty: 0, sigmaPenalty: 0 });

    expect(predictGaussian(model, [0]).mean).toBeCloseTo(1, 1);
    expect(predictGaussian(model, [4]).mean).toBeCloseTo(3, 1);
    expect(predictGaussian(model, [0]).sigma).toBeCloseTo(Math.exp(-2), 1);
    expect(predictGaussian(model, [4]).sigma).toBeCloseTo(Math.exp(-1), 1);
  });

  it('falls back to the plain mean and spread when features carry no signal', () => {
    const rows = Array.from({ length: 10 }, () => [7]);
    const targets = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5];

    const prediction = predictGaussian(fitGaussianRegression(['constant'], rows, targets), [7]);

    expect(prediction.mean).toBeCloseTo(3, 1);
    expect(prediction.sigma).toBeCloseTo(Math.sqrt(2), 1);
  });
});
