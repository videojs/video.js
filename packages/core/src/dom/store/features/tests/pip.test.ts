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
 * A video element as a browser that supports picture-in-picture presents one. jsdom implements neither the method nor
 * the property, so a bare element reads as media that cannot enter picture-in-picture at all.
 */
function createPipCapableVideo(): HTMLVideoElement {
  const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });

  video.requestPictureInPicture = async () => ({}) as PictureInPictureWindow;
  return video;
}

const presentationProperties = [
  'fullscreenEnabled',
  'fullscreenElement',
  'pictureInPictureEnabled',
  'pictureInPictureElement',
  'exitFullscreen',
  'exitPictureInPicture',
] as const;
let originalProperties: (PropertyDescriptor | undefined)[];
let originalWebkitMethod: PropertyDescriptor | undefined;

beforeEach(() => {
  originalProperties = presentationProperties.map((key) => Object.getOwnPropertyDescriptor(document, key));
  originalWebkitMethod = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'webkitSetPresentationMode');
});

afterEach(() => {
  for (const [index, key] of presentationProperties.entries()) {
    const original = originalProperties[index];

    if (original) Object.defineProperty(document, key, original);
    else Reflect.deleteProperty(document, key);
  }

  if (originalWebkitMethod) {
    Object.defineProperty(HTMLVideoElement.prototype, 'webkitSetPresentationMode', originalWebkitMethod);
  } else {
    Reflect.deleteProperty(HTMLVideoElement.prototype, 'webkitSetPresentationMode');
  }

  vi.unstubAllGlobals();
});

describe('pipFeature', () => {
  describe('attach', () => {
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
      let resolveExit!: () => void;
      const exit = new Promise<void>((resolve) => {
        resolveExit = resolve;
      });

      document.exitFullscreen = vi.fn(() => exit);

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

      const request = store.requestPictureInPicture();

      try {
        expect(document.exitFullscreen).toHaveBeenCalledOnce();
        await Promise.resolve();
        expect(video.requestPictureInPicture).not.toHaveBeenCalled();
      } finally {
        resolveExit();
      }

      await request;
      expect(video.requestPictureInPicture).toHaveBeenCalledOnce();
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
  describe('attach', () => {
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
      expect(vi.mocked(video.webkitSetPresentationMode).mock.contexts).toEqual([video]);
      expect(video.requestPictureInPicture).not.toHaveBeenCalled();
    });
  });
});
