import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createLazyVideoElement, type LazyMediaDefinition, type LazyMediaElement } from '../lazy-video/create';
import { video } from '../lazy-video/video';

let tagCounter = 0;

function define(medias: LazyMediaDefinition[]): string {
  const tag = `test-lazy-video-${tagCounter++}`;

  customElements.define(tag, createLazyVideoElement(medias));
  return tag;
}

function create(tag: string, src: string): LazyMediaElement {
  const element = document.createElement(tag) as LazyMediaElement;

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

  it('exposes the media an element hands the player through getMediaTarget', async () => {
    const tag = `test-acme-video-${tagCounter++}`;
    const target = {};

    customElements.define(
      tag,
      class extends HTMLElement {
        getMediaTarget() {
          return target;
        }
      }
    );

    const element = create(define([{ ...acmeVideo, tag }]), 'https://video.acme.com/1');

    await flush();

    expect(element.media).toBe(target);
  });

  it('only plays the sources its media do', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const element = create(define([video]), 'https://www.youtube.com/watch?v=aqz-KE-bpKQ');

    await flush();

    expect(element.children).toHaveLength(0);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('No media plays'));
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
