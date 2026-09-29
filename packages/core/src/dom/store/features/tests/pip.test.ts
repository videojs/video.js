import { HTMLVideoAdapter } from '@videojs/media/dom';
import { createStore } from '@videojs/store';
import type { WebKitVideoElement } from '@videojs/utils/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { pipFeature } from '../pip';

function enablePictureInPicture() {
  Object.defineProperty(document, 'pictureInPictureEnabled', {
    value: true,
    writable: true,
    configurable: true,
  });
}

/**
 * A video element as a browser that supports picture-in-picture presents one. happy-dom implements neither the method
 * nor the property, so a bare element reads as media that cannot enter picture-in-picture at all.
 */
function createPipCapableVideo(): HTMLVideoElement {
  const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });

  video.requestPictureInPicture = async () => ({}) as PictureInPictureWindow;
  return video;
}

describe('pipFeature', () => {
  let originalPictureInPictureEnabled: boolean | undefined;

  beforeEach(() => {
    originalPictureInPictureEnabled = document.pictureInPictureEnabled;
  });

  afterEach(() => {
    Object.defineProperty(document, 'pictureInPictureEnabled', {
      value: originalPictureInPictureEnabled,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document, 'pictureInPictureElement', {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  describe('attach', () => {
    it('syncs initial state on attach', () => {
      const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      expect(store.state.isPictureInPicture).toBe(false);
    });

    it('detects PiP availability when supported', () => {
      enablePictureInPicture();

      const video = createPipCapableVideo();
      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      expect(store.state.pictureInPictureAvailability).toBe('available');
    });

    it('keeps PiP unavailable until metadata is loaded', () => {
      enablePictureInPicture();

      const video = createPipCapableVideo();

      Object.defineProperty(video, 'readyState', {
        value: HTMLMediaElement.HAVE_NOTHING,
        configurable: true,
      });
      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      expect(store.state.pictureInPictureAvailability).toBe('unavailable');

      Object.defineProperty(video, 'readyState', {
        value: HTMLMediaElement.HAVE_METADATA,
        configurable: true,
      });
      video.dispatchEvent(new Event('loadedmetadata'));

      expect(store.state.pictureInPictureAvailability).toBe('available');
    });

    it('reports media that cannot enter PiP as unsupported', () => {
      enablePictureInPicture();

      // What an iframe embed looks like when its provider has no
      // picture-in-picture: the browser offers it, this media cannot use it.
      const media = createMockVideo();
      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media, container: null });

      expect(store.state.pictureInPictureAvailability).toBe('unsupported');
    });

    it('reports WebKit presentation mode as available', () => {
      enablePictureInPicture();

      // iPhone Safari reaches picture-in-picture through presentation mode rather
      // than through `requestPictureInPicture`, so the media is capable without it.
      const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA }) as WebKitVideoElement;

      video.webkitSetPresentationMode = () => {};
      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      expect(store.state.pictureInPictureAvailability).toBe('available');
    });

    it('updates pip on PiP events', () => {
      Object.defineProperty(document, 'pictureInPictureEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      expect(store.state.isPictureInPicture).toBe(false);

      // Simulate entering PiP
      Object.defineProperty(document, 'pictureInPictureElement', {
        value: video,
        writable: true,
        configurable: true,
      });
      video.dispatchEvent(new Event('enterpictureinpicture'));

      expect(store.state.isPictureInPicture).toBe(true);

      // Simulate exiting PiP
      Object.defineProperty(document, 'pictureInPictureElement', {
        value: null,
        writable: true,
        configurable: true,
      });
      video.dispatchEvent(new Event('leavepictureinpicture'));

      expect(store.state.isPictureInPicture).toBe(false);
    });

    it('syncs pip on webkitpresentationmodechanged event (iOS Safari)', () => {
      const video = createMockVideo({
        readyState: HTMLMediaElement.HAVE_METADATA,
      }) as HTMLVideoElement & WebKitVideoElement;

      video.webkitPresentationMode = 'inline';

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      expect(store.state.isPictureInPicture).toBe(false);

      // Simulate entering PiP via WebKit presentation mode
      video.webkitPresentationMode = 'picture-in-picture';
      video.dispatchEvent(new Event('webkitpresentationmodechanged'));

      expect(store.state.isPictureInPicture).toBe(true);

      // Simulate exiting
      video.webkitPresentationMode = 'inline';
      video.dispatchEvent(new Event('webkitpresentationmodechanged'));

      expect(store.state.isPictureInPicture).toBe(false);
    });
  });

  describe('actions', () => {
    it('requestPictureInPicture() rejects before metadata is loaded', async () => {
      const video = createPipCapableVideo();

      Object.defineProperty(video, 'readyState', {
        value: HTMLMediaElement.HAVE_NOTHING,
        configurable: true,
      });
      video.requestPictureInPicture = vi.fn().mockResolvedValue({});
      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      await expect(store.requestPictureInPicture()).rejects.toMatchObject({ name: 'InvalidStateError' });
      expect(video.requestPictureInPicture).not.toHaveBeenCalled();
    });

    it('requestPictureInPicture() stays in fullscreen when it rejects before metadata is loaded', async () => {
      const originalExit = document.exitFullscreen;
      const video = createPipCapableVideo();
      const container = document.createElement('div');

      document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(video, 'readyState', {
        value: HTMLMediaElement.HAVE_NOTHING,
        configurable: true,
      });
      Object.defineProperty(document, 'fullscreenElement', {
        value: container,
        writable: true,
        configurable: true,
      });
      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container });

      try {
        await expect(store.requestPictureInPicture()).rejects.toMatchObject({ name: 'InvalidStateError' });
        expect(document.exitFullscreen).not.toHaveBeenCalled();
      } finally {
        document.exitFullscreen = originalExit;
        Object.defineProperty(document, 'fullscreenElement', { value: null, writable: true, configurable: true });
      }
    });

    it('requestPictureInPicture() calls requestPictureInPicture on video', async () => {
      const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });

      video.requestPictureInPicture = vi.fn().mockResolvedValue({});

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      await store.requestPictureInPicture();

      expect(video.requestPictureInPicture).toHaveBeenCalled();
    });

    it('requestPictureInPicture() uses webkitSetPresentationMode first when available (iOS Safari)', async () => {
      const video = createMockVideo({
        readyState: HTMLMediaElement.HAVE_METADATA,
      }) as HTMLVideoElement & WebKitVideoElement;

      video.requestPictureInPicture = vi.fn().mockResolvedValue({});
      video.webkitSetPresentationMode = vi.fn();

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      await store.requestPictureInPicture();

      expect(video.webkitSetPresentationMode).toHaveBeenCalledWith('picture-in-picture');
      expect(video.requestPictureInPicture).not.toHaveBeenCalled();
    });

    it('exitPictureInPicture() calls document.exitPictureInPicture', async () => {
      const originalExit = document.exitPictureInPicture;

      document.exitPictureInPicture = vi.fn().mockResolvedValue(undefined);

      const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });

      // Set the video as the current PiP element
      Object.defineProperty(document, 'pictureInPictureElement', {
        value: video,
        writable: true,
        configurable: true,
      });

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      await store.exitPictureInPicture();

      expect(document.exitPictureInPicture).toHaveBeenCalled();

      document.exitPictureInPicture = originalExit;
    });

    it('exitPictureInPicture() calls document.exitPictureInPicture even without pictureInPictureElement', async () => {
      const originalExit = document.exitPictureInPicture;

      document.exitPictureInPicture = vi.fn().mockResolvedValue(undefined);

      const video = createMockVideo();

      Object.defineProperty(document, 'pictureInPictureElement', {
        value: null,
        writable: true,
        configurable: true,
      });

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      await store.exitPictureInPicture();

      expect(document.exitPictureInPicture).toHaveBeenCalled();

      document.exitPictureInPicture = originalExit;
    });
  });

  describe('transitions', () => {
    it('requestPictureInPicture() exits fullscreen first if active', async () => {
      const originalExit = document.exitFullscreen;

      document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

      const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });

      video.requestPictureInPicture = vi.fn().mockResolvedValue({});
      const container = document.createElement('div');

      // Set fullscreen as active
      Object.defineProperty(document, 'fullscreenElement', {
        value: container,
        writable: true,
        configurable: true,
      });

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container });

      await store.requestPictureInPicture();

      expect(document.exitFullscreen).toHaveBeenCalled();
      expect(video.requestPictureInPicture).toHaveBeenCalled();

      document.exitFullscreen = originalExit;
    });

    it('requestPictureInPicture() does not exit fullscreen if not active', async () => {
      const originalExit = document.exitFullscreen;

      document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

      const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });

      video.requestPictureInPicture = vi.fn().mockResolvedValue({});

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: video, container: null });

      await store.requestPictureInPicture();

      expect(document.exitFullscreen).not.toHaveBeenCalled();
      expect(video.requestPictureInPicture).toHaveBeenCalled();

      document.exitFullscreen = originalExit;
    });
  });
});

