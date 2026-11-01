import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import {
  type AbrRule,
  type Oracle,
  type PlayerConfig,
  runSession,
  type SessionInputs,
  type SessionResult,
} from '../abr/session.ts';
import { SERVER_BEHAVIORS } from '../abr/transport.ts';
import { validateAgainstProbe } from '../abr/validate.ts';
import type { PredictorFactory } from '../predictors/predictor.ts';
import { BASELINES } from '../predictors/roster.ts';
import { createStructured } from '../predictors/structured.ts';
import { generateTrace, type NetworkProfile, PROFILES, seededRandom } from '../synthetic/trace.ts';
import type { ProbeSample } from './probe.ts';

/**
 * Playback quality per predictor: every predictor drives the same ABR rule through the same simulated sessions (trace,
 * RTT draws, segment sizes), so only the forecast differs. `oracle` forecasts with the true transfer time. Two rules:
 * the throughput rule with its safety factor tuned per predictor on separate seeds (each at its best operating point),
 * and MPC, which uses forecasts directly. `--validate <probe.jsonl>` first checks the transfer model against a lab
 * sweep.
 *
 * The learned model is left out: trained on one real network, it is out of distribution on every synthetic one.
 */
const { values } = parseArgs({
  options: {
    seeds: { type: 'string', default: '20' },
    validate: { type: 'string' },
  },
});

if (values.validate) {
  const samples = readFileSync(values.validate, 'utf8')
    .trim()
    .split('\n')
    .map((line) => parseProbe(line));

  console.log('Transfer model vs lab probe (median |ln(sim/measured)|, median sim/measured):');

  for (const row of validateAgainstProbe(samples)) {
    console.log(
      `  ${row.state.padEnd(20)} n ${row.n}  ${row.medianAbsLogError.toFixed(3)}  ${row.medianRatio.toFixed(3)}`
    );
  }
}

const LADDER = [974_600, 1_861_200, 2_953_500, 5_639_700, 7_519_600, 11_030_800, 18_393_100];
const PLAYERS: PlayerConfig[] = [
  {
    name: 'vod-4s',
    ladderBps: LADDER,
    segmentSeconds: 4,
    targetBufferSeconds: 30,
    contentSeconds: 300,
    startupSegments: 1,
  },
  {
    name: 'low-latency-1s',
    ladderBps: LADDER,
    segmentSeconds: 1,
    targetBufferSeconds: 4,
    contentSeconds: 180,
    startupSegments: 2,
  },
];
const NETWORKS: NetworkProfile[] = [
  PROFILES['wifi-steady']!,
  PROFILES['cable-evening']!,
  PROFILES.cellular!,
  // Fast but far: where slow start costs the most round trips.
  {
    ...PROFILES.cellular!,
    name: 'lte-high-bdp',
    meanMbps: 30,
    latencyMs: 120,
    latencyJitterMs: 30,
    outagesPerMinute: 0.2,
  },
  { ...PROFILES['cable-evening']!, name: 'dsl-slow', meanMbps: 4, latencyMs: 45, sigma: 0.08 },
];

const SAFETIES = [0.6, 0.7, 0.8, 0.9, 1.0];
/** Tuning seeds never overlap evaluation seeds. */
const TUNING_SEED_OFFSET = 10_000;
const roster: Array<{ name: string; create: PredictorFactory | Oracle }> = [
  { name: 'oracle', create: 'oracle' },
  { name: 'oracle-now', create: 'oracle-now' },
  { name: 'structured', create: createStructured },
  ...BASELINES.map((create) => ({ name: create().name, create })),
];

type Row = { network: string; behavior: string; result: SessionResult };

for (const player of PLAYERS) {
  for (const ruleName of ['throughput (tuned)', 'mpc'] as const) {
    const results = new Map<string, Row[]>();
    const tuned = new Map<string, number>();

    for (const { name, create } of roster) {
      const ruleFor = (safety: number): AbrRule =>
        ruleName === 'mpc' ? { kind: 'mpc' } : { kind: 'throughput', safety };
      const safety =
        ruleName === 'mpc'
          ? 1
          : SAFETIES.map((s) => ({
              s,
              q: mean(sweep(player, create, ruleFor(s), TUNING_SEED_OFFSET, 6).map((r) => qoe(r.result, player))),
            })).sort((a, b) => b.q - a.q)[0]!.s;

      tuned.set(name, safety);
      results.set(name, sweep(player, create, ruleFor(safety), 0, Number(values.seeds)));
    }

    report(player, ruleName, results, tuned);
  }
}

/** Runs one predictor under one rule over every network × server behavior × seed. */
function sweep(
  player: PlayerConfig,
  create: PredictorFactory | Oracle,
  rule: AbrRule,
  seedOffset: number,
  seeds: number
): Row[] {
  const rows: Row[] = [];

  for (const network of NETWORKS) {
    for (const behavior of Object.values(SERVER_BEHAVIORS)) {
      for (let seed = 1; seed <= seeds; seed++) {
        const inputs = sessionInputs(player, network, behavior.name, seedOffset + seed);
        const result = runSession(inputs, typeof create === 'string' ? create : create(), rule);

        rows.push({ network: network.name, behavior: behavior.name, result });
      }
    }
  }

  return rows;
}

