import { MediaError } from '@videojs/media';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { KalturaEntryResponse, KalturaPlaybackSource } from '../api';
import {
  createKalturaPlaybackURL,
  createKalturaPosterURL,
  createPlaySessionId,
  KALTURA_CLIENT_TAG,
  resolveKalturaReferrer,
  selectKalturaPlaybackSource,
} from '../playback';
import { HLS_STREAM, OTHER_HLS_STREAM } from './fixtures';

function hls(url: string, deliveryProfileId: number, drm: unknown[] = []): KalturaPlaybackSource {
  return { format: 'applehttp', url, deliveryProfileId, drm };
}

function response(overrides: Partial<KalturaEntryResponse['context']> = {}, entry = {}, isLive?: boolean) {
  return {
    entry: { id: '0_uka1msg4', type: 1, moderationStatus: 6, ...entry },
    context: {
      sources: [
        { format: 'mpegdash', url: 'https://example.com/manifest.mpd', deliveryProfileId: 4662, drm: [] },
        hls(HLS_STREAM, 13942),
        hls(OTHER_HLS_STREAM, 5372),
      ],
      actions: [],
      messages: [],
      ...overrides,
    },
    isLive,
  };
}

function expectError(result: KalturaPlaybackSource | MediaError, code: number, context: string): MediaError {
  expect(result).toBeInstanceOf(MediaError);

  const error = result as MediaError;

  expect(error.code).toBe(code);
  expect(error.context).toBe(context);
  expect(error.fatal).toBe(true);
  return error;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('selectKalturaPlaybackSource', () => {
  it('picks the first unprotected HLS source', () => {
    expect(selectKalturaPlaybackSource(response())).toMatchObject({ url: HLS_STREAM });
  });

  it('prefers an HTTPS source over an earlier HTTP one', () => {
    const result = selectKalturaPlaybackSource(
      response({ sources: [hls('http://cdnapi.kaltura.com/a.m3u8', 1), hls(HLS_STREAM, 13942)] })
    );

    expect(result).toMatchObject({ url: HLS_STREAM });
  });

  it('picks the source of a named delivery profile', () => {
    expect(selectKalturaPlaybackSource(response(), 5372)).toMatchObject({ url: OTHER_HLS_STREAM });
  });

  it('falls back to the default source, with a warning, when no source uses the named delivery profile', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(selectKalturaPlaybackSource(response(), 1)).toMatchObject({ url: HLS_STREAM });
    expect(warn).toHaveBeenCalledOnce();
  });

  it("reports a blocked entry with the publisher's message and access-control code", () => {
    const messages = [{ message: 'Un authorized country', code: 'COUNTRY_RESTRICTED' }];
    const error = expectError(
      selectKalturaPlaybackSource(response({ actions: [{ type: 1 }], messages })),
      MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
      'COUNTRY_RESTRICTED'
    );

    expect(error.message).toBe('Un authorized country');
    expect(error.data).toEqual({ messages });
  });

  it('reports a blocked entry without a message with the default message', () => {
    const error = expectError(
      selectKalturaPlaybackSource(response({ actions: [{ type: 1 }] })),
      MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
      'ACCESS_CONTROL_BLOCKED'
    );

    expect(error.message).toBe(MediaError.defaultMessages[MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED]);
  });

  it('plays through access-control actions that do not block, such as a preview', () => {
    expect(selectKalturaPlaybackSource(response({ actions: [{ type: 2 }] }))).toMatchObject({ url: HLS_STREAM });
  });

  it.each([
    [1, 'pending'],
    [3, 'rejected'],
  ])('reports an entry whose moderation status is %s (%s)', (moderationStatus) => {
    expectError(
      selectKalturaPlaybackSource(response({}, { moderationStatus })),
      MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
      'ENTRY_MODERATION_ERROR'
    );
  });

  it('plays an entry flagged for review, which Kaltura still serves', () => {
    expect(selectKalturaPlaybackSource(response({}, { moderationStatus: 5 }))).toMatchObject({ url: HLS_STREAM });
  });

  it('reports a live entry that is not broadcasting, and plays one that is', () => {
    expectError(
      selectKalturaPlaybackSource(response({}, { type: 7 }, false)),
      MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
      'LIVE_STREAM_NOT_BROADCASTING'
    );
    expect(selectKalturaPlaybackSource(response({}, { type: 7 }, true))).toMatchObject({ url: HLS_STREAM });
  });

  it('reports an entry whose HLS sources are all protected', () => {
    expectError(
      selectKalturaPlaybackSource(response({ sources: [hls(HLS_STREAM, 13942, [{ scheme: 'drm.WIDEVINE_CENC' }])] })),
      MediaError.MEDIA_ERR_ENCRYPTED,
      'DRM_NOT_SUPPORTED'
    );
  });

  it('reports an entry without an HLS source', () => {
    expectError(
      selectKalturaPlaybackSource(response({ sources: [] })),
      MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
      'NO_PLAYABLE_SOURCE'
    );
  });
});

