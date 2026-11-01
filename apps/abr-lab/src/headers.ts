import type { CacheSummary, TransferOrigin } from './record.ts';

/**
 * Per-tier cache status, outermost tier last.
 *
 * Edgemv answers with its own `x-shield-cache-status` / `x-edge-cache-status`, and also carries Fastly-style `x-cache`
 * headers that were stored with the object when it was filled, so those are stale on later responses; prefer the edgemv
 * pair when present.
 */
export function summarizeCache(headers: Record<string, string>): CacheSummary | undefined {
  const shield = headers['x-shield-cache-status'];
  const edge = headers['x-edge-cache-status'];

  if (shield !== undefined || edge !== undefined) {
    return {
      tiers: [shield, edge].filter((v): v is string => v !== undefined).map((v) => v.trim().toUpperCase()),
      servedBy: [headers['x-served-by-shield'], headers['x-served-by-edge']].filter(
        (v): v is string => v !== undefined
      ),
    };
  }

  const xCache = headers['x-cache'];
  if (xCache === undefined) return undefined;

  return {
    tiers: splitList(xCache).map((v) => v.toUpperCase()),
    hits: headers['x-cache-hits'] === undefined ? undefined : splitList(headers['x-cache-hits']).map(Number),
    servedBy: headers['x-served-by'] === undefined ? undefined : splitList(headers['x-served-by']),
  };
}

export function describeOrigin(
  url: string,
  headers: Record<string, string>,
  role: TransferOrigin['role']
): TransferOrigin {
  const { hostname } = new URL(url);
  const servedBy = summarizeCache(headers)?.servedBy;

  return {
    site: registrableDomain(hostname),
    cdn: headers['x-cdn'] ?? cdnFromVia(headers['via']),
    host: hostname,
    pop: servedBy?.at(-1),
    role,
  };
}

/** Last two labels; good enough for the hosts in play, without bundling the public suffix list. */
export function registrableDomain(hostname: string): string {
  return hostname.split('.').slice(-2).join('.');
}

function cdnFromVia(via: string | undefined): string | undefined {
  if (!via) return undefined;

  if (/varnish/i.test(via)) return 'varnish';

  return undefined;
}

function splitList(value: string): string[] {
  return value.split(',').map((v) => v.trim());
}
