import type { Distribution } from '../distribution.ts';
import type { TransferRecord } from '../record.ts';
import type { EvidenceWeights } from '../regime.ts';

/** What the scorer asks: how long would a request of `bytes` to `host`, starting at `at`, take? */
export interface ForecastRequest {
  bytes: number;
  host: string;
  at: number;
  url?: string | undefined;
  renditionId?: string | undefined;
  /** First request for this rendition in the session. */
  firstTouchRendition?: boolean | undefined;
  idleGapMs?: number | undefined;
  /** Transfers already in flight when this request starts. */
  inFlight?: number | undefined;
}

/**
 * A download-time predictor under test. The scorer only ever calls `observe` with transfers that completed before the
 * forecast's `at`, in completion order, so no predictor can see the future.
 */
export interface Predictor {
  readonly name: string;
  observe(record: TransferRecord, weights: EvidenceWeights): void;
  forecast(request: ForecastRequest): Distribution;
}

export type PredictorFactory = () => Predictor;

/** SPF's cold-start estimate (`DEFAULT_INITIAL_BANDWIDTH`), shared so every predictor starts from the same prior. */
export const INITIAL_BANDWIDTH_BPS = 5_000_000;
