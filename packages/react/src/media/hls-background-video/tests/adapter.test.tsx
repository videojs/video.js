import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

/** SVTA 2011 — no video track this environment can play. */
const NO_SUPPORTED_VIDEO_TRACK = 2011;
/** SVTA 2039 — a manifest feature went unhonored; degraded but still playable. */
const MANIFEST_FEATURE_UNSUPPORTED = 2039;

/**
 * The component owns its Media and hands out no reference to it, so the engine is reached by tracking what it
 * constructs. Everything else about the entry is the real thing.
 */
const instances: { engine: { state: { errors: { set(value: unknown): void } } } }[] = vi.hoisted(() => []);

vi.mock('@videojs/spf/hls-background-video', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@videojs/spf/hls-background-video')>();

  return {
    ...actual,
    HlsBackgroundVideoAdapter: class extends actual.HlsBackgroundVideoAdapter {
      constructor(...args: ConstructorParameters<typeof actual.HlsBackgroundVideoAdapter>) {
        super(...args);
        instances.push(this as never);
      }
    },
  };
});

const { HlsBackgroundVideo } = await import('../adapter');

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  instances.length = 0;
  // The engine seeds `loadActivated: true`, so a rendered `src` starts fetching
  // the manifest at once. Stubbed so these stay offline and leave no request
  // pending at teardown.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('offline')))
  );
});

afterEach(() => {
  // Unmount explicitly: this package wires no auto-cleanup, and a mounted
  // component here keeps a live engine — whose in-flight manifest request can
  // land after the environment is gone.
  cleanup();
  vi.unstubAllGlobals();
});

describe('HlsBackgroundVideo', () => {
  // An unplayable source never reaches the <video>, so `onError` can only fire
  // because the component re-fires what the engine reported.
  describe('error forwarding', () => {
    it('calls onError when a fatal condition is reported', async () => {
      const onError = vi.fn();
      const { container } = render(<HlsBackgroundVideo src="https://example.com/v.m3u8" onError={onError} />);

      const media = instances[0];
      const video = container.querySelector('video');

      expect(media).toBeTruthy();
      expect(video).toBeTruthy();

      media!.engine.state.errors.set([{ code: MANIFEST_FEATURE_UNSUPPORTED }]);
      await flush();
      expect(onError).not.toHaveBeenCalled();

      media!.engine.state.errors.set([{ code: NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      expect(onError).toHaveBeenCalledTimes(1);
      // Delivered through React's own plumbing, on the node the consumer holds.
      expect(onError.mock.calls[0]?.[0]?.target).toBe(video);
    });
  });
});
