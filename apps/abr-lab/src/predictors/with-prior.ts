import { pointDistribution } from '../distribution.ts';
import type { TransferRecord } from '../record.ts';
import type { EvidenceWeights } from '../regime.ts';
import type { Predictor, PredictorFactory } from './predictor.ts';

/**
 * Where a session's first bandwidth estimate comes from, before any segment has been measured. `playlist` measures the
 * playlist bodies as they arrive; the others are a fixed value known at session start.
 */
export type StartingEstimate =
  | { kind: 'fixed'; bps: number }
  /** `blend` takes the geometric mean of the playlist measurement and `fallbackBps` rather than preferring the former. */
  | { kind: 'playlist'; jitterMs: () => number; fallbackBps: number; blend?: boolean };

/**
 * Wraps a predictor so it forecasts from `start` until it has observed one segment that counts as bandwidth evidence,
 * then defers to the wrapped predictor. Only the starting estimate differs from the predictor alone.
 */
export function withStartingEstimate(
  create: PredictorFactory,
  name: string,
  start: StartingEstimate
): Predictor & { firstEstimateBps(): number | undefined } {
  const inner = create();
  let measuredSegment = false;
  let playlistBps: number | undefined;
  let firstBps: number | undefined;

  return {
    name,
    observe(record: TransferRecord, weights: EvidenceWeights) {
      inner.observe(record, weights);

      if (record.kind === 'segment' && weights.bandwidth > 0) measuredSegment = true;

      const { firstByte, end } = record.t;

      if (start.kind === 'playlist' && record.kind === 'playlist' && firstByte !== undefined && end !== undefined) {
        // Body time from headers to last byte, as Resource Timing reports it; timer and scheduling noise included.
        const bodyMs = Math.max(1, end - firstByte + start.jitterMs());

        playlistBps = (8000 * record.bytes) / bodyMs;
      }
    },
    /** The estimate behind the session's first forecast. */
    firstEstimateBps: () => firstBps,
    forecast(request) {
      if (measuredSegment) return inner.forecast(request);

      const bps =
        start.kind === 'fixed'
          ? start.bps
          : playlistBps === undefined
            ? start.fallbackBps
            : start.blend
              ? Math.sqrt(playlistBps * start.fallbackBps)
              : playlistBps;

      firstBps ??= bps;
      return pointDistribution((8000 * request.bytes) / bps);
    },
  };
}
