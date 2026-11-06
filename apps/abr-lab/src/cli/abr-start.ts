import { parseArgs } from 'node:util';

import { mean, median, NETWORKS, PLAYERS, qoe, table } from '../abr/scenarios.ts';
import { type AbrRule, runSession, type SessionResult } from '../abr/session.ts';
import { SERVER_BEHAVIORS } from '../abr/transport.ts';
import { buildWorld, quantile, SCENARIOS, weigh, weightedMean, weightedQuantile, type World } from '../abr/worlds.ts';
import { INITIAL_BANDWIDTH_BPS } from '../predictors/predictor.ts';
import { createDashJs } from '../predictors/reference.ts';
import { type StartingEstimate, withStartingEstimate } from '../predictors/with-prior.ts';

/**
 * Where dash.js's first estimate should come from. Every variant is dash.js with only its starting estimate changed,
 * through the same sessions. The session starts 10 minutes into its network's trace; the minute before that stands in
 * for "the last session" (stored estimate) and for recent browsing (Network Information API).
 */
const { values } = parseArgs({
  options: { seeds: { type: 'string', default: '20' }, 'playlist-bytes': { type: 'string' } },
});

/** Accept a stored estimate when the first request's TTFB is within 2× of the stored session's. */
const RTT_TOLERANCE = 2;

/** Stored estimate behind the RTT check, the playlist's first burst, and a cap without playlist evidence. */
const policy = (w: World, moved: boolean): StartingEstimate => ({
  kind: 'policy',
  storedBps: moved ? w.movedBps : w.lastSessionBps,
  storedFirstTtfbMs: moved ? w.movedTtfbMs : w.storedTtfbMs,
  tolerance: RTT_TOLERANCE,
  jitterMs: w.jitterMs,
  fallbackBps: INITIAL_BANDWIDTH_BPS,
  capBps: 2 * INITIAL_BANDWIDTH_BPS,
});

const gated = (w: World, moved: boolean, withPlaylist: boolean): StartingEstimate => ({
  kind: 'gated',
  storedBps: moved ? w.movedBps : w.lastSessionBps,
  storedFirstTtfbMs: moved ? w.movedTtfbMs : w.storedTtfbMs,
  tolerance: RTT_TOLERANCE,
  withPlaylist,
  jitterMs: w.jitterMs,
  fallbackBps: INITIAL_BANDWIDTH_BPS,
});

const VARIANTS: Array<{ name: string; start: (world: World) => StartingEstimate }> = [
  { name: 'default 5 Mbit/s', start: () => ({ kind: 'fixed', bps: INITIAL_BANDWIDTH_BPS }) },
  { name: 'last session (same net)', start: (w) => ({ kind: 'fixed', bps: w.lastSessionBps }) },
  { name: 'last session (moved net)', start: (w) => ({ kind: 'fixed', bps: w.movedBps }) },
  {
    name: 'playlist timing',
    start: (w) => ({ kind: 'playlist', jitterMs: w.jitterMs, fallbackBps: INITIAL_BANDWIDTH_BPS }),
  },
  {
    name: 'last session + playlist',
    start: (w) => ({ kind: 'playlist', jitterMs: w.jitterMs, fallbackBps: w.lastSessionBps, blend: true }),
  },
  { name: 'netinfo downlink', start: (w) => ({ kind: 'fixed', bps: w.netInfoBps }) },
  {
    name: 'netinfo + playlist',
    start: (w) => ({ kind: 'playlist', jitterMs: w.jitterMs, fallbackBps: w.netInfoBps, blend: true }),
  },
  { name: 'population (Mux Data)', start: (w) => ({ kind: 'fixed', bps: w.populationBps }) },
  { name: 'last, RTT-gated (same net)', start: (w) => gated(w, false, false) },
  { name: 'last, RTT-gated (moved net)', start: (w) => gated(w, true, false) },
  { name: 'last+playlist, gated (same)', start: (w) => gated(w, false, true) },
  { name: 'last+playlist, gated (moved)', start: (w) => gated(w, true, true) },
  {
    name: 'stream burst',
    start: (w) => ({ kind: 'stream', jitterMs: w.jitterMs, fallbackBps: INITIAL_BANDWIDTH_BPS }),
  },
  { name: 'policy (same net)', start: (w) => policy(w, false) },
  { name: 'policy (moved net)', start: (w) => policy(w, true) },
  { name: 'perfect start', start: (w) => ({ kind: 'fixed', bps: w.perfectBps }) },
];

/** Deployable policies: a stored-estimate policy is one variant on the same network and another after a move. */
const POLICIES: Array<{ name: string; same: string; moved: string }> = [
  { name: 'default 5 Mbit/s', same: 'default 5 Mbit/s', moved: 'default 5 Mbit/s' },
  { name: 'last session', same: 'last session (same net)', moved: 'last session (moved net)' },
  { name: 'playlist timing', same: 'playlist timing', moved: 'playlist timing' },
  { name: 'netinfo + playlist', same: 'netinfo + playlist', moved: 'netinfo + playlist' },
  { name: 'last, RTT-gated', same: 'last, RTT-gated (same net)', moved: 'last, RTT-gated (moved net)' },
  { name: 'last+playlist, gated', same: 'last+playlist, gated (same)', moved: 'last+playlist, gated (moved)' },
  { name: 'stream burst', same: 'stream burst', moved: 'stream burst' },
  { name: 'policy', same: 'policy (same net)', moved: 'policy (moved net)' },
  { name: 'perfect start', same: 'perfect start', moved: 'perfect start' },
];

const players = PLAYERS.map((p) =>
  values['playlist-bytes'] === undefined ? p : { ...p, mediaPlaylistBytes: Number(values['playlist-bytes']) }
);

