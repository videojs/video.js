import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { snapshot } from '../../../../core/signals/primitives';
import type { Presentation } from '../../../../media/types';
import { createHlsAudioEngine } from '../engine-audio-only';

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

describe('createHlsAudioEngine', () => {
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
    originalFetch = globalThis.fetch;

    const originalConsoleError = console.error.bind(console);

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
      const text = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
      if (expectedErrorPatterns.some((p) => p.test(text))) return;

      originalConsoleError(...args);
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    consoleErrorSpy.mockRestore();
  });

  it('exposes userAudioTrackSelection slot for multi-language-audio Tier 2 writes', async () => {
    const engine = createHlsAudioEngine();
    const tracks = ['en', 'es'].map((language) => ({
      type: 'audio' as const,
      id: language,
      language,
      name: language,
      groupId: 'audio',
      default: language === 'en',
      url: `https://example.com/${language}.m3u8`,
      mimeType: 'audio/mp4',
      codecs: ['mp4a.40.2'],
      bandwidth: 128_000,
      sampleRate: 48_000,
      channels: 2,
      startTime: 0,
      duration: 60,
      initialization: { url: 'https://example.com/init.mp4' },
      segments: [],
    }));

    try {
      engine.state.presentation.set({
        id: 'presentation',
        url: 'https://example.com/master.m3u8',
        startTime: 0,
        selectionSets: [{ id: 'audio', type: 'audio', switchingSets: [{ id: 'audio', type: 'audio', tracks }] }],
      });
      await vi.waitFor(() => expect(engine.state.selectedAudioTrackId.get()).toBe('en'));

      engine.state.userAudioTrackSelection.set({ language: 'es' });
      await vi.waitFor(() => expect(engine.state.selectedAudioTrackId.get()).toBe('es'));
    } finally {
      await engine.destroy();
    }
  });

  it('wires the default canPlayTrack — prunes an undecodable (raw-AAC) audio source, making no pick', async () => {
    const flush = () => Promise.resolve().then(() => Promise.resolve());
    // No canPlayTrack override → relies on the engine's default. A raw-AAC
    // (audio/aac) rendition is asserted unplayable, so it should be pruned
    // rather than selected. (If the default weren't wired, the constraint would
    // pass through and select it.)
    const engine = createHlsAudioEngine();

    engine.state.presentation.set({
      id: 'pres-aac',
      url: 'https://example.com/master.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'a',
          type: 'audio',
          switchingSets: [
            {
              id: 'as',
              type: 'audio',
              tracks: [
                {
                  type: 'audio',
                  id: 'aud-aac',
                  codecs: ['mp4a.40.2'],
                  url: 'https://example.com/aud.m3u8',
                  bandwidth: 128_000,
                  mimeType: 'audio/aac',
                  groupId: 'audio',
                  name: 'Default',
                  sampleRate: 48_000,
                  channels: 2,
                },
              ],
            },
          ],
        },
      ],
    } as Presentation);
    await flush();

    expect(engine.state.selectedAudioTrackId.get()).toBeUndefined();

    engine.destroy();
  });

  it('plays truly audio-only HLS source (parity with default-engine tolerance)', async () => {
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

    const engine = createHlsAudioEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);
        const owners = snapshot(engine.context);

        expect(state.selectedAudioTrackId).toBeDefined();
        expect(owners.audioBufferActor).toBeDefined();
        expect(owners.mediaSource).toBeDefined();
        // readyState isn't asserted: with appendSegment mocked the stream completes
        // instantly, so the MediaSource doesn't durably sit in 'open' (a created buffer
        // actor implies addSourceBuffer ran, which requires an open MediaSource).
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('plays mixed HLS source as audio-only (video tracks ignored)', async () => {
    // Mixed AV manifest: audio rendition + video stream-inf. The variant
    // should compose audio behaviors only — no video selection, no video
    // buffer actor, no video segment loading.
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

      // Video playlist is NOT expected to be fetched — fail loudly if it is.
      if (url.includes('video-360p.m3u8')) {
        throw new Error('Audio-only variant fetched the video media playlist');
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsAudioEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state) as Record<string, unknown>;
        const owners = snapshot(engine.context) as Record<string, unknown>;

        // Audio-side fully exercised
        expect(state.selectedAudioTrackId).toBeDefined();
        expect(owners.audioBufferActor).toBeDefined();
        expect(owners.mediaSource).toBeDefined();
        // readyState isn't asserted: with appendSegment mocked the stream completes
        // instantly, so the MediaSource doesn't durably sit in 'open' (a created buffer
        // actor implies addSourceBuffer ran, which requires an open MediaSource).

        // Video-side slots absent — no composed behavior in this variant
        // declares them. Behaviors that read these slots defensively
        // (`endOfStream` for videoBufferActor; `calculatePresentationDuration`
        // for selectedVideoTrackId) treat them as optional context/state
        // fields and don't leak the slot into the composition. Asserting
        // absence catches regressions where a behavior re-introduces a
        // video-side declaration.
        expect('videoBufferActor' in owners).toBe(false);
        expect('videoSegmentLoaderActor' in owners).toBe(false);
        expect('selectedVideoTrackId' in state).toBe(false);
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('plays mixed HLS source with subtitles ignored', async () => {
    // Mixed AV manifest with a subtitle rendition. Subtitle behaviors are
    // subtracted in Phase 1, so no text-track machinery should be set up.
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",LANGUAGE="en",CHANNELS="2",URI="http://example.com/audio-en.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",DEFAULT=YES,AUTOSELECT=YES,URI="http://example.com/text-en.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E,mp4a.40.2",AUDIO="audio",SUBTITLES="subs",RESOLUTION=640x360
http://example.com/video-360p.m3u8`)
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

      if (url.includes('text-en.m3u8') || url.includes('video-360p.m3u8')) {
        throw new Error(`Audio-only variant fetched a non-audio playlist: ${url}`);
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsAudioEngine();
    const mediaElement = document.createElement('video');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state) as Record<string, unknown>;
        const owners = snapshot(engine.context) as Record<string, unknown>;

        expect(state.selectedAudioTrackId).toBeDefined();
        expect(owners.audioBufferActor).toBeDefined();

        // Text-track slots absent — Phase 1 subtracts all text-track
        // behaviors, and no remaining behavior declares the slots.
        expect('selectedTextTrackId' in state).toBe(false);
        expect('textTracksActor' in owners).toBe(false);
        expect('textTrackSegmentLoaderActor' in owners).toBe(false);
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('cleanly replaces source in place via state.presentation overwrite', async () => {
    // Parity with the default engine's in-place replacement test. The audio-only
    // adapter's `src` setter overwrites `state.presentation` on the *same*
    // engine rather than rebuilding one, so this routing is what makes a source
    // change work at all: `resolvePresentation` re-enters 'resolving', and
    // downstream behaviors tear down A's actors via reactor state-exit and
    // rebuild fresh ones for B.
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist-a.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",LANGUAGE="en",CHANNELS="2",URI="http://example.com/audio-a.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2",AUDIO="audio"
http://example.com/audio-a.m3u8`)
        );
      }

      if (url.includes('playlist-b.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="English",LANGUAGE="en",CHANNELS="2",URI="http://example.com/audio-b.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=128000,CODECS="mp4a.40.2",AUDIO="audio"
http://example.com/audio-b.m3u8`)
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

    const engine = createHlsAudioEngine();
    const mediaElement = document.createElement('audio');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist-a.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);
        const owners = snapshot(engine.context);

        expect(state.presentation?.url).toBe('http://example.com/playlist-a.m3u8');
        expect(state.presentation?.id).toBeDefined();
        expect(state.selectedAudioTrackId).toBeDefined();
        expect(owners.audioBufferActor).toBeDefined();
      },
      { timeout: 5000 }
    );

    const sourceA = snapshot(engine.context);
    const sourceAMediaSource = sourceA.mediaSource;
    const sourceAAudioBufferActor = sourceA.audioBufferActor;

    engine.state.presentation.set({ url: 'http://example.com/playlist-b.m3u8' });

    await vi.waitFor(
      () => {
        const state = snapshot(engine.state);
        const owners = snapshot(engine.context);

        expect(state.presentation?.url).toBe('http://example.com/playlist-b.m3u8');
        expect(state.presentation?.id).toBeDefined();
        expect(state.presentation?.selectionSets).toBeDefined();
        expect(state.selectedAudioTrackId).toBeDefined();

        // Replacement must create resources before comparing their identities.
        expect(owners.mediaSource).toBeDefined();
        expect(owners.audioBufferActor).toBeDefined();
        expect(owners.mediaSource).not.toBe(sourceAMediaSource);
        expect(owners.audioBufferActor).not.toBe(sourceAAudioBufferActor);
      },
      { timeout: 5000 }
    );

    engine.destroy();
  });

  // ---------------------------------------------------------------------------
  // AirPlay / MSE-recovery composition
  //
  // `setupAirPlay` itself is a no-op here — these tests run in Chromium, where
  // `isWebKitAirPlayCapable` is false, so the behavior never leaves
  // `'preconditions-unmet'`. What's asserted is the *wiring* the audio-only
  // composition has to provide for the WebKit path to work at all: the
  // AirPlay-compatible attach shape, the state slots, and the cross-behavior
  // edges. `setupAirPlay`'s own session logic is covered in
  // `behaviors/dom/tests/airplay.test.ts` against a faked WebKit element.
  // ---------------------------------------------------------------------------

  function mockAudioOnlyManifest(onFetch?: (url: string) => void) {
    return vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      onFetch?.(url);

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
  }

  it('attaches the MediaSource as a <source> child, not on the src attribute', async () => {
    // The engine bakes `attachMediaSourceAsSourceElement`, because
    // `setupAirPlay`'s native-HLS fallback `<source>` is only reachable by
    // resource selection when the MSE attachment is a sibling `<source>` too.
    // An `src`-attribute attach would commit the element to the MSE resource
    // and make the fallback inert — silently disabling AirPlay.
    globalThis.fetch = mockAudioOnlyManifest();

    const engine = createHlsAudioEngine();
    const mediaElement = document.createElement('audio');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        expect(snapshot(engine.context).mediaSource).toBeDefined();
      },
      { timeout: 2000 }
    );

    const sourceEl = mediaElement.querySelector('source');

    expect(sourceEl).not.toBeNull();
    expect(sourceEl!.src.startsWith('blob:')).toBe(true);
    expect(mediaElement.getAttribute('src')).toBeNull();

    engine.destroy();
  });

  it('materializes the startPosition / loadingSuspended / disableRemotePlayback slots', () => {
    const engine = createHlsAudioEngine();
    const state = snapshot(engine.state) as Record<string, unknown>;

    // `startPosition` + `loadingSuspended` come from setupAirPlay /
    // applyStartPosition declaring them; `disableRemotePlayback` is a
    // consumer input declared with makeExternalInputs.
    expect('startPosition' in state).toBe(true);
    expect('loadingSuspended' in state).toBe(true);
    expect('disableRemotePlayback' in state).toBe(true);

    // Unwritten slots must start neutral — absence of a value means
    // "no pending start position", "not suspended", "not opted out".
    expect(state.startPosition).toBeUndefined();
    expect(state.loadingSuspended).toBeUndefined();
    expect(state.disableRemotePlayback).toBeUndefined();

    engine.destroy();
  });

  it('composes applyStartPosition — a startPosition command seeds the load window', async () => {
    globalThis.fetch = mockAudioOnlyManifest();

    const engine = createHlsAudioEngine();
    const mediaElement = document.createElement('audio');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    await vi.waitFor(
      () => {
        expect(engine.state.selectedAudioTrackId.get()).toBeDefined();
      },
      { timeout: 2000 }
    );

    engine.state.startPosition.set(5);

    // Step 1 of applyStartPosition — the loaders' first fetches anchor here.
    // Step 2 (the element seek + command consume) waits on HAVE_METADATA,
    // which never arrives with `appendSegment` mocked, so it isn't asserted.
    await vi.waitFor(
      () => {
        expect(engine.state.currentTime.get()).toBe(5);
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('observes loadingSuspended — a held suspension parks audio segment loading', async () => {
    // The observed-optional edge: `loadAudioSegments` never declares
    // `loadingSuspended`, so this only works because setupAirPlay declares it
    // in the same composition. Suspending before the presentation is set makes
    // the assertion deterministic — the dispatcher parks in `'dormant'` from
    // the start, so *no* segment fetch should ever be issued.
    const fetchedUrls: string[] = [];

    globalThis.fetch = mockAudioOnlyManifest((url) => fetchedUrls.push(url));

    const engine = createHlsAudioEngine();
    const mediaElement = document.createElement('audio');

    mediaElement.preload = 'auto';

    engine.state.loadingSuspended.set(true);
    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    // Manifest + media-playlist resolution is not segment loading — it still
    // runs, and proves the engine progressed far enough to have started
    // fetching segments had it not been suspended.
    await vi.waitFor(
      () => {
        expect(engine.state.selectedAudioTrackId.get()).toBeDefined();
      },
      { timeout: 2000 }
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(fetchedUrls).not.toContain('http://example.com/init-audio.mp4');
    expect(fetchedUrls).not.toContain('http://example.com/audio-seg1.m4s');

    // Releasing the suspension lets the same dispatcher proceed.
    engine.state.loadingSuspended.set(false);
    await vi.waitFor(
      () => {
        expect(fetchedUrls).toContain('http://example.com/init-audio.mp4');
      },
      { timeout: 2000 }
    );

    engine.destroy();
  });

  it('projects Apple JSON chapters onto an <audio> element', async () => {
    const mockFetch = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes('playlist.m3u8')) {
        return Promise.resolve(
          new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-SESSION-DATA:DATA-ID="com.apple.hls.chapters",FORMAT=JSON,URI="http://example.com/chapters.json"
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

      if (url.includes('chapters.json')) {
        return Promise.resolve(
          new Response(JSON.stringify([{ 'start-time': 0, titles: [{ language: 'und', title: 'Episode' }] }]))
        );
      }

      return unmockedFetchFallback(url);
    });

    globalThis.fetch = mockFetch;

    const engine = createHlsAudioEngine();
    const mediaElement = document.createElement('audio');

    mediaElement.preload = 'auto';

    engine.context.mediaElement.set(mediaElement);
    engine.state.presentation.set({ url: 'http://example.com/playlist.m3u8' });
    engine.state.preload.set('auto');

    const chaptersTrack = () => mediaElement.querySelector<HTMLTrackElement>('track[kind="chapters"]');

    await vi.waitFor(
      () => {
        expect(chaptersTrack()?.track.mode).toBe('hidden');
        expect(chaptersTrack()?.track.cues?.length).toBe(1);
      },
      { timeout: 3000 }
    );

    // SAFETY: `loadChapters` adds `VTTCue`s only.
    const [cue] = Array.from(chaptersTrack()!.track.cues!) as VTTCue[];

    expect([cue!.startTime, cue!.endTime, cue!.text]).toEqual([0, Number.MAX_SAFE_INTEGER, 'Episode']);

    engine.destroy();

    expect(chaptersTrack()).toBeNull();
  });
});
