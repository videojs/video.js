/**
 * Linear regression with a learned, input-dependent spread: y ~ Normal(w·z, exp(v·z)²), z the standardized features
 * with a leading 1. Fitted by gradient descent on the negative log-likelihood with ridge penalties, so small samples
 * stay close to the plain mean and spread of y.
 */
export interface GaussianRegression {
  featureNames: readonly string[];
  featureMean: number[];
  featureStd: number[];
  /** Index 0 is the intercept. */
  meanWeights: number[];
  logSigmaWeights: number[];
}

export interface FitOptions {
  /** Ridge penalty on the mean's non-intercept weights. */
  meanPenalty?: number;
  /** Ridge penalty on the spread's non-intercept weights; larger, since spread is harder to learn. */
  sigmaPenalty?: number;
  iterations?: number;
  learningRate?: number;
}

const MIN_LOG_SIGMA = Math.log(0.05);

export function fitGaussianRegression(
  featureNames: readonly string[],
  rows: readonly number[][],
  targets: readonly number[],
  options: FitOptions = {}
): GaussianRegression {
  const { meanPenalty = 1, sigmaPenalty = 4, iterations = 4000, learningRate = 0.03 } = options;
  const n = rows.length;
  const columns = featureNames.length;
  const featureMean = Array.from({ length: columns }, (_, j) => average(rows.map((r) => r[j]!)));
  const featureStd = Array.from({ length: columns }, (_, j) => standardDeviation(rows.map((r) => r[j]!)) || 1);
  const z = rows.map((r) => [1, ...r.map((x, j) => (x - featureMean[j]!) / featureStd[j]!)]);
  const w = [average(targets), ...Array<number>(columns).fill(0)];
  const v = [Math.max(MIN_LOG_SIGMA, Math.log(standardDeviation(targets) || 1)), ...Array<number>(columns).fill(0)];
  const adamW = adam(columns + 1, learningRate);
  const adamV = adam(columns + 1, learningRate);

  for (let step = 0; step < iterations; step++) {
    const gradW = Array<number>(columns + 1).fill(0);
    const gradV = Array<number>(columns + 1).fill(0);

    for (let i = 0; i < n; i++) {
      const zi = z[i]!;
      const mean = dot(w, zi);
      const logSigma = Math.max(MIN_LOG_SIGMA, dot(v, zi));
      const precision = Math.exp(-2 * logSigma);
      const residual = targets[i]! - mean;

      for (let j = 0; j <= columns; j++) {
        gradW[j]! -= (residual * precision * zi[j]!) / n;
        gradV[j]! += ((1 - residual * residual * precision) * zi[j]!) / n;
      }
    }

    for (let j = 1; j <= columns; j++) {
      gradW[j]! += (meanPenalty * w[j]!) / n;
      gradV[j]! += (sigmaPenalty * v[j]!) / n;
    }

    adamW(w, gradW);
    adamV(v, gradV);
  }

  return { featureNames, featureMean, featureStd, meanWeights: w, logSigmaWeights: v };
}

export function predictGaussian(
  model: GaussianRegression,
  features: readonly number[]
): { mean: number; sigma: number } {
  const z = [1, ...features.map((x, j) => (x - model.featureMean[j]!) / model.featureStd[j]!)];

  return {
    mean: dot(model.meanWeights, z),
    sigma: Math.exp(Math.max(MIN_LOG_SIGMA, dot(model.logSigmaWeights, z))),
  };
}

function adam(size: number, learningRate: number): (params: number[], grad: number[]) => void {
  const m = Array<number>(size).fill(0);
  const s = Array<number>(size).fill(0);
  let t = 0;

  return (params, grad) => {
    t++;

    for (let j = 0; j < size; j++) {
      m[j] = 0.9 * m[j]! + 0.1 * grad[j]!;
      s[j] = 0.999 * s[j]! + 0.001 * grad[j]! ** 2;
      params[j]! -= (learningRate * (m[j]! / (1 - 0.9 ** t))) / (Math.sqrt(s[j]! / (1 - 0.999 ** t)) + 1e-8);
    }
  };
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a.reduce((sum, x, i) => sum + x * b[i]!, 0);
}

function average(values: readonly number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function standardDeviation(values: readonly number[]): number {
  const mean = average(values);

  return Math.sqrt(average(values.map((x) => (x - mean) ** 2)));
}
