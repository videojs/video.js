/**
 * HlsVideoAdapterCore adapter tests.
 *
 * Covers the HTMLMediaElement-compatible contract for src and play(), per the WHATWG HTML spec
 * (https://html.spec.whatwg.org/multipage/media.html).
 *
 * Notable spec anchors: - src IDL attribute reflects synchronously (§4.8.11.2) - Setting src invokes the load algorithm
 * (§4.8.11.5) - play() returns a Promise that resolves when playback starts (§4.8.11.8)
 *
 * Remote-source integration tests (e.g. full pipeline with Mux streams) are intentionally deferred; see comments below
 * for planned coverage.
 *
 * Future: consider web-platform-tests (wpt) fixtures for deeper spec coverage.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  SVTA_NO_SUPPORTED_AUDIO_TRACK,
  SVTA_NO_SUPPORTED_VIDEO_TRACK,
  SVTA_UNSUPPORTED_AUDIO_FORMAT,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
  SVTA_UNSUPPORTED_ENCRYPTION_METHOD,
  SVTA_UNSUPPORTED_PLAYBACK_FEATURE,
  SVTA_UNSUPPORTED_VIDEO_FORMAT,
  type SvtaError,
} from '../../../../media/errors';
import { MEDIA_PLAYLIST_METADATA_KEY, type Presentation } from '../../../../media/types';
import { UNSUPPORTED_PLAYBACK_FEATURE_MESSAGE } from '../../../primitives/error-messages';
import { HlsAudioAdapterCore } from '../../hls-audio/mixin';
import { HlsBackgroundVideoAdapterCore } from '../../hls-background-video/mixin';
import { HlsVideoAdapterCore, HlsVideoMixin } from '../mixin';

describe.each([
  { name: 'HlsVideoAdapterCore', Adapter: HlsVideoAdapterCore },
  { name: 'HlsAudioAdapterCore', Adapter: HlsAudioAdapterCore },
  { name: 'HlsBackgroundVideoAdapterCore', Adapter: HlsBackgroundVideoAdapterCore },
])('$name', ({ Adapter }) => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {}))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['replacement', 'detach', 'destroy', 'src change'] as const)(
    'does not retry play after immediate %s',
    async (action) => {
      const media = new Adapter();
      const first = document.createElement('video');
      const play = vi
        .spyOn(first, 'play')
        .mockRejectedValueOnce(new DOMException('No source yet', 'NotSupportedError'))
        .mockResolvedValue(undefined);
      const settled = vi.fn();

      try {
        media.attach(first);
        media.src = 'https://example.com/v.m3u8';
        media.play().then(settled, settled);

        // Invalidate the play before its native rejection handler can register a retry.
        if (action === 'replacement') media.attach(document.createElement('video'));
        else if (action === 'detach') media.detach();
        else if (action === 'destroy') media.destroy();
        else media.src = 'https://example.com/next.m3u8';

        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        first.dispatchEvent(new Event('loadstart'));
        await Promise.resolve();

        expect(play).toHaveBeenCalledTimes(1);
        expect(settled.mock.calls[0]?.[0]).toMatchObject({ name: 'AbortError' });
      } finally {
        media.destroy();
        play.mockRestore();
      }
    }
  );

  it.each(['replacement', 'detach', 'destroy', 'src change'] as const)(
    'rejects pending play retries on %s',
    async (action) => {
      const media = new Adapter();
      const first = document.createElement('video');
      const play = vi
        .spyOn(first, 'play')
        .mockRejectedValueOnce(new DOMException('No source yet', 'NotSupportedError'))
        .mockRejectedValueOnce(new DOMException('No source yet', 'NotSupportedError'))
        .mockResolvedValue(undefined);
      const settled = vi.fn();

      try {
        media.attach(first);
        media.src = 'https://example.com/v.m3u8';
        media.play().then(settled, settled);
        media.play().then(settled, settled);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        expect(play).toHaveBeenCalledTimes(2);
        expect(settled).not.toHaveBeenCalled();

        if (action === 'replacement') media.attach(document.createElement('video'));
        else if (action === 'detach') media.detach();
        else if (action === 'destroy') media.destroy();
        else media.src = 'https://example.com/next.m3u8';

        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        expect(settled).toHaveBeenCalledTimes(2);
        expect(settled.mock.calls[0]![0]).toMatchObject({ name: 'AbortError' });
        expect(settled.mock.calls[1]![0]).toMatchObject({ name: 'AbortError' });

        first.dispatchEvent(new Event('loadstart'));
        await Promise.resolve();
        expect(play).toHaveBeenCalledTimes(2);
      } finally {
        media.destroy();
        play.mockRestore();
      }
    }
  );
});

describe('HlsVideoAdapterCore', () => {
  // Prevent real network calls from engines that auto-trigger resolution
  // (e.g. when a media element with default preload="auto" is attached alongside a src).
  // A never-settling promise avoids unhandled rejections without affecting test assertions.
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {}))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ---------------------------------------------------------------------------
  // src — synchronous IDL attribute reflection (WHATWG §4.8.11.2)
  // ---------------------------------------------------------------------------
  describe('src', () => {
    it('returns empty string before any src is set', () => {
      const media = new HlsVideoAdapterCore();

      expect(media.src).toBe('');
    });

    it('reflects the set value synchronously', () => {
      const media = new HlsVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      // Must be synchronous — no await needed
      expect(media.src).toBe('https://example.com/v.m3u8');
    });

    it('reflects the most recently set value', () => {
      const media = new HlsVideoAdapterCore();

      media.src = 'https://example.com/v1.m3u8';
      media.src = 'https://example.com/v2.m3u8';
      expect(media.src).toBe('https://example.com/v2.m3u8');
    });

    it('reflects empty string when set to empty', () => {
      const media = new HlsVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      media.src = '';
      expect(media.src).toBe('');
    });

    // Setting src triggers the load algorithm — engine state update is synchronous
    it('synchronously updates engine presentation state when src is set', () => {
      const media = new HlsVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      expect(media.engine.state.presentation.get()?.url).toBe('https://example.com/v.m3u8');
    });

    it('synchronously updates engine presentation state when src changes', () => {
      const media = new HlsVideoAdapterCore();

      media.src = 'https://example.com/v1.m3u8';
      media.src = 'https://example.com/v2.m3u8';
      expect(media.engine.state.presentation.get()?.url).toBe('https://example.com/v2.m3u8');
    });

    it('clears engine presentation state when src is set to empty string', () => {
      const media = new HlsVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      media.src = '';
      expect(media.engine.state.presentation.get()?.url).toBeFalsy();
    });

    it('leaves engine presentation state alone when src is set to the URL already playing', () => {
      const media = new HlsVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      const presentation = media.engine.state.presentation.get();

      media.src = 'https://example.com/v.m3u8';

      // The same object, not an equal one: a fresh presentation re-resolves, which
      // restarts playback for a source that has not changed.
      expect(media.engine.state.presentation.get()).toBe(presentation);
    });
  });

  // ---------------------------------------------------------------------------
  // attach / detach — media element lifecycle (reuses the same engine)
  // ---------------------------------------------------------------------------
  describe('attach / detach', () => {
    it('reuses the same engine instance across attach/detach cycles', async () => {
      const media = new HlsVideoAdapterCore();
      const engine = media.engine;
      const destroy = vi.spyOn(engine, 'destroy');
      const first = document.createElement('video');
      const second = document.createElement('video');

      try {
        expect(engine).toBeDefined();
        media.attach(first);
        expect(media.engine).toBe(engine);
        media.attach(second);
        expect(media.engine).toBe(engine);
        media.detach();
        expect(media.engine).toBe(engine);
        media.attach(first);
        expect(media.engine).toBe(engine);
        media.src = 'https://example.com/v1.m3u8';
        expect(media.engine).toBe(engine);
        media.src = 'https://example.com/v2.m3u8';
        expect(media.engine).toBe(engine);
        expect(destroy).not.toHaveBeenCalled();
      } finally {
        media.destroy();
        await destroy.mock.results[0]!.value;
        destroy.mockRestore();
      }
    });

    it('keeps the attached media element across src changes', () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      media.src = 'https://example.com/v1.m3u8';
      media.src = 'https://example.com/v2.m3u8';
      expect(media.engine.context.mediaElement.get()).toBe(el);
    });

    it('cancels pending play listener when src changes', async () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');
      const play = vi
        .spyOn(el, 'play')
        .mockRejectedValueOnce(new Error('no supported sources'))
        .mockResolvedValue(undefined);

      try {
        media.attach(el);
        media.src = 'https://example.com/v1.m3u8';
        media.play().catch(() => {});
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        expect(play).toHaveBeenCalledTimes(1);

        media.src = 'https://example.com/v2.m3u8';
        el.dispatchEvent(new Event('loadstart'));
        await Promise.resolve();

        expect(play).toHaveBeenCalledTimes(1);
      } finally {
        media.destroy();
        play.mockRestore();
      }
    });

    it('sets mediaElement in owners when attached', () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      expect(media.engine.context.mediaElement.get()).toBe(el);
    });

    it('clears mediaElement in owners when detached', () => {
      const media = new HlsVideoAdapterCore();

      media.attach(document.createElement('video'));
      media.detach();
      expect(media.engine.context.mediaElement.get()).toBeUndefined();
    });

    it('updates mediaElement when re-attached to a different element', () => {
      const media = new HlsVideoAdapterCore();
      const el1 = document.createElement('video');
      const el2 = document.createElement('video');

      media.attach(el1);
      media.attach(el2);
      expect(media.engine.context.mediaElement.get()).toBe(el2);
    });

    it('preserves src across attach/detach cycles', () => {
      const media = new HlsVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      media.attach(document.createElement('video'));
      media.detach();
      expect(media.src).toBe('https://example.com/v.m3u8');
    });

    it('src set before attach is reflected in engine state', () => {
      const media = new HlsVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      media.attach(document.createElement('video'));
      expect(media.engine.state.presentation.get()?.url).toBe('https://example.com/v.m3u8');
    });
  });

  // ---------------------------------------------------------------------------
  // play() — WHATWG §4.8.11.8
  // ---------------------------------------------------------------------------
  describe('play()', () => {
    it('sets loadActivated on engine state when called', () => {
      const media = new HlsVideoAdapterCore();

      media.attach(document.createElement('video'));
      media.play().catch(() => {});
      expect(media.engine.state.loadActivated.get()).toBe(true);
    });

    it('retries play() via loadstart when element has no src but adapter has one', async () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      media.src = 'https://example.com/v.m3u8';

      // Simulate element having no blob URL yet on first call, as if MSE
      // hasn't attached yet, then succeed on retry
      let playCallCount = 0;
      const originalPlay = el.play.bind(el);

      el.play = () => {
        playCallCount++;

        if (playCallCount === 1) {
          return Promise.reject(new Error('no supported sources'));
        }

        return originalPlay();
      };

      const playPromise = media.play();

      // Push past all pending microtasks (state flush + .catch() handler)
      // before dispatching loadstart so the listener is registered in time
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      // Simulate MSE attaching the blob URL
      el.dispatchEvent(new Event('loadstart'));

      await playPromise.catch(() => {});
      expect(playCallCount).toBe(2);
    });

    it('re-throws when play() rejects and no adapter src is set', async () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      // No src on adapter — nothing pending to wait for

      const err = new Error('autoplay policy');

      el.play = () => Promise.reject(err);

      await expect(media.play()).rejects.toThrow('autoplay policy');
    });

    it('removes the pending loadstart listener on detach', async () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');
      const play = vi
        .spyOn(el, 'play')
        .mockRejectedValueOnce(new Error('no supported sources'))
        .mockResolvedValue(undefined);

      try {
        media.attach(el);
        media.src = 'https://example.com/v1.m3u8';
        media.play().catch(() => {});
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        expect(play).toHaveBeenCalledTimes(1);

        media.detach();
        el.dispatchEvent(new Event('loadstart'));
        await Promise.resolve();

        expect(play).toHaveBeenCalledTimes(1);
      } finally {
        media.destroy();
        play.mockRestore();
      }
    });

    it('removes the pending loadstart listener on destroy', async () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');
      const play = vi
        .spyOn(el, 'play')
        .mockRejectedValueOnce(new Error('no supported sources'))
        .mockResolvedValue(undefined);

      try {
        media.attach(el);
        media.src = 'https://example.com/v1.m3u8';
        media.play().catch(() => {});
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        expect(play).toHaveBeenCalledTimes(1);

        media.destroy();
        el.dispatchEvent(new Event('loadstart'));
        await Promise.resolve();

        expect(play).toHaveBeenCalledTimes(1);
      } finally {
        media.destroy();
        play.mockRestore();
      }
    });

    // TODO: Add integration tests with a real HLS stream once test fixtures are
    // in place (e.g. Mux stream, WPT-style fixture server).
    // Expected: play() resolves after the media element fires 'playing'.
  });

  // ---------------------------------------------------------------------------
  // preload — synchronous IDL attribute (WHATWG §4.8.11.2)
  // ---------------------------------------------------------------------------
  describe('preload', () => {
    it('returns empty string before any preload is set', () => {
      const media = new HlsVideoAdapterCore();

      expect(media.preload).toBe('');
    });

    it('reflects the set value synchronously', () => {
      const media = new HlsVideoAdapterCore();

      media.preload = 'auto';
      expect(media.preload).toBe('auto');
    });

    it('updates engine state immediately when set', () => {
      const media = new HlsVideoAdapterCore();

      media.preload = 'none';
      expect(media.engine.state.preload.get()).toBe('none');
    });

    it('setting preload to empty string resets the stored value but does not clear current engine state', () => {
      const media = new HlsVideoAdapterCore();

      media.preload = 'auto';
      media.preload = '';
      // Clearing the IDL mirror leaves the recycled engine's loading policy intact.
      expect(media.preload).toBe('');
      expect(media.engine.state.preload.get()).toBe('auto');
    });

    // Regression (#2532): the engine's DOM→state read must never adopt the
    // attached element's UA-default preload. A shadow-style <video> carries no
    // preload attribute, and its `preload` IDL property then reports a
    // browser-dependent UA default ('metadata' Chromium, 'auto' WebKit).
    it('keeps an explicit preload across attach of an element with no preload attribute (UA default is not a source)', async () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');

      // 'none' differs from every measured UA default, so a clobber from the
      // attach-time read fails this on any browser.
      media.preload = 'none';
      media.attach(el);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(media.engine.state.preload.get()).toBe('none');
    });

    it('adopts an authored preload attribute from a newly attached element (most-recent-wins on attach)', async () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');

      el.setAttribute('preload', 'auto');
      media.preload = 'none';
      media.attach(el);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(media.engine.state.preload.get()).toBe('auto');
    });

    it('keeps explicit preload in engine state across src changes', () => {
      const media = new HlsVideoAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      media.preload = 'none';
      media.src = 'https://example.com/v.m3u8';
      // The engine is recycled, so state.preload is engine-wide preference that
      // simply persists across the src change — no re-application needed.
      expect(media.preload).toBe('none');
      expect(media.engine.state.preload.get()).toBe('none');

      // Changing preload, then changing src again, keeps the latest value on the
      // same engine — not reset to a default by the source change.
      media.preload = 'auto';
      media.src = 'https://example.com/v2.m3u8';
      expect(media.preload).toBe('auto');
      expect(media.engine.state.preload.get()).toBe('auto');
    });
  });

  // ---------------------------------------------------------------------------
  // destroy() — explicit teardown (separate from detach)
  // ---------------------------------------------------------------------------
  describe('destroy()', () => {
    it('destroys the underlying engine', () => {
      const media = new HlsVideoAdapterCore();
      const spy = vi.spyOn(media.engine, 'destroy');

      media.destroy();
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  // ---------------------------------------------------------------------------
  // Live surface — streamType / targetLiveWindow / liveEdgeStart
  // (the contract the player store's stream-type + live features consume)
  // ---------------------------------------------------------------------------
  describe('live surface', () => {
    // The mixin dispatches change events via the base's EventTarget; the bare
    // HlsVideoAdapterCore has none, so tests compose over EventTarget.
    class TestAdapter extends HlsVideoMixin(EventTarget) {}

    /**
     * A resolved live presentation: one selected video track, 5×2s segments at [100, 110], targetDuration 2 (→
     * HOLD-BACK latency 6 → liveEdgeStart 104).
     */
    function liveVideoPresentation(playlistType?: 'VOD' | 'EVENT'): Presentation {
      const complete = playlistType === 'VOD';
      const video = {
        type: 'video',
        id: 'v-1',
        url: 'https://example.com/video.m3u8',
        mimeType: 'video/mp4',
        codecs: ['avc1.640020'],
        bandwidth: 1_000_000,
        initialization: { url: 'https://example.com/init.mp4' },
        duration: complete ? 10 : Number.POSITIVE_INFINITY,
        startTime: 0,
        segments: [100, 102, 104, 106, 108].map((startTime, i) => ({
          id: `seg-${i}`,
          url: `https://example.com/${i}.m4s`,
          duration: 2,
          startTime,
        })),
        metadata: {
          [MEDIA_PLAYLIST_METADATA_KEY]: { mediaSequence: 0, targetDuration: 2, playlistType, endList: complete },
        },
      };

      return {
        id: 'pres-1',
        url: 'https://example.com/master.m3u8',
        startTime: 0,
        streamType: playlistType === 'VOD' ? 'on-demand' : 'live',
        selectionSets: [
          { id: 'video-set', type: 'video', switchingSets: [{ id: 'vs', type: 'video', tracks: [video] }] },
        ],
      } as Presentation;
    }

    function liveMedia(playlistType?: 'VOD' | 'EVENT') {
      const media = new TestAdapter();

      media.engine.state.presentation.set(liveVideoPresentation(playlistType));
      media.engine.state.selectedVideoTrackId.set('v-1');
      return media;
    }

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    it('starts unknown / NaN before anything resolves', () => {
      const media = new TestAdapter();

      expect(media.streamType).toBe('unknown');
      expect(media.targetLiveWindow).toBeNaN();
      expect(media.liveEdgeStart).toBeNaN();
      media.destroy();
    });

    it('detects live: streamType live, targetLiveWindow 0, with change events', async () => {
      const media = new TestAdapter();
      const streamTypeChange = vi.fn();
      const targetLiveWindowChange = vi.fn();

      media.addEventListener('streamtypechange', streamTypeChange);
      media.addEventListener('targetlivewindowchange', targetLiveWindowChange);

      media.engine.state.presentation.set(liveVideoPresentation());
      media.engine.state.selectedVideoTrackId.set('v-1');
      await flush();

      expect(media.streamType).toBe('live');
      expect(media.targetLiveWindow).toBe(0);
      expect(streamTypeChange).toHaveBeenCalledTimes(1);
      expect(targetLiveWindowChange).toHaveBeenCalledTimes(1);
      media.destroy();
    });

    it('reports Infinity targetLiveWindow for an EVENT (DVR) playlist', async () => {
      const media = liveMedia('EVENT');

      await flush();
      expect(media.streamType).toBe('live');
      expect(media.targetLiveWindow).toBe(Number.POSITIVE_INFINITY);
      media.destroy();
    });

    it('reports on-demand / NaN for a VOD playlist', async () => {
      const media = liveMedia('VOD');

      await flush();
      expect(media.streamType).toBe('on-demand');
      expect(media.targetLiveWindow).toBeNaN();
      expect(media.liveEdgeStart).toBeNaN();
      media.destroy();
    });

    it('derives liveEdgeStart at read time: window end minus HOLD-BACK, sliding with the window', async () => {
      const media = liveMedia();

      await flush();
      // Window [100, 110], HOLD-BACK 3 × targetDuration(2) = 6 → 104.
      expect(media.liveEdgeStart).toBe(104);

      // The window slides (reload): derived value follows with no event needed.
      const slid = liveVideoPresentation();
      const track = slid.selectionSets[0]!.switchingSets[0]!.tracks[0] as { segments: { startTime: number }[] };

      for (const segment of track.segments) segment.startTime += 10;

      media.engine.state.presentation.set(slid);
      expect(media.liveEdgeStart).toBe(114);
      media.destroy();
    });

    it('supports a user streamType override, reverting on unknown', async () => {
      const media = liveMedia();

      await flush();
      expect(media.streamType).toBe('live');

      media.streamType = 'on-demand'; // pin
      expect(media.streamType).toBe('on-demand');

      // Detection updates don't displace the pin.
      media.engine.state.presentation.set(liveVideoPresentation());
      await flush();
      expect(media.streamType).toBe('on-demand');

      media.streamType = 'unknown'; // revert to detected
      expect(media.streamType).toBe('live');
      media.destroy();
    });

    it('resets to unknown / NaN when the source is cleared', async () => {
      const media = liveMedia();

      await flush();
      expect(media.streamType).toBe('live');

      media.src = '';
      await flush();
      expect(media.streamType).toBe('unknown');
      expect(media.targetLiveWindow).toBeNaN();
      expect(media.liveEdgeStart).toBeNaN();
      media.destroy();
    });
  });

  describe('HlsVideoAdapterCore > structured source', () => {
    it('derives src from source.src', () => {
      const media = new HlsVideoAdapterCore();

      media.source = { src: 'https://example.com/a.m3u8' };

      expect(media.src).toBe('https://example.com/a.m3u8');
      media.destroy();
    });

    it('announces sourcechange on a host that can dispatch', () => {
      // The standalone element has no EventTarget base, which is why the adapter
      // optional-chains `dispatchEvent`; hosts supply one.
      class EventfulMedia extends HlsVideoMixin(EventTarget) {}
      const media = new EventfulMedia();
      const changes: Event[] = [];

      media.addEventListener('sourcechange', (event: Event) => changes.push(event));

      media.source = { src: 'https://example.com/a.m3u8' };
      media.src = 'https://example.com/b.m3u8';

      expect(changes).toHaveLength(2);
      media.destroy();
    });

    it('replaces the source when a bare src is assigned, dropping its licensing', () => {
      const media = new HlsVideoAdapterCore();

      media.source = { src: 'https://example.com/a.m3u8', drm: { 'com.widevine.alpha': { licenseUrl: 'https://l' } } };

      media.src = 'https://example.com/b.m3u8';

      // A different asset: the previous asset's license servers cannot apply.
      expect(media.source).toEqual({ src: 'https://example.com/b.m3u8' });
      media.destroy();
    });

    it('clears the presentation when the source is dropped', () => {
      const media = new HlsVideoAdapterCore();

      media.source = { src: 'https://example.com/a.m3u8' };
      media.source = null;

      expect(media.src).toBe('');
      expect(media.source).toBe(null);
      media.destroy();
    });

    it('keeps playing when only the licensing half of a source changes', () => {
      const media = new HlsVideoAdapterCore();

      media.source = { src: 'https://example.com/a.m3u8' };
      const before = media.engine.state.presentation.get();

      media.source = { src: 'https://example.com/a.m3u8', drm: { 'com.widevine.alpha': { licenseUrl: 'https://l' } } };

      // Same URL, so the presentation object is not replaced — re-resolving it
      // would restart playback.
      expect(media.engine.state.presentation.get()).toBe(before);
      media.destroy();
    });
  });
  // ---------------------------------------------------------------------------
  // Delivery notices — console-only, non-fatal, once per source
  // ---------------------------------------------------------------------------
  describe('delivery notices', () => {
    class TestAdapter extends HlsVideoMixin(EventTarget) {}

    // Without this, `vi.spyOn` on an already-mocked `console.warn` accumulates
    // calls across tests and the per-source counts read high.
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    /** Unrelated behaviors warn as well, so count only the delivery notices. */
    const noticesMatching = (spy: { mock: { calls: unknown[][] } }, pattern: RegExp) =>
      spy.mock.calls.map((call) => String(call[0])).filter((text) => pattern.test(text));

    const livePresentation = (metadata: Record<string, unknown>) =>
      ({
        id: 'pres-1',
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
                    url: 'https://example.com/v1.m3u8',
                    bandwidth: 1000,
                    mimeType: 'video/mp4',
                    codecs: ['avc1.4d401f'],
                    startTime: 0,
                    duration: 10,
                    segments: [],
                    metadata: {
                      [MEDIA_PLAYLIST_METADATA_KEY]: {
                        targetDuration: 4,
                        mediaSequence: 0,
                        endList: false,
                        ...metadata,
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      }) as unknown as Presentation;

    it('warns that LL-HLS falls back to standard live', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const media = new TestAdapter();

      media.engine.state.selectedVideoTrackId.set('v1');
      media.engine.state.presentation.set(livePresentation({ lowLatency: true }));
      await flush();

      const notices = noticesMatching(spy, /Low-Latency HLS/);

      expect(notices).toHaveLength(1);
      expect(notices[0]).toMatch(/standard live/i);
      media.destroy();
    });

    it('warns that DVR/EVENT support is experimental', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const media = new TestAdapter();

      media.engine.state.selectedVideoTrackId.set('v1');
      media.engine.state.presentation.set(livePresentation({ playlistType: 'EVENT' }));
      await flush();

      expect(noticesMatching(spy, /experimental/i)).toHaveLength(1);
      media.destroy();
    });

    it('warns once per source, not once per parse', async () => {
      // A live playlist reloads every target duration and the track re-parses each
      // time; a per-parse warning would repeat forever.
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const media = new TestAdapter();

      media.engine.state.selectedVideoTrackId.set('v1');

      media.engine.state.presentation.set(livePresentation({ lowLatency: true }));
      await flush();
      // Same source, fresh presentation object — exactly what a reload produces.
      media.engine.state.presentation.set(livePresentation({ lowLatency: true }));
      await flush();

      expect(noticesMatching(spy, /Low-Latency HLS/)).toHaveLength(1);
      media.destroy();
    });

    it('says nothing for a plain live source', async () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const media = new TestAdapter();

      media.engine.state.selectedVideoTrackId.set('v1');
      media.engine.state.presentation.set(livePresentation({}));
      await flush();

      expect(noticesMatching(spy, /Low-Latency HLS|experimental/i)).toEqual([]);
      media.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Error surface — error / 'error' event
  // (the MediaErrorCapability contract the player store's error feature consumes)
  // ---------------------------------------------------------------------------
  describe('error surface', () => {
    class TestAdapter extends HlsVideoMixin(EventTarget) {}

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    it('exposes no error before anything is reported', () => {
      const media = new TestAdapter();

      expect(media.error).toBeNull();
      media.destroy();
    });

    it('stops promoting conditions after destroy', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];
      const destroy = vi.spyOn(media.engine, 'destroy');

      media.addEventListener('error', (event) => fired.push(event));
      media.destroy();
      await destroy.mock.results[0]!.value;

      // Write after engine cleanup so clearing its signals cannot hide a live effect.
      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      expect(fired).toHaveLength(0);
      expect(media.error).toBeNull();
      destroy.mockRestore();
    });

    it('surfaces a reported fatal condition as an ErrorLike and fires error', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      // No message: viewer-facing copy is the consumer's to localize from the
      // code, so the engine ships none.
      expect(media.error).toEqual({ code: SVTA_NO_SUPPORTED_VIDEO_TRACK, message: '' });
      expect(fired).toHaveLength(1);
      media.destroy();
    });

    it('surfaces the first fatal condition — the root cause, not the consequence', async () => {
      const media = new TestAdapter();

      // A reporter states the cause before selection reports the consequence;
      // sequence order is causal, so the first fatal is the actionable one.
      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_AUDIO_TRACK }, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      expect(media.error?.code).toBe(SVTA_NO_SUPPORTED_AUDIO_TRACK);
      media.destroy();
    });

    it('ignores non-fatal reports — they stay in the sequence only', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      // 2039 (manifest feature unsupported) is the degraded-but-playable tier;
      // it must not reach the media surface.
      media.engine.state.errors.set([{ code: 2039 }]);
      await flush();

      expect(media.error).toBeNull();
      expect(fired).toHaveLength(0);
      media.destroy();
    });

    it('fires once per distinct condition, not per re-report', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();
      // A later append (a second reporter, a re-evaluation) leaves the first
      // fatal in place; the surface must not re-fire for the same condition.
      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }, { code: 2039 }]);
      await flush();

      expect(fired).toHaveLength(1);
      media.destroy();
    });

    it('clears when the sequence resets for a new source', async () => {
      const media = new TestAdapter();

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();
      expect(media.error).not.toBeNull();

      // collectErrors clears the slot on source change.
      media.engine.state.errors.set(undefined);
      await flush();

      expect(media.error).toBeNull();
      media.destroy();
    });

    it('surfaces the unsupported-playback-feature code when a container cause explains the verdict', async () => {
      const media = new TestAdapter();

      // The verdict alone only says nothing was selectable. The cause says why
      // it can't be fixed here — no retry, CDN, or rendition helps — which is a
      // different thing to tell a viewer, so it gets its own code.
      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_VIDEO_FORMAT, data: { trackType: 'video', trackId: 'v1', mimeType: 'video/mp2t' } },
        { code: SVTA_NO_SUPPORTED_VIDEO_TRACK },
      ]);
      await flush();

      expect(media.error?.code).toBe(SVTA_UNSUPPORTED_PLAYBACK_FEATURE);
      media.destroy();
    });

    it('surfaces the same code for an encrypted source', async () => {
      const media = new TestAdapter();

      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_DRM_SYSTEM, data: { trackType: 'video', trackId: 'v1' } },
        { code: SVTA_NO_SUPPORTED_VIDEO_TRACK },
      ]);
      await flush();

      // One code for both: the viewer's situation is identical either way, and
      // the specifics stay on `engine.state.errors` for a developer.
      expect(media.error?.code).toBe(SVTA_UNSUPPORTED_PLAYBACK_FEATURE);
      expect(media.error?.message).toBe('');
      media.destroy();
    });

    it('surfaces the same code for non-DRM clear-key encryption', async () => {
      const media = new TestAdapter();

      // AES-128 clear-key: the cause is the unsupported encryption method, not a
      // DRM system, but the viewer's situation — unplayable, unfixable here — is
      // the same, so it surfaces the same code.
      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_ENCRYPTION_METHOD, data: { method: 'AES-128' } },
        { code: SVTA_NO_SUPPORTED_VIDEO_TRACK },
      ]);
      await flush();

      expect(media.error?.code).toBe(SVTA_UNSUPPORTED_PLAYBACK_FEATURE);
      media.destroy();
    });

    it('surfaces it for a cause on a different track type than the verdict', async () => {
      const media = new TestAdapter();

      // Encrypted audio empties audio while video is MPEG-TS. Attributing causes
      // per type would miss this; the source is unplayable either way.
      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_DRM_SYSTEM, data: { trackType: 'audio', trackId: 'a1' } },
        { code: SVTA_NO_SUPPORTED_VIDEO_TRACK },
      ]);
      await flush();

      expect(media.error?.code).toBe(SVTA_UNSUPPORTED_PLAYBACK_FEATURE);
      media.destroy();
    });

    it('keeps the verdict code when nothing unsupported explains it', async () => {
      const media = new TestAdapter();

      // A type can empty for reasons that are not "we don't implement this" —
      // that stays a plain verdict.
      media.engine.state.errors.set([{ code: 2039 }, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      expect(media.error?.code).toBe(SVTA_NO_SUPPORTED_VIDEO_TRACK);
      media.destroy();
    });

    it('does not re-fire when a cause is appended after the verdict surfaced', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_AUDIO_FORMAT, data: { trackType: 'audio', trackId: 'a1' } },
        { code: SVTA_NO_SUPPORTED_AUDIO_TRACK },
      ]);
      await flush();
      const surfaced = media.error?.code;

      // A rendition resolving later can't retroactively change an error a
      // consumer has already shown.
      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_AUDIO_FORMAT, data: { trackType: 'audio', trackId: 'a1' } },
        { code: SVTA_NO_SUPPORTED_AUDIO_TRACK },
        { code: SVTA_UNSUPPORTED_DRM_SYSTEM, data: { trackType: 'audio', trackId: 'a2' } },
      ]);
      await flush();

      expect(media.error?.code).toBe(surfaced);
      expect(fired).toHaveLength(1);
      media.destroy();
    });

    it('prefers a message the reporter supplied', async () => {
      const media = new TestAdapter();

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK, message: 'Reporter knows best.' }]);
      await flush();

      expect(media.error?.message).toBe('Reporter knows best.');
      media.destroy();
    });

    it('carries reporter context through as data', async () => {
      const media = new TestAdapter();

      media.engine.state.errors.set([
        { code: SVTA_NO_SUPPORTED_VIDEO_TRACK, data: { selectionKey: 'selectedVideoTrackId' } },
      ]);
      await flush();

      expect(media.error?.data).toEqual({ selectionKey: 'selectedVideoTrackId' });
      media.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Unsupported-playback-feature log — the developer half of the same event
  // ---------------------------------------------------------------------------
  describe('unsupported-playback-feature log', () => {
    class TestAdapter extends HlsVideoMixin(EventTarget) {}

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const MESSAGE = UNSUPPORTED_PLAYBACK_FEATURE_MESSAGE;

    const unsupportedSource: SvtaError[] = [
      { code: SVTA_UNSUPPORTED_VIDEO_FORMAT, data: { trackType: 'video', trackId: 'v1', mimeType: 'video/mp2t' } },
      { code: SVTA_NO_SUPPORTED_VIDEO_TRACK },
    ];

    it('logs the reported conditions alongside it, so specifics stay inspectable', async () => {
      // One string, full detail: the container lives in structured data rather
      // than in a sentence the engine would have to localize.
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const media = new TestAdapter();

      media.engine.state.errors.set(unsupportedSource);
      await flush();

      const calls = spy.mock.calls.filter((entry) => String(entry[0]).startsWith(MESSAGE));

      expect(calls).toHaveLength(1);
      expect(calls[0]?.[1]).toEqual({ conditions: unsupportedSource });
      media.destroy();
    });

    it('says nothing for a verdict with no unsupported cause', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const media = new TestAdapter();

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      expect(spy.mock.calls.filter((call) => String(call[0]).startsWith(MESSAGE))).toEqual([]);
      media.destroy();
    });

    it('appends the alternative-Media suggestion when the class names one', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      class Suggesting extends HlsVideoMixin(EventTarget) {
        static override get alternativeMediaSuggestion(): string {
          return 'Import from "/media/mux/hls-js" instead.';
        }
      }
      const media = new Suggesting();

      media.engine.state.errors.set(unsupportedSource);
      await flush();

      expect(spy.mock.calls.map((call) => String(call[0])).find((text) => text.startsWith(MESSAGE))).toMatch(
        /Import from "\/media\/mux\/hls-js" instead\.$/
      );
      media.destroy();
    });
  });
});
