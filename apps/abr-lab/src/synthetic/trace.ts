/** A synthetic network: log-throughput follows an AR(1) process around a level that jumps occasionally, plus outages. */
export interface NetworkProfile {
  name: string;
  meanMbps: number;
  /** Per-step innovation of log-throughput. */
  sigma: number;
  /** Per-step persistence of log-throughput around its level; closer to 1 means slower fades. */
  phi: number;
  /** Level jumps per minute, each N(0, stepSigma) in log space. */
  stepsPerMinute: number;
  stepSigma: number;
  outagesPerMinute: number;
  outageMs: number;
  latencyMs: number;
  latencyJitterMs: number;
}

export interface CapacityTrace {
  stepMs: number;
  /** Capacity per step, in bits per ms. */
  bitsPerMs: Float64Array;
  latencyAt(timeMs: number): number;
}

export const STEP_MS = 100;

export function generateTrace(profile: NetworkProfile, durationMs: number, random: () => number): CapacityTrace {
  const steps = Math.ceil(durationMs / STEP_MS) + 1;
  const bitsPerMs = new Float64Array(steps);
  const stepChance = (profile.stepsPerMinute * STEP_MS) / 60_000;
  const outageChance = (profile.outagesPerMinute * STEP_MS) / 60_000;
  const outageSteps = Math.round(profile.outageMs / STEP_MS);

  let level = Math.log(profile.meanMbps * 1000);
  let x = level;
  let outageLeft = 0;

  for (let i = 0; i < steps; i++) {
    if (random() < stepChance) level += profile.stepSigma * gaussian(random);

    if (random() < outageChance) outageLeft = outageSteps;

    x = level + profile.phi * (x - level) + profile.sigma * gaussian(random);
    bitsPerMs[i] = outageLeft > 0 ? 1 : Math.exp(x);
    outageLeft = Math.max(0, outageLeft - 1);
  }

  return {
    stepMs: STEP_MS,
    bitsPerMs,
    latencyAt: () => Math.max(1, profile.latencyMs + profile.latencyJitterMs * gaussian(random)),
  };
}

/** Deterministic PRNG (mulberry32), so synthetic recordings are reproducible from a seed. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;

  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(random: () => number): number {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}

export const PROFILES: Record<string, NetworkProfile> = {
  'wifi-steady': {
    name: 'wifi-steady',
    meanMbps: 40,
    sigma: 0.08,
    phi: 0.97,
    stepsPerMinute: 0.2,
    stepSigma: 0.3,
    outagesPerMinute: 0,
    outageMs: 0,
    latencyMs: 25,
    latencyJitterMs: 5,
  },
  'cable-evening': {
    name: 'cable-evening',
    meanMbps: 15,
    sigma: 0.12,
    phi: 0.98,
    stepsPerMinute: 1,
    stepSigma: 0.6,
    outagesPerMinute: 0,
    outageMs: 0,
    latencyMs: 35,
    latencyJitterMs: 10,
  },
  cellular: {
    name: 'cellular',
    meanMbps: 8,
    sigma: 0.25,
    phi: 0.95,
    stepsPerMinute: 2,
    stepSigma: 0.7,
    outagesPerMinute: 0.5,
    outageMs: 2500,
    latencyMs: 70,
    latencyJitterMs: 25,
  },
};
