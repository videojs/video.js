/**
 * The host-bound Media, covering what binding to a host is what makes true: the fixed behavior is readable back off the
 * Media because the host forwards to the element, not because the adapter keeps a parallel copy of it.
 */
import { describe, expect, it, vi } from 'vite-plus/test';

import { HlsBackgroundVideoAdapter } from '../adapter';

describe('HlsBackgroundVideoAdapter', () => {
  it('reports the fixed behavior from the attached element', () => {
    const media = new HlsBackgroundVideoAdapter();
    const el = document.createElement('video');

    media.attach(el);

    expect(media.loop).toBe(true);
    expect(media.muted).toBe(true);
    expect(media.autoplay).toBe(true);
    expect(media.preload).toBe('auto');
  });

  it('follows the element when it is changed underneath', () => {
    const media = new HlsBackgroundVideoAdapter();
    const el = document.createElement('video');

    media.attach(el);

    el.loop = false;

    // The reason for not shadowing these: a stored value would still claim true.
    expect(media.loop).toBe(false);
  });

  it('exposes the attached element as target', () => {
    const media = new HlsBackgroundVideoAdapter();
    const el = document.createElement('video');

    expect(media.target).toBeNull();

    media.attach(el);

    // What `getMediaElement` reads, so extensions like Mux Data can find the element.
    expect(media.target).toBe(el);

    media.detach();

    expect(media.target).toBeNull();
  });

  it('forwards loadstart from the attached element only', () => {
    const media = new HlsBackgroundVideoAdapter();
    const first = document.createElement('video');
    const second = document.createElement('video');
    const onLoadStart = vi.fn();

    media.addEventListener('loadstart', onLoadStart);
    media.attach(first);
    media.attach(second);

    first.dispatchEvent(new Event('loadstart'));

    expect(onLoadStart).not.toHaveBeenCalled();

    second.dispatchEvent(new Event('loadstart'));

    expect(onLoadStart).toHaveBeenCalledTimes(1);

    media.detach();
    second.dispatchEvent(new Event('loadstart'));

    expect(onLoadStart).toHaveBeenCalledTimes(1);
  });
});
