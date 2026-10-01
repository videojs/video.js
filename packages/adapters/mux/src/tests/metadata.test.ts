import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  createMuxMetadataURL,
  loadMuxMetadata,
  MuxMetadataLoader,
  parseMuxMetadata,
  toMuxContentData,
} from '../metadata';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// The document Mux serves: Apple's JSON chapters, the first chapter standing
// for the asset. `titles` is what a titled asset carries today; `metadata` is
// the format's key/value list, for the entries the free plan adds.
const DOCUMENT = [
  {
    'start-time': 0,
    titles: [{ language: 'und', title: 'Big Buck Bunny' }],
    metadata: [{ key: 'com.mux.video.branding', value: 'mux-free-plan' }],
  },
];

const FLATTENED = { title: 'Big Buck Bunny', 'com.mux.video.branding': 'mux-free-plan' };

function stubFetch(handler: (url: string) => Response | Promise<Response>) {
  const fetchMock = vi.fn((input: string | URL | Request) =>
    Promise.resolve(handler(input instanceof Request ? input.url : String(input)))
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

// Let a resolved fetch settle through the loader's `then`.
function flush() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('createMuxMetadataURL', () => {
  it('returns undefined without a playbackId', () => {
    expect(createMuxMetadataURL()).toBeUndefined();
    expect(createMuxMetadataURL(null)).toBeUndefined();
    expect(createMuxMetadataURL({ src: 'https://example.com/custom.m3u8' })).toBeUndefined();
  });

  it('builds the predictable URL from a playbackId', () => {
    expect(createMuxMetadataURL({ playbackId: 'abc123' })).toBe('https://stream.mux.com/abc123/metadata.json');
  });

  it('uses the custom domain', () => {
    expect(createMuxMetadataURL({ playbackId: 'abc123', customDomain: 'example.com' })).toBe(
      'https://stream.example.com/abc123/metadata.json'
    );
  });

  it('carries the playback token and nothing else from the playback params', () => {
    expect(createMuxMetadataURL({ playbackId: 'abc123', playback: { token: 'jwt', maxResolution: '1080p' } })).toBe(
      'https://stream.mux.com/abc123/metadata.json?token=jwt'
    );

    expect(createMuxMetadataURL({ playbackId: 'abc123', playback: { maxResolution: '1080p' } })).toBe(
      'https://stream.mux.com/abc123/metadata.json'
    );
  });
});

describe('parseMuxMetadata', () => {
  it('flattens the title and the entries on the first chapter', () => {
    expect(
      parseMuxMetadata([
        ...DOCUMENT,
        {
          titles: [{ title: 'Later chapter' }],
          metadata: [
            { key: 'com.mux.video.branding', value: 'later' },
            { key: 'second-only', value: 'excluded' },
          ],
        },
      ])
    ).toEqual(FLATTENED);
  });

  it('takes the first title as the default', () => {
    expect(
      parseMuxMetadata([
        {
          titles: [
            { language: 'en', title: 'English' },
            { language: 'fr', title: 'Français' },
          ],
        },
      ])
    ).toEqual({ title: 'English' });
  });

  it('is empty for an untitled asset without entries', () => {
    // What Mux serves for every asset that has no metadata.
    expect(parseMuxMetadata([{ 'start-time': 0 }])).toEqual({});
    expect(parseMuxMetadata([{ 'start-time': 0, titles: [], metadata: [] }])).toEqual({});
    expect(parseMuxMetadata([{ titles: [{ language: 'und', title: '' }] }])).toEqual({});
    expect(parseMuxMetadata([])).toEqual({});
  });

  it('is empty for anything that is not the document', () => {
    expect(parseMuxMetadata(undefined)).toEqual({});
    expect(parseMuxMetadata(null)).toEqual({});
    expect(parseMuxMetadata('nope')).toEqual({});
    expect(parseMuxMetadata({ titles: [{ title: 'x' }] })).toEqual({});
    expect(parseMuxMetadata([{ titles: 'nope', metadata: 'nope' }])).toEqual({});
    expect(parseMuxMetadata([{ titles: [{ title: 42 }] }])).toEqual({});
  });

  it('skips entries without a string key and value', () => {
    expect(
      parseMuxMetadata([
        {
          metadata: [
            { key: 'video_title', value: 'x' },
            { key: '', value: 'blank key' },
            { key: 'no_value' },
            { key: 'numeric', value: 1 },
            'nope',
            null,
          ],
        },
      ])
    ).toEqual({ video_title: 'x' });
  });
});

describe('loadMuxMetadata', () => {
  it('resolves the flattened document', async () => {
    const fetchMock = stubFetch(() => jsonResponse(DOCUMENT));

    await expect(loadMuxMetadata('https://stream.mux.com/abc123/metadata.json')).resolves.toEqual(FLATTENED);
    expect(fetchMock).toHaveBeenCalledWith('https://stream.mux.com/abc123/metadata.json', {});
  });

  it('passes the signal through', async () => {
    const fetchMock = stubFetch(() => jsonResponse(DOCUMENT));
    const { signal } = new AbortController();

    await loadMuxMetadata('https://stream.mux.com/abc123/metadata.json', signal);

    expect(fetchMock).toHaveBeenCalledWith('https://stream.mux.com/abc123/metadata.json', { signal });
  });

  it('resolves undefined quietly for a 404', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    stubFetch(() => jsonResponse({ error: { type: 'not_found' } }, 404));

    await expect(loadMuxMetadata('https://stream.mux.com/abc123/metadata.json')).resolves.toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('resolves undefined and warns for another failed response', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // What signed playback answers without its token.
    stubFetch(() => jsonResponse({ error: { type: 'not_authorized' } }, 403));

    await expect(loadMuxMetadata('https://stream.mux.com/abc123/metadata.json')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain('403');
  });

  it('resolves undefined and warns for a network failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    stubFetch(() => Promise.reject(new TypeError('Failed to fetch')));

    await expect(loadMuxMetadata('https://stream.mux.com/abc123/metadata.json')).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each(['AbortError', 'aborted signal', 'DOMException with aborted signal'] as const)(
    'resolves undefined quietly for %s',
    async (reason) => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const controller = new AbortController();

      stubFetch(() => {
        if (reason !== 'AbortError') controller.abort(new Error('Cancelled'));

        return Promise.reject(
          reason === 'AbortError'
            ? Object.assign(new Error('Aborted'), { name: 'AbortError' })
            : reason === 'aborted signal'
              ? controller.signal.reason
              : new DOMException('Aborted', 'AbortError')
        );
      });

      await expect(
        loadMuxMetadata('https://stream.mux.com/abc123/metadata.json', controller.signal)
      ).resolves.toBeUndefined();
      expect(warn).not.toHaveBeenCalled();
    }
  );
});

describe('toMuxContentData', () => {
  it('is empty without metadata', () => {
    expect(toMuxContentData()).toEqual({});
    expect(toMuxContentData({})).toEqual({});
  });

  it('keeps every key as it stands', () => {
    expect(toMuxContentData(FLATTENED)).toEqual(FLATTENED);
  });

  it('lets a video_title entry stand in for a missing title', () => {
    expect(toMuxContentData({ video_title: 'Big Buck Bunny' })).toEqual({
      title: 'Big Buck Bunny',
      video_title: 'Big Buck Bunny',
    });
    expect(toMuxContentData({ title: 'Titled', video_title: 'Entry' })).toEqual({
      title: 'Titled',
      video_title: 'Entry',
    });
  });

  it('leaves title absent for an empty video_title', () => {
    expect(toMuxContentData({ video_title: '' })).toEqual({ video_title: '' });
  });
});

describe('MuxMetadataLoader', () => {
  it('starts without metadata', () => {
    expect(new MuxMetadataLoader(() => {}).metadata).toBeUndefined();
  });

  it('loads the document for the source and announces it', async () => {
    const fetchMock = stubFetch(() => jsonResponse(DOCUMENT));
    const onChange = vi.fn();
    const loader = new MuxMetadataLoader(onChange);

    loader.reset({ playbackId: 'abc123' });
    loader.load();
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://stream.mux.com/abc123/metadata.json');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(loader.metadata).toEqual(FLATTENED);
  });

  it('does nothing without a Mux source', async () => {
    const fetchMock = stubFetch(() => jsonResponse(DOCUMENT));
    const loader = new MuxMetadataLoader(() => {});

    loader.load();

    loader.reset({ src: 'https://example.com/custom.m3u8' });
    loader.load();
    await flush();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requests each source once, across repeated loads', async () => {
    const fetchMock = stubFetch(() => jsonResponse(DOCUMENT));
    const loader = new MuxMetadataLoader(() => {});

    loader.reset({ playbackId: 'abc123' });
    loader.load();
    loader.load();
    await flush();
    loader.load();
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('settles a failed request so the source is not asked again', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const fetchMock = stubFetch(() => new Response('', { status: 500 }));
    const onChange = vi.fn();
    const loader = new MuxMetadataLoader(onChange);

    loader.reset({ playbackId: 'abc123' });
    loader.load();
    await flush();
    loader.load();
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(loader.metadata).toEqual({});
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keeps the document across a source with the same identity', async () => {
    const fetchMock = stubFetch(() => jsonResponse(DOCUMENT));
    const loader = new MuxMetadataLoader(() => {});

    loader.reset({ playbackId: 'abc123' });
    loader.load();
    await flush();

    // What `poster-time` does through the element: same stream, new object.
    loader.reset({ playbackId: 'abc123', poster: { time: 3 } });
    loader.load();
    await flush();

    expect(loader.metadata?.title).toBe('Big Buck Bunny');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('drops the document when the identity moves, and loads the new one', async () => {
    const fetchMock = stubFetch((url) =>
      jsonResponse([{ titles: [{ title: url.includes('xyz789') ? 'second' : 'first' }] }])
    );
    const loader = new MuxMetadataLoader(() => {});

    loader.reset({ playbackId: 'abc123' });
    loader.load();
    await flush();

    loader.reset({ playbackId: 'xyz789' });

    expect(loader.metadata).toBeUndefined();

    loader.load();
    await flush();

    expect(loader.metadata?.title).toBe('second');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('treats the playback token as part of the identity', async () => {
    const fetchMock = stubFetch(() => jsonResponse(DOCUMENT));
    const loader = new MuxMetadataLoader(() => {});

    loader.reset({ playbackId: 'abc123' });
    loader.load();
    await flush();

    loader.reset({ playbackId: 'abc123', playback: { token: 'jwt' } });
    loader.load();
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://stream.mux.com/abc123/metadata.json?token=jwt');
  });

  it('ignores a request that was in flight when the source moved', async () => {
    let release!: (response: Response) => void;
    const fetchMock = stubFetch(
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        })
    );
    const onChange = vi.fn();
    const loader = new MuxMetadataLoader(onChange);

    loader.reset({ playbackId: 'abc123' });
    loader.load();

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];

    loader.reset({ playbackId: 'xyz789' });

    expect(init.signal?.aborted).toBe(true);

    release(jsonResponse(DOCUMENT));
    await flush();

    expect(loader.metadata).toBeUndefined();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('aborts the request in flight on destroy', () => {
    const fetchMock = stubFetch(() => new Promise<Response>(() => {}));
    const loader = new MuxMetadataLoader(() => {});

    loader.reset({ playbackId: 'abc123' });
    loader.load();
    loader.destroy();

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];

    expect(init.signal?.aborted).toBe(true);
  });
});
