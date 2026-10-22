import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import '../../define/media/lazy-video';

function create(attributes: Record<string, string>, children = ''): HTMLElement {
  const element = document.createElement('lazy-video');

  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);

  element.innerHTML = children;
  document.body.append(element);

  return element;
}

// The first import of an engine can be slow under a full test run.
const LOAD_TIMEOUT = { timeout: 5000 };

async function flush(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('LazyVideo', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders a native video for a file with its attributes', async () => {
    const element = create({ id: 'player', class: 'media', src: '/movie.mp4', type: 'video/mp4', muted: '' });

    await flush();

    const video = element.querySelector('video')!;

    expect(video.getAttribute('src')).toBe('/movie.mp4');
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.hasAttribute('muted')).toBe(true);
    expect(video.hasAttribute('id')).toBe(false);
    expect(video.hasAttribute('class')).toBe(false);
    expect(video.hasAttribute('type')).toBe(false);
  });

  it('keeps forwarding attributes after the media renders', async () => {
    const element = create({ src: '/movie.mp4', preload: 'auto' });

    await flush();

    const video = element.querySelector('video')!;

    expect(video.getAttribute('preload')).toBe('auto');

    element.setAttribute('playsinline', '');
    element.removeAttribute('preload');
    element.setAttribute('src', '/other.mp4');
    await flush();

    expect(video.hasAttribute('playsinline')).toBe(true);
    expect(video.getAttribute('preload')).toBe('none');
    expect(video.getAttribute('src')).toBe('/other.mp4');
    expect(element.querySelector('video')).toBe(video);
  });

  it('loads hls.js for HLS when MSE playback is preferred', async () => {
    const element = create({ src: 'https://example.com/master.m3u8', 'prefer-playback': 'mse' });

    await vi.waitFor(() => expect(element.querySelector('hlsjs-video')).not.toBeNull(), LOAD_TIMEOUT);

    expect(customElements.get('hlsjs-video')).toBeDefined();
    expect(element.querySelector('hlsjs-video')!.getAttribute('src')).toBe('https://example.com/master.m3u8');
  });

  it('swaps the media when the source needs a different one, and moves its tracks', async () => {
    const element = create({ src: '/movie.mp4' }, '<track kind="captions" src="captions.vtt">');

    await flush();
    expect(element.querySelector('video > track')).not.toBeNull();

    element.setAttribute('prefer-playback', 'mse');
    element.setAttribute('src', 'https://example.com/master.m3u8');

    await vi.waitFor(() => expect(element.querySelector('hlsjs-video')).not.toBeNull(), LOAD_TIMEOUT);
    expect(element.querySelector(':scope > video')).toBeNull();
    expect(element.querySelector('hlsjs-video > track')).not.toBeNull();
  });

  it('moves tracks added later into the media', async () => {
    const element = create({ src: '/movie.mp4' });

    await flush();
    element.append(document.createElement('track'));
    await flush();

    expect(element.querySelector('video > track')).not.toBeNull();
  });

  it('removes the media and reports a source it cannot resolve', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const element = create({ src: '/movie.mp4' });

    await flush();
    element.setAttribute('src', 'https://fast.wistia.net/embed/iframe/e4a27b971d');
    await flush();

    expect(element.children).toHaveLength(0);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('set its MIME type in the `type` attribute'));
  });

  it('keeps a newer source from reaching the media it is replacing', async () => {
    const element = create({ src: '/movie.mp4', 'prefer-playback': 'mse' });

    await flush();
    const video = element.querySelector('video')!;

    element.setAttribute('src', 'https://example.com/a.m3u8');
    await flush();
    element.setAttribute('src', 'https://example.com/b.m3u8');
    await flush();

    expect(video.getAttribute('src')).toBe('/movie.mp4');

    await vi.waitFor(() => expect(element.querySelector('hlsjs-video')).not.toBeNull(), LOAD_TIMEOUT);
    expect(element.querySelector('hlsjs-video')!.getAttribute('src')).toBe('https://example.com/b.m3u8');
  });

  it('ignores a slower load superseded by a newer source', async () => {
    const element = create({ src: 'https://vimeo.com/76979871' });

    await flush();
    element.setAttribute('src', '/movie.mp4');
    await flush();
    await vi.waitFor(() => expect(customElements.get('vimeo-video')).toBeDefined(), LOAD_TIMEOUT);
    await flush();

    expect(element.querySelector('vimeo-video')).toBeNull();
    expect(element.querySelector('video')!.getAttribute('src')).toBe('/movie.mp4');
  });
});
