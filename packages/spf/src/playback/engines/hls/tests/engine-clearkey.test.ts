import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { clearKeySystem } from '../../../../media/dom/key-systems';
import type { MaybeResolvedPresentation } from '../../../../media/types';
import { createEngine } from '../engine';

// Full-pipeline EME coverage on the bundled Chromium, which ships no proprietary CDM but must ship Clear Key (the one
// key system the EME spec requires). The engine plays a real cenc-encrypted fixture end to end — negotiate → attach →
// manifest-driven session → license exchange → decode — so a regression anywhere in that pipeline fails every PR
// instead of waiting for a manual smoke against a real CDM.
//
// Nothing here leaves the test server: the fixture (fixtures/clearkey/, see its README) is served by the runner, and
// only the license URL is intercepted — Clear Key's exchange is spec-fixed JSON (`{"kids": […]}` in, a JWK set out),
// so the "server" is three lines. Everything between the CDM and this response is the production code path.

const FIXTURE_URL = new URL('./fixtures/clearkey/multivariant.m3u8', import.meta.url).href;
const LICENSE_URL = 'https://clearkey.example.com/license';

// The fixture's key pair (fixtures/clearkey/README.md). EME's JWK fields are base64url without padding.
const KID_HEX = '00112233445566778899aabbccddeeff';
const KEY_HEX = '0123456789abcdef0123456789abcdef';

function base64UrlFromHex(hex: string): string {
  const bytes = hex.match(/../g)!.map((pair) => Number.parseInt(pair, 16));

  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

describe('createEngine (Clear Key, real EME end to end)', () => {
  let realFetch: typeof globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('negotiates, licenses, and decodes an encrypted source', async () => {
    realFetch = globalThis.fetch;
    const licenseBodies: string[] = [];

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      if (url !== LICENSE_URL) return realFetch(input as RequestInfo, init);

      licenseBodies.push(new TextDecoder().decode(init!.body as ArrayBuffer));
      const jwk = { kty: 'oct', kid: base64UrlFromHex(KID_HEX), k: base64UrlFromHex(KEY_HEX) };

      return new Response(JSON.stringify({ keys: [jwk], type: 'temporary' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const video = document.createElement('video');

    video.muted = true;
    document.body.append(video);

    const engine = createEngine({
      drm: { 'org.w3.clearkey': { licenseUrl: LICENSE_URL } },
      keySystems: [clearKeySystem],
    });
    const { state, context } = engine;

    expect(state.segmentLoadingBlocked.get()).toBeUndefined();
    expect(context.mediaKeys.get()).toBeUndefined();

    context.mediaElement.set(video);
    state.presentation.set({ url: FIXTURE_URL } as MaybeResolvedPresentation);

    // Negotiation lands on Clear Key and the license exchange carries the
    // fixture's KID out and the JWK set back.
    await vi.waitFor(() => expect(state.negotiatedKeySystem.get()).toBe('org.w3.clearkey'), {
      timeout: 10_000,
    });
    await vi.waitFor(() => expect(licenseBodies.length).toBeGreaterThan(0), { timeout: 10_000 });
    expect(JSON.parse(licenseBodies[0]!)).toMatchObject({ kids: [base64UrlFromHex(KID_HEX)] });

    // Decode is the proof the returned key actually decrypted the samples —
    // buffered ranges alone would pass with a key the CDM never accepted.
    void video.play().catch(() => {});
    await vi.waitFor(() => expect(video.getVideoPlaybackQuality().totalVideoFrames).toBeGreaterThan(0), {
      timeout: 15_000,
      interval: 250,
    });

    expect(state.errors.get() ?? []).toEqual([]);

    await engine.destroy();
    video.remove();
  }, 45_000);
});
