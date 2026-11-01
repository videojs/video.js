import { latencyMs, type TransferRecord } from './record.ts';

export type Regime = 'network' | 'local' | 'cdn-miss' | 'origin' | 'held' | 'small' | 'failed';

/**
 * How much a transfer counts as evidence about the network, split by component. The seed version of the regime model:
 * hand-set rules, to be replaced by a classifier tuned on lab-labelled logs.
 */
export interface EvidenceWeights {
  regime: Regime;
  latency: number;
  bandwidth: number;
}

/** Bodies below this are dominated by request latency; mirrors SPF's `DEFAULT_BANDWIDTH_CONFIG.minBytes`. */
const MIN_BANDWIDTH_BYTES = 16_000;
/**
 * A local cache answers within a few ms; in the first lab runs disk hits took 0.8–2.2 ms to first byte, while no
 * network request beat ~27 ms. Body rate is no help: small local reads are paced by the read loop, not the link.
 */
const LOCAL_MAX_LATENCY_MS = 5;

/**
 * Classify a completed transfer. `previous` is the most recent earlier completed transfer of the same URL, if any: a
 * local cache replays stored headers, so identical CDN headers on a repeat fetch point to a local hit.
 */
export function classifyTransfer(record: TransferRecord, previous?: TransferRecord): EvidenceWeights {
  if (record.t.end === undefined || typeof record.status !== 'number' || record.status >= 400) {
    return { regime: 'failed', latency: 0, bandwidth: 0 };
  }

  if (record.heldByServer) return { regime: 'held', latency: 0, bandwidth: 0 };

  if (isLikelyLocal(record, previous)) return { regime: 'local', latency: 0, bandwidth: 0 };

  const tiers = record.cache?.tiers ?? [];
  const missedEveryTier = tiers.length > 0 && tiers.every((tier) => tier.startsWith('MISS'));
  const missedEdge = tiers.length > 0 && (tiers.at(-1) ?? '').startsWith('MISS');

  const bandwidth = record.bytes >= MIN_BANDWIDTH_BYTES ? 1 : 0;

  // A miss at every tier waited on origin, so its first byte isn't network latency. Its body still arrived at network
  // speed in the first real recordings (long-tail content is mostly misses), so it stays bandwidth evidence. A JIT
  // encode that paces the body would not; detecting that needs cold-rendition data first.
  if (missedEveryTier) return { regime: 'origin', latency: 0, bandwidth };

  if (missedEdge) return { regime: 'cdn-miss', latency: 0.5, bandwidth };

  return { regime: bandwidth ? 'network' : 'small', latency: 1, bandwidth };
}

function isLikelyLocal(record: TransferRecord, previous?: TransferRecord): boolean {
  const latency = latencyMs(record);
  if (latency !== undefined && latency <= LOCAL_MAX_LATENCY_MS) return true;

  // A per-response request id, exposed by Mux CDNs, is replayed verbatim by a local cache.
  const requestId = record.headers?.['x-request-id'];
  const previousRequestId = previous?.headers?.['x-request-id'];
  if (requestId !== undefined && previousRequestId !== undefined) return requestId === previousRequestId;

  if (!previous?.cache || !record.cache) return false;

  return (
    sameList(previous.cache.hits, record.cache.hits) &&
    sameList(previous.cache.servedBy, record.cache.servedBy) &&
    sameList(previous.cache.tiers, record.cache.tiers)
  );
}

function sameList<T>(a: readonly T[] | undefined, b: readonly T[] | undefined): boolean {
  if (!a || !b || a.length !== b.length || a.length === 0) return false;

  return a.every((value, i) => value === b[i]);
}
