/**
 * CreateBackgroundVideoEngine tests.
 *
 * The variant subtracts audio, text, ABR, and preload-monitoring behaviors from the HLS video engine, then seeds
 * `loadActivated: true` so the composition behaves as if preload has already been activated. These tests confirm the
 * seed, the absence of subtracted state slots, and the selection rule chain — its screen-size cap and its
 * configurability.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { snapshot } from '../../../../core/signals/primitives';
import { SVTA_NO_SUPPORTED_VIDEO_TRACK } from '../../../../media/errors';
import type { MaybeResolvedPresentation } from '../../../../media/types';
import { createEngine } from '../engine-background-video';

vi.mock('../../../../media/dom/mse/append-segment', () => ({
  appendSegment: vi.fn().mockResolvedValue(undefined),
}));

describe('createEngine', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads media segments without play or explicit preload activation', async () => {
    const fetchedUrls: string[] = [];

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      fetchedUrls.push(url);

      if (url.endsWith('/master.m3u8')) {
        return new Response(
          '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.42E01E",RESOLUTION=640x360\nvideo.m3u8'
        );
      }

      if (url.endsWith('/video.m3u8')) {
        return new Response(
          '#EXTM3U\n#EXT-X-VERSION:7\n#EXT-X-TARGETDURATION:10\n#EXT-X-MAP:URI="init.mp4"\n#EXTINF:10.0,\nsegment.m4s\n#EXT-X-ENDLIST'
        );
      }

      return new Response(new Uint8Array([0]));
    });

    const engine = createEngine();
    const mediaElement = document.createElement('video');

    try {
      engine.context.mediaElement.set(mediaElement);
      engine.state.presentation.set({ url: 'https://example.com/master.m3u8' });
      await vi.waitFor(() => expect(fetchedUrls).toContain('https://example.com/segment.m4s'));
    } finally {
      await engine.destroy();
    }
  });

  it('omits subtracted state slots — no audio/text/userVideoTrackSelection signals', () => {
    const engine = createEngine();
    const state = snapshot(engine.state) as Record<string, unknown>;

    // No audio-selection behavior declares this slot in the video-only composition.
    expect('selectedAudioTrackId' in state).toBe(false);

    // Text-track and userVideoTrackSelection signals must not exist —
    // no behavior in this composition declares them.
    expect('selectedTextTrackId' in state).toBe(false);
    expect('userVideoTrackSelection' in state).toBe(false);

    engine.destroy();
  });

  // Error reporting is deliberately *not* subtracted: nothing about an unplayable
  // source reaches the media element on its own, so without the sequence a
  // background video fails invisibly.
  describe('errors', () => {
    const unplayablePresentation = (): MaybeResolvedPresentation => ({
      id: 'p',
      url: 'https://example.com/v.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [
            {
              id: 'video-switching',
              type: 'video',
              tracks: [
                {
                  type: 'video',
                  id: '720p-ts',
                  url: 'https://example.com/720p.m3u8',
                  bandwidth: 2_000_000,
                  // Already relabeled, as `resolve-track` leaves the whole type
                  // once a media playlist resolves without an EXT-X-MAP.
                  mimeType: 'video/mp2t',
                  codecs: ['avc1.42E01E'],
                  width: 1280,
                  height: 720,
                },
              ],
            },
          ],
        },
      ],
    });

    // MPEG-TS: the capability constraint prunes it, so nothing is selected and the
    // emptied set reports 2011. The cause (1004) precedes it in the real flow, where
    // the track is picked and resolves first; this presentation starts pre-relabeled.
    it('makes no pick for an unplayable container', async () => {
      const engine = createEngine();

      engine.state.presentation.set(unplayablePresentation());
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(engine.state.selectedVideoTrackId.get()).toBeUndefined();
      expect(engine.state.errors.get()).toEqual([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      engine.destroy();
    });

    // CODECS is in the multivariant playlist, so an undecodable ladder is pruned
    // before anything is picked and nothing resolves to report a cause. The emptied
    // survivor set is the only thing left to report, which is why 2011 covers it.
    it('reports for a ladder the environment cannot decode', async () => {
      const engine = createEngine({ canPlayTrack: () => false });

      engine.state.presentation.set(undecodablePresentation());
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(engine.state.selectedVideoTrackId.get()).toBeUndefined();
      expect(engine.state.errors.get()).toEqual([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      engine.destroy();
    });

    // fMP4 throughout, so only the injected codec probe rejects it.
    const undecodablePresentation = (): MaybeResolvedPresentation => ({
      id: 'p',
      url: 'https://example.com/v.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [
            {
              id: 'video-switching',
              type: 'video',
              tracks: [
                {
                  type: 'video',
                  id: '720p-hevc',
                  url: 'https://example.com/720p.m3u8',
                  bandwidth: 2_000_000,
                  mimeType: 'video/mp4',
                  codecs: ['hvc1.1.6.L93.B0'],
                  width: 1280,
                  height: 720,
                },
                {
                  type: 'video',
                  id: '1080p-hevc',
                  url: 'https://example.com/1080p.m3u8',
                  bandwidth: 5_000_000,
                  mimeType: 'video/mp4',
                  codecs: ['hvc1.1.6.L120.B0'],
                  width: 1920,
                  height: 1080,
                },
              ],
            },
          ],
        },
      ],
    });

    // The one failure with no per-rendition cause behind it: nothing resolves, so
    // nothing reports. `reportAbsentTrackType` at the head of the constraint chain
    // is what covers it, composed because this engine is video-only.
    it('reports for a source with no video renditions at all', async () => {
      const engine = createEngine();

      engine.state.presentation.set(audioOnlyPresentation());
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(engine.state.errors.get()).toEqual([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      engine.destroy();
    });

    const audioOnlyPresentation = (): MaybeResolvedPresentation =>
      ({
        id: 'p',
        url: 'https://example.com/audio-only.m3u8',
        startTime: 0,
        selectionSets: [
          {
            id: 'audio-set',
            type: 'audio',
            switchingSets: [
              {
                id: 'audio-switching',
                type: 'audio',
                tracks: [
                  {
                    type: 'audio',
                    id: 'audio-1',
                    url: 'https://example.com/audio.m3u8',
                    bandwidth: 128_000,
                    mimeType: 'audio/mp4',
                    codecs: ['mp4a.40.2'],
                    groupId: 'g',
                    name: 'English',
                    sampleRate: 48_000,
                    channels: 2,
                  },
                ],
              },
            ],
          },
        ],
      }) as never;

    it('reports the absent type once, not on every presentation write', async () => {
      // The constraint chain runs inside a `computed` that re-derives on every
      // write, and the sequence keeps duplicates, so the guard is load-bearing.
      const engine = createEngine();

      engine.state.presentation.set(audioOnlyPresentation());
      await new Promise((resolve) => setTimeout(resolve, 0));
      engine.state.presentation.set(audioOnlyPresentation());
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(engine.state.errors.get()).toHaveLength(1);
      engine.destroy();
    });

    it('clears the sequence on src unload so the next source starts clean', async () => {
      const engine = createEngine();

      engine.state.presentation.set(audioOnlyPresentation());
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(engine.state.errors.get()).toHaveLength(1);

      engine.state.presentation.set(undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(engine.state.errors.get()).toBeUndefined();
      engine.destroy();
    });
  });

  it('omits subtracted context slots — no audio segment loader / text actors', () => {
    const engine = createEngine();
    const context = snapshot(engine.context) as Record<string, unknown>;

    // EOS reads optional audio context without declaring an audio buffer slot.
    expect('audioBufferActor' in context).toBe(false);

    // The audio segment loader and both text-track actors aren't declared
    // by any behavior left in the composition — their signals don't exist.
    expect('audioSegmentLoaderActor' in context).toBe(false);
    expect('textTracksActor' in context).toBe(false);
    expect('textTrackSegmentLoaderActor' in context).toBe(false);

    engine.destroy();
  });

  // The screen is written explicitly in both tests below rather than left to
  // whatever the test runner's screen happens to be: the default chain caps to it,
  // so an ambient reading would make the expected pick machine-dependent.
  it('defaults the rule chain to the largest rendition that fits the screen', async () => {
    const engine = createEngine();

    // Roomy enough that the cap admits both, leaving the ranker to decide.
    engine.state.screenResolution.set({ width: 3840, height: 2160 });

    const presentation: MaybeResolvedPresentation = {
      id: 'p',
      url: 'https://example.com/manifest.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [
            {
              id: 'video-switching',
              type: 'video',
              tracks: [
                {
                  type: 'video',
                  id: '480p',
                  url: 'https://example.com/480p.m3u8',
                  bandwidth: 1_000_000,
                  mimeType: 'video/mp4',
                  codecs: ['avc1.42E01E'],
                  initialization: { url: 'init', byteRange: { offset: 0, length: 0 } },
                  segments: [],
                  startTime: 0,
                  duration: 0,
                  width: 854,
                  height: 480,
                } as never,
                {
                  type: 'video',
                  id: '1080p',
                  url: 'https://example.com/1080p.m3u8',
                  bandwidth: 4_000_000,
                  mimeType: 'video/mp4',
                  codecs: ['avc1.640028'],
                  initialization: { url: 'init', byteRange: { offset: 0, length: 0 } },
                  segments: [],
                  startTime: 0,
                  duration: 0,
                  width: 1920,
                  height: 1080,
                } as never,
              ],
            },
          ],
        },
      ],
    };

    engine.state.presentation.set(presentation);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(engine.state.selectedVideoTrackId.get()).toBe('1080p');
    engine.destroy();
  });

  it('caps the default pick to the screen', async () => {
    const engine = createEngine();

    // 921,600 px: the 1080p rung's 2,073,600 is over it, the 480p rung's 409,920 fits.
    engine.state.screenResolution.set({ width: 1280, height: 720 });

    const videoTrack = (id: string, width: number, height: number, bandwidth: number) =>
      ({
        type: 'video',
        id,
        url: `https://example.com/${id}.m3u8`,
        bandwidth,
        mimeType: 'video/mp4',
        codecs: ['avc1.42E01E'],
        initialization: { url: 'init', byteRange: { offset: 0, length: 0 } },
        segments: [],
        startTime: 0,
        duration: 0,
        width,
        height,
      }) as never;

    engine.state.presentation.set({
      id: 'p',
      url: 'https://example.com/manifest.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [
            {
              id: 'video-switching',
              type: 'video',
              tracks: [videoTrack('480p', 854, 480, 1_000_000), videoTrack('1080p', 1920, 1080, 4_000_000)],
            },
          ],
        },
      ],
    } as MaybeResolvedPresentation);

    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(engine.state.selectedVideoTrackId.get()).toBe('480p');
    engine.destroy();
  });

  it('honors a custom rule chain from config', async () => {
    // Two tracks, so overriding is observable: the default chain
    // (`[screenResolutionCap, preferHighestResolution]`) would take 720p on any
    // screen that fits it, and this rule takes 480p regardless.
    const engine = createEngine({
      videoRules: [(tracks) => tracks.filter((track) => track.id === '480p')],
    });

    const presentation: MaybeResolvedPresentation = {
      id: 'p',
      url: 'https://example.com/manifest.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [
            {
              id: 'video-switching',
              type: 'video',
              tracks: [
                {
                  type: 'video',
                  id: '480p',
                  url: 'https://example.com/480p.m3u8',
                  bandwidth: 1_000_000,
                  mimeType: 'video/mp4',
                  codecs: ['avc1.42E01E'],
                  initialization: { url: 'init', byteRange: { offset: 0, length: 0 } },
                  segments: [],
                  startTime: 0,
                  duration: 0,
                  width: 854,
                  height: 480,
                } as never,
                {
                  type: 'video',
                  id: '720p',
                  url: 'https://example.com/720p.m3u8',
                  bandwidth: 2_500_000,
                  mimeType: 'video/mp4',
                  codecs: ['avc1.42E01E'],
                  initialization: { url: 'init', byteRange: { offset: 0, length: 0 } },
                  segments: [],
                  startTime: 0,
                  duration: 0,
                  width: 1280,
                  height: 720,
                } as never,
              ],
            },
          ],
        },
      ],
    };

    engine.state.presentation.set(presentation);
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(engine.state.selectedVideoTrackId.get()).toBe('480p');
    engine.destroy();
  });

  describe('screenResolution', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    function stubScreen(width: number, height: number, ratio = 1) {
      const screen = Object.assign(new EventTarget(), { width, height, orientation: new EventTarget() });

      vi.stubGlobal('screen', screen);
      vi.stubGlobal('devicePixelRatio', ratio);
      return screen;
    }

    it('is populated in device pixels before any presentation is set', () => {
      // The cap needs the screen from frame 0, not once a source arrives — the
      // slot is independent of the presentation lifecycle.
      stubScreen(1440, 900, 2);
      const engine = createEngine();

      expect(engine.state.screenResolution.get()).toEqual({ width: 2880, height: 1800 });

      engine.destroy();
    });

    it('honors useDevicePixelRatio from engine config', () => {
      stubScreen(1440, 900, 2);
      const engine = createEngine({ useDevicePixelRatio: false });

      expect(engine.state.screenResolution.get()).toEqual({ width: 1440, height: 900 });

      engine.destroy();
    });

    // Teardown is asserted at the behavior level instead — see
    // `behaviors/dom/tests/track-screen-resolution.test.ts`. Reading the slot
    // after `destroy()` returns `undefined` regardless, so an engine-level
    // assertion here couldn't tell a removed listener from torn-down state.
  });
});
