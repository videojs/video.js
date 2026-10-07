/**
 * HlsAudioAdapterCore adapter tests.
 *
 * Covers the HTMLMediaElement-compatible contract for src and play(), per the WHATWG HTML spec, for the audio-only HLS
 * variant. Parallels adapter.test.ts — semantics match (the variant differs in composition, not in adapter contract).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  SVTA_NO_SUPPORTED_AUDIO_TRACK,
  SVTA_NO_SUPPORTED_VIDEO_TRACK,
  SVTA_UNSUPPORTED_AUDIO_FORMAT,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
  SVTA_UNSUPPORTED_PLAYBACK_FEATURE,
} from '../../../../media/errors';
import { UNSUPPORTED_PLAYBACK_FEATURE_MESSAGE } from '../../../primitives/error-messages';
import { HlsAudioAdapterCore, HlsAudioMixin } from '../mixin';

describe('HlsAudioAdapterCore', () => {
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
      const media = new HlsAudioAdapterCore();

      expect(media.src).toBe('');
    });

    it('reflects the set value synchronously', () => {
      const media = new HlsAudioAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      expect(media.src).toBe('https://example.com/v.m3u8');
    });

    it('reflects the most recently set value', () => {
      const media = new HlsAudioAdapterCore();

      media.src = 'https://example.com/v1.m3u8';
      media.src = 'https://example.com/v2.m3u8';
      expect(media.src).toBe('https://example.com/v2.m3u8');
    });

    it('reflects empty string when set to empty', () => {
      const media = new HlsAudioAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      media.src = '';
      expect(media.src).toBe('');
    });

    it('synchronously updates engine presentation state when src is set', () => {
      const media = new HlsAudioAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      expect(media.engine.state.presentation.get()?.url).toBe('https://example.com/v.m3u8');
    });

    it('synchronously updates engine presentation state when src changes', () => {
      const media = new HlsAudioAdapterCore();

      media.src = 'https://example.com/v1.m3u8';
      media.src = 'https://example.com/v2.m3u8';
      expect(media.engine.state.presentation.get()?.url).toBe('https://example.com/v2.m3u8');
    });

    it('clears engine presentation state when src is set to empty string', () => {
      const media = new HlsAudioAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      media.src = '';
      expect(media.engine.state.presentation.get()?.url).toBeFalsy();
    });

    it('leaves engine presentation state alone when src is set to the URL already playing', () => {
      const media = new HlsAudioAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      const presentation = media.engine.state.presentation.get();

      media.src = 'https://example.com/v.m3u8';

      // See the video adapter's note: a fresh presentation re-resolves.
      expect(media.engine.state.presentation.get()).toBe(presentation);
    });
  });

  // ---------------------------------------------------------------------------
  // attach / detach — media element lifecycle (reuses the same engine)
  // ---------------------------------------------------------------------------
  describe('attach / detach', () => {
    it('reuses the same engine instance across attach/detach cycles', async () => {
      const media = new HlsAudioAdapterCore();
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
      const media = new HlsAudioAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      media.src = 'https://example.com/v1.m3u8';
      media.src = 'https://example.com/v2.m3u8';
      expect(media.engine.context.mediaElement.get()).toBe(el);
    });

    it('sets mediaElement in owners when attached', () => {
      const media = new HlsAudioAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      expect(media.engine.context.mediaElement.get()).toBe(el);
    });

    it('clears mediaElement in owners when detached', () => {
      const media = new HlsAudioAdapterCore();

      media.attach(document.createElement('video'));
      media.detach();
      expect(media.engine.context.mediaElement.get()).toBeUndefined();
    });

    it('updates mediaElement when re-attached to a different element', () => {
      const media = new HlsAudioAdapterCore();
      const el1 = document.createElement('video');
      const el2 = document.createElement('video');

      media.attach(el1);
      media.attach(el2);
      expect(media.engine.context.mediaElement.get()).toBe(el2);
    });

    it('preserves src across attach/detach cycles', () => {
      const media = new HlsAudioAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      media.attach(document.createElement('video'));
      media.detach();
      expect(media.src).toBe('https://example.com/v.m3u8');
    });

    it('src set before attach is reflected in engine state', () => {
      const media = new HlsAudioAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      media.attach(document.createElement('video'));
      expect(media.engine.state.presentation.get()?.url).toBe('https://example.com/v.m3u8');
    });
  });

  // ---------------------------------------------------------------------------
  // play() — WHATWG §4.8.11.8
  // ---------------------------------------------------------------------------
  describe('play()', () => {
    it.each(['src change', 'detach', 'destroy'] as const)('cancels a pending play retry on %s', async (action) => {
      const media = new HlsAudioAdapterCore();
      const el = document.createElement('audio');
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

        if (action === 'src change') media.src = 'https://example.com/v2.m3u8';
        else if (action === 'detach') media.detach();
        else media.destroy();

        el.dispatchEvent(new Event('loadstart'));
        await Promise.resolve();
        expect(play).toHaveBeenCalledTimes(1);
      } finally {
        media.destroy();
        play.mockRestore();
      }
    });

    it('sets loadActivated on engine state when called', () => {
      const media = new HlsAudioAdapterCore();

      media.attach(document.createElement('video'));
      media.play().catch(() => {});
      expect(media.engine.state.loadActivated.get()).toBe(true);
    });

    it('retries play() via loadstart when element has no src but adapter has one', async () => {
      const media = new HlsAudioAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      media.src = 'https://example.com/v.m3u8';

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

      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      el.dispatchEvent(new Event('loadstart'));

      await playPromise.catch(() => {});
      expect(playCallCount).toBe(2);
    });

    it('re-throws when play() rejects and no adapter src is set', async () => {
      const media = new HlsAudioAdapterCore();
      const el = document.createElement('video');

      media.attach(el);

      const err = new Error('autoplay policy');

      el.play = () => Promise.reject(err);

      await expect(media.play()).rejects.toThrow('autoplay policy');
    });
  });

  // ---------------------------------------------------------------------------
  // preload — synchronous IDL attribute (WHATWG §4.8.11.2)
  // ---------------------------------------------------------------------------
  describe('preload', () => {
    it('returns empty string before any preload is set', () => {
      const media = new HlsAudioAdapterCore();

      expect(media.preload).toBe('');
    });

    it('reflects the set value synchronously', () => {
      const media = new HlsAudioAdapterCore();

      media.preload = 'auto';
      expect(media.preload).toBe('auto');
    });

    it('updates engine state immediately when set', () => {
      const media = new HlsAudioAdapterCore();

      media.preload = 'none';
      expect(media.engine.state.preload.get()).toBe('none');
    });

    it('keeps explicit preload in engine state across src changes', () => {
      const media = new HlsAudioAdapterCore();

      media.preload = 'none';
      media.src = 'https://example.com/v.m3u8';
      // The engine is recycled, so state.preload is an engine-wide preference
      // that simply persists across the src change — no re-application needed.
      expect(media.preload).toBe('none');
      expect(media.engine.state.preload.get()).toBe('none');
    });
  });

  // ---------------------------------------------------------------------------
  // disableRemotePlayback — synchronous IDL attribute (WHATWG Remote Playback)
  // ---------------------------------------------------------------------------
  describe('disableRemotePlayback', () => {
    it('defaults to false', () => {
      const media = new HlsAudioAdapterCore();

      expect(media.disableRemotePlayback).toBe(false);
    });

    it('reflects the set value synchronously', () => {
      const media = new HlsAudioAdapterCore();

      media.disableRemotePlayback = true;
      expect(media.disableRemotePlayback).toBe(true);
    });

    it('updates engine state immediately when set', () => {
      const media = new HlsAudioAdapterCore();

      media.disableRemotePlayback = true;
      expect(media.engine.state.disableRemotePlayback.get()).toBe(true);
    });

    it('keeps the author opt-out in engine state across src changes', () => {
      // The engine is recycled, so author intent persists on the same signal.
      // An opted-out consumer must never get an AirPlay picker back on a
      // source change.
      const media = new HlsAudioAdapterCore();

      media.disableRemotePlayback = true;
      media.src = 'https://example.com/v.m3u8';
      expect(media.disableRemotePlayback).toBe(true);
      expect(media.engine.state.disableRemotePlayback.get()).toBe(true);
    });

    it('keeps a re-enabled remote playback across src changes', () => {
      const media = new HlsAudioAdapterCore();

      media.disableRemotePlayback = true;
      media.disableRemotePlayback = false;
      media.src = 'https://example.com/v.m3u8';
      expect(media.engine.state.disableRemotePlayback.get()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // crossOrigin — synchronous IDL attribute doubling as request-credentials intent
  // (full contract pinned on the video adapter; this checks the audio wiring)
  // ---------------------------------------------------------------------------
  describe('crossOrigin', () => {
    /** The `credentials` mode the engine's next manifest request carries — see the video adapter tests. */
    async function manifestCredentials(media: HlsAudioAdapterCore, url = 'https://cdn.example.com/master.m3u8') {
      const fetchMock = vi.mocked(globalThis.fetch);

      // Unload first and let the reactor observe it: a pending resolve is not
      // restarted by another URL, and two synchronous writes coalesce.
      fetchMock.mockClear();
      media.src = '';
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      media.preload = 'auto';
      media.src = url;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      expect(fetchMock).toHaveBeenCalledOnce();

      // SAFETY: `fetchResolvable` always calls `fetch` with a `Request`.
      return (fetchMock.mock.calls[0]![0] as Request).credentials;
    }

    it('is null by default, leaving requests at the platform default', async () => {
      const media = new HlsAudioAdapterCore();

      expect(media.crossOrigin).toBeNull();
      expect(await manifestCredentials(media)).toBe('same-origin');
    });

    it('sends credentials for use-credentials, and follows a later change on the same engine', async () => {
      const media = new HlsAudioAdapterCore();

      media.crossOrigin = 'use-credentials';
      expect(media.crossOrigin).toBe('use-credentials');
      expect(await manifestCredentials(media, 'https://cdn.example.com/a.m3u8')).toBe('include');

      media.crossOrigin = 'anonymous';
      expect(await manifestCredentials(media, 'https://cdn.example.com/b.m3u8')).toBe('same-origin');
    });

    it('adopts the crossorigin attribute of an attached element when none was set', async () => {
      const media = new HlsAudioAdapterCore();
      const el = document.createElement('audio');

      el.setAttribute('crossorigin', 'use-credentials');
      media.attach(el);

      expect(await manifestCredentials(media)).toBe('include');
    });
  });

  // ---------------------------------------------------------------------------
  // destroy()
  // ---------------------------------------------------------------------------
  describe('destroy()', () => {
    it('destroys the underlying engine', () => {
      const media = new HlsAudioAdapterCore();
      const spy = vi.spyOn(media.engine, 'destroy');

      media.destroy();
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  // ---------------------------------------------------------------------------
  // Error surface — parallels adapter.test.ts, with a narrower fatal policy
  // ---------------------------------------------------------------------------
  describe('error surface', () => {
    class TestAdapter extends HlsAudioMixin(EventTarget) {}

    const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

    it('exposes no error before anything is reported', () => {
      const media = new TestAdapter();

      expect(media.error).toBeNull();
      media.destroy();
    });

    it('surfaces the audio verdict as an ErrorLike and fires error', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_AUDIO_TRACK }]);
      await flush();

      expect(fired).toHaveLength(1);
      // No message: the consumer localizes from the code.
      expect(media.error).toEqual({ code: SVTA_NO_SUPPORTED_AUDIO_TRACK, message: '' });
      media.destroy();
    });

    it('ignores the video verdict — this media has no video track to fail', async () => {
      // The whole difference in fatal policy. An audio-only engine composes no
      // video selection, so a video verdict can't be about anything here, and
      // surfacing it would describe a track type this media doesn't have.
      const media = new TestAdapter();

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      expect(media.error).toBeNull();
      media.destroy();
    });

    it('surfaces the unsupported-playback-feature code when a cause explains the verdict', async () => {
      const media = new TestAdapter();

      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_AUDIO_FORMAT, data: { trackType: 'audio', trackId: 'a1', mimeType: 'audio/aac' } },
        { code: SVTA_NO_SUPPORTED_AUDIO_TRACK },
      ]);
      await flush();

      expect(media.error?.code).toBe(SVTA_UNSUPPORTED_PLAYBACK_FEATURE);
      expect(media.error?.message).toBe('');
      media.destroy();
    });

    it('logs the refusal', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const media = new TestAdapter();

      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_DRM_SYSTEM, data: { trackType: 'audio', trackId: 'a1' } },
        { code: SVTA_NO_SUPPORTED_AUDIO_TRACK },
      ]);
      await flush();

      const logged = spy.mock.calls
        .map((call) => String(call[0]))
        .filter((text) => text.startsWith(UNSUPPORTED_PLAYBACK_FEATURE_MESSAGE));

      expect(logged).toHaveLength(1);
      vi.restoreAllMocks();
      media.destroy();
    });

    it('appends the alternative-Media suggestion when the class names one', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      class Suggesting extends HlsAudioMixin(EventTarget) {
        static override get alternativeMediaSuggestion(): string {
          return 'Import from "/media/mux/hls-js" instead.';
        }
      }
      const media = new Suggesting();

      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_DRM_SYSTEM, data: { trackType: 'audio', trackId: 'a1' } },
        { code: SVTA_NO_SUPPORTED_AUDIO_TRACK },
      ]);
      await flush();

      expect(
        spy.mock.calls
          .map((call) => String(call[0]))
          .find((text) => text.startsWith(UNSUPPORTED_PLAYBACK_FEATURE_MESSAGE))
      ).toMatch(/Import from "\/media\/mux\/hls-js" instead\.$/);
      vi.restoreAllMocks();
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
      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_AUDIO_TRACK }]);
      await flush();

      expect(fired).toHaveLength(0);
      expect(media.error).toBeNull();
      destroy.mockRestore();
    });
  });
});
