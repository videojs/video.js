import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NativeHlsAdapter } from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

function fireDurationChange(video: HTMLVideoElement, duration: number) {
  Object.defineProperty(video, 'duration', { value: duration, configurable: true });
  video.dispatchEvent(new Event('durationchange'));
}

describe('NativeHlsAdapter', () => {
  function setupNative() {
    const video = document.createElement('video');

    document.body.appendChild(video);
    const media = new NativeHlsAdapter();

    media.attach(video);
    return { media, video };
  }

  it('defaults to `unknown`', () => {
    const media = new NativeHlsAdapter();

    expect(media.streamType).toBe('unknown');
  });

  it('detects `live` and fires `streamtypechange`', () => {
    const { media, video } = setupNative();

    const handler = vi.fn();

    media.addEventListener('streamtypechange', handler);

    fireDurationChange(video, Infinity);

    expect(media.streamType).toBe('live');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('honors a user override and clears it on `unknown`', () => {
    const { media, video } = setupNative();

    media.streamType = 'live';
    fireDurationChange(video, 120);
    expect(media.streamType).toBe('live');

    media.streamType = 'unknown';
    expect(media.streamType).toBe('on-demand');
  });

  it('detects `on-demand` from finite duration', () => {
    const { media, video } = setupNative();

    const handler = vi.fn();

    media.addEventListener('streamtypechange', handler);

    fireDurationChange(video, 120);

    expect(media.streamType).toBe('on-demand');
    expect(handler).toHaveBeenCalledOnce();
  });

  it('dedupes `streamtypechange` when the detected value does not change', () => {
    const { media, video } = setupNative();

    const handler = vi.fn();

    media.addEventListener('streamtypechange', handler);

    fireDurationChange(video, 120);
    fireDurationChange(video, 240);

    expect(handler).toHaveBeenCalledOnce();
  });
});