describe('pipFeature with HTMLVideoAdapter', () => {
  let originalPictureInPictureEnabled: boolean | undefined;

  beforeEach(() => {
    originalPictureInPictureEnabled = document.pictureInPictureEnabled;
  });

  afterEach(() => {
    Object.defineProperty(document, 'pictureInPictureEnabled', {
      value: originalPictureInPictureEnabled,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(document, 'pictureInPictureElement', {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  describe('attach', () => {
    it('syncs initial state on attach', () => {
      const video = createMockVideo();
      const host = new HTMLVideoAdapter();

      host.attach(video);

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: host, container: null });

      expect(store.state.isPictureInPicture).toBe(false);
    });

    it('reflects host.isPictureInPicture when document PiP element is the underlying video', () => {
      Object.defineProperty(document, 'pictureInPictureEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();
      const host = new HTMLVideoAdapter();

      host.attach(video);

      Object.defineProperty(document, 'pictureInPictureElement', {
        value: video,
        writable: true,
        configurable: true,
      });

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: host, container: null });

      expect(store.state.isPictureInPicture).toBe(true);
    });

    it('updates pip on PiP events forwarded from target', () => {
      Object.defineProperty(document, 'pictureInPictureEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();
      const host = new HTMLVideoAdapter();

      host.attach(video);

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: host, container: null });

      expect(store.state.isPictureInPicture).toBe(false);

      Object.defineProperty(document, 'pictureInPictureElement', {
        value: video,
        writable: true,
        configurable: true,
      });
      video.dispatchEvent(new Event('enterpictureinpicture'));

      expect(store.state.isPictureInPicture).toBe(true);

      Object.defineProperty(document, 'pictureInPictureElement', {
        value: null,
        writable: true,
        configurable: true,
      });
      video.dispatchEvent(new Event('leavepictureinpicture'));

      expect(store.state.isPictureInPicture).toBe(false);
    });

    it('syncs pip on webkitpresentationmodechanged forwarded from target (iOS Safari)', () => {
      const video = createMockVideo() as HTMLVideoElement & WebKitVideoElement;

      video.webkitPresentationMode = 'inline';
      const host = new HTMLVideoAdapter();

      host.attach(video);

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: host, container: null });

      expect(store.state.isPictureInPicture).toBe(false);

      video.webkitPresentationMode = 'picture-in-picture';
      video.dispatchEvent(new Event('webkitpresentationmodechanged'));

      expect(store.state.isPictureInPicture).toBe(true);

      video.webkitPresentationMode = 'inline';
      video.dispatchEvent(new Event('webkitpresentationmodechanged'));

      expect(store.state.isPictureInPicture).toBe(false);
    });
  });

  describe('actions', () => {
    it('requestPictureInPicture() delegates to underlying video', async () => {
      const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });

      video.requestPictureInPicture = vi.fn().mockResolvedValue({});
      const host = new HTMLVideoAdapter();

      host.attach(video);

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: host, container: null });

      await store.requestPictureInPicture();

      expect(video.requestPictureInPicture).toHaveBeenCalled();
    });

    it('requestPictureInPicture() prefers webkitSetPresentationMode on the underlying video (iOS Safari)', async () => {
      const video = createMockVideo({
        readyState: HTMLMediaElement.HAVE_METADATA,
      }) as HTMLVideoElement & WebKitVideoElement;

      video.requestPictureInPicture = vi.fn().mockResolvedValue({});
      video.webkitSetPresentationMode = vi.fn();
      const host = new HTMLVideoAdapter();

      host.attach(video);

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: host, container: null });

      await store.requestPictureInPicture();

      expect(video.webkitSetPresentationMode).toHaveBeenCalledWith('picture-in-picture');
      expect(video.requestPictureInPicture).not.toHaveBeenCalled();
    });

    it('exitPictureInPicture() calls document.exitPictureInPicture when underlying video is the PiP element', async () => {
      const originalExit = document.exitPictureInPicture;

      document.exitPictureInPicture = vi.fn().mockResolvedValue(undefined);

      const video = createMockVideo();
      const host = new HTMLVideoAdapter();

      host.attach(video);

      Object.defineProperty(document, 'pictureInPictureElement', {
        value: video,
        writable: true,
        configurable: true,
      });

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: host, container: null });

      await store.exitPictureInPicture();

      expect(document.exitPictureInPicture).toHaveBeenCalled();

      document.exitPictureInPicture = originalExit;
    });
  });

  describe('transitions', () => {
    it('requestPictureInPicture() exits fullscreen first if active', async () => {
      const originalExit = document.exitFullscreen;

      document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

      const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });

      video.requestPictureInPicture = vi.fn().mockResolvedValue({});
      const container = document.createElement('div');
      const host = new HTMLVideoAdapter();

      host.attach(video);

      Object.defineProperty(document, 'fullscreenElement', {
        value: container,
        writable: true,
        configurable: true,
      });

      const store = createStore<PlayerTarget>()(pipFeature);

      store.attach({ media: host, container });

      await store.requestPictureInPicture();

      expect(document.exitFullscreen).toHaveBeenCalled();
      expect(video.requestPictureInPicture).toHaveBeenCalled();

      document.exitFullscreen = originalExit;
    });
  });
});
