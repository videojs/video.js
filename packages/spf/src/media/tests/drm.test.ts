import { describe, expect, it } from 'vite-plus/test';

import {
  declaredDrmKeys,
  declaredEncryptionScheme,
  type DrmRequest,
  type DrmSystemsConfig,
  firstNonDrmEncryptionKey,
  keySystemCandidates,
  type KeySystemModule,
  manifestInitData,
  resolveDrmCredentials,
  resolveDrmHeaders,
  resolveDrmUrl,
  sourceDrmSystems,
  unsupportedEncryptionMethodCause,
} from '../drm';
import { SVTA_UNSUPPORTED_ENCRYPTION_METHOD } from '../errors';
import type { MaybeResolvedPresentation } from '../types';
import type { Presentation } from '../types';

const WIDEVINE_KEY = {
  method: 'SAMPLE-AES',
  uri: 'data:text/plain;base64,cGluZw==',
  keyFormat: 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
};
const FAIRPLAY_KEY = {
  method: 'SAMPLE-AES',
  uri: 'skd://mux?keyId=abc',
  keyFormat: 'com.apple.streamingkeydelivery',
};

// Stand-in modules: this file tests the DOM-free model, so it declares the
// minimum contract rather than importing the real (DOM-bound) modules.
const widevine: KeySystemModule = {
  keySystem: 'com.widevine.alpha',
  keyFormats: ['urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed'],
};
const fairPlay: KeySystemModule = {
  keySystem: 'com.apple.fps',
  keyFormats: ['com.apple.streamingkeydelivery'],
};

function makePresentation(tracks: object[]): Presentation {
  return {
    id: 'p1',
    url: 'https://example.com/multivariant.m3u8',
    selectionSets: [
      {
        id: 'ss1',
        type: 'video' as const,
        switchingSets: [{ id: 'sw1', type: 'video' as const, tracks }],
      },
    ],
  } as Presentation;
}

function makeResolvedTrack(keys?: object[], overrides: object = {}) {
  return {
    type: 'video' as const,
    id: 'v-1',
    url: 'https://example.com/v.m3u8',
    bandwidth: 1000,
    mimeType: 'video/mp4',
    codecs: ['avc1.4d401f'],
    segments: [{ id: 's0', url: 'https://example.com/0.m4s', startTime: 0, duration: 4 }],
    startTime: 0,
    duration: 4,
    ...(keys && { metadata: { mediaPlaylist: { targetDuration: 4, mediaSequence: 0, endList: true, keys } } }),
    ...overrides,
  };
}

describe('declaredDrmKeys', () => {
  it('collects keys from resolved tracks', () => {
    const presentation = makePresentation([makeResolvedTrack([WIDEVINE_KEY, FAIRPLAY_KEY])]);

    expect(declaredDrmKeys(presentation)).toEqual([WIDEVINE_KEY, FAIRPLAY_KEY]);
  });

  it('dedupes the same declaration across tracks', () => {
    const presentation = makePresentation([
      makeResolvedTrack([WIDEVINE_KEY]),
      makeResolvedTrack([{ ...WIDEVINE_KEY }], { id: 'v-2', url: 'https://example.com/v2.m3u8' }),
    ]);

    expect(declaredDrmKeys(presentation)).toEqual([WIDEVINE_KEY]);
  });

  it('is empty for unresolved presentations, clear tracks, and unresolved tracks', () => {
    expect(declaredDrmKeys(undefined)).toEqual([]);
    expect(declaredDrmKeys({ url: 'https://example.com/m.m3u8' })).toEqual([]);
    expect(declaredDrmKeys(makePresentation([makeResolvedTrack()]))).toEqual([]);

    const { segments: _segments, ...unresolved } = makeResolvedTrack([FAIRPLAY_KEY]);

    expect(declaredDrmKeys(makePresentation([unresolved]))).toEqual([]);
    expect(declaredDrmKeys(makePresentation([unresolved, makeResolvedTrack([WIDEVINE_KEY])]))).toEqual([WIDEVINE_KEY]);
  });
});

