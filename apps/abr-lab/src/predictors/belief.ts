/**
 * A belief over a session's starting throughput, held as weights on a grid of ln(bits/s). Each signal multiplies in a
 * likelihood: a reading with a spread, or a lower bound. A grid keeps lower bounds and the stored-estimate mixture
 * exact where closed-form Gaussians would not.
 */
export interface Belief {
  /** Ln(bits/s) at each grid point. */
  readonly x: Float64Array;
  readonly w: Float64Array;
}

const GRID_MIN = Math.log(50_000);
const GRID_MAX = Math.log(2_000_000_000);
const GRID_POINTS = 400;

/** A lognormal prior: median `bps`, spread `sigma` in ln units. */
export function createBelief(bps: number, sigma: number): Belief {
  const x = new Float64Array(GRID_POINTS);
  const w = new Float64Array(GRID_POINTS);

  for (let i = 0; i < GRID_POINTS; i++) {
    x[i] = GRID_MIN + ((GRID_MAX - GRID_MIN) * i) / (GRID_POINTS - 1);
    w[i] = normal(x[i]!, Math.log(bps), sigma);
  }

  return normalize({ x, w });
}

/** A reading of the throughput, off by a lognormal error of spread `sigma`. */
export function observeReading(belief: Belief, bps: number, sigma: number): Belief {
  return multiply(belief, (x) => normal(Math.log(bps), x, sigma));
}

/** Evidence the throughput is at least `bps`; `softness` (ln units) blurs the edge for timing noise. */
export function observeLowerBound(belief: Belief, bps: number, softness: number): Belief {
  return multiply(belief, (x) => 1 / (1 + Math.exp(-(x - Math.log(bps)) / softness)));
}

/**
 * A stored estimate from an earlier session: with probability `pSame` a reading of this network (spread `sigma`),
 * otherwise a draw from the population (`populationDensity`, constant in the throughput). Later signals that disagree
 * with the stored value shift weight to the "moved" branch on their own.
 */
export function observeStored(
  belief: Belief,
  bps: number,
  sigma: number,
  pSame: number,
  populationDensity: number
): Belief {
  const reading = Math.log(bps);

  return multiply(belief, (x) => pSame * normal(reading, x, sigma) + (1 - pSame) * populationDensity);
}

export function quantile(belief: Belief, q: number): number {
  let seen = 0;

  for (let i = 0; i < belief.x.length; i++) {
    seen += belief.w[i]!;

    if (seen >= q) return Math.exp(belief.x[i]!);
  }

  return Math.exp(belief.x.at(-1)!);
}

/** Density of a lognormal population, per ln unit, at `bps`. */
export function lognormalDensity(bps: number, medianBps: number, sigma: number): number {
  return normal(Math.log(bps), Math.log(medianBps), sigma);
}

function multiply(belief: Belief, likelihood: (x: number) => number): Belief {
  const w = belief.w.map((weight, i) => weight * likelihood(belief.x[i]!));

  return normalize({ x: belief.x, w });
}

function normalize(belief: Belief): Belief {
  const total = belief.w.reduce((sum, v) => sum + v, 0);
  if (!(total > 0)) return belief;

  return { x: belief.x, w: belief.w.map((v) => v / total) };
}

function normal(value: number, mean: number, sigma: number): number {
  const z = (value - mean) / sigma;

  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}
