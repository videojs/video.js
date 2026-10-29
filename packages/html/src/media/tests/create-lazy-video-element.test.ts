import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createLazyVideoElement, type LazyMediaDefinition } from '../lazy/create';
import { video } from '../lazy/video';

let tagCounter = 0;

function define(medias: LazyMediaDefinition[]): string {
  const tag = `test-lazy-video-${tagCounter++}`;

  customElements.define(tag, createLazyVideoElement(medias));
  return tag;
}

function create(tag: string, src: string): HTMLElement {
  const element = document.createElement(tag);

  element.setAttribute('src', src);
  document.body.append(element);

  return element;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

const acmeVideo: LazyMediaDefinition = {
  match: ({ url }) => url?.hostname === 'video.acme.com',
  tag: 'acme-video',
};

function deferred(): { promise: Promise<void>; resolve: () => void; reject: (error: Error) => void } {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

describe('createLazyVideoElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders the first media that plays the source, with its attributes', async () => {
    const element = create(define([acmeVideo, video]), 'https://video.acme.com/a.mp4');

    await flush();

    expect(element.querySelector('acme-video')?.getAttribute('src')).toBe('https://video.acme.com/a.mp4');

    element.setAttribute('src', '/movie.mp4');
    await flush();

    expect(element.querySelector('acme-video')).toBeNull();
    expect(element.querySelector('video')?.getAttribute('src')).toBe('/movie.mp4');
  });

  it('registers a media through load before rendering it', async () => {
    const tag = `test-acme-video-${tagCounter++}`;
    const load = vi.fn(async () => customElements.define(tag, class extends HTMLElement {}));
    const element = create(define([{ ...acmeVideo, tag, load }]), 'https://video.acme.com/1');

    await vi.waitFor(() => expect(element.querySelector(tag)).not.toBeNull());

    expect(load).toHaveBeenCalledOnce();
    expect(element.querySelector(tag)).toBeInstanceOf(customElements.get(tag)!);
  });

  it('renders the media of the latest source when a pending load lands after a swap', async () => {
    const pending = deferred();
    const tag = `test-acme-video-${tagCounter++}`;
    const load = vi.fn(() => pending.promise);
    const element = create(define([{ ...acmeVideo, tag, load }, video]), 'https://video.acme.com/1');

    await flush();
    element.setAttribute('src', '/movie.mp4');
    await flush();

    expect(element.querySelector('video')?.getAttribute('src')).toBe('/movie.mp4');

    element.setAttribute('src', 'https://video.acme.com/2');
    await flush();
    pending.resolve();
    await flush();

    expect(element.querySelector('video')).toBeNull();
    expect(element.querySelectorAll(tag)).toHaveLength(1);
    expect(element.querySelector(tag)?.getAttribute('src')).toBe('https://video.acme.com/2');
  });

  it('removes the previous media when a load fails, and loads again for a later source', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const tag = `test-acme-video-${tagCounter++}`;
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const element = create(define([{ ...acmeVideo, tag, load }, video]), '/movie.mp4');

    await flush();
    element.setAttribute('src', 'https://video.acme.com/1');
    await vi.waitFor(() =>
      expect(error).toHaveBeenCalledWith(expect.stringContaining('Failed to load'), expect.any(Error))
    );

    expect(element.children).toHaveLength(0);

    element.setAttribute('src', 'https://video.acme.com/2');
    await vi.waitFor(() => expect(element.querySelector(tag)).not.toBeNull());

    expect(load).toHaveBeenCalledTimes(2);
    expect(element.querySelector(tag)!.getAttribute('src')).toBe('https://video.acme.com/2');
  });

  it('only plays the sources its media do', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const element = create(define([video]), 'https://www.youtube.com/watch?v=aqz-KE-bpKQ');

    await flush();

    expect(element.children).toHaveLength(0);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('No media plays'));
  });

  // Asserted against the shadow styles because no DOM implementation the tests run in resolves `::slotted` for a
  // computed style.
  it('clears the minimum size an embed host sets, so a portrait floor cannot overflow the player', () => {
    const element = document.createElement(define([video]));

    expect(element.shadowRoot!.querySelector('style')!.textContent).toMatch(
      /::slotted\(\[data-cross-origin-frame\]\)\s*\{\s*min-width:\s*0;\s*min-height:\s*0;/
    );
  });

  it('reflects preferPlayback, and leaves it unset by default', () => {
    const element = document.createElement(define([video])) as HTMLElement & {
      preferPlayback: 'native' | 'mse' | undefined;
    };

    expect(element.preferPlayback).toBeUndefined();

    element.preferPlayback = 'native';
    expect(element.getAttribute('prefer-playback')).toBe('native');

    element.preferPlayback = undefined;
    expect(element.hasAttribute('prefer-playback')).toBe(false);
  });
});
