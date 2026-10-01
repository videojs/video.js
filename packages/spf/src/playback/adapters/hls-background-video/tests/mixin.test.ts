/**
 * HlsBackgroundVideoAdapterCore adapter tests.
 *
 * Covers the HTMLMediaElement-compatible contract for `src` and `play()`. Adapter-shape parallels
 * `HlsVideoAdapterCore`; the tests focus on what diverges: silent autoplay-looping playback is fixed on the element at
 * attach rather than exposed, and the picker takes the largest rendition on offer, since narrowing the set is the
 * manifest's job rather than a property here.
 *
 * `<mux-background-video>` in html and react is an alias of these same classes, so this file carries the behavior.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  SVTA_NO_SUPPORTED_VIDEO_TRACK,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
  SVTA_UNSUPPORTED_PLAYBACK_FEATURE,
  SVTA_UNSUPPORTED_VIDEO_FORMAT,
} from '../../../../media/errors';
import type { MaybeResolvedPresentation } from '../../../../media/types';
import { UNPLAYABLE_SOURCE_MESSAGE } from '../../../primitives/error-messages';
import { HlsBackgroundVideoAdapterCore, HlsBackgroundVideoMixin } from '../mixin';

describe('HlsBackgroundVideoAdapterCore', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => {}))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('src', () => {
    it('returns empty string before any src is set', () => {
      const media = new HlsBackgroundVideoAdapterCore();

      expect(media.src).toBe('');
    });

    it('reflects the set value synchronously', () => {
      const media = new HlsBackgroundVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      expect(media.src).toBe('https://example.com/v.m3u8');
    });

    it('synchronously updates engine presentation state when src is set', () => {
      const media = new HlsBackgroundVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      expect(media.engine.state.presentation.get()?.url).toBe('https://example.com/v.m3u8');
    });

    it('clears engine presentation state when src is set to empty string', () => {
      const media = new HlsBackgroundVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      media.src = '';
      expect(media.engine.state.presentation.get()?.url).toBeFalsy();
    });

    it('leaves engine presentation state alone when src is set to the URL already playing', () => {
      const media = new HlsBackgroundVideoAdapterCore();

      media.src = 'https://example.com/v.m3u8';
      const presentation = media.engine.state.presentation.get();

      media.src = 'https://example.com/v.m3u8';

      // The same object, not an equal one: a fresh presentation re-resolves.
      expect(media.engine.state.presentation.get()).toBe(presentation);
    });
  });

  describe('attach / detach', () => {
    it('reuses the same engine instance across attach calls', () => {
      const media = new HlsBackgroundVideoAdapterCore();
      const firstEngine = media.engine;

      media.attach(document.createElement('video'));
      media.attach(document.createElement('video'));
      expect(media.engine).toBe(firstEngine);
    });

    it('sets mediaElement in context when attached', () => {
      const media = new HlsBackgroundVideoAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      expect(media.engine.context.mediaElement.get()).toBe(el);
    });

    it('clears mediaElement in context when detached', () => {
      const media = new HlsBackgroundVideoAdapterCore();

      media.attach(document.createElement('video'));
      media.detach();
      expect(media.engine.context.mediaElement.get()).toBeUndefined();
    });

    it('keeps the attached element through a src change', () => {
      // The engine instance and the element both survive re-resolution, so
      // neither has to be rewired.
      const media = new HlsBackgroundVideoAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      media.src = 'https://example.com/v.m3u8';
      expect(media.engine.context.mediaElement.get()).toBe(el);
    });

    it('detach does not destroy the engine', () => {
      const media = new HlsBackgroundVideoAdapterCore();

      media.attach(document.createElement('video'));
      const spy = vi.spyOn(media.engine, 'destroy');

      media.detach();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // The adapter declares none of these — a host-bound Media inherits them, and
  // `attach` is the one place the fixed behavior is written.
  describe('fixed playback behavior', () => {
    it('fixes loop, muted, autoplay, and preload on the element at attach', () => {
      const media = new HlsBackgroundVideoAdapterCore();
      const el = document.createElement('video');

      // Start in the opposite state so attach is what we observe.
      el.loop = false;
      el.muted = false;
      el.autoplay = false;
      el.preload = 'none';

      media.attach(el);

      expect(el.loop).toBe(true);
      expect(el.muted).toBe(true);
      expect(el.autoplay).toBe(true);
      expect(el.preload).toBe('auto');
    });

    it('re-applies them to a second element', () => {
      const media = new HlsBackgroundVideoAdapterCore();

      media.attach(document.createElement('video'));

      const next = document.createElement('video');

      next.loop = false;
      next.muted = false;
      next.autoplay = false;
      next.preload = 'none';
      media.attach(next);

      expect(next.loop).toBe(true);
      expect(next.muted).toBe(true);
      expect(next.autoplay).toBe(true);
      expect(next.preload).toBe('auto');
    });

    it('leaves the element alone on a src change', () => {
      // `attach` is the only writer, so a consumer that turned one of these off
      // afterwards keeps that state across re-resolution.
      const media = new HlsBackgroundVideoAdapterCore();
      const el = document.createElement('video');

      media.attach(el);
      el.loop = false;
      el.muted = false;

      media.src = 'https://example.com/v.m3u8';

      expect(el.loop).toBe(false);
      expect(el.muted).toBe(false);
    });
  });

  describe('rendition selection', () => {
    // Pre-resolved 4-track presentation. Setting it on `engine.state.presentation`
    // drives the composition through `presentation-unresolved → resolved`, which
    // is what fires the picker.
    const presentationWithFourTracks = (): MaybeResolvedPresentation => ({
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
                videoTrack('360p', 640, 360, 500_000),
                videoTrack('720p', 1280, 720, 2_000_000),
                videoTrack('1080p', 1920, 1080, 4_000_000),
                videoTrack('1440p', 2560, 1440, 8_000_000),
              ],
            },
          ],
        },
      ],
    });

    it('caps the pick to the screen when the manifest offers more than it can show', async () => {
      const media = new HlsBackgroundVideoAdapterCore();

      // 1080p (2,073,600) is over a 1,555,200 px screen; 720p (921,600) fits.
      media.engine.state.screenResolution.set({ width: 1440, height: 1080 });
      media.engine.state.presentation.set(presentationWithFourTracks());
      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(media.engine.state.selectedVideoTrackId.get()).toBe('720p');
      media.destroy();
    });

    it('honors a config-supplied rule chain, overriding the engine default', async () => {
      // The adapter supplies no selection config of its own, so a consumer's chain
      // replaces the engine's `[screenResolutionCap, preferHighestResolution]`
      // default outright — screen cap included, hence no screen written here.
      const media = new HlsBackgroundVideoAdapterCore({
        config: {
          videoRules: [(tracks: readonly { id: string }[]) => tracks.filter((track) => track.id === '360p')],
        },
      });

      media.engine.state.presentation.set(presentationWithFourTracks());
      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(media.engine.state.selectedVideoTrackId.get()).toBe('360p');
      media.destroy();
    });
  });

  // ---------------------------------------------------------------------------
  // Error surface — error / 'error' event. The only signal an unplayable source
  // produces here: the inner <video> stays at readyState 0 with `error` null.
  // ---------------------------------------------------------------------------
  describe('error surface', () => {
    class TestAdapter extends HlsBackgroundVideoMixin(EventTarget) {}

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

    it('surfaces a reported fatal condition and fires error', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      // A verdict with nothing unsupported behind it keeps its own code. No
      // message: viewer-facing copy is the consumer's to localize from the code.
      expect(media.error).toEqual({ code: SVTA_NO_SUPPORTED_VIDEO_TRACK, message: '' });
      expect(fired).toHaveLength(1);
      media.destroy();
    });

    it('surfaces a cause with no verdict behind it — the pinned variant never re-picks', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      // What an MPEG-TS source actually produces here (measured on Chromium): a
      // cause against the pinned rendition and nothing else, because only the
      // pick's playlist resolves and dropping it is final. Verdict-only fatality
      // would leave this a silent stall.
      const data = { trackType: 'video', trackId: 'v1', mimeType: 'video/mp2t' };

      media.engine.state.errors.set([{ code: SVTA_UNSUPPORTED_VIDEO_FORMAT, data }]);
      await flush();

      // Surfaced as the unimplemented-capability code, like the other two Medias:
      // no retry, CDN, or rendition fixes it. The reporter's context rides along.
      expect(media.error).toEqual({ code: SVTA_UNSUPPORTED_PLAYBACK_FEATURE, message: '', data });
      expect(fired).toHaveLength(1);
      media.destroy();
    });

    it('surfaces the same code for an encrypted pick', async () => {
      const media = new TestAdapter();

      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_DRM_SYSTEM, data: { trackType: 'video', trackId: 'v1' } },
      ]);
      await flush();

      // One code for both: the consumer's situation is identical either way, and
      // the specifics stay on `engine.state.errors` and the console.
      expect(media.error?.code).toBe(SVTA_UNSUPPORTED_PLAYBACK_FEATURE);
      media.destroy();
    });

    it('logs the explanation once, with the conditions attached', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const media = new TestAdapter();

        media.engine.state.errors.set([{ code: SVTA_UNSUPPORTED_VIDEO_FORMAT, data: { trackType: 'video' } }]);
        await flush();
        media.engine.state.errors.set([
          { code: SVTA_UNSUPPORTED_VIDEO_FORMAT, data: { trackType: 'video' } },
          { code: SVTA_NO_SUPPORTED_VIDEO_TRACK },
        ]);
        await flush();

        // The prose is console-only — `error.message` stays empty — and a later
        // append must not repeat it.
        const logged = spy.mock.calls.filter(([message]) => message === UNPLAYABLE_SOURCE_MESSAGE);

        expect(logged).toHaveLength(1);
        expect(logged[0]?.[1]).toEqual({
          conditions: [{ code: SVTA_UNSUPPORTED_VIDEO_FORMAT, data: { trackType: 'video' } }],
        });
        media.destroy();
      } finally {
        spy.mockRestore();
      }
    });

    it('explains a source with no video renditions too, not only a substituted code', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const media = new TestAdapter();

        // The shape that used to reach a developer as a bare 2011: a verdict with
        // no cause behind it, so nothing was substituted and nothing was said.
        media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
        await flush();

        expect(spy.mock.calls.filter(([message]) => message === UNPLAYABLE_SOURCE_MESSAGE)).toHaveLength(1);
        expect(media.error?.code).toBe(SVTA_NO_SUPPORTED_VIDEO_TRACK);
        media.destroy();
      } finally {
        spy.mockRestore();
      }
    });

    it('ignores a condition outside the fatal set', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      // 2039 (manifest feature unsupported) is the degraded-but-playable tier.
      media.engine.state.errors.set([{ code: 2039 }]);
      await flush();

      expect(media.error).toBeNull();
      expect(fired).toHaveLength(0);
      media.destroy();
    });

    it('carries the first fatal condition data even when the code is substituted', async () => {
      const media = new TestAdapter();

      // Sequence order is causal, so the cause is the one whose context rides
      // along, while both conditions collapse to the same surfaced code.
      media.engine.state.errors.set([
        { code: SVTA_UNSUPPORTED_VIDEO_FORMAT, data: { trackType: 'video', trackId: 'v1' } },
        { code: SVTA_NO_SUPPORTED_VIDEO_TRACK },
      ]);
      await flush();

      expect(media.error?.code).toBe(SVTA_UNSUPPORTED_PLAYBACK_FEATURE);
      expect(media.error?.data).toEqual({ trackType: 'video', trackId: 'v1' });
      media.destroy();
    });

    it('fires once per distinct condition, not per re-report', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();
      // A later append leaves the first fatal in place; the surface must not
      // re-fire for the condition it already announced.
      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }, { code: 2039 }]);
      await flush();

      expect(fired).toHaveLength(1);
      media.destroy();
    });

    it('clears when the sequence resets for a new source', async () => {
      const media = new TestAdapter();
      const fired: Event[] = [];

      media.addEventListener('error', (event) => fired.push(event));

      media.engine.state.errors.set([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();
      expect(media.error).not.toBeNull();

      // collectErrors clears the slot on source change. Clearing is not itself a
      // failure, so it announces nothing.
      media.engine.state.errors.set(undefined);
      await flush();

      expect(media.error).toBeNull();
      expect(fired).toHaveLength(1);
      media.destroy();
    });
  });

  describe('play()', () => {
    it.each(['src change', 'detach', 'destroy'] as const)('cancels a pending play retry on %s', async (action) => {
      const media = new HlsBackgroundVideoAdapterCore();
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

    it('retries play() via loadstart when element has no src but adapter has one', async () => {
      const media = new HlsBackgroundVideoAdapterCore();
      const el = document.createElement('video');
      const play = vi
        .spyOn(el, 'play')
        .mockRejectedValueOnce(new Error('no supported sources'))
        .mockResolvedValue(undefined);

      try {
        media.attach(el);
        media.src = 'https://example.com/v.m3u8';
        const pending = media.play();

        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        expect(play).toHaveBeenCalledTimes(1);
        el.dispatchEvent(new Event('loadstart'));
        await pending;
        expect(play).toHaveBeenCalledTimes(2);
      } finally {
        media.destroy();
        play.mockRestore();
      }
    });

    it('rejects when no media element is attached', async () => {
      const media = new HlsBackgroundVideoAdapterCore();

      await expect(media.play()).rejects.toThrow('no media element attached');
    });
  });

  describe('destroy()', () => {
    it('destroys the underlying engine', () => {
      const media = new HlsBackgroundVideoAdapterCore();
      const spy = vi.spyOn(media.engine, 'destroy');

      media.destroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});

function videoTrack(id: string, width: number, height: number, bandwidth: number) {
  return {
    type: 'video' as const,
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
  } as never;
}
