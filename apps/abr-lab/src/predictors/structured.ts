import {
  type Connection,
  constantTrace,
  newConnection,
  type ServerBehavior,
  simulateTransfer,
} from '../abr/transport.ts';
import { empiricalDistribution, normalQuantile } from '../distribution.ts';
import type { TransferRecord } from '../record.ts';
import type { EvidenceWeights } from '../regime.ts';
import { INITIAL_BANDWIDTH_BPS, type Predictor } from './predictor.ts';

/** Bodies smaller than this never leave slow start on a fast link, so their rate says little about capacity. */
const MIN_RATE_BYTES = 64_000;
const RTT_PRIOR_MS = 100;
/** An idle gap this long is where server behaviors differ (restart, added round trip, or nothing). */
const IDLE_MS = 1000;
const QUANTILE_GRID = Array.from({ length: 21 }, (_, i) => normalQuantile((i + 0.5) / 21));

/**
 * Download time from transport structure rather than one throughput number: RTT and link rate are estimated separately,
 * a new connection pays its handshakes, and the body follows slow start from the window a shadow connection says it
 * has. Whether the server restarts slow start after idle, and how many round trips it adds to the first byte after
 * idle, are learned per session from after-idle transfers, never assumed. TCP's initial window is the RFC 6928 default,
 * not a fitted value.
 */
export function createStructured(): Predictor {
  let rttMs: number | undefined;
  let fastLogRate: number | undefined;
  let slowLogRate: number | undefined;
  let idlePenaltyRtts = 0;
  let restartError = 0;
  let steadyError = 0;
  let residualVariance = 0.04;
  const connections = new Map<string, Connection>();

  const rateKbps = () =>
    fastLogRate === undefined || slowLogRate === undefined
      ? INITIAL_BANDWIDTH_BPS / 1000
      : Math.exp(Math.min(fastLogRate, slowLogRate));

  const behavior = (restart: boolean): ServerBehavior => ({
    name: restart ? 'learned-restart' : 'learned-steady',
    slowStartAfterIdle: restart,
    restartAfterMs: 200,
    idlePenaltyRtts,
    penaltyAfterMs: IDLE_MS,
    // Folded into the RTT estimate, which is measured to the first byte.
    responseMs: 0,
  });

  const pointForecast = (host: string, at: number, bytes: number, restart: boolean) => {
    const shadow = { ...(connections.get(host) ?? newConnection()) };
    const rtt = rttMs ?? RTT_PRIOR_MS;
    const timing = simulateTransfer(shadow, constantTrace(rateKbps(), rtt), behavior(restart), at, bytes, rtt);

    return timing.end - at;
  };

  const restartLikely = () => restartError < steadyError;

  return {
    name: 'structured',
    observe(record: TransferRecord, weights: EvidenceWeights) {
      const { start, firstByte, end } = record.t;

      if (firstByte === undefined || end === undefined || weights.regime === 'failed' || weights.regime === 'local') {
        return;
      }

      const host = record.origin.host;
      const fresh = !connections.has(host);
      const idle = (record.idleGapMs ?? 0) >= IDLE_MS;
      const actual = end - start;

      // Score both idle hypotheses on what was known before this transfer.
      if (!fresh && idle && record.bytes >= MIN_RATE_BYTES) {
        restartError =
          0.7 * restartError + 0.3 * Math.abs(Math.log(actual / pointForecast(host, start, record.bytes, true)));
        steadyError =
          0.7 * steadyError + 0.3 * Math.abs(Math.log(actual / pointForecast(host, start, record.bytes, false)));
      }

      if (!fresh) {
        const forecast = pointForecast(host, start, record.bytes, restartLikely());

        residualVariance = 0.8 * residualVariance + 0.2 * Math.log(actual / forecast) ** 2;
      }

      if (weights.latency > 0) {
        // A new connection's first byte took the TCP and TLS handshakes plus the request: three round trips.
        const sample = (firstByte - start) / (fresh ? 3 : 1);

        if (!fresh && idle && rttMs !== undefined) {
          idlePenaltyRtts = Math.max(0, 0.7 * idlePenaltyRtts + 0.3 * (sample / rttMs - 1));
        } else {
          rttMs = rttMs === undefined ? sample : 0.75 * rttMs + 0.25 * sample;
        }
      }

      const tail = tailRateKbps(record);

      if (weights.bandwidth > 0 && record.bytes >= MIN_RATE_BYTES && tail !== undefined) {
        const log = Math.log(tail);

        fastLogRate = fastLogRate === undefined ? log : 0.5 * fastLogRate + 0.5 * log;
        slowLogRate = slowLogRate === undefined ? log : 0.9 * slowLogRate + 0.1 * log;
      }

      // Keep the shadow connection's window in step with what this transfer would have done to it.
      const shadow = connections.get(host) ?? newConnection();
      const rtt = rttMs ?? RTT_PRIOR_MS;

      simulateTransfer(shadow, constantTrace(rateKbps(), rtt), behavior(restartLikely()), start, record.bytes, rtt);
      shadow.lastActiveMs = end;
      connections.set(host, shadow);
    },
    forecast({ bytes, host, at }) {
      const point = pointForecast(host, at, bytes, restartLikely());
      const sigma = Math.sqrt(residualVariance);

      return empiricalDistribution(QUANTILE_GRID.map((z) => point * Math.exp(sigma * z)));
    },
  };
}

/** Rate over the second half of the body, after slow start has mostly played out; kbit/s (bits per ms). */
function tailRateKbps(record: TransferRecord): number | undefined {
  const { firstByte, end } = record.t;
  if (firstByte === undefined || end === undefined || record.chunks.length === 0) return undefined;

  let received = 0;
  let halfAt = firstByte;

  for (const [time, bytes] of record.chunks) {
    if (received + bytes > record.bytes / 2) break;

    received += bytes;
    halfAt = time;
  }

  const ms = end - halfAt;

  return ms > 0 ? (8 * (record.bytes - received)) / ms : undefined;
}
