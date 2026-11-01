import { describe, expect, it } from 'vite-plus/test';

import { describeOrigin, summarizeCache } from '../headers.ts';

describe('summarizeCache', () => {
  it('prefers edgemv tier headers over the stale Fastly-style ones stored with the object', () => {
    const summary = summarizeCache({
      'x-cache': 'MISS, MISS',
      'x-shield-cache-status': 'MISS',
      'x-edge-cache-status': 'HIT',
      'x-served-by-shield': 'shield-1',
      'x-served-by-edge': 'edge-5',
    });

    expect(summary).toEqual({ tiers: ['MISS', 'HIT'], servedBy: ['shield-1', 'edge-5'] });
  });

  it('reads Fastly tiers, hit counts and nodes in order', () => {
    const summary = summarizeCache({ 'x-cache': 'HIT, MISS', 'x-cache-hits': '1, 0', 'x-served-by': 'iad, bur' });

    expect(summary).toEqual({ tiers: ['HIT', 'MISS'], hits: [1, 0], servedBy: ['iad', 'bur'] });
  });
});

describe('describeOrigin', () => {
  it('places a host in its site, CDN and serving node', () => {
    const origin = describeOrigin(
      'https://chunk-oci-us-ashburn-1-vop1.edgemv.mux.com/v1/chunk/x.m4s',
      { 'x-cdn': 'edgemv', 'x-edge-cache-status': 'HIT', 'x-served-by-edge': 'edge-5' },
      'segment'
    );

    expect(origin).toEqual({
      site: 'mux.com',
      cdn: 'edgemv',
      host: 'chunk-oci-us-ashburn-1-vop1.edgemv.mux.com',
      pop: 'edge-5',
      role: 'segment',
    });
  });
});
