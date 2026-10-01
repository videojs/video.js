import { describe, expect, it, vi } from 'vite-plus/test';

import {
  attachMediaSource,
  attachMediaSourceAsSourceElement,
  createMediaSource,
  createSourceBuffer,
  isCodecSupported,
  supportsManagedMediaSource,
  supportsMediaSource,
  waitForMediaSourceOpen,
} from '../mediasource-setup';

describe('supportsMediaSource', () => {
  it('should return true when MediaSource is available', () => {
    expect(supportsMediaSource()).toBe(true);
  });
});

describe('supportsManagedMediaSource', () => {
  it('should detect ManagedMediaSource availability', () => {
    try {
      vi.stubGlobal('ManagedMediaSource', undefined);
      expect(supportsManagedMediaSource()).toBe(false);

      vi.stubGlobal('ManagedMediaSource', class extends EventTarget {});
      expect(supportsManagedMediaSource()).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('createMediaSource', () => {
  it('should create MediaSource instance', () => {
    const ms = createMediaSource();

    expect(ms).toBeInstanceOf(MediaSource);
    expect(ms.readyState).toBe('closed');
  });

  it('should create ManagedMediaSource when preferManaged is true and available', () => {
    class ClassicMediaSource extends EventTarget {}
    class ManagedSource extends EventTarget {}
    const classic = vi.fn(ClassicMediaSource);
    const managed = vi.fn(ManagedSource);

    vi.stubGlobal('MediaSource', classic);
    vi.stubGlobal('ManagedMediaSource', managed);

    try {
      expect(createMediaSource({ preferManaged: true })).toBeInstanceOf(ManagedSource);
      expect(managed).toHaveBeenCalledOnce();
      expect(classic).not.toHaveBeenCalled();

      vi.stubGlobal('ManagedMediaSource', undefined);
      expect(createMediaSource({ preferManaged: true })).toBeInstanceOf(ClassicMediaSource);
      expect(classic).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('attachMediaSource', () => {
  it('should attach MediaSource using object URL', () => {
    const mediaElement = document.createElement('video');
    const mediaSource = createMediaSource();

    const { url, detach } = attachMediaSource(mediaSource, mediaElement);

    expect(url).toBeTruthy();
    expect(url).toContain('blob:');
    expect(mediaElement.src).toBe(url);
    expect(typeof detach).toBe('function');
  });

  it('should return detach function that cleans up', () => {
    const mediaElement = document.createElement('video');
    const mediaSource = createMediaSource();

    const { detach } = attachMediaSource(mediaSource, mediaElement);

    detach();

    expect(mediaElement.src).toBe('');
  });

  it('detach resets the element when tearing down an unclosed attachment it still owns', async () => {
    const mediaElement = document.createElement('video');
    const mediaSource = createMediaSource();
    const { url, detach } = attachMediaSource(mediaSource, mediaElement);

    // An unclosed attachment: the MediaSource has opened (readyState is 'closed'
    // until the browser's async attach completes).
    await new Promise<void>((resolve) => mediaSource.addEventListener('sourceopen', () => resolve(), { once: true }));

    // The element committed to our resource (browser resource selection is
    // async — stage the committed state directly).
    Object.defineProperty(mediaElement, 'currentSrc', { value: url, configurable: true });
    const load = vi.spyOn(mediaElement, 'load');

    detach();

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('detach skips the reset for a UA-closed MediaSource — the element carries the recovery snapshot', () => {
    const mediaElement = document.createElement('video');
    const mediaSource = createMediaSource();
    const { url, detach } = attachMediaSource(mediaSource, mediaElement);

    Object.defineProperty(mediaElement, 'currentSrc', { value: url, configurable: true });
    // The UA killed the MediaSource out from under the engine (AirPlay
    // handoff, MMS eviction). A load() here would wipe the element's frozen
    // currentTime/paused — the recovery restore state — and re-run resource
    // selection under an AirPlay receiver.
    Object.defineProperty(mediaSource, 'readyState', { value: 'closed', configurable: true });
    const load = vi.spyOn(mediaElement, 'load');

    detach();

    expect(load).not.toHaveBeenCalled();
    expect(mediaElement.getAttribute('src')).toBeNull();
  });

  it('detach skips the reset when the element has moved to another resource', async () => {
    const mediaElement = document.createElement('video');
    const mediaSource = createMediaSource();
    const { detach } = attachMediaSource(mediaSource, mediaElement);

    await new Promise<void>((resolve) => mediaSource.addEventListener('sourceopen', () => resolve(), { once: true }));
    expect(mediaSource.readyState).toBe('open');

    // Resource selection moved on (e.g. Safari switched to a native-HLS
    // fallback source for an AirPlay handoff) — resetting would rip that
    // resource out from under its owner.
    Object.defineProperty(mediaElement, 'currentSrc', {
      value: 'https://example.com/fallback.m3u8',
      configurable: true,
    });
    const load = vi.spyOn(mediaElement, 'load');

    detach();

    expect(load).not.toHaveBeenCalled();
  });
});

describe('attachMediaSourceAsSourceElement', () => {
  it('attaches a regular MediaSource via a <source> child and reaches sourceopen', async () => {
    const mediaElement = document.createElement('video');
    const mediaSource = createMediaSource();

    const { url, detach } = attachMediaSourceAsSourceElement(mediaSource, mediaElement);

    expect(mediaElement.getAttribute('src')).toBeNull();
    const sourceEl = mediaElement.querySelector('source');

    expect(sourceEl!.src).toBe(url);
    expect(sourceEl!.type).toBe('video/mp4');
    // The flag is MMS-only — a regular MediaSource must leave the standard
    // Remote Playback API alone.
    expect(mediaElement.disableRemotePlayback).toBe(false);

    // The mechanism genuinely attaches: resource selection picks the
    // <source> child and the MediaSource opens.
    await new Promise<void>((resolve) => mediaSource.addEventListener('sourceopen', () => resolve(), { once: true }));

    detach();
    expect(mediaElement.querySelector('source')).toBeNull();
  });

  it('attaches a ManagedMediaSource as the FIRST <source> child, keeping siblings', () => {
    class FakeManagedMediaSource extends EventTarget {
      readyState = 'closed';
    }
    vi.stubGlobal('ManagedMediaSource', FakeManagedMediaSource);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-mms');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    try {
      const mediaSource = new FakeManagedMediaSource() as unknown as MediaSource;
      const mediaElement = document.createElement('video');

      mediaElement.setAttribute('src', 'https://example.com/old.mp4');
      const sibling = document.createElement('source');

      mediaElement.append(sibling);

      const { url, detach } = attachMediaSourceAsSourceElement(mediaSource, mediaElement);

      expect(url).toBe('blob:fake-mms');
      // Bare src dropped; MSE source is the FIRST child so local playback
      // selects it; the sibling alternative stays second.
      expect(mediaElement.getAttribute('src')).toBeNull();
      expect(mediaElement.disableRemotePlayback).toBe(true);
      const sources = mediaElement.querySelectorAll('source');

      expect(sources).toHaveLength(2);
      expect(sources[0]!.src).toBe('blob:fake-mms');
      expect(sources[0]!.type).toBe('video/mp4');
      expect(sources[1]).toBe(sibling);

      detach();
      expect(mediaElement.querySelectorAll('source')).toHaveLength(1);
      expect(mediaElement.querySelector('source')).toBe(sibling);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-mms');
    } finally {
      vi.unstubAllGlobals();
      createObjectURL.mockRestore();
      revokeObjectURL.mockRestore();
    }
  });

  it('detach with deferReset holds the reset until sibling <source> owners have dropped theirs', async () => {
    const mediaElement = document.createElement('video');
    const mediaSource = createMediaSource();
    const { url, detach } = attachMediaSourceAsSourceElement(mediaSource, mediaElement);

    await new Promise<void>((resolve) => mediaSource.addEventListener('sourceopen', () => resolve(), { once: true }));

    // A sibling alternative owned by another behavior (setupAirPlay's
    // native-HLS fallback), removed from a signal effect — i.e. on a
    // microtask queued before detach's.
    const fallback = document.createElement('source');

    fallback.type = 'application/x-mpegURL';
    fallback.src = 'https://example.com/outgoing.m3u8';
    mediaElement.append(fallback);
    queueMicrotask(() => fallback.remove());

    Object.defineProperty(mediaElement, 'currentSrc', { value: url, configurable: true });
    // Capture what resource selection would see at reset time.
    let typesAtReset: string[] | undefined;
    const load = vi.spyOn(mediaElement, 'load').mockImplementation(() => {
      typesAtReset = [...mediaElement.querySelectorAll('source')].map((el) => el.type);
    });

    detach({ deferReset: true });

    // A synchronous reset here would run resource selection against the
    // fallback and start native HLS of the outgoing manifest.
    expect(load).not.toHaveBeenCalled();

    await Promise.resolve();

    expect(load).toHaveBeenCalledTimes(1);
    expect(typesAtReset).toEqual([]);
  });

  it('detach with deferReset re-checks ownership at fire time — a re-attach suppresses the reset', async () => {
    const mediaElement = document.createElement('video');
    const mediaSource = createMediaSource();
    const { url, detach } = attachMediaSourceAsSourceElement(mediaSource, mediaElement);

    await new Promise<void>((resolve) => mediaSource.addEventListener('sourceopen', () => resolve(), { once: true }));

    Object.defineProperty(mediaElement, 'currentSrc', { value: url, configurable: true });
    const load = vi.spyOn(mediaElement, 'load');

    detach({ deferReset: true });
    // A new attachment committed the element before the deferred reset ran;
    // resetting now would rip that resource out from under its owner.
    Object.defineProperty(mediaElement, 'currentSrc', { value: 'blob:next-attachment', configurable: true });

    await Promise.resolve();

    expect(load).not.toHaveBeenCalled();
  });
});

describe('createSourceBuffer', () => {
  it('should create SourceBuffer with codec string', async () => {
    const mediaSource = createMediaSource();
    const mediaElement = document.createElement('video');

    attachMediaSource(mediaSource, mediaElement);

    await new Promise<void>((resolve) => mediaSource.addEventListener('sourceopen', () => resolve(), { once: true }));

    const buffer = createSourceBuffer(mediaSource, 'video/mp4; codecs="avc1.42E01E"');

    expect(buffer).toBeDefined();
    expect(mediaSource.sourceBuffers.length).toBe(1);
  });

  it('should throw when MediaSource is not open', () => {
    const mediaSource = createMediaSource();

    expect(() => createSourceBuffer(mediaSource, 'video/mp4; codecs="avc1.42E01E"')).toThrow('MediaSource is not open');
  });
});

describe('isCodecSupported', () => {
  it('should return true for supported codecs', () => {
    // Test with common H.264 codec
    expect(isCodecSupported('video/mp4; codecs="avc1.42E01E"')).toBe(true);
  });

  it('should return false for unsupported codecs', () => {
    // Test with unlikely/unsupported codec
    expect(isCodecSupported('video/invalid; codecs="fake"')).toBe(false);
  });

  it('falls back to ManagedMediaSource.isTypeSupported when classic MediaSource is absent — the iPhone shape', () => {
    const isTypeSupported = vi.fn((type: string) => type.includes('avc1'));

    vi.stubGlobal('MediaSource', undefined);
    vi.stubGlobal('ManagedMediaSource', { isTypeSupported });

    try {
      expect(isCodecSupported('video/mp4; codecs="avc1.42E01E"')).toBe(true);
      expect(isCodecSupported('video/mp4; codecs="hvc1.2.4.L123.B0"')).toBe(false);
      expect(isTypeSupported).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('returns false when neither MediaSource API exists', () => {
    vi.stubGlobal('MediaSource', undefined);
    vi.stubGlobal('ManagedMediaSource', undefined);

    try {
      expect(isCodecSupported('video/mp4; codecs="avc1.42E01E"')).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('waitForMediaSourceOpen', () => {
  it('resolves immediately when readyState is already open', async () => {
    const mediaSource = createMediaSource();
    const mediaElement = document.createElement('video');

    attachMediaSource(mediaSource, mediaElement);
    await new Promise<void>((resolve) => mediaSource.addEventListener('sourceopen', () => resolve(), { once: true }));

    expect(mediaSource.readyState).toBe('open');
    const controller = new AbortController();

    await waitForMediaSourceOpen(mediaSource, controller.signal);
  });

  it('resolves once readyState transitions out of closed via sourceopen', async () => {
    const mediaSource = createMediaSource();

    expect(mediaSource.readyState).toBe('closed');

    const controller = new AbortController();
    const ready = waitForMediaSourceOpen(mediaSource, controller.signal);

    const mediaElement = document.createElement('video');

    attachMediaSource(mediaSource, mediaElement);

    await ready;
    expect(mediaSource.readyState).toBe('open');
  });

  it('resolves on abort even if readyState never transitions', async () => {
    const mediaSource = createMediaSource();
    const controller = new AbortController();

    const ready = waitForMediaSourceOpen(mediaSource, controller.signal);

    controller.abort();

    await ready;
  });

  it('returns an already-resolved promise when signal is pre-aborted', async () => {
    const mediaSource = createMediaSource();
    const controller = new AbortController();

    controller.abort();

    await waitForMediaSourceOpen(mediaSource, controller.signal);
  });
});
