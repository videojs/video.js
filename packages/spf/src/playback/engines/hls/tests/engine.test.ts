import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { snapshot } from '../../../../core/signals/primitives';
import { appendSegment } from '../../../../media/dom/mse/append-segment';
import { SVTA_NO_SUPPORTED_VIDEO_TRACK } from '../../../../media/errors';
import type {
  CanPlayTrack,
  PartiallyResolvedAudioTrack,
  PartiallyResolvedVideoTrack,
  Presentation,
  VideoTrack,
} from '../../../../media/types';
import { createHlsVideoEngine } from '../engine';

// Mock appendSegment to succeed without real MP4 data
vi.mock('../../../../media/dom/mse/append-segment', () => ({
  appendSegment: vi.fn().mockResolvedValue(undefined),
}));

// Fallback for URLs a test's mock doesn't handle explicitly. Segment/init
// requests resolve with an empty body — the appendSegment mock makes the bytes
// inert — so the failover monitor isn't tripped by unmocked segment fetches (a
// single failed fetch trips that CDN into cooldown, which empties the candidate
// set). Genuinely unknown URLs still reject loudly.
function unmockedFetchFallback(url: string): Promise<Response> {
  // Non-empty body: `fetchStream` throws "Response has no body" on a null body
  // (empty Uint8Array), which would itself trip the monitor.
  if (/\.(m4s|mp4|ts|aac)(\?|$)/.test(url)) return Promise.resolve(new Response(new Uint8Array([0])));

  return Promise.reject(new Error(`Unmocked URL: ${url}`));
}

