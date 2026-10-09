import { HTMLVideoAdapter } from '@videojs/media/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { NativeHlsChaptersMixin } from '../chapters';

// Loading the document is SPF's `loadChaptersTracks`, covered there in a real
// browser; here only what the mixin hands it, and when it aborts, is observed.
const loadChaptersTracks = vi.hoisted(() =>
  vi.fn((..._args: Parameters<typeof import('@videojs/spf/dom').loadChaptersTracks>) => {})
);

vi.mock('@videojs/spf/dom', () => ({ loadChaptersTracks }));

type Responder = (url: string) => Response | Promise<Response>;

function stubFetch(responses: Record<string, Responder | string>) {
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    const entry = responses[url];

    init?.signal?.throwIfAborted();

    if (entry === undefined) return new Response('not found', { status: 404 });

    return typeof entry === 'function' ? entry(url) : new Response(entry, { status: 200 });
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

/** The signal of the most recent load. */
function lastSignal(): AbortSignal {
  return loadChaptersTracks.mock.lastCall![2];
}

const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

class FakeHost extends HTMLVideoAdapter {}

const NativeHlsChapters = NativeHlsChaptersMixin(FakeHost);

const MULTIVARIANT = [
  '#EXTM3U',
  '#EXT-X-SESSION-DATA:DATA-ID="com.apple.hls.chapters",URI="chapters.json"',
  '#EXT-X-STREAM-INF:BANDWIDTH=2000000',
  'media.m3u8',
].join('\n');

function createVideoWithSrc(src: string): HTMLVideoElement {
  const video = document.createElement('video');

  // Jsdom doesn't load the source; only `currentSrc` is read.
  Object.defineProperty(video, 'currentSrc', { configurable: true, writable: true, value: src });

  return video;
}

beforeEach(() => {
  loadChaptersTracks.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NativeHlsChaptersMixin', () => {
  it('loads the chapters document the multivariant playlist references', async () => {
    stubFetch({ 'https://stream.example.com/main.m3u8': MULTIVARIANT });
    const video = createVideoWithSrc('https://stream.example.com/main.m3u8');
    const host = new NativeHlsChapters();

    host.attach(video);

    await vi.waitFor(() =>
      expect(loadChaptersTracks).toHaveBeenCalledWith(
        video,
        'https://stream.example.com/chapters.json',
        expect.any(AbortSignal)
      )
    );

    host.destroy();
  });

  it('resolves the chapters URI against the playlist response URL after a redirect', async () => {
    stubFetch({
      'https://stream.example.com/main.m3u8': () => {
        const response = new Response(MULTIVARIANT);

        Object.defineProperty(response, 'url', { value: 'https://cdn.example.com/redirected/main.m3u8' });

        return response;
      },
    });
    const host = new NativeHlsChapters();

    host.attach(createVideoWithSrc('https://stream.example.com/main.m3u8'));

    await vi.waitFor(() => expect(loadChaptersTracks).toHaveBeenCalledOnce());
    expect(loadChaptersTracks.mock.lastCall![1]).toBe('https://cdn.example.com/redirected/chapters.json');

    host.destroy();
  });

  it('fetches the playlist once per source across repeated loadstarts', async () => {
    const fetchMock = stubFetch({ 'https://stream.example.com/main.m3u8': MULTIVARIANT });
    const video = createVideoWithSrc('https://stream.example.com/main.m3u8');
    const host = new NativeHlsChapters();

    host.attach(video);
    video.dispatchEvent(new Event('loadstart'));

    await vi.waitFor(() => expect(loadChaptersTracks).toHaveBeenCalledOnce());
    expect(fetchMock).toHaveBeenCalledOnce();

    host.destroy();
  });

  it('does nothing for a playlist without chapters session data', async () => {
    stubFetch({
      'https://stream.example.com/main.m3u8': ['#EXTM3U', '#EXT-X-STREAM-INF:BANDWIDTH=1', 'media.m3u8'].join('\n'),
    });
    const host = new NativeHlsChapters();

    host.attach(createVideoWithSrc('https://stream.example.com/main.m3u8'));
    await settle();
    await settle();

    expect(loadChaptersTracks).not.toHaveBeenCalled();

    host.destroy();
  });

  it('ignores sources that are not HLS', async () => {
    const fetchMock = stubFetch({});
    const host = new NativeHlsChapters();

    host.attach(createVideoWithSrc('https://example.com/video.mp4'));
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();

    host.destroy();
  });

  it('aborts the load when the source empties, and loads the next source', async () => {
    stubFetch({
      'https://stream.example.com/a.m3u8': MULTIVARIANT,
      'https://stream.example.com/b.m3u8': MULTIVARIANT.replace('chapters.json', 'b.json'),
    });
    const video = createVideoWithSrc('https://stream.example.com/a.m3u8');
    const host = new NativeHlsChapters();

    host.attach(video);
    await vi.waitFor(() => expect(loadChaptersTracks).toHaveBeenCalledOnce());

    const signal = lastSignal();

    video.dispatchEvent(new Event('emptied'));

    expect(signal.aborted).toBe(true);

    Object.defineProperty(video, 'currentSrc', { value: 'https://stream.example.com/b.m3u8' });
    video.dispatchEvent(new Event('loadstart'));

    await vi.waitFor(() => expect(loadChaptersTracks).toHaveBeenCalledTimes(2));
    expect(loadChaptersTracks.mock.lastCall![1]).toBe('https://stream.example.com/b.json');

    host.destroy();
  });

  it('aborts the load on detach', async () => {
    stubFetch({ 'https://stream.example.com/main.m3u8': MULTIVARIANT });
    const host = new NativeHlsChapters();

    host.attach(createVideoWithSrc('https://stream.example.com/main.m3u8'));
    await vi.waitFor(() => expect(loadChaptersTracks).toHaveBeenCalledOnce());

    host.detach();

    expect(lastSignal().aborted).toBe(true);
  });
});
