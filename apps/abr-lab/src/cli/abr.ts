import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { mean, median, NETWORKS, PLAYERS, qoe, sessionInputs, sum, table } from '../abr/scenarios.ts';
import { type AbrRule, type Oracle, type PlayerConfig, runSession, type SessionResult } from '../abr/session.ts';
import { SERVER_BEHAVIORS } from '../abr/transport.ts';
import { validateAgainstProbe } from '../abr/validate.ts';
import type { PredictorFactory } from '../predictors/predictor.ts';
import { BASELINES } from '../predictors/roster.ts';
import { createStructured } from '../predictors/structured.ts';
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

function parseProbe(line: string): ProbeSample {
  // SAFETY: probe files are written only by `probe`, one ProbeSample per line.
  return JSON.parse(line) as ProbeSample;
}