describe('createHlsVideoEngine', () => {
  let originalFetch: typeof globalThis.fetch;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  // Tests assert at actor-presence and state-shape level, not at "init segment
  // appended" level. Audio/video segment fetches resolve via
  // `unmockedFetchFallback` (inert under the appendSegment mock); text-track
  // segment fetches still reject and leak a console.error. Suppress only the
  // expected patterns so genuine failures still surface.
  const expectedErrorPatterns = [
    /Unexpected error in segment loader.*Unmocked URL/s,
    /Failed to load text-track segment/,
  ];

  beforeEach(() => {
    // Save original fetch
    originalFetch = globalThis.fetch;

    const originalConsoleError = console.error.bind(console);

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const text = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
      if (expectedErrorPatterns.some((p) => p.test(text))) return;

      originalConsoleError(...args);
    });
  });

  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  it('initializes state with seeded bandwidthState and behavior-supplied defaults', () => {
    const engine = createHlsVideoEngine();

    // Composition creates one signal per declared key. ABR machinery is
    // seeded via `initialState` with an empty BandwidthState. `preload` is
    // backfilled by `syncPreload` to its default (`'metadata'`); `currentTime`
    // is backfilled by `trackCurrentTime` to its default (`0`).
    // Everything else starts as `undefined` and behaviors write their
    // own slots in response to inputs.
    expect(snapshot(engine.state)).toEqual({
      cdnPriority: undefined,
      userVideoTrackSelection: undefined,
      bandwidthState: {
        fastEstimate: 0,
        fastTotalWeight: 0,
        slowEstimate: 0,
        slowTotalWeight: 0,
        bytesSampled: 0,
      },
      currentTime: 0,
      loadActivated: undefined,
      preload: 'metadata',
      presentation: undefined,
      selectedAudioTrackId: undefined,
      selectedTextTrackId: undefined,
      selectedVideoTrackId: undefined,
    });

    const contextSnapshot = snapshot(engine.context);

    expect(Object.values(contextSnapshot).every((v) => v === undefined)).toBe(true);

    engine.destroy();
  });

  it('publishes the CDN list and keeps the video selection on the primary (redundant-stream source)', async () => {
    const flush = () => Promise.resolve().then(() => Promise.resolve());
    const engine = createHlsVideoEngine();

    const videoTrack = (id: string, host: string): PartiallyResolvedVideoTrack => ({
      type: 'video',
      id,
      codecs: [],
      url: `https://${host}/${id}.m3u8`,
      bandwidth: 2_400_000,
      mimeType: 'video/mp4',
    });

    // Same rendition duplicated across cdn-a (manifest head) and cdn-b.
    engine.state.presentation.set({
      id: 'pres-1',
      url: 'https://cdn-a.example.com/master.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'v',
          type: 'video',
          switchingSets: [
            {
              id: 'vs',
              type: 'video',
              tracks: [videoTrack('720p-a', 'cdn-a.example.com'), videoTrack('720p-b', 'cdn-b.example.com')],
            },
          ],
        },
      ],
    } as Presentation);
    await flush();

    // resolveCdns publishes the manifest-ordered list; preferActiveCdn narrows
    // the video pick to the primary (first-with-survivors) CDN.
    expect(engine.state.cdnPriority.get()).toEqual(['https://cdn-a.example.com', 'https://cdn-b.example.com']);
    expect(engine.state.selectedVideoTrackId.get()).toBe('720p-a');

    // Reorder the CDN list (steering/override seam): the scope re-narrows and the
    // selection follows to the other CDN's matching rendition.
    engine.state.cdnPriority.set(['https://cdn-b.example.com', 'https://cdn-a.example.com']);
    await flush();
    expect(engine.state.selectedVideoTrackId.get()).toBe('720p-b');

    engine.destroy();
  });

  it('keeps audio on the same CDN as video even when the audio rendition order differs', async () => {
    // Order-effect guard: `deriveCdnPriority` derives the list from track order,
    // so a same-ordered source can't distinguish "scope applied" from "scope is
    // a no-op". This source is doubly adversarial to the desired result: the
    // audio selection set comes BEFORE video in the manifest, and within it the
    // audio renditions list cdn-b first. By raw parse order that would make
    // cdn-b primary and pull everything onto cdn-b. `getOrderedCdnIds` instead
    // visits video selection sets before audio, so `cdnPriority` is video-derived
    // (cdn-a primary) *by guarantee*, and the scope pulls audio onto cdn-a —
    // `aud-a`, NOT the parse-order `aud-b`. This pins the type-priority ordering,
    // not a manifest/parse-order coincidence.
    const flush = () => Promise.resolve().then(() => Promise.resolve());
    const engine = createHlsVideoEngine();

    const videoTrack = (id: string, host: string): PartiallyResolvedVideoTrack => ({
      type: 'video',
      id,
      codecs: [],
      url: `https://${host}/${id}.m3u8`,
      bandwidth: 2_400_000,
      mimeType: 'video/mp4',
    });
    const audioTrack = (id: string, host: string): PartiallyResolvedAudioTrack => ({
      type: 'audio',
      id,
      codecs: ['mp4a.40.2'],
      url: `https://${host}/${id}.m3u8`,
      bandwidth: 128_000,
      mimeType: 'audio/mp4',
      groupId: 'audio',
      name: id,
      sampleRate: 48_000,
      channels: 2,
    });

    engine.state.presentation.set({
      id: 'pres-asym',
      url: 'https://cdn-a.example.com/master.m3u8',
      startTime: 0,
      // Audio selection set listed FIRST, cdn-b first within it — the reverse of
      // the video order on both axes. Type-priority ordering must still put video
      // (cdn-a) at the head of cdnPriority.
      selectionSets: [
        {
          id: 'a',
          type: 'audio',
          switchingSets: [
            {
              id: 'as',
              type: 'audio',
              tracks: [audioTrack('aud-b', 'cdn-b.example.com'), audioTrack('aud-a', 'cdn-a.example.com')],
            },
          ],
        },
        {
          id: 'v',
          type: 'video',
          switchingSets: [
            {
              id: 'vs',
              type: 'video',
              tracks: [videoTrack('vid-a', 'cdn-a.example.com'), videoTrack('vid-b', 'cdn-b.example.com')],
            },
          ],
        },
      ],
    } as Presentation);
    await flush();

    expect(engine.state.cdnPriority.get()).toEqual(['https://cdn-a.example.com', 'https://cdn-b.example.com']);
    expect(engine.state.selectedVideoTrackId.get()).toBe('vid-a');
    // The discriminator: audio is listed first and lists aud-b first, but the
    // video-derived cdnPriority puts cdn-a first, so the scope picks aud-a.
    expect(engine.state.selectedAudioTrackId.get()).toBe('aud-a');

    engine.destroy();
  });

  it('fails over video and audio to the next CDN when one is marked failed', async () => {
    const flush = () => Promise.resolve().then(() => Promise.resolve());
    const engine = createHlsVideoEngine();

    const videoTrack = (id: string, host: string): PartiallyResolvedVideoTrack => ({
      type: 'video',
      id,
      codecs: [],
      url: `https://${host}/${id}.m3u8`,
      bandwidth: 2_400_000,
      mimeType: 'video/mp4',
    });
    const audioTrack = (id: string, host: string): PartiallyResolvedAudioTrack => ({
      type: 'audio',
      id,
      codecs: ['mp4a.40.2'],
      url: `https://${host}/${id}.m3u8`,
      bandwidth: 128_000,
      mimeType: 'audio/mp4',
      groupId: 'audio',
      name: id,
      sampleRate: 48_000,
      channels: 2,
    });

    engine.state.presentation.set({
      id: 'pres-failover',
      url: 'https://cdn-a.example.com/master.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'v',
          type: 'video',
          switchingSets: [
            {
              id: 'vs',
              type: 'video',
              tracks: [videoTrack('vid-a', 'cdn-a.example.com'), videoTrack('vid-b', 'cdn-b.example.com')],
            },
          ],
        },
        {
          id: 'a',
          type: 'audio',
          switchingSets: [
            {
              id: 'as',
              type: 'audio',
              tracks: [audioTrack('aud-a', 'cdn-a.example.com'), audioTrack('aud-b', 'cdn-b.example.com')],
            },
          ],
        },
      ],
    } as Presentation);
    await flush();

    // Primary CDN initially.
    expect(engine.state.selectedVideoTrackId.get()).toBe('vid-a');
    expect(engine.state.selectedAudioTrackId.get()).toBe('aud-a');

    // Mark cdn-a failed → both types fail over to cdn-b coherently.
    engine.state.failedCdns.set(['https://cdn-a.example.com']);
    await flush();
    expect(engine.state.selectedVideoTrackId.get()).toBe('vid-b');
    expect(engine.state.selectedAudioTrackId.get()).toBe('aud-b');

    // cdn-a recovers → both return to the primary.
    engine.state.failedCdns.set([]);
    await flush();
    expect(engine.state.selectedVideoTrackId.get()).toBe('vid-a');
    expect(engine.state.selectedAudioTrackId.get()).toBe('aud-a');

    engine.destroy();
  });

  it('codec-filters renditions via the injected canPlayTrack before selection', async () => {
    const flush = () => Promise.resolve().then(() => Promise.resolve());
    // Reject HEVC; accept everything else.
    const canPlayTrack = (track: { codecs?: string[] }) => !track.codecs?.some((c) => c.startsWith('hvc1'));
    const engine = createHlsVideoEngine({ canPlayTrack });

    const videoTrack = (id: string, codec: string): PartiallyResolvedVideoTrack => ({
      type: 'video',
      id,
      codecs: [codec],
      url: `https://example.com/${id}.m3u8`,
      bandwidth: 4_800_000,
      mimeType: 'video/mp4',
    });

    engine.state.presentation.set({
      id: 'pres-codec',
      url: 'https://example.com/master.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'v',
          type: 'video',
          switchingSets: [
            {
              id: 'vs',
              type: 'video',
              tracks: [videoTrack('1080p-hevc', 'hvc1.1.6.L120.B0'), videoTrack('1080p-avc', 'avc1.640028')],
            },
          ],
        },
      ],
    } as Presentation);
    await flush();

    // HEVC pruned upstream by the capability constraint; AVC selected.
    expect(engine.state.selectedVideoTrackId.get()).toBe('1080p-avc');

    engine.destroy();
  });

  it.each([false, true])(
    'honors the injected capability verdict for an AVC singleton (playable: %s)',
    async (playable) => {
      const track: VideoTrack = {
        type: 'video',
        id: '1080p-avc',
        codecs: ['avc1.640028'],
        url: 'https://example.com/video.m3u8',
        bandwidth: 4_800_000,
        mimeType: 'video/mp4',
        initialization: { url: 'https://example.com/init.mp4' },
        segments: [],
        startTime: 0,
        duration: 0,
      };
      const canPlayTrack = vi.fn<CanPlayTrack>(() => playable);
      const engine = createHlsVideoEngine({ canPlayTrack });

      try {
        engine.state.presentation.set({
          id: 'pres-capability',
          url: 'https://example.com/master.m3u8',
          startTime: 0,
          selectionSets: [{ id: 'v', type: 'video', switchingSets: [{ id: 'vs', type: 'video', tracks: [track] }] }],
        });
        await Promise.resolve().then(() => Promise.resolve());

        expect.soft(canPlayTrack.mock.calls.map(([probed]) => probed)).toContainEqual(track);
        expect(engine.state.selectedVideoTrackId.get()).toBe(playable ? track.id : undefined);
        expect(engine.state.errors.get()?.map((error) => error.code) ?? []).toEqual(
          playable ? [] : [SVTA_NO_SUPPORTED_VIDEO_TRACK]
        );
      } finally {
        await engine.destroy();
      }
    }
  );

  it('reports playlist conditions through an overridden reporter', async () => {
    // Same default-with-override shape as `canPlayTrack` / `resolveTextTrackSegment`.
    // A composition that ships no MPEG-TS, or wants a different vocabulary, replaces
    // the reporter rather than living with the built-in checks.
    const reportUnsupportedTrackConditions = () => [{ code: 99001, message: 'custom' }];
    const engine = createHlsVideoEngine({ reportUnsupportedTrackConditions });

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(`#EXTM3U
#EXT-X-TARGETDURATION:4
#EXT-X-MAP:URI="init.mp4"
#EXTINF:4.0,
0.m4s
#EXT-X-ENDLIST`)
    );

    engine.state.presentation.set({
      id: 'pres-report',
      url: 'https://example.com/master.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'v',
          type: 'video',
          switchingSets: [
            {
              id: 'vs',
              type: 'video',
              tracks: [
                {
                  type: 'video',
                  id: 'v1',
                  codecs: ['avc1.640028'],
                  url: 'https://example.com/v1.m3u8',
                  bandwidth: 1_000_000,
                  mimeType: 'video/mp4',
                } as PartiallyResolvedVideoTrack,
              ],
            },
          ],
        },
      ],
    } as Presentation);

    await vi.waitFor(() => {
      expect(engine.state.errors.get()?.map((error) => error.code)).toEqual([99001]);
    });

    engine.destroy();
  });

  it('auto-fails-over when a CDN fetch fails (monitor trips, failedCdns set)', async () => {
    const engine = createHlsVideoEngine({ failover: { cooldownMs: 60_000 } });

    // cdn-a is down (media-playlist fetch rejects); cdn-b serves a valid playlist.
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String((input as Request).url ?? input);
      if (url.includes('cdn-a')) throw new TypeError('cdn-a unreachable');

      return new Response('#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10.0,\nseg-1.m4s\n#EXT-X-ENDLIST');
    }) as typeof fetch;

    const videoTrack = (id: string, host: string): PartiallyResolvedVideoTrack => ({
      type: 'video',
      id,
      codecs: [],
      url: `https://${host}/${id}.m3u8`,
      bandwidth: 2_400_000,
      mimeType: 'video/mp4',
    });

    engine.state.presentation.set({
      id: 'pres-failover',
      url: 'https://cdn-a.example.com/master.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'v',
          type: 'video',
          switchingSets: [
            {
              id: 'vs',
              type: 'video',
              tracks: [videoTrack('vid-a', 'cdn-a.example.com'), videoTrack('vid-b', 'cdn-b.example.com')],
            },
          ],
        },
      ],
    } as Presentation);

    // The primary (cdn-a) is picked first, its media-playlist fetch fails, the
    // monitor trips it, the constraint prunes it, and the scope fails over to
    // cdn-b — all without any external failedCdns write.
    await vi.waitFor(() => {
      expect(engine.state.failedCdns.get()).toEqual(['https://cdn-a.example.com']);
      expect(engine.state.selectedVideoTrackId.get()).toBe('vid-b');
    });

    engine.destroy();
  });

  it('honors a custom getCdnId across cdnPriority, the trip, and the constraint/scope', async () => {
    // Key CDNs on the `cdn=` query param instead of origin. Both variants share a
    // host, so origin-based identity would see ONE CDN (no redundancy); the
    // custom resolver must be respected at every site for failover to work.
    const getCdnId = (url: string) => new URL(url).searchParams.get('cdn') ?? url;
    const engine = createHlsVideoEngine({ getCdnId, failover: { cooldownMs: 60_000 } });

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : String((input as Request).url ?? input);
      if (url.includes('cdn=a')) throw new TypeError('cdn-a unreachable');

      return new Response('#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10.0,\nseg-1.m4s\n#EXT-X-ENDLIST');
    }) as typeof fetch;

    const videoTrack = (id: string, cdn: string): PartiallyResolvedVideoTrack => ({
      type: 'video',
      id,
      codecs: [],
      url: `https://cdn.example.com/${id}.m3u8?cdn=${cdn}`,
      bandwidth: 2_400_000,
      mimeType: 'video/mp4',
    });

    engine.state.presentation.set({
      id: 'pres-custom-cdn',
      url: 'https://cdn.example.com/master.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'v',
          type: 'video',
          switchingSets: [{ id: 'vs', type: 'video', tracks: [videoTrack('vid-a', 'a'), videoTrack('vid-b', 'b')] }],
        },
      ],
    } as Presentation);

    await vi.waitFor(() => {
      // deriveCdnPriority keyed on the param (not origin → not a single CDN).
      expect(engine.state.cdnPriority.get()).toEqual(['a', 'b']);
      // The trip recorded the param key, and the constraint + scope failed over.
      expect(engine.state.failedCdns.get()).toEqual(['a']);
      expect(engine.state.selectedVideoTrackId.get()).toBe('vid-b');
    });

    engine.destroy();
  });

  it('can be destroyed multiple times safely', async () => {
    const engine = createHlsVideoEngine();

    await engine.destroy();
    await expect(engine.destroy()).resolves.toBeUndefined();
  });

  it('orchestrates complete pipeline: presentation → tracks → MediaSource → SourceBuffers', async () => {
    // Mock fetch with URL-based lookup for all playlist types
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      // Multivariant playlist with video and audio
      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",LANGUAGE="en",CHANNELS="2",URI="http://example.com/audio-en.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E,mp4a.40.2",AUDIO="audio",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      // Video media playlist
      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      // Audio media playlist
      if (url.includes('audio-en.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-audio.mp4"
#EXTINF:10.0,
http://example.com/audio-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();

    expect(engine.state.segmentLoadingBlocked.get()).toBeUndefined();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    // Initialize: patch owners and state
    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    // Wait for complete orchestration pipeline
    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);
        const owners = snapshot(engine.context);

        // === IMMUTABLE STATE VERIFICATION ===

        // 1. Presentation should be fully resolved
        expect(state.presentation).toBeDefined();
        expect(state.presentation?.id).toBeDefined();
        expect(state.presentation?.selectionSets).toBeDefined();
        expect(state.presentation?.selectionSets?.length).toBeGreaterThan(0);

        // 2. Video track should be selected and resolved
        expect(state.selectedVideoTrackId).toBeDefined();
        const videoTrack = state.presentation?.selectionSets
          ?.find((s: any) => s.type === 'video')
          ?.switchingSets?.[0]?.tracks?.find((t: any) => t.id === state.selectedVideoTrackId);

        expect(videoTrack).toBeDefined();
        expect(videoTrack?.segments).toBeDefined(); // Track resolved (has segments)

        // 3. Audio track should be selected and resolved
        expect(state.selectedAudioTrackId).toBeDefined();
        const audioTrack = state.presentation?.selectionSets
          ?.find((s: any) => s.type === 'audio')
          ?.switchingSets?.[0]?.tracks?.find((t: any) => t.id === state.selectedAudioTrackId);

        expect(audioTrack).toBeDefined();
        expect(audioTrack?.segments).toBeDefined(); // Track resolved (has segments)

        // === MUTABLE OWNERS VERIFICATION ===

        // 4. MediaElement should be set
        expect(owners.mediaElement).toBe(mediaElement);

        // 5. MediaSource should be created
        expect(owners.mediaSource).toBeDefined();
        // readyState isn't asserted: with appendSegment mocked the stream completes
        // instantly, so the MediaSource doesn't durably sit in 'open' (a created buffer
        // actor implies addSourceBuffer ran, which requires an open MediaSource).

        // 6. Video buffer cluster should be created (actor presence implies
        //    `addSourceBuffer` ran; SourceBuffer itself is private to
        //    `setupVideoBufferActors`).
        expect(owners.videoBufferActor).toBeDefined();

        // 7. Audio buffer cluster should be created
        expect(owners.audioBufferActor).toBeDefined();
      },
      { timeout: 5000 }
    );

    await engine.destroy();
  });

  it('cleanly replaces source in place via state.presentation overwrite', async () => {
    // Two sources, A and B, each with their own video + audio playlists.
    // Source-replacement validation: the resolved/unresolved routing in
    // `resolvePresentation` should let an in-place `state.presentation.set`
    // tear down A's actors via reactor state-exit and rebuild fresh actors
    // for B without recreating the engine.
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist-a.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",LANGUAGE="en",CHANNELS="2",URI="http://example.com/audio-a.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E,mp4a.40.2",AUDIO="audio",RESOLUTION=640x360
http://example.com/video-a.m3u8`)
        );
      }

      if (url.includes('video-a.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video-a.mp4"
#EXTINF:10.0,
http://example.com/video-a-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('audio-a.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-audio-a.mp4"
#EXTINF:10.0,
http://example.com/audio-a-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('playlist-b.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="Spanish",LANGUAGE="es",CHANNELS="2",URI="http://example.com/audio-b.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=2000000,CODECS="avc1.4D401F,mp4a.40.2",AUDIO="audio",RESOLUTION=1280x720
http://example.com/video-b.m3u8`)
        );
      }

      if (url.includes('video-b.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video-b.mp4"
#EXTINF:10.0,
http://example.com/video-b-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('audio-b.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-audio-b.mp4"
#EXTINF:10.0,
http://example.com/audio-b-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist-a.m3u8' });
    engine.state.preload.set('auto');

    // Wait for source A's pipeline to fully resolve
    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);
        const owners = snapshot(engine.context);

        expect(state.presentation?.url).toBe('http://example.com/playlist-a.m3u8');
        expect(state.presentation?.id).toBeDefined();
        expect(state.selectedVideoTrackId).toBeDefined();
        expect(state.selectedAudioTrackId).toBeDefined();
        // readyState isn't asserted: with appendSegment mocked the stream completes
        // instantly, so the MediaSource doesn't durably sit in 'open' (a created buffer
        // actor implies addSourceBuffer ran, which requires an open MediaSource).
        expect(owners.videoBufferActor).toBeDefined();
        expect(owners.audioBufferActor).toBeDefined();
      },
      { timeout: 5000 }
    );

    // Capture source A's identities for post-switch comparison
    const sourceA = snapshot(engine.context);
    const sourceAMediaSource = sourceA.mediaSource;
    const sourceAVideoBufferActor = sourceA.videoBufferActor;
    const sourceAAudioBufferActor = sourceA.audioBufferActor;

    // In-place replacement: overwrite state.presentation with B's unresolved
    // {url}. resolvePresentation's FSM should route through 'resolving' again;
    // downstream behaviors tear down via state-exit and rebuild for source B.
    engine.state.presentation.set({ url: 'http://example.com/playlist-b.m3u8' });

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);
        const owners = snapshot(engine.context);

        // Source B is resolved
        expect(state.presentation?.url).toBe('http://example.com/playlist-b.m3u8');
        expect(state.presentation?.id).toBeDefined();
        expect(state.presentation?.selectionSets).toBeDefined();

        // Tracks re-selected for source B
        expect(state.selectedVideoTrackId).toBeDefined();
        expect(state.selectedAudioTrackId).toBeDefined();

        // Fresh MediaSource + buffer actors (different instances from A)
        // readyState isn't asserted: with appendSegment mocked the stream completes
        // instantly, so the MediaSource doesn't durably sit in 'open' (a created buffer
        // actor implies addSourceBuffer ran, which requires an open MediaSource).
        expect(owners.mediaSource).toBeDefined();
        expect(owners.videoBufferActor).toBeDefined();
        expect(owners.audioBufferActor).toBeDefined();
        expect(owners.mediaSource).not.toBe(sourceAMediaSource);
        expect(owners.videoBufferActor).not.toBe(sourceAVideoBufferActor);
        expect(owners.audioBufferActor).not.toBe(sourceAAudioBufferActor);
      },
      { timeout: 5000 }
    );

    engine.destroy();
  });

  it('handles video-only stream (no audio tracks)', async () => {
    // Mock fetch for video-only stream
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);
        const owners = snapshot(engine.context);

        // Should create video track and buffer
        expect(state.selectedVideoTrackId).toBeDefined();
        expect(owners.videoBufferActor).toBeDefined();

        // Should NOT create audio track or buffer
        expect(state.selectedAudioTrackId).toBeUndefined();
        expect(owners.audioBufferActor).toBeUndefined();

        // MediaSource should still be created
        expect(owners.mediaSource).toBeDefined();
        // readyState isn't asserted: with appendSegment mocked the stream completes
        // instantly, so the MediaSource doesn't durably sit in 'open' (a created buffer
        // actor implies addSourceBuffer ran, which requires an open MediaSource).
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('handles audio-only stream (no video tracks)', async () => {
    // Mock fetch for audio-only stream
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",LANGUAGE="en",CHANNELS="2",URI="http://example.com/audio-en.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2",AUDIO="audio"
http://example.com/audio-en.m3u8`)
        );
      }

      if (url.includes('audio-en.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-audio.mp4"
#EXTINF:10.0,
http://example.com/audio-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);
        const owners = snapshot(engine.context);

        // Should create audio track and buffer
        expect(state.selectedAudioTrackId).toBeDefined();
        expect(owners.audioBufferActor).toBeDefined();

        // Should NOT create video track or buffer
        expect(state.selectedVideoTrackId).toBeUndefined();
        expect(owners.videoBufferActor).toBeUndefined();

        // MediaSource should still be created
        expect(owners.mediaSource).toBeDefined();
        // readyState isn't asserted: with appendSegment mocked the stream completes
        // instantly, so the MediaSource doesn't durably sit in 'open' (a created buffer
        // actor implies addSourceBuffer ran, which requires an open MediaSource).
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('does not auto-select text tracks (user opt-in)', async () => {
    // Mock fetch for stream with text tracks
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",URI="http://example.com/text-en.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",SUBTITLES="subs",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);

        // Should have resolved presentation with text tracks
        expect(state.presentation?.selectionSets).toBeDefined();
        const textSet = state.presentation?.selectionSets?.find((s: any) => s.type === 'text');

        expect(textSet).toBeDefined();

        // Should NOT auto-select text track (user opt-in)
        expect(state.selectedTextTrackId).toBeUndefined();
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('resolves presentation and tracks but not MediaSource without mediaElement', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();

    // Patch state but NOT owners (no mediaElement)
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    // Wait for presentation and track resolution
    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);

        expect(state.presentation?.selectionSets).toBeDefined();
        expect(state.selectedVideoTrackId).toBeDefined();

        // Track should be resolved
        const videoTrack = state.presentation?.selectionSets
          ?.find((s: any) => s.type === 'video')
          ?.switchingSets?.[0]?.tracks?.find((t: any) => t.id === state.selectedVideoTrackId);

        expect(videoTrack?.segments).toBeDefined();
      },
      { timeout: 2000 }
    );

    // Give time for MediaSource setup (which shouldn't happen)
    await new Promise((resolve) => setTimeout(resolve, 100));

    const owners = snapshot(engine.context);

    // Should NOT create MediaSource or SourceBuffers without mediaElement
    expect(owners.mediaElement).toBeUndefined();
    expect(owners.mediaSource).toBeUndefined();
    expect(owners.videoBufferActor).toBeUndefined();

    engine.destroy();
  });

  it('defers resolution with preload: "none" until play event', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",LANGUAGE="en",CHANNELS="2",URI="http://example.com/audio-en.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E,mp4a.40.2",AUDIO="audio",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('audio-en.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-audio.mp4"
#EXTINF:10.0,
http://example.com/audio-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'none';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });

    // PHASE 1: Verify nothing auto-resolves
    await new Promise((resolve) => setTimeout(resolve, 200));

    let state = snapshot(engine.state);

    expect(state.presentation?.selectionSets).toBeUndefined();
    expect(mockFetch).not.toHaveBeenCalled();

    // PHASE 2: Simulate play — reflect real browser behavior where paused becomes
    // false before the play event fires (per WHATWG §4.8.11.8), then dispatch.
    Object.defineProperty(mediaElement, 'paused', { get: () => false, configurable: true });
    mediaElement.dispatchEvent(new Event('play'));

    // Wait for complete orchestration
    await vi.waitFor(
      () => {
        state = snapshot(engine.state);
        const owners = snapshot(engine.context);

        // Now everything should be resolved and created
        expect(state.presentation?.selectionSets).toBeDefined();
        expect(state.selectedVideoTrackId).toBeDefined();
        expect(state.selectedAudioTrackId).toBeDefined();

        expect(owners.mediaSource).toBeDefined();
        // readyState isn't asserted: with appendSegment mocked the stream completes
        // instantly, so the MediaSource doesn't durably sit in 'open' (a created buffer
        // actor implies addSourceBuffer ran, which requires an open MediaSource).
        expect(owners.videoBufferActor).toBeDefined();
        expect(owners.audioBufferActor).toBeDefined();
      },
      { timeout: 2000 }
    );

    // Fetch should have been called for multivariant + 2 media playlists
    expect(mockFetch).toHaveBeenCalled();

    engine.destroy();
  });

  it('resolves presentation and tracks with preload: "metadata"', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init.mp4"
#EXTINF:10.0,
http://example.com/seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('init.mp4')) {
        return Promise.resolve(new Response(new ArrayBuffer(100)));
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'metadata';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('metadata');

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);

        // Should resolve presentation and select/resolve track
        expect(state.presentation?.selectionSets).toBeDefined();
        expect(state.selectedVideoTrackId).toBeDefined();

        const videoTrack = state.presentation?.selectionSets
          ?.find((s: any) => s.type === 'video')
          ?.switchingSets?.[0]?.tracks?.find((t: any) => t.id === state.selectedVideoTrackId);

        expect(videoTrack?.segments).toBeDefined();

        // Init segment should be loaded (advances readyState to HAVE_METADATA)
        expect(engine.context.videoBufferActor.get()?.snapshot.get().context.initTrackId).toBeDefined();
      },
      { timeout: 2000 }
    );

    // Fetches: multivariant + media playlist + init segment
    // Media segments NOT fetched — preload="metadata" stops at init
    expect(mockFetch).toHaveBeenCalledTimes(3);
    const fetchedUrls = mockFetch.mock.calls.map((c: any[]) => {
      const input = c[0] as RequestInfo | URL;

      return typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    });

    expect(fetchedUrls).not.toContain('http://example.com/seg1.m4s');

    engine.destroy();
  });

  it('resolves only selected track (not all qualities)', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-STREAM-INF:BANDWIDTH=500000,CODECS="avc1.42E01E",RESOLUTION=640x360
http://example.com/video-360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2000000,CODECS="avc1.42E01E",RESOLUTION=1280x720
http://example.com/video-720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=4000000,CODECS="avc1.42E01E",RESOLUTION=1920x1080
http://example.com/video-1080p.m3u8`)
        );
      }

      // Return media playlist for whichever quality is requested
      if (url.includes('video-360p.m3u8') || url.includes('video-720p.m3u8') || url.includes('video-1080p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init.mp4"
#EXTINF:10.0,
http://example.com/seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    // Use a conservative initialBandwidth so switchVideoQuality also selects 360p and
    // doesn't immediately upgrade — verifying only the selected track is resolved.
    const engine = createHlsVideoEngine({ initialBandwidth: 600_000 });
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);

        expect(state.selectedVideoTrackId).toBeDefined();

        // Selected track should be resolved
        const selectedTrack = state.presentation?.selectionSets
          ?.find((s: any) => s.type === 'video')
          ?.switchingSets?.[0]?.tracks?.find((t: any) => t.id === state.selectedVideoTrackId);

        expect(selectedTrack?.segments).toBeDefined();
      },
      { timeout: 2000 }
    );

    const state = snapshot(engine.state);
    const allVideoTracks = state.presentation?.selectionSets?.find((s: any) => s.type === 'video')?.switchingSets?.[0]
      ?.tracks;

    // Should have 3 tracks total
    expect(allVideoTracks?.length).toBe(3);

    // Only ONE track should be resolved (has segments)
    const resolvedTracks = allVideoTracks?.filter((t: any) => t.segments);

    expect(resolvedTracks?.length).toBe(1);

    // The resolved track should be the selected one
    expect(resolvedTracks?.[0]?.id).toBe(state.selectedVideoTrackId);

    // The non-selected qualities are never resolved — only the selected track's
    // media playlist is fetched. Asserts the intent directly rather than a brittle
    // total fetch count (which shifts with init/segment loading of the selected track).
    const fetchedUrls = mockFetch.mock.calls.map((call: unknown[]) => {
      const input = call[0] as RequestInfo | URL;

      return typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    });

    expect(fetchedUrls.some((u: string) => u.includes('video-720p.m3u8'))).toBe(false);
    expect(fetchedUrls.some((u: string) => u.includes('video-1080p.m3u8'))).toBe(false);

    engine.destroy();
  });

  it('auto-selects DEFAULT text track when enableDefaultTrack is true', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",URI="http://example.com/text-en.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Spanish",LANGUAGE="es",URI="http://example.com/text-es.m3u8",DEFAULT=YES,AUTOSELECT=YES
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",SUBTITLES="subs",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      // Text track playlists (VTT segments)
      if (url.includes('text-es.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
http://example.com/text-es-seg1.vtt
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine({
      enableDefaultTrack: true,
    });
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    // Wait for DEFAULT text track to be auto-selected and resolved
    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);

        expect(state.presentation?.selectionSets).toBeDefined();

        // Should auto-select text track with DEFAULT=YES + AUTOSELECT=YES
        expect(state.selectedTextTrackId).toBeDefined();

        const textSet = state.presentation?.selectionSets?.find((s: any) => s.type === 'text');
        const selectedTrack = textSet?.switchingSets?.[0]?.tracks?.find((t: any) => t.id === state.selectedTextTrackId);

        expect(selectedTrack?.language).toBe('es'); // Spanish is marked DEFAULT
        expect(selectedTrack?.segments).toBeDefined(); // Track resolved
        expect(selectedTrack?.segments?.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('auto-selects preferred subtitle language', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",URI="http://example.com/text-en.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Spanish",LANGUAGE="es",URI="http://example.com/text-es.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="French",LANGUAGE="fr",URI="http://example.com/text-fr.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",SUBTITLES="subs",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      // Text track playlists (VTT segments)
      if (url.includes('text-fr.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
http://example.com/text-fr-seg1.vtt
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine({
      preferredSubtitleLanguage: 'fr',
    });
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    // Wait for preferred language text track to be auto-selected and resolved
    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);

        expect(state.presentation?.selectionSets).toBeDefined();

        expect(state.selectedTextTrackId).toBeDefined();

        const textSet = state.presentation?.selectionSets?.find((s: any) => s.type === 'text');
        const selectedTrack = textSet?.switchingSets?.[0]?.tracks?.find((t: any) => t.id === state.selectedTextTrackId);

        expect(selectedTrack?.language).toBe('fr'); // French preferred
        expect(selectedTrack?.segments).toBeDefined(); // Track resolved
        expect(selectedTrack?.segments?.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('switches between text tracks via patch()', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",URI="http://example.com/text-en.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Spanish",LANGUAGE="es",URI="http://example.com/text-es.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",SUBTITLES="subs",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      // Text track playlists (VTT segments)
      if (url.includes('text-en.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
http://example.com/text-en-seg1.vtt
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('text-es.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
http://example.com/text-es-seg1.vtt
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    // Wait for presentation to be resolved
    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);

        expect(state.presentation?.selectionSets).toBeDefined();
      },
      { timeout: 2000 }
    );

    const textSet = engine.state.presentation.get()?.selectionSets?.find((s: any) => s.type === 'text');
    const textTracks = textSet?.switchingSets?.[0]?.tracks;

    const englishTrack = textTracks?.find((t: any) => t.language === 'en');
    const spanishTrack = textTracks?.find((t: any) => t.language === 'es');

    // Select English track
    engine.state.selectedTextTrackId.set(englishTrack!.id);

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);

        expect(state.selectedTextTrackId).toBe(englishTrack!.id);

        const resolvedTrack = state.presentation?.selectionSets
          ?.find((s: any) => s.type === 'text')
          ?.switchingSets?.[0]?.tracks?.find((t: any) => t.id === englishTrack!.id);

        expect(resolvedTrack?.segments).toBeDefined();
        expect(resolvedTrack?.segments?.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    // Switch to Spanish track
    engine.state.selectedTextTrackId.set(spanishTrack!.id);

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);

        expect(state.selectedTextTrackId).toBe(spanishTrack!.id);

        const resolvedTrack = state.presentation?.selectionSets
          ?.find((s: any) => s.type === 'text')
          ?.switchingSets?.[0]?.tracks?.find((t: any) => t.id === spanishTrack!.id);

        expect(resolvedTrack?.segments).toBeDefined();
        expect(resolvedTrack?.segments?.length).toBeGreaterThan(0);
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('creates track elements for all text tracks', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",URI="http://example.com/text-en.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Spanish",LANGUAGE="es",URI="http://example.com/text-es.m3u8",DEFAULT=YES,AUTOSELECT=YES
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="French",LANGUAGE="fr",URI="http://example.com/text-fr.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",SUBTITLES="subs",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    // Wait for text tracks to be set up
    await vi.waitFor(
      () => {
        // Track elements should be in DOM (count <track> specifically — the
        // MSE attach contributes a <source> child).
        expect(mediaElement.querySelectorAll('track')).toHaveLength(3);

        // Verify track elements
        const tracks = Array.from(mediaElement.querySelectorAll('track'));

        // English track
        expect(tracks[0]!.kind).toBe('subtitles');
        expect(tracks[0]!.label).toBe('English');
        expect(tracks[0]!.srclang).toBe('en');
        expect(tracks[0]!.default).toBe(false);

        // Spanish track (DEFAULT=YES in the manifest) — the `default` attribute
        // is deliberately NOT propagated to the <track> element (it would make the
        // browser auto-activate it, bypassing SPF's opt-in selection policy).
        expect(tracks[1]!.kind).toBe('subtitles');
        expect(tracks[1]!.label).toBe('Spanish');
        expect(tracks[1]!.srclang).toBe('es');
        expect(tracks[1]!.default).toBe(false);

        // French track
        expect(tracks[2]!.kind).toBe('subtitles');
        expect(tracks[2]!.label).toBe('French');
        expect(tracks[2]!.srclang).toBe('fr');
        expect(tracks[2]!.default).toBe(false);
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('syncs text track modes with selection', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",URI="http://example.com/text-en.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="Spanish",LANGUAGE="es",URI="http://example.com/text-es.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",SUBTITLES="subs",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('text-en.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
http://example.com/text-en-seg1.vtt
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('text-es.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
http://example.com/text-es-seg1.vtt
#EXT-X-ENDLIST`)
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    // Wait for text tracks to be set up (count <track> specifically — the
    // MSE attach contributes a <source> child).
    await vi.waitFor(
      () => {
        expect(mediaElement.querySelectorAll('track')).toHaveLength(2);
      },
      { timeout: 2000 }
    );

    const tracks = Array.from(mediaElement.querySelectorAll('track'));
    const englishTrack = tracks.find((el) => el.srclang === 'en')!;
    const spanishTrack = tracks.find((el) => el.srclang === 'es')!;

    expect(englishTrack).toBeDefined();
    expect(spanishTrack).toBeDefined();

    // Initially all tracks should be disabled (no selection)
    expect(englishTrack.track.mode).toBe('disabled');
    expect(spanishTrack.track.mode).toBe('disabled');

    // Select English track
    engine.state.selectedTextTrackId.set(englishTrack.id);

    await vi.waitFor(
      () => {
        expect(englishTrack.track.mode).toBe('showing');
        expect(spanishTrack.track.mode).toBe('disabled');
      },
      { timeout: 2000 }
    );

    // Switch to Spanish track
    engine.state.selectedTextTrackId.set(spanishTrack.id);

    await vi.waitFor(
      () => {
        expect(englishTrack.track.mode).toBe('disabled');
        expect(spanishTrack.track.mode).toBe('showing');
      },
      { timeout: 2000 }
    );

    // Deselect (disable all)
    engine.state.selectedTextTrackId.set(undefined);

    await vi.waitFor(
      () => {
        expect(englishTrack.track.mode).toBe('disabled');
        expect(spanishTrack.track.mode).toBe('disabled');
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('tracks buffer state separately for video and audio', async () => {
    let releaseMediaAppends!: () => void;
    const mediaAppends = new Promise<void>((resolve) => {
      releaseMediaAppends = resolve;
    });

    // Init appends must finish so both actors can reach their streaming media
    // appends. Hold those to keep partial associations observable.
    vi.mocked(appendSegment).mockImplementation(async (_buffer, _data, signal) => {
      if (signal) await mediaAppends;
    });

    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E,mp4a.40.2",AUDIO="audio"
http://example.com/video.m3u8
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",URI="http://example.com/audio.m3u8"`)
        );
      }

      if (url.includes('video.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('audio.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MAP:URI="http://example.com/init-audio.mp4"
#EXTINF:10.0,
http://example.com/audio-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('.mp4') || url.includes('.m4s')) {
        return Promise.resolve(new Response(new ArrayBuffer(1000)));
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    try {
      mediaElement.preload = 'auto';

      engine.context.mediaElement.set(mediaElement);
      engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
      engine.state.preload.set('auto');

      await vi.waitFor(() => {
        expect(engine.context.videoBufferActor.get()?.snapshot.get().context.segments[0]?.partial).toBe(true);
        expect(engine.context.audioBufferActor.get()?.snapshot.get().context.segments[0]?.partial).toBe(true);
      });

      const videoTrackId = engine.state.selectedVideoTrackId.get();
      const audioTrackId = engine.state.selectedAudioTrackId.get();

      expect(videoTrackId).toBeDefined();
      expect(audioTrackId).toBeDefined();
      expect(videoTrackId).not.toBe(audioTrackId);
      expect(engine.context.videoBufferActor.get()?.snapshot.get().context.segments[0]?.trackId).toBe(videoTrackId);
      expect(engine.context.audioBufferActor.get()?.snapshot.get().context.segments[0]?.trackId).toBe(audioTrackId);

      releaseMediaAppends();

      await vi.waitFor(
        () => {
          // Each actor records only the resolved track selected for its own type.
          const videoActor = engine.context.videoBufferActor.get();
          const audioActor = engine.context.audioBufferActor.get();

          expect(videoActor).toBeDefined();
          expect(audioActor).toBeDefined();
          expect(videoActor).not.toBe(audioActor);

          const videoCtx = videoActor?.snapshot.get().context;
          const audioCtx = audioActor?.snapshot.get().context;

          expect(videoCtx?.initTrackId).toBe(videoTrackId);
          expect(audioCtx?.initTrackId).toBe(audioTrackId);
          expect(videoCtx?.segments?.length).toBeGreaterThan(0);
          expect(audioCtx?.segments?.length).toBeGreaterThan(0);

          for (const [context, trackId] of [
            [videoCtx, videoTrackId],
            [audioCtx, audioTrackId],
          ] as const) {
            for (const segment of context!.segments!) {
              expect(segment.id).toEqual(expect.any(String));
              expect(segment.trackId).toBe(trackId);
              expect(segment.partial).not.toBe(true);
            }
          }
        },
        { timeout: 3000 }
      );
    } finally {
      releaseMediaAppends();
      await engine.destroy();
      vi.mocked(appendSegment).mockResolvedValue(undefined);
    }
  });

  it('projects Apple JSON chapters from EXT-X-SESSION-DATA into a hidden chapters track', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-SESSION-DATA:DATA-ID="com.apple.hls.chapters",FORMAT=JSON,URI="http://example.com/chapters.json"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
        );
      }

      if (url.includes('video-360p.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="http://example.com/init-video.mp4"
#EXTINF:10.0,
http://example.com/video-seg1.m4s
#EXT-X-ENDLIST`)
        );
      }

      if (url.includes('chapters.json')) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              { 'start-time': 0, titles: [{ language: 'und', title: 'Intro' }] },
              { 'start-time': 4, titles: [{ language: 'und', title: 'Outro' }] },
            ])
          )
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsVideoEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    const chaptersTrack = () => mediaElement.querySelector<HTMLTrackElement>('track[kind="chapters"]');

    await vi.waitFor(
      () => {
        expect(chaptersTrack()?.track.mode).toBe('hidden');
        expect(chaptersTrack()?.track.cues?.length).toBe(2);
      },
      { timeout: 3000 }
    );

    // SAFETY: `loadChapters` adds `VTTCue`s only.
    const cues = Array.from(chaptersTrack()!.track.cues!) as VTTCue[];

    // The open last chapter ends at the largest safe integer; readers clamp.
    expect(cues.map((cue) => [cue.startTime, cue.endTime, cue.text])).toEqual([
      [0, 4, 'Intro'],
      [4, Number.MAX_SAFE_INTEGER, 'Outro'],
    ]);
    // The chapters track's mode changes never registered as subtitle intent.
    expect(engine.state.userTextTrackSelection.get()).toBeUndefined();

    await engine.destroy();

    expect(chaptersTrack()).toBeNull();
  });
});
