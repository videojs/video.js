import { parseArgs } from 'node:util';

import { NETWORKS, PLAYERS, qoe, START_PROFILES, startQoe, table } from '../abr/scenarios.ts';
import { type AbandonPolicy, runSession, type SessionResult } from '../abr/session.ts';
import { SERVER_BEHAVIORS } from '../abr/transport.ts';
import {
  buildWorld,
  NETINFO_CAP_BPS,
  SCENARIOS,
  weigh,
  weightedMean,
  weightedQuantile,
  type World,
} from '../abr/worlds.ts';
import { INITIAL_BANDWIDTH_BPS } from '../predictors/predictor.ts';
import { createDashJs } from '../predictors/reference.ts';
import { type StartingEstimate, withStartingEstimate } from '../predictors/with-prior.ts';

/**
 * Cold start as choosing the first displayed rung: each starting estimate, with and without abandoning a startup
 * segment that runs past a deadline, scored on how often the first rung lands below or above the rung the session
 * settles on (median over 20–60 s), and by `startQoe` per customer profile. dash.js with only the starting estimate
 * changed, under the throughput rule, through the same sessions as `pnpm abr:start`.
 */
const { values } = parseArgs({ options: { seeds: { type: 'string', default: '20' } } });

/** Odds, before any check, that a stored estimate came from the network this session is on. */
const STORED_P_SAME = 0.8;
const PRIOR_SIGMA = 2.5;

const fused = (w: World, moved: boolean | undefined, netInfo: boolean): StartingEstimate => ({
  kind: 'fused',
  priorBps: INITIAL_BANDWIDTH_BPS,
  priorSigma: PRIOR_SIGMA,
  stored:
    moved === undefined
      ? undefined
      : {
          bps: moved ? w.movedBps : w.lastSessionBps,
          firstTtfbMs: moved ? w.movedTtfbMs : w.storedTtfbMs,
          pSame: STORED_P_SAME,
        },
  netInfo: netInfo ? { bps: w.netInfoBps, capBps: NETINFO_CAP_BPS } : undefined,
  jitterMs: w.jitterMs,
  quantile: 0.5,
});

/** `usesStored` estimates run twice per seed: with the stored value from this network, and from the one left. */
const ESTIMATES: Array<{ name: string; usesStored: boolean; start: (w: World, moved: boolean) => StartingEstimate }> = [
  { name: 'default 5 Mbit/s', usesStored: false, start: () => ({ kind: 'fixed', bps: INITIAL_BANDWIDTH_BPS }) },
  {
    name: 'playlist burst',
    usesStored: false,
    start: (w) => ({ kind: 'stream', jitterMs: w.jitterMs, fallbackBps: INITIAL_BANDWIDTH_BPS }),
  },
  {
    name: 'rule-based policy',
    usesStored: true,
    start: (w, moved) => ({
      kind: 'policy',
      storedBps: moved ? w.movedBps : w.lastSessionBps,
      storedFirstTtfbMs: moved ? w.movedTtfbMs : w.storedTtfbMs,
      tolerance: 2,
      jitterMs: w.jitterMs,
      fallbackBps: INITIAL_BANDWIDTH_BPS,
      capBps: 2 * INITIAL_BANDWIDTH_BPS,
    }),
  },
  { name: 'fused, first visit', usesStored: false, start: (w) => fused(w, undefined, true) },
  { name: 'fused, no NetInfo', usesStored: true, start: (w, moved) => fused(w, moved, false) },
  { name: 'fused', usesStored: true, start: (w, moved) => fused(w, moved, true) },
  { name: 'perfect start', usesStored: false, start: (w) => ({ kind: 'fixed', bps: w.perfectBps }) },
];

const DEADLINES: Array<AbandonPolicy | undefined> = [undefined, { overrun: 2 }, { overrun: 1.5 }];

interface Row {
  network: string;
  moved: boolean;
  result: SessionResult;
}

for (const player of PLAYERS) {
  const results = new Map<string, Row[]>();
  const key = (estimate: string, abandon: AbandonPolicy | undefined) => `${estimate}|${abandon?.overrun ?? '-'}`;

  for (const network of NETWORKS) {
    for (const behavior of Object.keys(SERVER_BEHAVIORS)) {
      for (let seed = 1; seed <= Number(values.seeds); seed++) {
        const { inputs, world } = buildWorld(player, network, behavior, seed);

        for (const estimate of ESTIMATES) {
          for (const abandon of DEADLINES) {
            for (const moved of estimate.usesStored ? [false, true] : [false]) {
              const predictor = withStartingEstimate(createDashJs, estimate.name, estimate.start(world, moved));
              const result = runSession(inputs, predictor, { kind: 'throughput', safety: 1 }, { abandon });
              const rows = results.get(key(estimate.name, abandon)) ?? [];
              const copies = estimate.usesStored ? [moved] : [false, true];

              for (const m of copies) rows.push({ network: network.name, moved: m, result });

              results.set(key(estimate.name, abandon), rows);
            }
          }
        }
      }
    }
  }

  console.log(`\n=== ${player.name}, throughput rule, dash.js with each starting estimate, ${values.seeds} seeds`);
  console.log(
    `Low/high start: first rung below/above the settled rung (median over 20-60 s). QoE profiles: startup budget ` +
      `${START_PROFILES[0]!.startupBudgetMs} ms; strict also charges ${START_PROFILES[1]!.lowStartWeight} x the ` +
      `bitrate gap of a low start.`
  );

  for (const scenario of SCENARIOS) {
    console.log(`\nScenario "${scenario.name}" (assumed weights, P(moved) ${scenario.moved}):`);
    console.log(
      table(
        [
          'starting estimate',
          'abandon',
          'low start',
          'high start',
          'startup mean',
          'startup p90',
          'first 20 s Mbit/s',
          'early stall ms',
          'abandoned',
          'old QoE',
          ...START_PROFILES.map((p) => p.name),
        ],
        ESTIMATES.flatMap((estimate) =>
          DEADLINES.map((abandon) => {
            const rows = results.get(key(estimate.name, abandon))!;
            const weighted = [
              ...weigh(
                rows.filter((r) => !r.moved),
                scenario,
                1 - scenario.moved
              ),
              ...weigh(
                rows.filter((r) => r.moved),
                scenario,
                scenario.moved
              ),
            ];
            const of = (f: (r: SessionResult) => number) => weighted.map(({ r, w }) => ({ v: f(r.result), w }));
            const share = (f: (r: SessionResult) => boolean) =>
              `${Math.round(100 * weightedMean(of((r) => (f(r) ? 1 : 0))))}%`;

            return [
              estimate.name,
              abandon === undefined ? '-' : `${abandon.overrun}x forecast`,
              share((r) => r.firstRung < r.settledRung),
              share((r) => r.firstRung > r.settledRung),
              weightedMean(of((r) => r.startupMs)).toFixed(0),
              weightedQuantile(
                of((r) => r.startupMs),
                0.9
              ).toFixed(0),
              (weightedMean(of((r) => r.earlyBitrateBps)) / 1e6).toFixed(2),
              weightedMean(of((r) => r.earlyRebufferMs)).toFixed(0),
              share((r) => r.abandons > 0),
              weightedMean(of((r) => qoe(r, player))).toFixed(2),
              ...START_PROFILES.map((profile) => weightedMean(of((r) => startQoe(r, player, profile))).toFixed(2)),
            ];
          })
        )
      )
    );
  }
}
