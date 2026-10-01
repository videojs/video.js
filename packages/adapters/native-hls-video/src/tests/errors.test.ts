import { MediaError } from '@videojs/media';
import { HTMLVideoAdapter } from '@videojs/media/dom';
import { describe, expect, it, vi } from 'vite-plus/test';

import { NativeHlsErrorsMixin } from '../errors';

class FakeHost extends HTMLVideoAdapter {
  // Re-expose the now-protected `target` for test assertions.
  override get target(): HTMLVideoElement | null {
    return super.target as HTMLVideoElement | null;
  }
}

const NativeHlsErrors = NativeHlsErrorsMixin(FakeHost);

function setup() {
  const host = new NativeHlsErrors();
  const video = document.createElement('video');

  host.attach(video);
  return { host, video };
}

function fireNativeError(video: HTMLVideoElement, code: number, message = '') {
  Object.defineProperty(video, 'error', {
    value: { code, message },
    configurable: true,
  });
  video.dispatchEvent(new Event('error'));
}

describe('NativeHlsErrorsMixin', () => {
  it('normalizes browser-specific messages for standard error codes', () => {
    const { host, video } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    fireNativeError(video, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, 'Failed to open media');

    const event = handler.mock.calls[0]![0] as ErrorEvent;

    expect(event.error.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    expect(event.error.message).toBe(MediaError.defaultMessages[MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]);
  });

  it('uses default message when native error has no message', () => {
    const { host, video } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    fireNativeError(video, MediaError.MEDIA_ERR_DECODE);

    const event = handler.mock.calls[0]![0] as ErrorEvent;

    expect(event.error.code).toBe(MediaError.MEDIA_ERR_DECODE);
    expect(event.error.message).toBe(MediaError.defaultMessages[MediaError.MEDIA_ERR_DECODE]);
  });

  it('exposes the error via the error getter', () => {
    const { host, video } = setup();

    expect(host.error).toBeNull();

    fireNativeError(video, MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, 'Failed to open media');

    expect(host.error).toBeInstanceOf(MediaError);
    expect(host.error!.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    expect(host.error!.message).toBe(MediaError.defaultMessages[MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]);
  });

  it('stops propagation of the native error event', () => {
    const { video } = setup();

    const nativeHandler = vi.fn();

    video.addEventListener('error', nativeHandler);

    fireNativeError(video, MediaError.MEDIA_ERR_NETWORK, 'network failure');

    expect(nativeHandler).not.toHaveBeenCalled();
  });

  it('maps MEDIA_ERR_ABORTED correctly', () => {
    const { host, video } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    fireNativeError(video, MediaError.MEDIA_ERR_ABORTED);

    const event = handler.mock.calls[0]![0] as ErrorEvent;

    expect(event.error.code).toBe(MediaError.MEDIA_ERR_ABORTED);
  });

  it('ignores error events when target.error is null', () => {
    const { host, video } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    video.dispatchEvent(new Event('error'));

    expect(handler).not.toHaveBeenCalled();
    expect(host.error).toBeNull();
  });

  it('stops listening after detach', () => {
    const { host, video } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    host.detach();

    fireNativeError(video, MediaError.MEDIA_ERR_NETWORK, 'after detach');

    expect(handler).not.toHaveBeenCalled();
  });

  it('resets error after detach', () => {
    const { host, video } = setup();

    fireNativeError(video, MediaError.MEDIA_ERR_NETWORK, 'failure');

    expect(host.error).not.toBeNull();

    host.detach();

    expect(host.error).toBeNull();
  });

  it('stops listening after destroy', () => {
    const { host, video } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    host.destroy();

    fireNativeError(video, MediaError.MEDIA_ERR_NETWORK, 'after destroy');

    expect(handler).not.toHaveBeenCalled();
  });

  it('resets error after destroy', () => {
    const { host, video } = setup();

    fireNativeError(video, MediaError.MEDIA_ERR_DECODE, 'failure');

    expect(host.error).not.toBeNull();

    host.destroy();

    expect(host.error).toBeNull();
  });

  it('clears stale error on source change (emptied event)', () => {
    const { host, video } = setup();

    fireNativeError(video, MediaError.MEDIA_ERR_NETWORK, 'failure');
    expect(host.error).not.toBeNull();

    video.dispatchEvent(new Event('emptied'));

    expect(host.error).toBeNull();
  });

  it('has target set when error handler fires during attach', () => {
    const host = new NativeHlsErrors();
    const video = document.createElement('video');

    let targetDuringError: EventTarget | null = null;
    let attaching = false;
    const handler = vi.fn(() => {
      expect(attaching).toBe(true);
      targetDuringError = host.target;
    });
    const addEventListener = video.addEventListener.bind(video);

    vi.spyOn(video, 'addEventListener').mockImplementation((type, listener, options) => {
      addEventListener(type, listener, options);

      if (type === 'error' && typeof options === 'object' && options.capture) {
        video.dispatchEvent(new Event('error'));
      }
    });

    host.addEventListener('error', handler);

    Object.defineProperty(video, 'error', {
      value: { code: MediaError.MEDIA_ERR_NETWORK, message: 'fail' },
      configurable: true,
    });

    attaching = true;
    host.attach(video);
    attaching = false;

    expect(handler).toHaveBeenCalledOnce();
    expect(targetDuringError).toBe(video);
  });

  it('maintains one active listener set across repeated attachment', () => {
    const host = new NativeHlsErrors();
    const video = document.createElement('video');

    const registrations = vi.spyOn(video, 'addEventListener');
    const signals = () =>
      registrations.mock.calls
        .filter(([type]) => type === 'error' || type === 'emptied')
        .map(([, , options]) => (typeof options === 'object' ? options.signal : undefined));

    host.attach(video);
    const initialSignals = signals();

    expect(initialSignals).toHaveLength(2);
    expect(initialSignals.every((signal) => signal?.aborted === false)).toBe(true);

    fireNativeError(video, MediaError.MEDIA_ERR_NETWORK, 'first');
    expect(host.error).not.toBeNull();

    video.dispatchEvent(new Event('emptied'));
    expect(host.error).toBeNull();

    registrations.mockClear();
    host.attach(video);
    const replacementSignals = signals();

    expect(replacementSignals).toHaveLength(2);
    expect(initialSignals.every((signal) => signal?.aborted === true)).toBe(true);
    expect(replacementSignals.every((signal) => signal?.aborted === false)).toBe(true);

    const handler = vi.fn();

    host.addEventListener('error', handler);
    fireNativeError(video, MediaError.MEDIA_ERR_DECODE, 'second');

    expect(handler).toHaveBeenCalledOnce();

    host.detach();

    expect(replacementSignals.every((signal) => signal?.aborted === true)).toBe(true);
  });

  it('re-initializes on re-attach', () => {
    const { host } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    host.detach();

    const video2 = document.createElement('video');

    host.attach(video2);

    fireNativeError(video2, MediaError.MEDIA_ERR_NETWORK, 'new target');

    expect(handler).toHaveBeenCalledOnce();

    const event = handler.mock.calls[0]![0] as ErrorEvent;

    expect(event.error.code).toBe(MediaError.MEDIA_ERR_NETWORK);
  });
});
