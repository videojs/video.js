// Imported from source on purpose: the baseline must be SPF's actual estimator, not a copy that can drift.
import {
  type BandwidthState,
  getBandwidthEstimate,
  sampleBandwidth,
} from '../../../../packages/spf/src/network/bandwidth-estimator.ts';
import { pointDistribution } from '../distribution.ts';
import type { TransferRecord } from '../record.ts';
import { INITIAL_BANDWIDTH_BPS, type Predictor } from './predictor.ts';

/**
 * Today's SPF behavior, replayed: every video segment and init body chunk is sampled exactly as `createTrackedFetch`
 * does (elapsed time since the previous chunk, the first measured from headers), with no regime filtering and no
 * latency term. The forecast is the point estimate `bytes / estimate`.
 */
export function createSpfDualEwma(): Predictor {
  let state: BandwidthState = {
    fastEstimate: 0,
    fastTotalWeight: 0,
    slowEstimate: 0,
    slowTotalWeight: 0,
    bytesSampled: 0,
  };

  return {
    name: 'spf-dual-ewma',
    observe(record: TransferRecord) {
      if (record.kind !== 'segment' && record.kind !== 'init') return;

      if (record.trackType !== undefined && record.trackType !== 'video') return;

      if (record.t.firstByte === undefined) return;

      let previous = record.t.firstByte;

      for (const [time, bytes] of record.chunks) {
        state = sampleBandwidth(state, time - previous, bytes);
        previous = time;
      }
    },
    forecast({ bytes }) {
      const bps = getBandwidthEstimate(state, INITIAL_BANDWIDTH_BPS);

      return pointDistribution((8000 * bytes) / bps);
    },
  };
}
