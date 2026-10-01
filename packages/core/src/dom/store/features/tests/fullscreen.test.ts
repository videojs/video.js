import { HTMLVideoAdapter } from '@videojs/media/dom';
import { createStore } from '@videojs/store';
import type { WebKitVideoElement } from '@videojs/utils/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { selectFullscreen } from '../../selectors';
import { fullscreenFeature } from '../fullscreen';

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

describe('fullscreenFeature', () => {
  describe('attach', () => {
    it('exposes the fullscreen slice name for selectors', () => {
      expect(fullscreenFeature.name).toBe('fullscreen');
      expect(selectFullscreen.displayName).toBe('fullscreen');
    });

    it('detects fullscreen availability when supported', () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();
      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container: null });

      expect(store.state.fullscreenAvailability).toBe('available');
    });

    it('detects fullscreen unavailable when not supported', () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();
      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container: null });

      expect(store.state.fullscreenAvailability).toBe('unsupported');
    });

    it('detects fullscreen availability via webkitSetPresentationMode (iOS Safari)', () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        writable: true,
        configurable: true,
      });

      // Simulate iOS Safari: webkitSetPresentationMode on video prototype
      const proto = HTMLVideoElement.prototype as WebKitVideoElement;
      const original = proto.webkitSetPresentationMode;

      proto.webkitSetPresentationMode = () => {};

      const video = createMockVideo();
      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container: null });

      expect(store.state.fullscreenAvailability).toBe('available');

      if (original) {
        proto.webkitSetPresentationMode = original;
      } else {
        delete proto.webkitSetPresentationMode;
      }
    });

    it('syncs fullscreen on webkitpresentationmodechanged event (iOS Safari)', () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo() as HTMLVideoElement & WebKitVideoElement;

      video.webkitPresentationMode = 'inline';

      const container = document.createElement('div');
      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container });

      expect(store.state.isFullscreen).toBe(false);

      // Simulate entering fullscreen via WebKit presentation mode
      video.webkitPresentationMode = 'fullscreen';
      video.dispatchEvent(new Event('webkitpresentationmodechanged'));

      expect(store.state.isFullscreen).toBe(true);

      // Simulate exiting
      video.webkitPresentationMode = 'inline';
      video.dispatchEvent(new Event('webkitpresentationmodechanged'));

      expect(store.state.isFullscreen).toBe(false);
    });

    it('updates fullscreen on fullscreenchange event', () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();
      const container = document.createElement('div');

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container });

      expect(store.state.isFullscreen).toBe(false);

      // Simulate entering fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: container,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('fullscreenchange'));

      expect(store.state.isFullscreen).toBe(true);

      // Simulate exiting fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('fullscreenchange'));

      expect(store.state.isFullscreen).toBe(false);
    });

    it('detects fullscreen via :fullscreen pseudo-class when container is in a shadow tree', () => {
      // When `requestFullscreen()` is called on an element inside a shadow
      // tree, `document.fullscreenElement` returns the shadow host — not the
      // actual fullscreen element. The `:fullscreen` pseudo-class matches the
      // real fullscreen element across shadow boundaries.
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();
      const shadowHost = document.createElement('div');
      const container = document.createElement('div');
      const matchesSpy = vi.spyOn(container, 'matches').mockImplementation((selector) => selector === ':fullscreen');

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container });

      Object.defineProperty(document, 'fullscreenElement', {
        value: shadowHost,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('fullscreenchange'));

      expect(store.state.isFullscreen).toBe(true);

      matchesSpy.mockReturnValue(false);
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('fullscreenchange'));

      expect(store.state.isFullscreen).toBe(false);
      matchesSpy.mockRestore();
    });

    it('detects fullscreen via :fullscreen pseudo-class on the media element', () => {
      // When the inner `<video>` of a custom media element is fullscreened
      // directly (e.g. via native controls), `document.fullscreenElement`
      // points to a different element, but `:fullscreen` matches the media
      // element because the fullscreen flag propagates to ancestors across
      // shadow boundaries.
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();
      const container = document.createElement('div');
      const unrelated = document.createElement('div');
      const matchesSpy = vi.spyOn(video, 'matches').mockImplementation((selector) => selector === ':fullscreen');

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container });

      Object.defineProperty(document, 'fullscreenElement', {
        value: unrelated,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('fullscreenchange'));

      expect(store.state.isFullscreen).toBe(true);
      matchesSpy.mockRestore();
    });

    it('stops listening when store is destroyed', () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();
      const container = document.createElement('div');

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container });

      store.destroy();

      // Simulate entering fullscreen after destroy
      Object.defineProperty(document, 'fullscreenElement', {
        value: container,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(new Event('fullscreenchange'));

      // State should not update after destroy
      expect(store.state.isFullscreen).toBe(false);
    });
  });

  describe('actions', () => {
    it('requestFullscreen() calls requestFullscreen on container', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo();
      const container = document.createElement('div');

      container.requestFullscreen = vi.fn().mockResolvedValue(undefined);

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container });

      await store.requestFullscreen();

      expect(container.requestFullscreen).toHaveBeenCalled();
    });

    it('requestFullscreen() falls back to media when no container', async () => {
      const video = createMockVideo();

      video.requestFullscreen = vi.fn().mockResolvedValue(undefined);

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container: null });

      await store.requestFullscreen();

      expect(video.requestFullscreen).toHaveBeenCalled();
    });

    it('exitFullscreen() calls document.exitFullscreen', async () => {
      const originalExit = document.exitFullscreen;

      document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

      const video = createMockVideo();

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container: null });

      await store.exitFullscreen();

      expect(document.exitFullscreen).toHaveBeenCalled();

      document.exitFullscreen = originalExit;
    });

    it('requestFullscreen() uses webkitSetPresentationMode when element fullscreen is unsupported (iOS Safari)', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo() as HTMLVideoElement & WebKitVideoElement;

      video.webkitSetPresentationMode = vi.fn();
      const container = document.createElement('div');

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container });

      await store.requestFullscreen();

      expect(video.webkitSetPresentationMode).toHaveBeenCalledWith('fullscreen');
    });

    it('exitFullscreen() uses webkitSetPresentationMode first when available (iOS Safari)', async () => {
      const originalExit = document.exitFullscreen;

      document.exitFullscreen = vi.fn();

      const video = createMockVideo() as HTMLVideoElement & WebKitVideoElement;

      video.webkitPresentationMode = 'fullscreen';
      video.webkitSetPresentationMode = vi.fn();

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container: null });

      await store.exitFullscreen();

      expect(video.webkitSetPresentationMode).toHaveBeenCalledWith('inline');
      expect(document.exitFullscreen).not.toHaveBeenCalled();

      document.exitFullscreen = originalExit;
    });
  });

  describe('transitions', () => {
    it('requestFullscreen() exits PiP first when entering fullscreen', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      let resolveExit!: () => void;
      const exit = new Promise<void>((resolve) => {
        resolveExit = resolve;
      });

      document.exitPictureInPicture = vi.fn(() => exit);

      const video = createMockVideo();
      const container = document.createElement('div');

      container.requestFullscreen = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(document, 'pictureInPictureElement', {
        value: video,
        writable: true,
        configurable: true,
      });

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container });

      const request = store.requestFullscreen();

      try {
        expect(document.exitPictureInPicture).toHaveBeenCalledOnce();
        await Promise.resolve();
        expect(container.requestFullscreen).not.toHaveBeenCalled();
      } finally {
        resolveExit();
      }

      await request;
      expect(container.requestFullscreen).toHaveBeenCalledOnce();
    });

    it('requestFullscreen() does not exit PiP if not active', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const originalExit = document.exitPictureInPicture;

      document.exitPictureInPicture = vi.fn().mockResolvedValue(undefined);

      const video = createMockVideo();
      const container = document.createElement('div');

      container.requestFullscreen = vi.fn().mockResolvedValue(undefined);

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: video, container });

      await store.requestFullscreen();

      expect(document.exitPictureInPicture).not.toHaveBeenCalled();
      expect(container.requestFullscreen).toHaveBeenCalled();

      document.exitPictureInPicture = originalExit;
    });
  });
});

