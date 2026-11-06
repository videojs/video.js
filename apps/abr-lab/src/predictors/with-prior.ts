import { pointDistribution } from '../distribution.ts';
import type { TransferRecord } from '../record.ts';
import type { EvidenceWeights } from '../regime.ts';
import {
  createBelief,
  lognormalDensity,
  observeLowerBound,
  observeReading,
  observeStored,
  quantile,
} from './belief.ts';
import type { Predictor, PredictorFactory } from './predictor.ts';

/**
 * Where a session's first bandwidth estimate comes from, before any segment has been measured. `playlist` measures the
 * playlist bodies as they arrive; `gated` trusts a stored estimate only when the session's first request took about as
 * long as the stored session's did; `fixed` is a value known at session start.
 */
export type StartingEstimate =
  | { kind: 'fixed'; bps: number }
  /** `blend` takes the geometric mean of the playlist measurement and `fallbackBps` rather than preferring the former. */
  | { kind: 'playlist'; jitterMs: () => number; fallbackBps: number; blend?: boolean }
  | {
      kind: 'gated';
      storedBps: number;
      /** Time to first byte of the stored session's first request: a new connection, like this session's first. */
      storedFirstTtfbMs: number;
      /** Accept when this session's first TTFB is within this factor of the stored one, either way. */
      tolerance: number;
      /** Blend an accepted stored estimate with the playlist measurement, and fall back to the latter on rejection. */
      withPlaylist: boolean;
      jitterMs: () => number;
      fallbackBps: number;
    }
  /**
   * The first burst of the last playlist, timed chunk by chunk as a `ReadableStream` reader would see it: a measurement
   * when the burst spans at least `MIN_BURST_MS`, otherwise a lower bound. Lab-measured: bursts resolve on slow links
   * when the server sends small TLS records early, and collapse into one chunk on fast links.
   */
  | { kind: 'stream'; jitterMs: () => number; fallbackBps: number }
  /**
   * The recommended policy: a stored estimate that passed the RTT check is blended with a resolved burst, raised to a
   * lower bound, or, with no playlist evidence, capped at `capBps`; a rejected one is ignored.
   */
  | {
      kind: 'policy';
      storedBps: number;
      storedFirstTtfbMs: number;
      tolerance: number;
      jitterMs: () => number;
      fallbackBps: number;
      capBps: number;
    }
  /**
   * Every signal at hand folded into one belief (see `belief.ts`): a broad prior, a stored estimate as a same-network /
   * moved mixture whose odds the first request's TTFB shifts, the Network Information API's downlink (a lower bound at
   * its cap), and the last playlist's first burst. The estimate is the belief's `quantile`.
   */
  | {
      kind: 'fused';
      priorBps: number;
      priorSigma: number;
      stored?: { bps: number; firstTtfbMs: number; pSame: number } | undefined;
      netInfo?: { bps: number; capBps: number } | undefined;
      jitterMs: () => number;
      quantile: number;
    };

/**
 * Spreads of each signal, ln units: the sim's median |ln error| per signal (`pnpm abr:start`) over 0.674, the median of
 * |z| for a normal. Fitted on the same simulator they are tested in, so optimistic.
 */
const STORED_SIGMA = 1.05;
const NETINFO_SIGMA = 1.25;
const BURST_SIGMA = 0.67;
const LOWER_BOUND_SOFTNESS = 0.2;
/** Spread of ln(TTFB ratio) between two sessions on the same network, and between different networks. */
const TTFB_SAME_SIGMA = 0.35;
const TTFB_MOVED_SIGMA = 1;

/** Below this, a burst arrives within a chunk or two and its timing is noise (lab: 11.6 kB at 20 Mbit/s collapsed). */
const MIN_BURST_MS = 5;

/**
 * Wraps a predictor so it forecasts from `start` until it has observed one segment that counts as bandwidth evidence,
 * then defers to the wrapped predictor. Only the starting estimate differs from the predictor alone.
 */