describe('declaredEncryptionScheme', () => {
  it('maps SAMPLE-AES to cbcs and SAMPLE-AES-CTR to cenc', () => {
    expect(declaredEncryptionScheme([WIDEVINE_KEY])).toBe('cbcs');
    expect(declaredEncryptionScheme([{ ...WIDEVINE_KEY, method: 'SAMPLE-AES-CTR' }])).toBe('cenc');
  });

  it('declares nothing for mixed or unrecognized methods', () => {
    expect(declaredEncryptionScheme([WIDEVINE_KEY, { ...WIDEVINE_KEY, method: 'SAMPLE-AES-CTR' }])).toBeUndefined();
    expect(declaredEncryptionScheme([{ method: 'AES-128', uri: 'k.bin' }])).toBeUndefined();
    expect(declaredEncryptionScheme([])).toBeUndefined();
  });
});

describe('keySystemCandidates', () => {
  const drm = {
    'com.widevine.alpha': { licenseUrl: 'https://license.example.com/widevine' },
    'com.apple.fps': { licenseUrl: 'https://license.example.com/fairplay' },
  };
  const keySystems = [fairPlay, widevine];
  const ids = (modules: KeySystemModule[]) => modules.map((module_) => module_.keySystem);

  it('intersects declared key formats with configured systems, in `keySystems` order', () => {
    // FairPlay outranks Widevine because the caller's list says so, even though
    // the manifest declares it second.
    expect(ids(keySystemCandidates([WIDEVINE_KEY, FAIRPLAY_KEY], drm, keySystems))).toEqual([
      'com.apple.fps',
      'com.widevine.alpha',
    ]);
  });

  it('offers only the modules the composition carries', () => {
    // The composability guarantee: a system the manifest declares and the config
    // licenses is still never offered when its module isn't composed.
    expect(ids(keySystemCandidates([WIDEVINE_KEY, FAIRPLAY_KEY], drm, [widevine]))).toEqual(['com.widevine.alpha']);
  });

  it('omits declared systems with no configured license server', () => {
    expect(
      ids(
        keySystemCandidates(
          [WIDEVINE_KEY, FAIRPLAY_KEY],
          { 'com.widevine.alpha': drm['com.widevine.alpha'] },
          keySystems
        )
      )
    ).toEqual(['com.widevine.alpha']);
  });

  it('ignores keys with unrecognized or absent KEYFORMAT', () => {
    expect(keySystemCandidates([{ method: 'AES-128', uri: 'k.bin' }], drm, keySystems)).toEqual([]);
    expect(keySystemCandidates([{ ...WIDEVINE_KEY, keyFormat: 'urn:uuid:unknown' }], drm, keySystems)).toEqual([]);
  });

  it('resolves a function-valued license server', () => {
    expect(
      ids(
        keySystemCandidates(
          [WIDEVINE_KEY],
          { 'com.widevine.alpha': { licenseUrl: () => 'https://license.example.com/widevine' } },
          keySystems
        )
      )
    ).toEqual(['com.widevine.alpha']);
  });

  it('omits a declared system whose license server resolves to nothing', () => {
    // The per-source "not licensable" signal: the entry names the system, but
    // the current source has no credentials for it, so it prunes exactly as an
    // unnamed system does.
    expect(
      keySystemCandidates(
        [WIDEVINE_KEY, FAIRPLAY_KEY],
        { 'com.widevine.alpha': { licenseUrl: undefined }, 'com.apple.fps': { licenseUrl: () => undefined } },
        keySystems
      )
    ).toEqual([]);
  });

  it('treats a throwing resolver as no configured license server', () => {
    expect(
      keySystemCandidates(
        [WIDEVINE_KEY],
        {
          'com.widevine.alpha': {
            licenseUrl: () => {
              throw new Error('no token yet');
            },
          },
        },
        keySystems
      )
    ).toEqual([]);
  });
});

describe('resolveDrmUrl', () => {
  it('passes a plain value through, including undefined', () => {
    expect(resolveDrmUrl('https://license.example.com/widevine')).toBe('https://license.example.com/widevine');
    expect(resolveDrmUrl(undefined)).toBeUndefined();
  });

  it('calls a resolver and returns what it yields', () => {
    expect(resolveDrmUrl(() => 'https://license.example.com/fairplay')).toBe('https://license.example.com/fairplay');
    expect(resolveDrmUrl(() => undefined)).toBeUndefined();
  });

  it('answers undefined when the resolver throws', () => {
    expect(
      resolveDrmUrl(() => {
        throw new Error('no token yet');
      })
    ).toBeUndefined();
  });
});