for (const player of players) {
  for (const rule of [{ kind: 'throughput', safety: 1 }, { kind: 'mpc' }] satisfies AbrRule[]) {
    const results = new Map<
      string,
      Array<{
        network: string;
        behavior: string;
        result: SessionResult;
        ratio: number;
        accepted: boolean | undefined;
      }>
    >();

    for (const network of NETWORKS) {
      for (const behavior of Object.keys(SERVER_BEHAVIORS)) {
        for (let seed = 1; seed <= Number(values.seeds); seed++) {
          const { inputs, world } = buildWorld(player, network, behavior, seed);

          for (const variant of VARIANTS) {
            const predictor = withStartingEstimate(createDashJs, variant.name, variant.start(world));
            const result = runSession(inputs, predictor, rule);

            const ratio = (predictor.firstEstimateBps() ?? Number.NaN) / world.perfectBps;
            const accepted = predictor.gateAccepted();

            results.set(variant.name, [
              ...(results.get(variant.name) ?? []),
              { network: network.name, behavior, result, ratio, accepted },
            ]);
          }
        }
      }
    }

    const ruleName = rule.kind === 'mpc' ? 'mpc' : `throughput (safety ${rule.safety})`;

    console.log(
      `\n=== ${player.name} (playlist ${player.mediaPlaylistBytes} B), ${ruleName}, dash.js with each starting estimate, ${values.seeds} seeds`
    );
    console.log(
      table(
        [
          'starting estimate',
          'gate pass',
          'est/true p50',
          '|ln err| p50',
          'startup mean ms',
          'startup p50 ms',
          'startup p90 ms',
          'first 20 s Mbit/s',
          'first 20 s stall ms',
          'QoE',
          'QoE p50',
        ],
        VARIANTS.map(({ name }) => {
          const rows = results.get(name)!.map((r) => r.result);
          const ratios = results.get(name)!.map((r) => r.ratio);
          const gates = results.get(name)!.flatMap((r) => (r.accepted === undefined ? [] : [r.accepted]));

          return [
            name,
            gates.length === 0 ? '-' : `${Math.round((100 * gates.filter(Boolean).length) / gates.length)}%`,
            median(ratios).toFixed(2),
            median(ratios.map((r) => Math.abs(Math.log(r)))).toFixed(2),
            mean(rows.map((r) => r.startupMs)).toFixed(0),
            median(rows.map((r) => r.startupMs)).toFixed(0),
            quantile(
              rows.map((r) => r.startupMs),
              0.9
            ).toFixed(0),
            (mean(rows.map((r) => r.earlyBitrateBps)) / 1e6).toFixed(2),
            mean(rows.map((r) => r.earlyRebufferMs)).toFixed(0),
            mean(rows.map((r) => qoe(r, player))).toFixed(2),
            median(rows.map((r) => qoe(r, player))).toFixed(2),
          ];
        })
      )
    );

    const networks = NETWORKS.map((n) => n.name);
    const behaviors = Object.keys(SERVER_BEHAVIORS);
    const startupCell = (rows: SessionResult[]) =>
      `${mean(rows.map((r) => r.startupMs)).toFixed(0)}/${median(rows.map((r) => r.startupMs)).toFixed(0)}`;

    console.log('\nStartup ms (mean/p50) by network:');
    console.log(
      table(
        ['starting estimate', ...networks],
        VARIANTS.map(({ name }) => [
          name,
          ...networks.map((n) =>
            startupCell(
              results
                .get(name)!
                .filter((r) => r.network === n)
                .map((r) => r.result)
            )
          ),
        ])
      )
    );

    console.log('\nStartup ms (mean/p50) by server behavior:');
    console.log(
      table(
        ['starting estimate', ...behaviors],
        VARIANTS.map(({ name }) => [
          name,
          ...behaviors.map((b) =>
            startupCell(
              results
                .get(name)!
                .filter((r) => r.behavior === b)
                .map((r) => r.result)
            )
          ),
        ])
      )
    );

    for (const scenario of SCENARIOS) {
      console.log(`\nScenario "${scenario.name}" (assumed weights, P(moved) ${scenario.moved}):`);
      console.log(
        table(
          ['policy', 'startup mean ms', 'startup p50 ms', 'startup p90 ms', 'first 20 s Mbit/s', 'QoE', 'QoE p50'],
          POLICIES.map((policy) => {
            const weighted = [
              ...weigh(results.get(policy.same)!, scenario, 1 - scenario.moved),
              ...weigh(results.get(policy.moved)!, scenario, scenario.moved),
            ];
            const of = (f: (r: SessionResult) => number) => weighted.map(({ r, w }) => ({ v: f(r.result), w }));

            return [
              policy.name,
              weightedMean(of((r) => r.startupMs)).toFixed(0),
              weightedQuantile(
                of((r) => r.startupMs),
                0.5
              ).toFixed(0),
              weightedQuantile(
                of((r) => r.startupMs),
                0.9
              ).toFixed(0),
              (weightedMean(of((r) => r.earlyBitrateBps)) / 1e6).toFixed(2),
              weightedMean(of((r) => qoe(r, player))).toFixed(2),
              weightedQuantile(
                of((r) => qoe(r, player)),
                0.5
              ).toFixed(2),
            ];
          })
        )
      );
    }

    console.log('\nFirst 20 s Mbit/s by network:');
    console.log(
      table(
        ['starting estimate', ...networks],
        VARIANTS.map(({ name }) => [
          name,
          ...networks.map((n) =>
            (
              mean(
                results
                  .get(name)!
                  .filter((r) => r.network === n)
                  .map((r) => r.result.earlyBitrateBps)
              ) / 1e6
            ).toFixed(2)
          ),
        ])
      )
    );
  }
}