export function withStartingEstimate(
  create: PredictorFactory,
  name: string,
  start: StartingEstimate
): Predictor & { firstEstimateBps(): number | undefined; gateAccepted(): boolean | undefined } {
  const inner = create();
  let measuredSegment = false;
  let playlistBps: number | undefined;
  /** The last playlist's first burst: a rate, and whether it is only a lower bound. */
  let burst: { bps: number; lowerBound: boolean } | undefined;
  let firstTtfbMs: number | undefined;
  let firstBps: number | undefined;

  /** Posterior odds the stored estimate came from this network, after the TTFB check alone. */
  const pSame = (): number | undefined => {
    if (start.kind !== 'fused' || !start.stored) return undefined;

    if (firstTtfbMs === undefined) return start.stored.pSame;

    const r = Math.log(firstTtfbMs / start.stored.firstTtfbMs);
    const same = start.stored.pSame * gauss(r, TTFB_SAME_SIGMA);
    const moved = (1 - start.stored.pSame) * gauss(r, TTFB_MOVED_SIGMA);

    return same / (same + moved);
  };

  const fused = (): number => {
    if (start.kind !== 'fused') return Number.NaN;

    let belief = createBelief(start.priorBps, start.priorSigma);

    if (start.stored) {
      const population = lognormalDensity(start.stored.bps, start.priorBps, start.priorSigma);

      belief = observeStored(belief, start.stored.bps, STORED_SIGMA, pSame()!, population);
    }

    if (start.netInfo) {
      belief =
        start.netInfo.bps >= start.netInfo.capBps
          ? observeLowerBound(belief, start.netInfo.capBps, LOWER_BOUND_SOFTNESS)
          : observeReading(belief, start.netInfo.bps, NETINFO_SIGMA);
    }

    if (burst) {
      belief = burst.lowerBound
        ? observeLowerBound(belief, burst.bps, LOWER_BOUND_SOFTNESS)
        : observeReading(belief, burst.bps, BURST_SIGMA);
    }

    return quantile(belief, start.quantile);
  };

  const accepted = () => {
    if (start.kind === 'fused') {
      const p = pSame();

      return p === undefined ? undefined : p >= 0.5;
    }

    if ((start.kind !== 'gated' && start.kind !== 'policy') || firstTtfbMs === undefined) return undefined;

    const ratio = firstTtfbMs / start.storedFirstTtfbMs;

    return ratio <= start.tolerance && ratio >= 1 / start.tolerance;
  };

  const estimate = (): number => {
    if (start.kind === 'fixed') return start.bps;

    if (start.kind === 'playlist') {
      if (playlistBps === undefined) return start.fallbackBps;

      return start.blend ? Math.sqrt(playlistBps * start.fallbackBps) : playlistBps;
    }

    if (start.kind === 'stream') return burst?.bps ?? start.fallbackBps;

    if (start.kind === 'fused') return fused();

    if (start.kind === 'policy') {
      const stored = accepted() ? start.storedBps : undefined;

      if (burst && !burst.lowerBound) return stored === undefined ? burst.bps : Math.sqrt(burst.bps * stored);

      if (burst) return Math.max(burst.bps, stored ?? 0);

      return stored === undefined ? start.fallbackBps : Math.min(stored, start.capBps);
    }

    const measured = start.withPlaylist ? playlistBps : undefined;

    if (!accepted()) return measured ?? start.fallbackBps;

    return measured === undefined ? start.storedBps : Math.sqrt(measured * start.storedBps);
  };

  return {
    name,
    observe(record: TransferRecord, weights: EvidenceWeights) {
      inner.observe(record, weights);

      if (record.kind === 'segment' && weights.bandwidth > 0) measuredSegment = true;

      const { start: requested, firstByte, end } = record.t;
      if (record.kind !== 'playlist' || firstByte === undefined || end === undefined) return;

      firstTtfbMs ??= firstByte - requested;

      if (start.kind !== 'fixed') {
        // Body time from headers to last byte, as Resource Timing reports it; timer and scheduling noise included.
        const bodyMs = Math.max(1, end - firstByte + start.jitterMs());

        playlistBps = (8000 * record.bytes) / bodyMs;

        // The first chunk is the first burst: its bytes over the time from headers to its last byte.
        const [arrival, bytes] = record.chunks[0] ?? [end, record.bytes];
        const spanMs = arrival - firstByte + start.jitterMs();

        burst =
          spanMs >= MIN_BURST_MS
            ? { bps: (8000 * bytes) / spanMs, lowerBound: false }
            : { bps: (8000 * bytes) / MIN_BURST_MS, lowerBound: true };
      }
    },
    /** The estimate behind the session's first forecast. */
    firstEstimateBps: () => firstBps,
    /** Whether a `gated` stored estimate passed the RTT check. */
    gateAccepted: accepted,
    forecast(request) {
      if (measuredSegment) return inner.forecast(request);

      const bps = estimate();

      firstBps ??= bps;
      return pointDistribution((8000 * request.bytes) / bps);
    },
  };
}

function gauss(value: number, sigma: number): number {
  return Math.exp(-0.5 * (value / sigma) ** 2) / sigma;
}