describe('resolveDrmHeaders', () => {
  it('passes a plain header map through and resolves a function-valued one', () => {
    expect(resolveDrmHeaders({ 'X-AxDRM-Message': 'entitlement' })).toEqual({ 'X-AxDRM-Message': 'entitlement' });
    expect(resolveDrmHeaders(() => ({ customdata: 'buydrm' }))).toEqual({ customdata: 'buydrm' });
    expect(resolveDrmHeaders(undefined)).toBeUndefined();
  });

  it('answers undefined when the resolver throws', () => {
    expect(
      resolveDrmHeaders(() => {
        throw new Error('no entitlement yet');
      })
    ).toBeUndefined();
  });
});

describe('sourceDrmSystems', () => {
  const widevine: KeySystemModule = { keySystem: 'com.widevine.alpha', keyFormats: [] };

  it('resolves url, header, and credentials fields from the current source, and reflects a source swap', () => {
    let drm: DrmSystemsConfig | undefined = {
      'com.widevine.alpha': {
        licenseUrl: 'https://a',
        headers: { Authorization: 'one' },
        certificateHeaders: { 'x-cert': 'two' },
        credentials: 'include',
      },
    };
    // The engine holds this entry object for its whole life; a swap must show through it, not a rebuild.
    const entry = sourceDrmSystems(() => drm, [widevine])['com.widevine.alpha']!;

    expect(resolveDrmUrl(entry.licenseUrl)).toBe('https://a');
    expect(resolveDrmHeaders(entry.headers)).toEqual({ Authorization: 'one' });
    expect(resolveDrmHeaders(entry.certificateHeaders)).toEqual({ 'x-cert': 'two' });
    expect(resolveDrmCredentials(entry.credentials)).toBe('include');

    drm = { 'com.widevine.alpha': { licenseUrl: 'https://b' } };

    expect(resolveDrmUrl(entry.licenseUrl)).toBe('https://b');
    expect(resolveDrmHeaders(entry.headers)).toBeUndefined();
    expect(resolveDrmHeaders(entry.certificateHeaders)).toBeUndefined();
    expect(resolveDrmCredentials(entry.credentials)).toBeUndefined();
  });

  it('applies the current source response transform, and derefs it live across swaps', async () => {
    let drm: DrmSystemsConfig | undefined;
    const entry = sourceDrmSystems(() => drm, [widevine])['com.widevine.alpha']!;
    const bytes = new Uint8Array([1, 2, 3]);

    // No source transform named: the same bytes pass through untouched.
    expect(await entry.licenseResponse!(bytes)).toBe(bytes);

    drm = { 'com.widevine.alpha': { licenseUrl: 'https://l', licenseResponse: () => new Uint8Array([9]) } };
    expect([...(await entry.licenseResponse!(bytes))]).toEqual([9]);

    // Swapped to a source with none again: the same stable wrapper reverts to passthrough.
    drm = {};
    expect(await entry.licenseResponse!(bytes)).toBe(bytes);
  });

  it('passes a request through untouched until the source names a request transform', async () => {
    let drm: DrmSystemsConfig | undefined = {};
    const entry = sourceDrmSystems(() => drm, [widevine])['com.widevine.alpha']!;
    const request: DrmRequest = { url: 'https://l', method: 'GET', headers: {}, body: null };

    expect(await entry.certificateRequest!(request)).toBe(request);
    expect(await entry.licenseRequest!(request)).toBe(request);

    drm = {
      'com.widevine.alpha': {
        licenseUrl: 'https://l',
        licenseRequest: (r) => ({ ...r, headers: { ...r.headers, 'X-Tok': 't' } }),
      },
    };
    expect((await entry.licenseRequest!(request)).headers).toEqual({ 'X-Tok': 't' });
  });
});

