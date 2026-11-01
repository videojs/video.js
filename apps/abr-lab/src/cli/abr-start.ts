import { parseArgs } from 'node:util';

import { mean, median, NETWORKS, PLAYERS, qoe, sessionInputs, table } from '../abr/scenarios.ts';
import { type AbrRule, runSession, type SessionResult } from '../abr/session.ts';
import { SERVER_BEHAVIORS } from '../abr/transport.ts';
import { INITIAL_BANDWIDTH_BPS } from '../predictors/predictor.ts';
import { createDashJs } from '../predictors/reference.ts';
import { type StartingEstimate, withStartingEstimate } from '../predictors/with-prior.ts';
import type { CapacityTrace } from '../synthetic/trace.ts';
import { seededRandom } from '../synthetic/trace.ts';

/**
 * Where dash.js's first estimate should come from. Every variant is dash.js with only its starting estimate changed,
 * through the same sessions. The session starts 10 minutes into its network's trace; the minute before that stands in
 * for "the last session" (stored estimate) and for recent browsing (Network Information API).
 */
const { values } = parseArgs({ options: { seeds: { type: 'string', default: '20' } } });

const HISTORY_MS = 11 * 60_000;
const LAST_SESSION_MS = 60_000;
/** Chrome caps `navigator.connection.downlink` at 10 Mbit/s and rounds it to 25 kbit/s. */
const NETINFO_CAP_BPS = 10_000_000;

interface World {
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

for (const player of PLAYERS) {
  for (const rule of [{ kind: 'throughput', safety: 1 }, { kind: 'mpc' }] satisfies AbrRule[]) {
    const results = new Map<
      string,
      Array<{ network: string; result: SessionResult; ratio: number; accepted: boolean | undefined }>
    >();

    for (const network of NETWORKS) {
      for (const behavior of Object.keys(SERVER_BEHAVIORS)) {
        for (let seed = 1; seed <= Number(values.seeds); seed++) {
          const inputs = sessionInputs(player, network, behavior, seed, HISTORY_MS);
          const other = NETWORKS[(NETWORKS.indexOf(network) + 1 + (seed % (NETWORKS.length - 1))) % NETWORKS.length]!;
          const elsewhere = sessionInputs(player, other, behavior, seed + 500, HISTORY_MS);
          const random = seededRandom(seed * 104_729);
          const lastSessionBps = 1000 * windowMean(inputs.history, 0, LAST_SESSION_MS);
          const world: World = {
            lastSessionBps,
            movedBps: 1000 * windowMean(elsewhere.history, 0, LAST_SESSION_MS),
            netInfoBps:
              Math.round(
                Math.min(NETINFO_CAP_BPS, 1000 * windowMean(inputs.history, HISTORY_MS - LAST_SESSION_MS, HISTORY_MS)) /
                  25_000
              ) * 25_000,
            populationBps: network.meanMbps * 1e6 * Math.exp(0.6 * gaussian(random)),
            perfectBps: 1000 * windowMean(inputs.trace, 0, 10_000),
            // A first request pays the TCP and TLS handshakes and the request: three round trips, plus server time.
            storedTtfbMs: 3 * inputs.history.latencyAt(0) + SERVER_BEHAVIORS[behavior]!.responseMs,
            movedTtfbMs: 3 * elsewhere.history.latencyAt(0) + SERVER_BEHAVIORS[behavior]!.responseMs,
            jitterMs: () => 2 * gaussian(random),
          };

          for (const variant of VARIANTS) {
            const predictor = withStartingEstimate(createDashJs, variant.name, variant.start(world));
            const result = runSession(inputs, predictor, rule);

            const ratio = (predictor.firstEstimateBps() ?? Number.NaN) / world.perfectBps;
            const accepted = predictor.gateAccepted();

            results.set(variant.name, [
              ...(results.get(variant.name) ?? []),
              { network: network.name, result, ratio, accepted },
            ]);
          }
        }
      }
    }

    const ruleName = rule.kind === 'mpc' ? 'mpc' : `throughput (safety ${rule.safety})`;

    console.log(`\n=== ${player.name}, ${ruleName}, dash.js with each starting estimate, ${values.seeds} seeds`);
    console.log(
      table(
        [
          'starting estimate',
          'gate pass',
          'est/true p50',
          '|ln err| p50',
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

/** Mean capacity, kbit/s, over `[fromMs, toMs)` of a trace. */
function windowMean(trace: CapacityTrace, fromMs: number, toMs: number): number {
  const from = Math.min(trace.bitsPerMs.length - 1, Math.floor(fromMs / trace.stepMs));
  const to = Math.max(from + 1, Math.min(trace.bitsPerMs.length, Math.floor(toMs / trace.stepMs)));
  let total = 0;

  for (let i = from; i < to; i++) total += trace.bitsPerMs[i]!;

  return total / (to - from);
}

function quantile(values: readonly number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? Number.NaN;
}

function gaussian(random: () => number): number {
  return Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
}
