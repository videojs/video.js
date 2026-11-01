/** A forecast of one positive quantity (download time in ms). */
export interface Distribution {
  cdf(x: number): number;
  quantile(p: number): number;
}

/** A point estimate, so today's single-number estimators can be scored alongside real distributions. */
export function pointDistribution(value: number): Distribution {
  return {
    cdf: (x) => (x >= value ? 1 : 0),
    quantile: () => value,
  };
}

/**
 * Download time T = latency + 8 × bytes / X, with throughput X lognormal(mu, sigma²) in bits/ms. Monotone in X, so its
 * quantiles map directly: T's p-quantile uses X's (1 − p)-quantile.
 */
export function downloadTimeDistribution(params: {
  latencyMs: number;
  bytes: number;
  logRateMean: number;
  logRateSigma: number;
}): Distribution {
  const { latencyMs, bytes, logRateMean, logRateSigma } = params;
  const bits = 8 * bytes;

  return {
    cdf(x) {
      if (x <= latencyMs) return 0;

      const requiredLogRate = Math.log(bits / (x - latencyMs));

      return 1 - normalCdf((requiredLogRate - logRateMean) / logRateSigma);
    },
    quantile(p) {
      const rate = Math.exp(logRateMean + logRateSigma * normalQuantile(1 - p));

      return latencyMs + bits / rate;
    },
  };
}

/** Standard normal CDF (Abramowitz and Stegun 7.1.26, max error 1.5e-7). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + (0.3275911 * Math.abs(z)) / Math.SQRT2);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-(z * z) / 2);

  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** Standard normal quantile (Acklam's rational approximation, relative error 1.15e-9). */
export function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;

  if (p >= 1) return Infinity;

  const a = [
    -39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239,
  ];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [
    -0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968,
    2.938163982698783,
  ];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;

  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));

    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }

  if (p > 1 - low) return -normalQuantile(1 - p);

  const q = p - 0.5;
  const r = q * q;

  return (
    ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
    (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
  );
}

/** A distribution over equally weighted sample values, with linear interpolation between order statistics. */
export function empiricalDistribution(values: readonly number[]): Distribution {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  return {
    cdf(x) {
      let below = 0;

      while (below < n && sorted[below]! <= x) below++;

      return below / n;
    },
    quantile(p) {
      const position = Math.min(n - 1, Math.max(0, p * n - 0.5));
      const lower = Math.floor(position);
      const upper = Math.min(n - 1, lower + 1);

      return sorted[lower]! + (position - lower) * (sorted[upper]! - sorted[lower]!);
    },
  };
}

/** Like `empiricalDistribution`, with a weight per value (weights need not sum to 1). */
export function weightedEmpiricalDistribution(values: readonly number[], weights: readonly number[]): Distribution {
  const order = values.map((_, i) => i).sort((a, b) => values[a]! - values[b]!);
  const total = weights.reduce((sum, w) => sum + w, 0);
  const sorted = order.map((i) => values[i]!);
  // Each value sits at the midpoint of its own probability mass.
  const positions: number[] = [];
  let cumulative = 0;

  for (const i of order) {
    positions.push((cumulative + weights[i]! / 2) / total);
    cumulative += weights[i]!;
  }

  return {
    cdf(x) {
      let mass = 0;

      order.forEach((i, k) => {
        if (sorted[k]! <= x) mass += weights[i]!;
      });

      return mass / total;
    },
    quantile(p) {
      if (p <= positions[0]!) return sorted[0]!;

      for (let k = 1; k < sorted.length; k++) {
        if (p <= positions[k]!) {
          const t = (p - positions[k - 1]!) / (positions[k]! - positions[k - 1]!);

          return sorted[k - 1]! + t * (sorted[k]! - sorted[k - 1]!);
        }
      }

      return sorted.at(-1)!;
    },
  };
}
