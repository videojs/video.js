import type { ProbeSample } from '../cli/probe.ts';
import { constantTrace, newConnection, SERVER_BEHAVIORS, simulateTransfer } from './transport.ts';

export interface ValidationRow {
  state: string;
  n: number;
  /** Median |ln(simulated / measured)|. */
  medianAbsLogError: number;
  /** Median simulated / measured. */
  medianRatio: number;
}

/**
 * Replays each lab probe through the transfer model with the lab origin's behavior: a fresh sample on a new connection,
 * a warm one after a same-size priming transfer and the sample's idle gap. The probe reuses one connection for the
 * whole sweep, so a warm sample's connection starts with a grown window.
 */
export function validateAgainstProbe(samples: readonly ProbeSample[]): ValidationRow[] {
  const byState = new Map<string, number[]>();

  for (const sample of samples) {
    if (sample.target !== undefined || sample.rateKbps <= 0 || sample.rttMs <= 0) continue;

    const trace = constantTrace(sample.rateKbps, sample.rttMs);
    const connection = newConnection();
    const behavior = SERVER_BEHAVIORS['linux-default']!;
    let start = 0;

    if (sample.state === 'warm') {
      simulateTransfer(connection, trace, behavior, 0, 4_000_000, sample.rttMs);

      const prime = simulateTransfer(connection, trace, behavior, connection.lastActiveMs, sample.bytes, sample.rttMs);

      start = prime.end + sample.idleMs;
    }

    const simulated = simulateTransfer(connection, trace, behavior, start, sample.bytes, sample.rttMs);
    const key = sample.state === 'warm' ? `warm idle ${sample.idleMs} ms` : 'fresh';

    byState.set(key, [...(byState.get(key) ?? []), (simulated.end - start) / sample.ms]);
  }

  return [...byState].map(([state, ratios]) => ({
    state,
    n: ratios.length,
    medianAbsLogError: median(ratios.map((r) => Math.abs(Math.log(r)))),
    medianRatio: median(ratios),
  }));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
}
