import { MediaError } from '@videojs/media';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { requestKalturaEntry } from '../api';
import { apiException, ENTRY_LIST, NOT_A_LIVE_ENTRY, PLAYBACK_CONTEXT, PUBLIC_ENTRY, WIDGET_SESSION } from './fixtures';

const PARAMS = {
  serviceUrl: 'https://cdnapisec.kaltura.com',
  partnerId: 243342,
  entryId: '0_uka1msg4',
  clientTag: 'videojs:test',
};

function stubFetch(respond: () => Promise<Response>) {
  const fetchMock = vi.fn((_input: string | URL | Request, _init?: RequestInit) => respond());

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
}

function requestBody(fetchMock: ReturnType<typeof stubFetch>): Record<string, any> {
  return JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
}

async function rejection(promise: Promise<unknown>): Promise<MediaError> {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason
  );

  expect(error).toBeInstanceOf(MediaError);
  return error as MediaError;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('requestKalturaEntry', () => {
  it('looks an anonymous entry up with one multirequest that starts a widget session', async () => {
    const fetchMock = stubFetch(() => jsonResponse(PUBLIC_ENTRY));

    const response = await requestKalturaEntry({ ...PARAMS, referrer: 'https://example.com/page' });
    const body = requestBody(fetchMock);

    expect(fetchMock.mock.calls[0]![0]).toBe('https://cdnapisec.kaltura.com/api_v3/service/multirequest');
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ method: 'POST' });
    expect(body).toMatchObject({ format: 1, clientTag: 'videojs:test', partnerId: 243342 });
    expect(body.ks).toBeUndefined();
    expect(body['1']).toEqual({ service: 'session', action: 'startWidgetSession', widgetId: '_243342' });
    expect(body['2']).toMatchObject({
      service: 'baseEntry',
      action: 'list',
      ks: '{1:result:ks}',
      filter: { redirectFromEntryId: '0_uka1msg4' },
    });
    expect(body['3']).toMatchObject({
      service: 'baseEntry',
      action: 'getPlaybackContext',
      ks: '{1:result:ks}',
      entryId: '{2:result:objects:0:id}',
      contextDataParams: { referrer: 'https://example.com/page' },
    });
    expect(body['4']).toMatchObject({ service: 'liveStream', action: 'isLive', id: '{2:result:objects:0:id}' });

    expect(response.entry).toEqual({ id: '0_uka1msg4', name: 'Folgers Coffee', type: 1, moderationStatus: 5 });
    expect(response.context.sources.map((source) => source.deliveryProfileId)).toEqual([92, 4662, 13942, 5372]);
    expect(response.isLive).toBeUndefined();
  });

  it("sends the app's KS with the request instead of starting a widget session", async () => {
    const fetchMock = stubFetch(() => jsonResponse([ENTRY_LIST, PLAYBACK_CONTEXT, NOT_A_LIVE_ENTRY]));

    const response = await requestKalturaEntry({ ...PARAMS, ks: 'YXBwLWtz' });
    const body = requestBody(fetchMock);

    expect(body.ks).toBe('YXBwLWtz');
    expect(body['1']).toMatchObject({ service: 'baseEntry', action: 'list' });
    expect(body['1'].ks).toBeUndefined();
    expect(body['2']).toMatchObject({ action: 'getPlaybackContext', entryId: '{1:result:objects:0:id}' });
    expect(body['3']).toMatchObject({ action: 'isLive' });
    expect(response.entry.name).toBe('Folgers Coffee');
  });

  it('reads whether a live entry is broadcasting', async () => {
    stubFetch(() => jsonResponse([WIDGET_SESSION, ENTRY_LIST, PLAYBACK_CONTEXT, false]));

    expect((await requestKalturaEntry(PARAMS)).isLive).toBe(false);
  });

  it.each([
    [
      'the entry does not exist',
      [WIDGET_SESSION, apiException('INVALID_ENTRY_ID', 'Invalid entry id'), apiException('ENTRY_ID_NOT_FOUND', '')],
      'INVALID_ENTRY_ID',
    ],
    [
      'the partner is blocked',
      [
        apiException('SERVICE_FORBIDDEN_CONTENT_BLOCKED', 'blocked'),
        apiException('SERVICE_FORBIDDEN_CONTENT_BLOCKED', 'blocked'),
      ],
      'SERVICE_FORBIDDEN_CONTENT_BLOCKED',
    ],
    ['the request itself fails', apiException('INVALID_KS', 'Invalid KS'), 'INVALID_KS'],
    [
      'the playback context fails',
      [WIDGET_SESSION, ENTRY_LIST, apiException('ENTRY_ID_NOT_FOUND', ''), NOT_A_LIVE_ENTRY],
      'ENTRY_ID_NOT_FOUND',
    ],
    [
      'the entry list is empty',
      [WIDGET_SESSION, { totalCount: 0, objects: [] }, PLAYBACK_CONTEXT, NOT_A_LIVE_ENTRY],
      'ENTRY_ID_NOT_FOUND',
    ],
  ])('rejects with a source error carrying the Kaltura code when %s', async (_, results, code) => {
    stubFetch(() => jsonResponse(results));

    const error = await rejection(requestKalturaEntry(PARAMS));

    expect(error.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    expect(error.context).toBe(code);
    expect(error.fatal).toBe(true);
    expect(error.message).toBe(MediaError.defaultMessages[MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]);
  });

  it('keeps the Kaltura exception on the error', async () => {
    const exception = apiException('INVALID_ENTRY_ID', 'Invalid entry id');

    stubFetch(() => jsonResponse([WIDGET_SESSION, exception, exception, exception]));

    expect((await rejection(requestKalturaEntry(PARAMS))).data).toEqual(exception);
  });

  it.each([
    ['the API is unreachable', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['the API answers an HTTP error', () => Promise.resolve(new Response('', { status: 503 }))],
    ['the API answers something other than JSON', () => Promise.resolve(new Response('<html>', { status: 200 }))],
  ])('rejects with a network error when %s', async (_, respond) => {
    stubFetch(respond);

    const error = await rejection(requestKalturaEntry(PARAMS));

    expect(error.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    expect(error.context).toBe('KALTURA_API_UNREACHABLE');
  });

  it('passes an abort through rather than reporting it', async () => {
    const controller = new AbortController();

    stubFetch(() => Promise.reject(new DOMException('Aborted', 'AbortError')));

    controller.abort();

    await expect(requestKalturaEntry({ ...PARAMS, signal: controller.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