function report(player: PlayerConfig, ruleName: string, results: Map<string, Row[]>, tuned: Map<string, number>): void {
  const qoeOf = (rows: Array<{ result: SessionResult }>) => mean(rows.map((r) => qoe(r.result, player)));
  const baseline = qoeOf(results.get('dash.js')!);
  const ceiling = qoeOf(results.get('oracle')!);

  console.log(
    `\n=== ${player.name}, ${ruleName}: ${NETWORKS.length} networks × ${Object.keys(SERVER_BEHAVIORS).length} server behaviors × ${values.seeds} seeds`
  );
  console.log(
    table(
      [
        'predictor',
        'safety',
        'startup p50 ms',
        'rebuffer %',
        'stalls/min',
        'Mbit/s',
        'first 20 s Mbit/s',
        'switches/min',
        'QoE',
        'QoE p50',
        'headroom',
      ],
      roster.map(({ name }) => {
        const rows = results.get(name)!.map((r) => r.result);
        const minutes = (rows.length * player.contentSeconds) / 60;
        const score = qoeOf(results.get(name)!);

        return [
          name,
          ruleName === 'mpc' ? '-' : tuned.get(name)!.toFixed(1),
          median(rows.map((r) => r.startupMs)).toFixed(0),
          ((100 * sum(rows.map((r) => r.rebufferMs))) / (rows.length * player.contentSeconds * 1000)).toFixed(2),
          (sum(rows.map((r) => r.rebuffers)) / minutes).toFixed(2),
          (mean(rows.map((r) => r.meanBitrateBps)) / 1e6).toFixed(2),
          (mean(rows.map((r) => r.earlyBitrateBps)) / 1e6).toFixed(2),
          (sum(rows.map((r) => r.switches)) / minutes).toFixed(2),
          score.toFixed(2),
          median(rows.map((r) => qoe(r, player))).toFixed(2),
          `${((100 * (score - baseline)) / (ceiling - baseline)).toFixed(0)}%`,
        ];
      })
    )
  );

  for (const [label, key] of [
    ['network', 'network'],
    ['server behavior', 'behavior'],
  ] as const) {
    const groups = [...new Set(results.get('oracle')!.map((r) => r[key]))];

    console.log(`\nQoE by ${label}:`);
    console.log(
      table(
        ['predictor', ...groups],
        roster.map(({ name }) => [
          name,
          ...groups.map((g) => qoeOf(results.get(name)!.filter((r) => r[key] === g)).toFixed(2)),
        ])
      )
    );
  }
}

console.log(
  '\nQoE per segment (MPC-style): mean Mbit/s − μ·(stall s + startup s)/segments − mean |Δ Mbit/s|, μ = top rung.' +
    "\nheadroom: share of the oracle's gain over dash.js this predictor captures."
);

/** One seed's world, shared by every predictor: the trace, every request's RTT, and every segment's size factor. */
function sessionInputs(player: PlayerConfig, network: NetworkProfile, behavior: string, seed: number): SessionInputs {
  const random = seededRandom(seed * 7919 + network.name.length * 31);
  const trace = generateTrace(network, (player.contentSeconds + 600) * 1000, random);
  const requests = Math.ceil(player.contentSeconds / player.segmentSeconds) + 3;

  return {
    trace,
    behavior: SERVER_BEHAVIORS[behavior]!,
    player,
    rtts: Array.from({ length: requests }, () => trace.latencyAt(0)),
    sizeFactors: Array.from({ length: requests }, () => 0.7 + 0.6 * random()),
  };
}

function qoe(result: SessionResult, player: PlayerConfig): number {
  const mu = Math.max(...player.ladderBps) / 1e6;
  const stallSeconds = (result.rebufferMs + result.startupMs) / 1000;

  return (
    result.meanBitrateBps / 1e6 -
    (mu * stallSeconds) / result.segments -
    result.switchMagnitudeBps / 1e6 / Math.max(1, result.segments - 1)
  );
}

function parseProbe(line: string): ProbeSample {
  // SAFETY: probe files are written only by `probe`, one ProbeSample per line.
  return JSON.parse(line) as ProbeSample;
}

function sum(values: readonly number[]): number {
  return values.reduce((total, v) => total + v, 0);
}

function mean(values: readonly number[]): number {
  return sum(values) / Math.max(1, values.length);
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
}

function table(header: string[], rows: string[][]): string {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const line = (cells: string[]) =>
    cells.map((cell, i) => (i === 0 ? cell.padEnd(widths[i]!) : cell.padStart(widths[i]!))).join('  ');

  return [line(header), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}