describe('fullscreenFeature with HTMLVideoAdapter', () => {
  describe('attach', () => {
    it('reflects host.isFullscreen when document.fullscreenElement is the underlying video', () => {
      const video = createMockVideo();
      const host = new HTMLVideoAdapter();

      host.attach(video);

      Object.defineProperty(document, 'fullscreenElement', {
        value: video,
        writable: true,
        configurable: true,
      });

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: host, container: null });

      expect(store.state.isFullscreen).toBe(true);
    });

    it('syncs fullscreen on webkitpresentationmodechanged forwarded from target (iOS Safari)', () => {
      const video = createMockVideo() as HTMLVideoElement & WebKitVideoElement;

      video.webkitPresentationMode = 'inline';
      const container = document.createElement('div');
      const host = new HTMLVideoAdapter();

      host.attach(video);

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: host, container });

      expect(store.state.isFullscreen).toBe(false);

      video.webkitPresentationMode = 'fullscreen';
      video.dispatchEvent(new Event('webkitpresentationmodechanged'));

      expect(store.state.isFullscreen).toBe(true);

      video.webkitPresentationMode = 'inline';
      video.dispatchEvent(new Event('webkitpresentationmodechanged'));

      expect(store.state.isFullscreen).toBe(false);
    });
  });

  describe('actions', () => {
    it('requestFullscreen() falls back to host.requestFullscreen when no container', async () => {
      const video = createMockVideo();

      video.requestFullscreen = vi.fn().mockResolvedValue(undefined);
      const host = new HTMLVideoAdapter();

      host.attach(video);

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: host, container: null });

      await store.requestFullscreen();

      expect(video.requestFullscreen).toHaveBeenCalled();
    });

    it('requestFullscreen() prefers webkitSetPresentationMode on the underlying video (iOS Safari)', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: false,
        writable: true,
        configurable: true,
      });

      const video = createMockVideo() as HTMLVideoElement & WebKitVideoElement;

      video.webkitSetPresentationMode = vi.fn();
      const container = document.createElement('div');
      const host = new HTMLVideoAdapter();

      host.attach(video);

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: host, container });

      await store.requestFullscreen();

      expect(video.webkitSetPresentationMode).toHaveBeenCalledWith('fullscreen');
      expect(vi.mocked(video.webkitSetPresentationMode).mock.contexts).toEqual([video]);
    });
  });

  describe('transitions', () => {
    it('requestFullscreen() exits PiP first if active', async () => {
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
        configurable: true,
      });

      const originalExit = document.exitPictureInPicture;

      document.exitPictureInPicture = vi.fn().mockResolvedValue(undefined);

      const video = createMockVideo();
      const container = document.createElement('div');

      container.requestFullscreen = vi.fn().mockResolvedValue(undefined);
      const host = new HTMLVideoAdapter();

      host.attach(video);

      Object.defineProperty(document, 'pictureInPictureElement', {
        value: video,
        writable: true,
        configurable: true,
      });

      const store = createStore<PlayerTarget>()(fullscreenFeature);

      store.attach({ media: host, container });

      await store.requestFullscreen();

      expect(document.exitPictureInPicture).toHaveBeenCalled();
      expect(container.requestFullscreen).toHaveBeenCalled();

      document.exitPictureInPicture = originalExit;
      Object.defineProperty(document, 'pictureInPictureElement', {
        value: null,
        writable: true,
        configurable: true,
      });
    });
  });
});
