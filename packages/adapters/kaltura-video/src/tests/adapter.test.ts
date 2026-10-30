import { MediaError } from '@videojs/media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { KalturaVideoAdapter } from '..';
import { apiException, ENTRY_LIST, HLS_STREAM, PLAYBACK_CONTEXT, PUBLIC_ENTRY, WIDGET_SESSION } from './fixtures';

const SHORTHAND = 'kaltura/243342/0_uka1msg4';
const V2_EMBED =
  'https://cdnapisec.kaltura.com/p/243342/sp/24334200/embedIframeJs/uiconf_id/28685261/partner_id/243342?iframeembed=true&entry_id=0_uka1msg4';
const MANIFEST =
  'https://cdnapisec.kaltura.com/p/243342/sp/24334200/playManifest/entryId/0_uka1msg4/format/applehttp/protocol/https/a.m3u8';
const POSTER = 'https://cdnapisec.kaltura.com/p/243342/thumbnail/entry_id/0_uka1msg4/width/1280';

interface Deferred {
  resolve(results: unknown): void;
  signal: AbortSignal | undefined;
}

let requests: Deferred[] = [];

// Every request waits until the test answers it, so a test sees the media both
// before and after Kaltura replies.
function stubKaltura() {
  requests = [];

  const fetchMock = vi.fn(
    (_input: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((resolve) => {
        requests.push({
          resolve: (results) => resolve(new Response(JSON.stringify(results), { status: 200 })),
          signal: init?.signal ?? undefined,
        });
      })
  );

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Answer the latest request, then let the media take the answer in. */
async function answer(results: unknown) {
  requests.at(-1)!.resolve(results);
  await settle();
}

// Assigning a source requests a load on a microtask, and a response settles on
// a few more.
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function setup() {
  const video = document.createElement('video');
  const media = new KalturaVideoAdapter();

  document.body.append(video);
  media.attach(video);

  return { media, video };
}

function requestBody(fetchMock: ReturnType<typeof stubKaltura>, call = 0): Record<string, any> {
  return JSON.parse(fetchMock.mock.calls[call]![1]!.body as string);
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('KalturaVideoAdapter', () => {
  it('defaults source to null', () => {
    expect(new KalturaVideoAdapter().source).toBeNull();
  });

  it('reads the entry a src URL names into source, and reads src back as written', () => {
    stubKaltura();
    const media = new KalturaVideoAdapter();

    media.src = V2_EMBED;

    expect(media.src).toBe(V2_EMBED);
    expect(media.source).toEqual({ src: V2_EMBED, partnerId: 243342, entryId: '0_uka1msg4', uiConfId: 28685261 });
  });

  it('resolves the entry with one request when it loads, then plays its HLS stream', async () => {
    const fetchMock = stubKaltura();
    const { media, video } = setup();

    media.src = SHORTHAND;
    await settle();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(video.hasAttribute('src')).toBe(false);

    await answer(PUBLIC_ENTRY);

    const stream = new URL(video.getAttribute('src')!);

    expect(stream.origin + stream.pathname).toBe(HLS_STREAM);
    expect(stream.searchParams.get('playSessionId')).toBe(media.playSessionId);
    expect(stream.searchParams.get('clientTag')).toMatch(/^videojs:v/);
    expect(atob(stream.searchParams.get('referrer')!)).toBe(location.href.split('#')[0]);
    expect(stream.searchParams.has('ks')).toBe(false);
    expect(media.src).toBe(SHORTHAND);
  });

  it("sends the app's KS instead of starting a widget session, and adds it to the stream", async () => {
    const fetchMock = stubKaltura();
    const { media, video } = setup();

    media.source = { partnerId: 243342, entryId: '0_uka1msg4', ks: 'YXBwLWtz', referrer: false };
    await settle();

    expect(requestBody(fetchMock)).toMatchObject({ ks: 'YXBwLWtz', 1: { action: 'list' } });

    await answer([ENTRY_LIST, PLAYBACK_CONTEXT, apiException('INVALID_ENTRY_ID', '')]);

    const stream = new URL(video.getAttribute('src')!);

    expect(stream.searchParams.get('ks')).toBe('YXBwLWtz');
    expect(stream.searchParams.has('referrer')).toBe(false);
  });

  it("asks the deployment a source names, and the delivery profile's stream", async () => {
    const fetchMock = stubKaltura();
    const { media, video } = setup();

    media.source = {
      partnerId: 243342,
      entryId: '0_uka1msg4',
      serviceUrl: 'https://api.ca.kaltura.com/api_v3/',
      deliveryProfileId: 5372,
    };
    await settle();

    expect(fetchMock.mock.calls[0]![0]).toBe('https://api.ca.kaltura.com/api_v3/service/multirequest');
    expect(media.contentData.poster).toBe(
      'https://api.ca.kaltura.com/p/243342/thumbnail/entry_id/0_uka1msg4/width/1280'
    );

    await answer(PUBLIC_ENTRY);

    expect(video.getAttribute('src')).toContain('/deliveryProfileId/5372/');
  });

  it('reports the poster with the source and the title once the entry resolves', async () => {
    stubKaltura();
    const { media } = setup();
    const contentDataChange = vi.fn();

    media.addEventListener('contentdatachange', contentDataChange);
    media.src = SHORTHAND;

    expect(media.contentData).toEqual({ poster: POSTER });
    expect(contentDataChange).toHaveBeenCalledOnce();

    await settle();
    await answer(PUBLIC_ENTRY);

    expect(media.contentData).toEqual({ poster: POSTER, title: 'Folgers Coffee' });
    expect(contentDataChange).toHaveBeenCalledTimes(2);
  });

  it('plays a playManifest HLS URL as written right away, and asks Kaltura for its title only', async () => {
    const fetchMock = stubKaltura();
    const { media, video } = setup();
    const error = vi.fn();

    media.addEventListener('error', error);
    media.src = MANIFEST;
    await settle();

    expect(video.getAttribute('src')).toMatch(new RegExp(`^${MANIFEST.replace(/[.?]/g, '\\$&')}\\?playSessionId=`));
    expect(fetchMock).toHaveBeenCalledOnce();

    await answer([WIDGET_SESSION, apiException('INVALID_ENTRY_ID', ''), apiException('ENTRY_ID_NOT_FOUND', '')]);

    expect(error).not.toHaveBeenCalled();
    expect(media.error).toBeNull();
  });

  it('plays any other URL as plain HLS without asking Kaltura', async () => {
    const fetchMock = stubKaltura();
    const { media, video } = setup();

    media.src = 'https://example.com/video.m3u8';
    await settle();

    expect(video.getAttribute('src')).toBe('https://example.com/video.m3u8');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(media.contentData).toEqual({});
    expect(media.playSessionId).toBeUndefined();
  });

  it("reports an entry Kaltura does not know with Kaltura's code, and plays nothing", async () => {
    stubKaltura();
    const { media, video } = setup();
    const error = vi.fn();

    media.addEventListener('error', error);
    media.src = 'kaltura/243342/0_missing0';
    await settle();
    await answer([WIDGET_SESSION, apiException('INVALID_ENTRY_ID', ''), apiException('ENTRY_ID_NOT_FOUND', '')]);

    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0]![0]).toBeInstanceOf(ErrorEvent);
    expect(media.error).toBeInstanceOf(MediaError);
    expect(media.error).toMatchObject({ code: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED, context: 'INVALID_ENTRY_ID' });
    expect(video.hasAttribute('src')).toBe(false);
  });

  it("reports a blocked entry with the publisher's message", async () => {
    stubKaltura();
    const { media } = setup();

    media.src = SHORTHAND;
    await settle();
    await answer([
      WIDGET_SESSION,
      ENTRY_LIST,
      {
        ...PLAYBACK_CONTEXT,
        actions: [{ type: 1 }],
        messages: [{ message: 'Un authorized country', code: 'COUNTRY_RESTRICTED' }],
      },
      apiException('INVALID_ENTRY_ID', ''),
    ]);

    expect(media.error).toMatchObject({ message: 'Un authorized country', context: 'COUNTRY_RESTRICTED' });
  });

  it('keeps the resolved stream when an equal source is assigned again', async () => {
    const fetchMock = stubKaltura();
    const { media, video } = setup();

    media.source = { partnerId: 243342, entryId: '0_uka1msg4' };
    await settle();
    await answer(PUBLIC_ENTRY);

    const stream = video.getAttribute('src');
    const playSessionId = media.playSessionId;

    // A new object for the same entry, as an inline React prop is on every render.
    media.source = { partnerId: 243342, entryId: '0_uka1msg4' };
    await settle();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(video.getAttribute('src')).toBe(stream);
    expect(media.playSessionId).toBe(playSessionId);
  });

  it('drops a request in flight, and the stream playing, when the source names another entry', async () => {
    const fetchMock = stubKaltura();
    const { media, video } = setup();

    media.src = SHORTHAND;
    await settle();
    await answer(PUBLIC_ENTRY);

    const firstSession = media.playSessionId;

    media.src = 'kaltura/243342/1_sf5ovm7u';
    await settle();

    expect(video.hasAttribute('src')).toBe(false);
    expect(media.contentData).toEqual({
      poster: 'https://cdnapisec.kaltura.com/p/243342/thumbnail/entry_id/1_sf5ovm7u/width/1280',
    });

    media.src = SHORTHAND;
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(requests[1]!.signal!.aborted).toBe(true);
    expect(media.playSessionId).not.toBe(firstSession);
  });

  it('announces an empty element when the source moves on from a failed entry, so the error clears', async () => {
    stubKaltura();
    const { media } = setup();

    media.src = 'kaltura/243342/0_missing0';
    await settle();
    await answer([WIDGET_SESSION, apiException('INVALID_ENTRY_ID', ''), apiException('ENTRY_ID_NOT_FOUND', '')]);

    const emptied = vi.fn();

    media.addEventListener('emptied', emptied);
    media.src = SHORTHAND;

    expect(emptied).toHaveBeenCalledOnce();
    expect(media.error).toBeNull();
  });

  it('asks again for a failed entry when it loads again', async () => {
    const fetchMock = stubKaltura();
    const { media, video } = setup();

    media.src = SHORTHAND;
    await settle();
    await answer({ code: 'INTERNAL_SERVERL_ERROR', message: '', objectType: 'KalturaAPIException' });

    expect(media.error).not.toBeNull();

    const emptied = vi.fn();

    media.addEventListener('emptied', emptied);
    media.load();
    await answer(PUBLIC_ENTRY);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(emptied).toHaveBeenCalledOnce();
    expect(media.error).toBeNull();
    expect(video.getAttribute('src')).toContain('/format/applehttp/');
  });

  it('carries playback options across a new src, but not the entry or its session', () => {
    stubKaltura();
    const media = new KalturaVideoAdapter();

    media.source = {
      partnerId: 243342,
      entryId: '0_uka1msg4',
      ks: 'YXBwLWtz',
      referrer: false,
      maxAutoResolution: '720p',
      engine: { hlsJs: { maxBufferLength: 60 } },
    };
    media.src = 'kaltura/243342/1_sf5ovm7u';

    expect(media.source).toEqual({
      src: 'kaltura/243342/1_sf5ovm7u',
      partnerId: 243342,
      entryId: '1_sf5ovm7u',
      referrer: false,
      maxAutoResolution: '720p',
      engine: { hlsJs: { maxBufferLength: 60 } },
    });
  });

  it('aborts a request in flight when destroyed', async () => {
    stubKaltura();
    const { media } = setup();

    media.src = SHORTHAND;
    await settle();
    media.destroy();

    expect(requests[0]!.signal!.aborted).toBe(true);
  });
});