describe('createKalturaPlaybackURL', () => {
  it('adds the KS, player, play session, client, and base64 page to the query', () => {
    const url = new URL(
      createKalturaPlaybackURL(HLS_STREAM, {
        ks: 'YXBwLWtz',
        uiConfId: 28685261,
        playSessionId: 'session-1',
        referrer: 'https://example.com/page',
      })
    );

    expect(url.pathname).toBe(new URL(HLS_STREAM).pathname);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      ks: 'YXBwLWtz',
      uiConfId: '28685261',
      playSessionId: 'session-1',
      clientTag: KALTURA_CLIENT_TAG,
      referrer: btoa('https://example.com/page'),
    });
  });

  it('leaves parameters the URL already carries, in its query or its path, as written', () => {
    const url = new URL(
      createKalturaPlaybackURL(`${HLS_STREAM.replace('/a.m3u8', '/ks/cGF0aC1rcw/a.m3u8')}?clientTag=mine`, {
        ks: 'YXBwLWtz',
        playSessionId: 'session-1',
      })
    );

    expect(url.searchParams.has('ks')).toBe(false);
    expect(url.searchParams.get('clientTag')).toBe('mine');
    expect(url.searchParams.get('playSessionId')).toBe('session-1');
  });

  it('encodes a page URL outside Latin-1 as UTF-8 and caps it at 1000 characters', () => {
    const encoded = (referrer: string) =>
      new URL(createKalturaPlaybackURL(HLS_STREAM, { playSessionId: 's', referrer })).searchParams.get('referrer')!;
    const decode = (value: string) => new TextDecoder().decode(Uint8Array.from(atob(value), (c) => c.charCodeAt(0)));

    expect(decode(encoded('https://example.com/café'))).toBe('https://example.com/café');
    expect(decode(encoded(`https://example.com/${'a'.repeat(2000)}`))).toHaveLength(1000);
  });
});

describe('createKalturaPosterURL', () => {
  it("builds a thumbnail URL on the entry's deployment, large enough for a player", () => {
    expect(createKalturaPosterURL('https://cdnapisec.kaltura.com', 243342, '0_uka1msg4')).toBe(
      'https://cdnapisec.kaltura.com/p/243342/thumbnail/entry_id/0_uka1msg4/width/1280'
    );
  });
});

describe('resolveKalturaReferrer', () => {
  it('defaults to the page URL without its fragment', () => {
    vi.stubGlobal('location', { href: 'https://example.com/watch?v=1#comments' });

    expect(resolveKalturaReferrer(undefined)).toBe('https://example.com/watch?v=1');
  });

  it('takes an explicit page URL, and none when opted out', () => {
    expect(resolveKalturaReferrer('https://example.com/')).toBe('https://example.com/');
    expect(resolveKalturaReferrer(false)).toBeUndefined();
  });
});

describe('createPlaySessionId', () => {
  it('generates a new version 4 UUID each time', () => {
    const first = createPlaySessionId();

    expect(first).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
    expect(createPlaySessionId()).not.toBe(first);
  });
});
