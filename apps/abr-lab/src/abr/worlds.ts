import type { CapacityTrace, NetworkProfile } from '../synthetic/trace.ts';
import { seededRandom } from '../synthetic/trace.ts';
import { NETWORKS, sessionInputs } from './scenarios.ts';
import type { PlayerConfig, SessionInputs } from './session.ts';
import { SERVER_BEHAVIORS } from './transport.ts';

/** What a starting estimate could know before a session, shared by `pnpm abr:start` and `pnpm abr:cold`. */
export const HISTORY_MS = 11 * 60_000;
export const LAST_SESSION_MS = 60_000;
/** Chrome caps `navigator.connection.downlink` at 10 Mbit/s and rounds it to 25 kbit/s. */
export const NETINFO_CAP_BPS = 10_000_000;

export interface World {
  /** Mean capacity of the previous session, 10 minutes before this one, on the same network. */
  lastSessionBps: number;
  /** The same, but the device has since moved to another of the simulated networks. */
  movedBps: number;
  netInfoBps: number;
  /** A population estimate for this network type: its mean, off by a per-user lognormal factor. */
  populationBps: number;
  /** True mean capacity over the first 10 s of this session. */
  perfectBps: number;
  /** First-request time to first byte of the stored session: on this network, or on the one the device left. */
  storedTtfbMs: number;
  movedTtfbMs: number;
  jitterMs: () => number;
}

/**
 * ASSUMED scenario mixes, not measured: how often a viewer is on each simulated network, and how often the stored
 * estimate came from a different network than this session's (Wi-Fi ↔ cellular, commuting, hotel Wi-Fi). Variants that
 * do not use a stored estimate are unaffected by `moved`.
 */
export const SCENARIOS: Array<{ name: string; networks: Record<string, number>; moved: number }> = [
  {
    name: 'home (mostly same net)',
    networks: { 'wifi-steady': 0.55, 'cable-evening': 0.25, cellular: 0.1, 'lte-high-bdp': 0.05, 'dsl-slow': 0.05 },
    moved: 0.1,
  },
  {
    name: 'mixed',
    networks: { 'wifi-steady': 0.35, 'cable-evening': 0.15, cellular: 0.25, 'lte-high-bdp': 0.15, 'dsl-slow': 0.1 },
    moved: 0.3,
  },
  {
    name: 'mobile / commuting',
    networks: { 'wifi-steady': 0.15, 'cable-evening': 0.05, cellular: 0.45, 'lte-high-bdp': 0.3, 'dsl-slow': 0.05 },
    moved: 0.6,
  },
  {
    name: 'slow links only',
    networks: { 'wifi-steady': 0, 'cable-evening': 0, cellular: 0.5, 'lte-high-bdp': 0, 'dsl-slow': 0.5 },
    moved: 0.3,
  },
];

/**
 * One seed's session and what a starting estimate could know before it: the session starts 11 minutes into its
 * network's trace; the first minute stands in for "the last session" (stored estimate), the last minute for recent
 * browsing (Network Information API). A "moved" stored estimate comes from the same seed on another network.
 */
export function buildWorld(
  player: PlayerConfig,
  network: NetworkProfile,
  behavior: string,
  seed: number
): { inputs: SessionInputs; world: World } {
  const inputs = sessionInputs(player, network, behavior, seed, HISTORY_MS);
  const other = NETWORKS[(NETWORKS.indexOf(network) + 1 + (seed % (NETWORKS.length - 1))) % NETWORKS.length]!;
  const elsewhere = sessionInputs(player, other, behavior, seed + 500, HISTORY_MS);
  const random = seededRandom(seed * 104_729);
  const world: World = {
    lastSessionBps: 1000 * windowMean(inputs.history, 0, LAST_SESSION_MS),
    movedBps: 1000 * windowMean(elsewhere.history, 0, LAST_SESSION_MS),
    netInfoBps:
      Math.round(
        Math.min(NETINFO_CAP_BPS, 1000 * windowMean(inputs.history, HISTORY_MS - LAST_SESSION_MS, HISTORY_MS)) / 25_000
      ) * 25_000,
    populationBps: network.meanMbps * 1e6 * Math.exp(0.6 * gaussian(random)),
    perfectBps: 1000 * windowMean(inputs.trace, 0, 10_000),
    // A first request pays the TCP and TLS handshakes and the request: three round trips, plus server time.
    storedTtfbMs: 3 * inputs.history.latencyAt(0) + SERVER_BEHAVIORS[behavior]!.responseMs,
    movedTtfbMs: 3 * elsewhere.history.latencyAt(0) + SERVER_BEHAVIORS[behavior]!.responseMs,
    jitterMs: () => 2 * gaussian(random),
  };

  return { inputs, world };
}

export function weigh<T extends { network: string }>(
  rows: readonly T[],
  scenario: { networks: Record<string, number> },
  share: number
): Array<{ r: T; w: number }> {
  const counts = new Map<string, number>();

  for (const r of rows) counts.set(r.network, (counts.get(r.network) ?? 0) + 1);

  return rows.map((r) => ({ r, w: (share * (scenario.networks[r.network] ?? 0)) / counts.get(r.network)! }));
}

export function weightedMean(values: ReadonlyArray<{ v: number; w: number }>): number {
  const total = values.reduce((t, { w }) => t + w, 0);

  return values.reduce((t, { v, w }) => t + v * w, 0) / total;
}

export function weightedQuantile(values: ReadonlyArray<{ v: number; w: number }>, q: number): number {
  const sorted = values.filter(({ w }) => w > 0).sort((a, b) => a.v - b.v);
  const total = sorted.reduce((t, { w }) => t + w, 0);
  let seen = 0;

  for (const { v, w } of sorted) {
    seen += w;

    if (seen >= q * total) return v;
  }

  return Number.NaN;
}

/** Mean capacity, kbit/s, over `[fromMs, toMs)` of a trace. */
export function windowMean(trace: CapacityTrace, fromMs: number, toMs: number): number {
  const from = Math.min(trace.bitsPerMs.length - 1, Math.floor(fromMs / trace.stepMs));
  const to = Math.max(from + 1, Math.min(trace.bitsPerMs.length, Math.floor(toMs / trace.stepMs)));
  let total = 0;

  for (let i = from; i < to; i++) total += trace.bitsPerMs[i]!;

  return total / (to - from);
}

export function quantile(values: readonly number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? Number.NaN;
}

export function gaussian(random: () => number): number {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}
