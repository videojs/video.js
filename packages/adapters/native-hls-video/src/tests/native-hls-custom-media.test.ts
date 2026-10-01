import { MediaError } from '@videojs/media';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NativeHlsAdapter } from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('NativeHlsAdapter', () => {
  it('dispatches only the enriched ErrorEvent when a native error fires', () => {
    const video = document.createElement('video');

    document.body.appendChild(video);

    const media = new NativeHlsAdapter();

    media.attach(video);

    const handler = vi.fn();

    media.addEventListener('error', handler);

    Object.defineProperty(video, 'error', {
      value: { code: MediaError.MEDIA_ERR_NETWORK, message: 'network failure' },
      configurable: true,
    });
    video.dispatchEvent(new Event('error'));

    expect(handler).toHaveBeenCalledOnce();

    const event = handler.mock.calls[0]![0] as ErrorEvent;

    expect(event).toBeInstanceOf(ErrorEvent);
    expect(event.error).toBeInstanceOf(MediaError);
    expect(event.error.fatal).toBe(true);
    expect(event.error.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    expect(event.error.message).toBe(MediaError.defaultMessages[MediaError.MEDIA_ERR_NETWORK]);
  });
});
