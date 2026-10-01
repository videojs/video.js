import Hls from 'hls.js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { setupDrm } from '../drm';

function createEngine(userConfig: Record<string, any> = {}): Hls {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  return {
    config: {
      emeEnabled: false,
      requestMediaKeySystemAccessFunc: Hls.DefaultConfig.requestMediaKeySystemAccessFunc,
      ...userConfig,
    },
    userConfig,
    on(event: string, fn: (...args: any[]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());

      listeners.get(event)!.add(fn);
    },
    off(event: string, fn: (...args: any[]) => void) {
      listeners.get(event)?.delete(fn);
    },
    emit(event: string, ...args: any[]) {
      for (const fn of listeners.get(event) ?? []) fn(event, ...args);
    },
  } as unknown as Hls;
}

function stubKeySystemAccess() {
  const requestMediaKeySystemAccess = vi.fn(async () => ({}) as MediaKeySystemAccess);

  Object.defineProperty(navigator, 'requestMediaKeySystemAccess', {
    value: requestMediaKeySystemAccess,
    configurable: true,
    writable: true,
  });
  return requestMediaKeySystemAccess;
}

function videoCapabilities() {
  return [{ contentType: 'video/mp4;codecs="avc1.640028"' }];
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('setupDrm', () => {
  it('leaves an unprotected engine alone', () => {
    const engine = createEngine();

    setupDrm(engine);

    expect(engine.config.requestMediaKeySystemAccessFunc).toBe(Hls.DefaultConfig.requestMediaKeySystemAccessFunc);
  });

  it('defers to a caller-supplied key system access function', () => {
    const requestMediaKeySystemAccessFunc = vi.fn();
    const engine = createEngine({ emeEnabled: true, requestMediaKeySystemAccessFunc });

    setupDrm(engine);

    expect(engine.config.requestMediaKeySystemAccessFunc).toBe(requestMediaKeySystemAccessFunc);
  });

  describe('key system access', () => {
    it('prefers hardware robustness for Widevine while keeping a fallback', async () => {
      const requestMediaKeySystemAccess = stubKeySystemAccess();
      const engine = createEngine({ emeEnabled: true });

      setupDrm(engine);

      const configurations = [{ videoCapabilities: videoCapabilities() }];

      await engine.config.requestMediaKeySystemAccessFunc!('com.widevine.alpha' as any, configurations as any);

      const [keySystem, requested] = requestMediaKeySystemAccess.mock.calls[0] as unknown as [
        string,
        MediaKeySystemConfiguration[],
      ];

      expect(keySystem).toBe('com.widevine.alpha');
      expect(requested).toHaveLength(2);
      expect(requested[0]!.videoCapabilities![0]!.robustness).toBe('HW_SECURE_ALL');
      expect(requested[1]!.videoCapabilities![0]!.robustness).toBeUndefined();
      // The caller's configurations must not be mutated.
      expect(configurations[0]!.videoCapabilities[0]).not.toHaveProperty('robustness');
    });

    it('passes configurations through unchanged for other key systems', async () => {
      const requestMediaKeySystemAccess = stubKeySystemAccess();
      const engine = createEngine({ emeEnabled: true });

      setupDrm(engine);

      const configurations = [{ videoCapabilities: videoCapabilities() }];

      await engine.config.requestMediaKeySystemAccessFunc!('com.apple.fps' as any, configurations as any);

      expect(requestMediaKeySystemAccess).toHaveBeenCalledWith('com.apple.fps', configurations);
    });

    it('propagates a denied request', async () => {
      const requestMediaKeySystemAccess = stubKeySystemAccess();

      requestMediaKeySystemAccess.mockRejectedValueOnce(new Error('unsupported'));

      const engine = createEngine({ emeEnabled: true });

      setupDrm(engine);

      await expect(engine.config.requestMediaKeySystemAccessFunc!('com.widevine.alpha' as any, [])).rejects.toThrow(
        'unsupported'
      );
    });
  });

  it('warns in dev about non-fatal key system errors', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = createEngine({ emeEnabled: true });

    setupDrm(engine);
    (engine as any).emit(Hls.Events.ERROR, {
      fatal: false,
      type: Hls.ErrorTypes.KEY_SYSTEM_ERROR,
      details: 'keySystemStatusOutputRestricted',
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('keySystemStatusOutputRestricted'), undefined);
  });

  it('stays quiet for fatal errors, which surface as media errors', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const engine = createEngine({ emeEnabled: true });

    setupDrm(engine);
    (engine as any).emit(Hls.Events.ERROR, {
      fatal: true,
      type: Hls.ErrorTypes.KEY_SYSTEM_ERROR,
      details: 'keySystemNoAccess',
    });

    expect(warn).not.toHaveBeenCalled();
  });
});
