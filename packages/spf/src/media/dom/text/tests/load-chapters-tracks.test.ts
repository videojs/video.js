import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { loadChaptersTracks } from '../load-chapters-tracks';

const CHAPTERS_URL = 'https://example.com/chapters.json';

const DOCUMENT = [
  { 'start-time': 0, titles: [{ language: 'und', title: 'Intro' }] },
  { 'start-time': 10, titles: [{ language: 'es', title: 'Fin' }] },
];

function chaptersTracks(media: HTMLMediaElement): HTMLTrackElement[] {
  return Array.from(media.querySelectorAll<HTMLTrackElement>('track[kind="chapters"]'));
}

const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 50);
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadChaptersTracks', () => {
  it('loads the document as chapters tracks, the preferred language leading, and removes them on abort', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(DOCUMENT)))
    );
    const media = document.createElement('video');
    const controller = new AbortController();

    loadChaptersTracks(media, CHAPTERS_URL, controller.signal, { preferredLanguage: 'es' });

    await vi.waitFor(() => expect(chaptersTracks(media).map((el) => el.srclang)).toEqual(['es', 'und']));

    controller.abort();

    expect(chaptersTracks(media)).toEqual([]);
  });

  it('cancels a request in flight on abort and loads nothing', async () => {
    let request: Request | undefined;
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Request) => {
        request = input;
        await released;

        return new Response(JSON.stringify(DOCUMENT));
      })
    );

    const media = document.createElement('video');
    const controller = new AbortController();

    loadChaptersTracks(media, CHAPTERS_URL, controller.signal);
    await vi.waitFor(() => expect(request).toBeDefined());

    controller.abort();
    release();
    await settle();

    expect(request!.signal.aborted).toBe(true);
    expect(chaptersTracks(media)).toEqual([]);
  });

  it('does nothing for a signal that is already aborted', async () => {
    const fetchMock = vi.fn();

    vi.stubGlobal('fetch', fetchMock);

    loadChaptersTracks(document.createElement('video'), CHAPTERS_URL, AbortSignal.abort());
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
