import { createHarmonicMean } from './harmonic-mean.ts';
import { createLognormal } from './lognormal.ts';
import type { PredictorFactory } from './predictor.ts';
import { createDashJs, createHlsJs, createShaka, createVhs } from './reference.ts';
import { createSpfDualEwma } from './spf-dual-ewma.ts';

/** Every non-learned predictor, in report order: other players first, then this spike's. */
export const BASELINES: readonly PredictorFactory[] = [
  createSpfDualEwma,
  createHlsJs,
  createShaka,
  createDashJs,
  createVhs,
  () => createHarmonicMean(5),
  () => createLognormal(),
];