describe('firstNonDrmEncryptionKey', () => {
  const aes = { method: 'AES-128', uri: 'https://example.com/key.bin' }; // no KEYFORMAT = identity
  const widevine = { method: 'SAMPLE-AES', keyFormat: 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed' };

  it('returns the first identity-keyformat key (absent or explicit), skipping DRM keys', () => {
    expect(firstNonDrmEncryptionKey([widevine, aes])?.method).toBe('AES-128');
    expect(firstNonDrmEncryptionKey([{ method: 'AES-128', keyFormat: 'identity' }])?.keyFormat).toBe('identity');
  });

  it('returns undefined when every declared key names a DRM system, or there are none', () => {
    expect(firstNonDrmEncryptionKey([widevine])).toBeUndefined();
    expect(firstNonDrmEncryptionKey([])).toBeUndefined();
  });
});

describe('unsupportedEncryptionMethodCause', () => {
  it('names the encryption method for an identity-keyformat (clear-key AES) key, carrying the caller data', () => {
    // No KEYFORMAT means identity per RFC 8216 — AES-128 over HTTP, not DRM.
    expect(
      unsupportedEncryptionMethodCause([{ method: 'AES-128', uri: 'https://example.com/key.bin' }], { trackId: 'v-1' })
    ).toEqual({
      code: SVTA_UNSUPPORTED_ENCRYPTION_METHOD,
      data: { trackId: 'v-1', method: 'AES-128', keyFormat: undefined },
    });
  });

  it('answers undefined when every key is a DRM key — a DRM system is the thing to blame', () => {
    expect(
      unsupportedEncryptionMethodCause([
        { method: 'SAMPLE-AES', uri: 'skd://k', keyFormat: 'com.apple.streamingkeydelivery' },
      ])
    ).toBeUndefined();
  });

  it('answers undefined with no keys at all — absent keys default to the DRM assumption', () => {
    expect(unsupportedEncryptionMethodCause([])).toBeUndefined();
  });
});

describe('manifestInitData', () => {
  const WIDEVINE_FORMAT = 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed';
  const projecting: KeySystemModule = {
    keySystem: 'com.widevine.alpha',
    keyFormats: [WIDEVINE_FORMAT],
    toInitData: (uri) =>
      uri.startsWith('data:') ? { initDataType: 'cenc', initData: new Uint8Array([uri.length]) } : undefined,
  };
  const eventDriven: KeySystemModule = { keySystem: 'com.apple.fps', keyFormats: ['com.apple.streamingkeydelivery'] };
  const presentation = (keys: object[]) =>
    ({
      id: 'p',
      url: 'https://example.com/m.m3u8',
      selectionSets: [
        {
          id: 's',
          type: 'video',
          switchingSets: [
            {
              id: 'w',
              type: 'video',
              tracks: [
                {
                  type: 'video',
                  id: 'v',
                  url: 'https://example.com/v.m3u8',
                  bandwidth: 1,
                  mimeType: 'video/mp4',
                  segments: [],
                  startTime: 0,
                  duration: 1,
                  metadata: { mediaPlaylist: { targetDuration: 4, mediaSequence: 0, endList: true, keys } },
                },
              ],
            },
          ],
        },
      ],
    }) as unknown as MaybeResolvedPresentation;

  it('projects every declared key the module claims through its toInitData', () => {
    const keys = [
      { method: 'SAMPLE-AES', uri: 'data:;base64,AA', keyFormat: WIDEVINE_FORMAT },
      { method: 'SAMPLE-AES', uri: 'skd://k', keyFormat: 'com.apple.streamingkeydelivery' },
      { method: 'SAMPLE-AES', uri: 'data:;base64,AAAA', keyFormat: WIDEVINE_FORMAT },
    ];

    expect(manifestInitData(presentation(keys), projecting)).toEqual([
      { initDataType: 'cenc', initData: new Uint8Array(['data:;base64,AA'.length]) },
      { initDataType: 'cenc', initData: new Uint8Array(['data:;base64,AAAA'.length]) },
    ]);
  });

  it('is empty for a module with no projection, which routes licensing to the encrypted-event fallback', () => {
    const keys = [{ method: 'SAMPLE-AES', uri: 'skd://k', keyFormat: 'com.apple.streamingkeydelivery' }];

    expect(manifestInitData(presentation(keys), eventDriven)).toEqual([]);
    expect(manifestInitData(presentation(keys), undefined)).toEqual([]);
  });

  it('skips keys without a URI or a key format', () => {
    const keys = [
      { method: 'SAMPLE-AES', keyFormat: WIDEVINE_FORMAT },
      { method: 'AES-128', uri: 'data:;base64,AA' },
    ];

    expect(manifestInitData(presentation(keys), projecting)).toEqual([]);
  });
});
