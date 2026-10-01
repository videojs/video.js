import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { isResolvedTrack, type MaybeResolvedPresentation } from '../../../../media/types';
import { createEngine } from '../engine';

// Live smoke test for multi-CDN failover against a real Mux `redundant_streams`
// source. It hits the network (the manifest + the surviving CDN are fetched for
// real), so it's gated behind VITE_FAILOVER_SMOKE and skipped in the default run.
//
//   VITE_FAILOVER_SMOKE=1 pnpm -F @videojs/spf test src/playback/engines/hls/tests/failover-smoke.test.ts
//
// We can't make a real Mux CDN drop requests, so the failure is "hacked": a
// fetch wrapper rejects every request to the primary origin while letting the
// manifest and the backup origin hit the real network.
const SMOKE = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_FAILOVER_SMOKE;

const REDUNDANT_URL = 'https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8?redundant_streams=true';

// This asset duplicates every variant across two origins; edgemv is listed
// first, so it resolves to cdnPriority[0] and is the one we block.
const PRIMARY = 'edgemv.mux.com';
const BACKUP = 'fastly.mux.com';

const hostOf = (url: string): string => new URL(url).host;

function selectedVideoTrack(presentation: MaybeResolvedPresentation | undefined, id: string | undefined) {
  if (!presentation || !id) return undefined;

  for (const set of presentation.selectionSets ?? []) {
    for (const sw of set.switchingSets) {
      const track = sw.tracks.find((t) => t.id === id);
      if (track) return track;
    }
  }

  return undefined;
}

describe.skipIf(!SMOKE)('multi-CDN failover (live smoke)', () => {
  let realFetch: typeof globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('fails over to the backup CDN when the primary is unreachable, then recovers', async () => {
    realFetch = globalThis.fetch;
    let blockPrimary = true;

    globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      if (blockPrimary && url.includes(PRIMARY)) return Promise.reject(new TypeError('blocked (smoke)'));

      return realFetch(input as RequestInfo, init);
    }) as typeof fetch;

    const engine = createEngine({ failover: { cooldownMs: 4000 } });

    engine.state.presentation.set({ url: REDUNDANT_URL } as MaybeResolvedPresentation);

    // The primary is picked first, its media-playlist fetch fails, the trip
    // lands in failedCdns, the constraint prunes it, and the selected video
    // track resolves on the backup CDN.
    await vi.waitFor(
      () => {
        expect(engine.state.cdnPriority.get()?.length).toBe(2);
        expect(engine.state.failedCdns.get()?.some((cdn) => cdn.includes(PRIMARY))).toBe(true);
        const track = selectedVideoTrack(engine.state.presentation.get(), engine.state.selectedVideoTrackId.get());

        expect(track).toBeDefined();
        expect(hostOf(track!.url)).toContain(BACKUP);
        expect(isResolvedTrack(track!)).toBe(true);
      },
      { timeout: 20_000, interval: 250 }
    );

    // Recovery: unblock the primary. Once its cooldown lapses it leaves
    // failedCdns and (being cdnPriority[0]) is preferred again — selection flips
    // back and the primary playlist now resolves for real.
    blockPrimary = false;
    await vi.waitFor(
      () => {
        expect(engine.state.failedCdns.get()?.some((cdn) => cdn.includes(PRIMARY))).toBe(false);
        const track = selectedVideoTrack(engine.state.presentation.get(), engine.state.selectedVideoTrackId.get());

        expect(track).toBeDefined();
        expect(hostOf(track!.url)).toContain(PRIMARY);
        expect(isResolvedTrack(track!)).toBe(true);
      },
      { timeout: 20_000, interval: 250 }
    );

    await engine.destroy();
  }, 60_000);
});
