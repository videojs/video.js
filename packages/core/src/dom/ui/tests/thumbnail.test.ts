import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { type CreateThumbnailOptions, createThumbnail } from '../thumbnail';

// --- ResizeObserver stub (jsdom lacks it) ---

class ResizeObserverStub {
  callback: ResizeObserverCallback;
  static instances: ResizeObserverStub[] = [];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverStub.instances.push(this);
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

vi.stubGlobal('ResizeObserver', ResizeObserverStub);

afterEach(() => {
  ResizeObserverStub.instances.length = 0;
});

// --- Helpers ---

function createMockImg(): HTMLImageElement {
  const img = document.createElement('img');

  Object.defineProperty(img, 'naturalWidth', { value: 2560, writable: true, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { value: 1600, writable: true, configurable: true });

  return img;
}

function createMockContainer(): HTMLElement {
  return document.createElement('div');
}

function createOptions(overrides: Partial<CreateThumbnailOptions> = {}): CreateThumbnailOptions {
  return {
    getContainer: () => createMockContainer(),
    getImg: () => createMockImg(),
    onStateChange: vi.fn(),
    ...overrides,
  };
}

describe('createThumbnail', () => {
  describe('initial state', () => {
    it('starts with loading false and error false', () => {
      const handle = createThumbnail(createOptions());

      expect(handle.loading).toBe(false);
      expect(handle.error).toBe(false);

      handle.destroy();
    });

    it('starts with zero natural dimensions', () => {
      const handle = createThumbnail(createOptions());

      expect(handle.naturalWidth).toBe(0);
      expect(handle.naturalHeight).toBe(0);

      handle.destroy();
    });
  });

  describe('updateSrc', () => {
    it('sets loading to true when given a new non-empty URL', () => {
      const handle = createThumbnail(createOptions());

      handle.updateSrc('sprite.jpg');

      expect(handle.loading).toBe(true);
      expect(handle.error).toBe(false);

      handle.destroy();
    });

    it('does nothing when called with the same URL', () => {
      const img = createMockImg();
      const handle = createThumbnail(createOptions({ getImg: () => img }));

      handle.updateSrc('sprite.jpg');
      expect(handle.loading).toBe(true);
      img.dispatchEvent(new Event('load'));
      expect(handle.loading).toBe(false);

      handle.updateSrc('sprite.jpg');
      expect(handle.loading).toBe(false);

      handle.destroy();
    });

    it('resets state when URL changes to empty', () => {
      const img = createMockImg();
      const handle = createThumbnail(createOptions({ getImg: () => img }));

      handle.updateSrc('sprite.jpg');
      expect(handle.loading).toBe(true);
      handle.updateSrc(undefined);
      expect(handle.loading).toBe(false);

      handle.updateSrc('sprite.jpg');
      img.dispatchEvent(new Event('load'));
      expect(handle.naturalWidth).toBe(2560);
      expect(handle.naturalHeight).toBe(1600);
      img.dispatchEvent(new Event('error'));
      expect(handle.error).toBe(true);

      handle.updateSrc(undefined);
      expect(handle.loading).toBe(false);
      expect(handle.error).toBe(false);
      expect(handle.naturalWidth).toBe(0);
      expect(handle.naturalHeight).toBe(0);

      handle.destroy();
    });
  });

  describe('img events', () => {
    it('updates natural dimensions and clears loading on img load', () => {
      const img = createMockImg();
      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getImg: () => img,
          onStateChange,
        })
      );

      handle.updateSrc('sprite.jpg');
      expect(handle.loading).toBe(true);

      img.dispatchEvent(new Event('load'));

      expect(handle.loading).toBe(false);
      expect(handle.error).toBe(false);
      expect(handle.naturalWidth).toBe(2560);
      expect(handle.naturalHeight).toBe(1600);
      expect(onStateChange).toHaveBeenCalled();

      handle.destroy();
    });

    it('handles src change: load first image, change src, load second image', () => {
      const img = createMockImg();
      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getImg: () => img,
          onStateChange,
        })
      );

      // First image loads successfully.
      handle.updateSrc('sprite-1.jpg');
      img.dispatchEvent(new Event('load'));

      expect(handle.loading).toBe(false);
      expect(handle.naturalWidth).toBe(2560);

      // Src changes — loading resets.
      handle.updateSrc('sprite-2.jpg');
      expect(handle.loading).toBe(true);

      // Second image loads — same listener catches it.
      Object.defineProperty(img, 'naturalWidth', { value: 1280, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 720, configurable: true });
      img.dispatchEvent(new Event('load'));

      expect(handle.loading).toBe(false);
      expect(handle.naturalWidth).toBe(1280);
      expect(handle.naturalHeight).toBe(720);

      handle.destroy();
    });

    it('moves event handling to a replacement image', () => {
      const first = createMockImg();
      const second = createMockImg();
      const onStateChange = vi.fn();
      let img = first;

      const handle = createThumbnail(
        createOptions({
          getImg: () => img,
          onStateChange,
        })
      );

      handle.updateSrc('sprite.jpg');

      img = second;
      handle.connect();
      onStateChange.mockClear();

      first.dispatchEvent(new Event('error'));
      expect(onStateChange).not.toHaveBeenCalled();

      second.dispatchEvent(new Event('load'));
      expect(handle.loading).toBe(false);
      expect(onStateChange).toHaveBeenCalledOnce();

      handle.destroy();
    });

    it('sets error on img error', () => {
      const img = createMockImg();
      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getImg: () => img,
          onStateChange,
        })
      );

      handle.updateSrc('bad.jpg');
      img.dispatchEvent(new Event('error'));

      expect(handle.loading).toBe(false);
      expect(handle.error).toBe(true);
      expect(onStateChange).toHaveBeenCalled();

      handle.destroy();
    });

    it('returns to a failed sheet without restarting loading', () => {
      const img = createMockImg();
      const handle = createThumbnail(createOptions({ getImg: () => img }));

      handle.updateSrc('bad.jpg');
      img.dispatchEvent(new Event('error'));

      // Scrubbing across the sheet boundary and back.
      handle.updateSrc('good.jpg');
      handle.updateSrc('bad.jpg');

      expect(handle.loading).toBe(false);
      expect(handle.error).toBe(true);

      handle.destroy();
    });

    it('clears a failed sheet once it loads', () => {
      const img = createMockImg();
      const handle = createThumbnail(createOptions({ getImg: () => img }));

      handle.updateSrc('flaky.jpg');
      img.dispatchEvent(new Event('error'));

      handle.updateSrc('good.jpg');
      handle.updateSrc('flaky.jpg');
      expect(handle.error).toBe(true);

      // The renderer assigns the src regardless, so a retry that succeeds recovers.
      img.dispatchEvent(new Event('load'));
      expect(handle.error).toBe(false);

      handle.updateSrc('good.jpg');
      handle.updateSrc('flaky.jpg');

      expect(handle.loading).toBe(true);
      expect(handle.error).toBe(false);

      handle.destroy();
    });

    it('stops listening to img events after destroy', () => {
      const img = createMockImg();
      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getImg: () => img,
          onStateChange,
        })
      );

      // Trigger lazy binding so listeners are actually attached.
      handle.updateSrc('sprite.jpg');

      handle.destroy();
      onStateChange.mockClear();

      img.dispatchEvent(new Event('load'));

      expect(onStateChange).not.toHaveBeenCalled();
    });
  });

  describe('readConstraints', () => {
    it('returns default constraints when no container', () => {
      const handle = createThumbnail(
        createOptions({
          getContainer: () => null,
        })
      );

      const constraints = handle.readConstraints();

      expect(constraints).toEqual({
        minWidth: 0,
        maxWidth: Infinity,
        minHeight: 0,
        maxHeight: Infinity,
      });

      handle.destroy();
    });
  });

  describe('connect', () => {
    it('binds img and ResizeObserver lazily after elements become available', () => {
      let img: HTMLImageElement | null = null;
      let container: HTMLElement | null = null;
      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getContainer: () => container,
          getImg: () => img,
          onStateChange,
        })
      );

      // Before elements exist: no observer created.
      expect(ResizeObserverStub.instances).toHaveLength(0);

      // Simulate elements becoming available (like React refs after mount).
      img = createMockImg();
      container = createMockContainer();

      handle.connect();

      // ResizeObserver should now be set up.
      expect(ResizeObserverStub.instances).toHaveLength(1);
      expect(ResizeObserverStub.instances[0]!.observe).toHaveBeenCalledWith(container);

      handle.destroy();
    });

    it('notifies on container resize so constraints are re-read', () => {
      const container = createMockContainer();
      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getContainer: () => container,
          onStateChange,
        })
      );

      handle.connect();
      onStateChange.mockClear();

      const observer = ResizeObserverStub.instances[0]!;

      // SAFETY: The stub is what `new ResizeObserver()` returns here, and the callback ignores this argument.
      observer.callback([], observer as unknown as ResizeObserver);

      expect(onStateChange).toHaveBeenCalledOnce();

      handle.destroy();
    });

    it('detects already-loaded img on connect', () => {
      const img = createMockImg();

      // Mark the img as already complete (cached image).
      Object.defineProperty(img, 'complete', { value: true, configurable: true });

      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getImg: () => img,
          onStateChange,
        })
      );

      handle.updateSrc('sprite.jpg');
      onStateChange.mockClear();

      handle.connect();

      expect(handle.loading).toBe(false);
      expect(handle.naturalWidth).toBe(2560);
      expect(handle.naturalHeight).toBe(1600);
      expect(onStateChange).toHaveBeenCalledOnce();

      handle.destroy();
    });

    it('React lifecycle: updateSrc before img available, then connect after mount', () => {
      let img: HTMLImageElement | null = null;
      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getImg: () => img,
          onStateChange,
        })
      );

      // 1. Render phase: updateSrc called but img ref is null (not mounted yet).
      handle.updateSrc('sprite.jpg');
      expect(handle.loading).toBe(true);

      // 2. Commit phase: img becomes available (React sets ref) but image is still loading.
      img = document.createElement('img');
      // Simulate a loading image: in a real browser, an img with src set is !complete
      // while the network request is in flight.
      Object.defineProperty(img, 'complete', { value: false, configurable: true });

      // 3. useEffect: connect() binds events and checks img.complete.
      handle.connect();

      // Image is not complete, so loading should remain true.
      expect(handle.loading).toBe(true);

      // 4. Image loads — event listener should catch it.
      Object.defineProperty(img, 'naturalWidth', { value: 2560, configurable: true });
      Object.defineProperty(img, 'naturalHeight', { value: 1600, configurable: true });
      img.dispatchEvent(new Event('load'));

      expect(handle.loading).toBe(false);
      expect(handle.naturalWidth).toBe(2560);
      expect(onStateChange).toHaveBeenCalled();

      handle.destroy();
    });

    it('React lifecycle: handles already-loaded img when ref was null during updateSrc', () => {
      let img: HTMLImageElement | null = null;
      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getImg: () => img,
          onStateChange,
        })
      );

      // 1. Render phase: updateSrc called but img ref is null.
      handle.updateSrc('sprite.jpg');
      expect(handle.loading).toBe(true);

      // 2. Commit phase: img becomes available and is already cached/complete.
      img = createMockImg();
      Object.defineProperty(img, 'complete', { value: true, configurable: true });

      // 3. useEffect: connect() should detect the already-loaded image.
      handle.connect();

      expect(handle.loading).toBe(false);
      expect(handle.naturalWidth).toBe(2560);
      expect(onStateChange).toHaveBeenCalled();

      handle.destroy();
    });

    it('React lifecycle: handles errored img when ref was null during updateSrc', () => {
      let img: HTMLImageElement | null = null;
      const onStateChange = vi.fn();

      const handle = createThumbnail(
        createOptions({
          getImg: () => img,
          onStateChange,
        })
      );

      // 1. Render phase: updateSrc called but img ref is null.
      handle.updateSrc('bad.jpg');
      expect(handle.loading).toBe(true);

      // 2. Commit phase: img becomes available but image errored (complete but no dimensions).
      img = document.createElement('img');
      Object.defineProperty(img, 'complete', { value: true, configurable: true });
      // naturalWidth defaults to 0 in jsdom — simulates an errored image.

      // 3. useEffect: connect() should detect the errored image.
      handle.connect();

      expect(handle.loading).toBe(false);
      expect(handle.error).toBe(true);
      expect(onStateChange).toHaveBeenCalled();

      handle.destroy();
    });

    it('stays quiet when a settled image is handed back after a ref swap', () => {
      const img = createMockImg();
      const onStateChange = vi.fn();

      Object.defineProperty(img, 'complete', { value: true, configurable: true });

      const handle = createThumbnail(createOptions({ getImg: () => img, onStateChange }));

      handle.updateSrc('sprite.jpg');
      handle.connect();
      expect(onStateChange).toHaveBeenCalledOnce();

      // React detaches and reattaches the same node when a callback ref changes identity.
      handle.disconnectImg(img);
      handle.connect();

      expect(handle.loading).toBe(false);
      expect(onStateChange).toHaveBeenCalledOnce();

      handle.destroy();
    });
  });

  describe('destroy', () => {
    it('stops observing resizes', () => {
      const handle = createThumbnail(createOptions());

      handle.connect();

      const observer = ResizeObserverStub.instances[0]!;

      handle.destroy();

      expect(observer.disconnect).toHaveBeenCalledOnce();
    });
  });
});
