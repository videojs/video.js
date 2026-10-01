import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../../../core/signals/primitives';
import { type DrmSystemsConfig, fetchDrm } from '../../../../media/dom/eme';
import { DEFAULT_KEY_SYSTEMS, widevineKeySystem } from '../../../../media/dom/key-systems';
import {
  SVTA_BAD_LICENSE_REQUEST,
  SVTA_DRM_LICENSE_RESPONSE_REJECTED,
  SVTA_DRM_LICENSE_REQUEST_GENERATION_FAILED,
  SVTA_LICENSE_EXPIRED,
  type SvtaError,
} from '../../../../media/errors';
import type { Presentation } from '../../../../media/types';
import { type ExchangeLicensesContext, type ExchangeLicensesState, exchangeLicenses } from '../exchange-licenses';

// Only the network seam is mocked: the key-system modules stay real, so the
// per-system init-data projection and license shaping are what's exercised.
vi.mock('../../../../media/dom/eme', async () => {
  const actual = await vi.importActual<typeof import('../../../../media/dom/eme')>('../../../../media/dom/eme');

  return { ...actual, fetchDrm: vi.fn() };
});

// "ping" in base64 — stand-in for a Widevine PSSH payload.
const PSSH_BASE64 = 'cGluZw==';
const PSSH_BYTES = new Uint8Array([0x70, 0x69, 0x6e, 0x67]);

const WIDEVINE_KEY = {
  method: 'SAMPLE-AES',
  uri: `data:text/plain;base64,${PSSH_BASE64}`,
  keyFormat: 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
};
const FAIRPLAY_KEY = {
  method: 'SAMPLE-AES',
  uri: 'skd://mux?keyId=abc',
  keyFormat: 'com.apple.streamingkeydelivery',
};
// A raw PlayReady Object stand-in — NOT a PSSH box, exactly as Mux authors it.
const PLAYREADY_KEY = {
  method: 'SAMPLE-AES',
  uri: `data:text/plain;charset=UTF-16;base64,${PSSH_BASE64}`,
  keyFormat: 'com.microsoft.playready',
};

const DRM_CONFIG = {
  'com.widevine.alpha': { licenseUrl: 'https://license.example.com/widevine' },
  'com.microsoft.playready': { licenseUrl: 'https://license.example.com/playready' },
  'com.apple.fps': { licenseUrl: 'https://license.example.com/fairplay' },
};

function makePresentation(keys?: object[]): Presentation {
  return {
    id: 'p1',
    url: 'https://example.com/multivariant.m3u8',
    selectionSets: [
      {
        id: 'ss1',
        type: 'video' as const,
        switchingSets: [
          {
            id: 'sw1',
            type: 'video' as const,
            tracks: [
              {
                type: 'video' as const,
                id: 'v-1',
                url: 'https://example.com/v.m3u8',
                bandwidth: 1000,
                mimeType: 'video/mp4',
                codecs: ['avc1.4d401f'],
                segments: [{ id: 's0', url: 'https://example.com/0.m4s', startTime: 0, duration: 4 }],
                startTime: 0,
                duration: 4,
                ...(keys && {
                  metadata: { mediaPlaylist: { targetDuration: 4, mediaSequence: 0, endList: true, keys } },
                }),
              },
            ],
          },
        ],
      },
    ],
  } as Presentation;
}

interface FakeSession extends EventTarget {
  generateRequest: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  keyStatuses: Map<BufferSource, MediaKeyStatus>;
}

function makeFakeSession(): FakeSession {
  const session = new EventTarget() as FakeSession;

  session.generateRequest = vi.fn(async () => {});
  session.update = vi.fn(async () => {});
  session.close = vi.fn(async () => {});
  // Same (status, keyId) forEach signature as MediaKeyStatusMap.
  session.keyStatuses = new Map();
  return session;
}

function makeFakeMediaKeys() {
  const sessions: FakeSession[] = [];
  const mediaKeys = {
    createSession: vi.fn(() => {
      const session = makeFakeSession();

      sessions.push(session);
      return session;
    }),
  } as unknown as MediaKeys;

  return { mediaKeys, sessions };
}

/**
 * The post-negotiation world `setupMediaKeys` hands over: MediaKeys attached, key system chosen. Nothing here needs the
 * negotiation itself — that's the point of the handoff.
 */
function setupExchangeLicenses({
  keys = [WIDEVINE_KEY],
  keySystem = 'com.widevine.alpha',
  drm = DRM_CONFIG as DrmSystemsConfig,
  mediaElement = document.createElement('video'),
}: {
  keys?: object[];
  keySystem?: string;
  drm?: DrmSystemsConfig;
  mediaElement?: HTMLMediaElement;
} = {}) {
  const { mediaKeys, sessions } = makeFakeMediaKeys();
  const state = {
    presentation: signal<ExchangeLicensesState['presentation']>(makePresentation(keys)),
    negotiatedKeySystem: signal<string | undefined>(keySystem),
    errors: signal<SvtaError[] | undefined>(undefined),
  };
  const context = {
    mediaElement: signal<ExchangeLicensesContext['mediaElement']>(mediaElement),
    mediaKeys: signal<MediaKeys | undefined>(mediaKeys),
  };
  const reactor = exchangeLicenses.setup({ state, context, config: { drm, keySystems: DEFAULT_KEY_SYSTEMS } });

  return { state, context, reactor, sessions, mediaElement };
}

describe('exchangeLicenses', () => {
  beforeEach(() => {
    vi.mocked(fetchDrm)
      .mockReset()
      .mockResolvedValue(new Uint8Array([9]));
  });

  it('stays out until the negotiation handoff is complete', async () => {
    const { mediaKeys, sessions } = makeFakeMediaKeys();
    const state = {
      presentation: signal<ExchangeLicensesState['presentation']>(makePresentation([WIDEVINE_KEY])),
      // Negotiation hasn't settled: MediaKeys are attached but no system is named.
      negotiatedKeySystem: signal<string | undefined>(undefined),
      errors: signal<SvtaError[] | undefined>(undefined),
    };
    const context = {
      mediaElement: signal<ExchangeLicensesContext['mediaElement']>(document.createElement('video')),
      mediaKeys: signal<MediaKeys | undefined>(mediaKeys),
    };
    const reactor = exchangeLicenses.setup({
      state,
      context,
      config: { drm: DRM_CONFIG, keySystems: DEFAULT_KEY_SYSTEMS },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sessions).toHaveLength(0);

    // The handoff completes and licensing picks up from there.
    state.negotiatedKeySystem.set('com.widevine.alpha');
    await vi.waitFor(() => expect(sessions).toHaveLength(1));

    reactor.destroy();
  });

  it('opens one session per manifest-carried init data and skips skd:// keys', async () => {
    const { sessions, reactor } = setupExchangeLicenses({ keys: [WIDEVINE_KEY, FAIRPLAY_KEY] });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    expect(sessions[0]!.generateRequest).toHaveBeenCalledWith('cenc', PSSH_BYTES);

    reactor.destroy();
  });

  it('wraps a raw PlayReady Object into a PSSH box before generating the request', async () => {
    const { sessions, reactor } = setupExchangeLicenses({
      keys: [PLAYREADY_KEY],
      keySystem: 'com.microsoft.playready',
    });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    const [initDataType, initData] = sessions[0]!.generateRequest.mock.calls[0]! as [string, Uint8Array];

    expect(initDataType).toBe('cenc');
    expect(initData.length).toBe(32 + PSSH_BYTES.length);
    expect([...initData.slice(4, 8)]).toEqual([0x70, 0x73, 0x73, 0x68]); // 'pssh'
    expect([...initData.slice(32)]).toEqual([...PSSH_BYTES]);

    reactor.destroy();
  });

  it('opens event-driven sessions when the manifest carries no init data, deduped by bytes', async () => {
    const { sessions, mediaElement, reactor } = setupExchangeLicenses({
      keys: [FAIRPLAY_KEY],
      keySystem: 'com.apple.fps',
    });

    // skd:// carries no inline init data, so no manifest-driven session opens.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sessions).toHaveLength(0);

    const sinf = new Uint8Array([5, 5, 5]);
    const fireEncrypted = (bytes: Uint8Array) =>
      mediaElement.dispatchEvent(
        Object.assign(new Event('encrypted'), { initDataType: 'sinf', initData: bytes.buffer })
      );

    fireEncrypted(sinf);
    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    expect(sessions[0]!.generateRequest).toHaveBeenCalledWith('sinf', sinf);

    // The same init data again (the other track of a muxed pair, a re-append)
    // opens nothing; different init data opens a second session.
    fireEncrypted(sinf);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sessions).toHaveLength(1);

    fireEncrypted(new Uint8Array([6, 6, 6]));
    await vi.waitFor(() => expect(sessions).toHaveLength(2));

    reactor.destroy();
  });

  it('ignores encrypted events when manifest-driven sessions exist', async () => {
    const { sessions, mediaElement, reactor } = setupExchangeLicenses();

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    mediaElement.dispatchEvent(
      Object.assign(new Event('encrypted'), { initDataType: 'cenc', initData: new Uint8Array([1]).buffer })
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sessions).toHaveLength(1);

    reactor.destroy();
  });

  it('opens no session for a key format the composed modules do not claim', async () => {
    const { mediaKeys, sessions } = makeFakeMediaKeys();
    const state = {
      presentation: signal<ExchangeLicensesState['presentation']>(makePresentation([PLAYREADY_KEY])),
      negotiatedKeySystem: signal<string | undefined>('com.widevine.alpha'),
      errors: signal<SvtaError[] | undefined>(undefined),
    };
    const context = {
      mediaElement: signal<ExchangeLicensesContext['mediaElement']>(document.createElement('video')),
      mediaKeys: signal<MediaKeys | undefined>(mediaKeys),
    };
    // Widevine-only composition against a PlayReady-only manifest: the manifest
    // path claims nothing, so nothing is licensed off it.
    const reactor = exchangeLicenses.setup({
      state,
      context,
      config: { drm: DRM_CONFIG, keySystems: [widevineKeySystem] },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sessions).toHaveLength(0);

    reactor.destroy();
  });

  it("exchanges the chosen system's license on a session message", async () => {
    const license = new Uint8Array([9, 9, 9]);

    vi.mocked(fetchDrm).mockResolvedValue(license);
    const { sessions, reactor } = setupExchangeLicenses();

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    const message = new Uint8Array([1, 2, 3]).buffer;

    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message }));

    await vi.waitFor(() => expect(sessions[0]!.update).toHaveBeenCalledWith(license));
    expect(fetchDrm).toHaveBeenCalledWith(
      {
        url: DRM_CONFIG['com.widevine.alpha'].licenseUrl,
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: message,
      },
      expect.anything()
    );

    reactor.destroy();
  });

  it('resolves a function-valued license server when the exchange runs', async () => {
    // The Mux flavor's shape: the Media holds the source, so the URL is not
    // known when the engine is constructed.
    const licenseUrl = vi.fn(() => 'https://license.example.com/minted');
    const { sessions, reactor } = setupExchangeLicenses({ drm: { 'com.widevine.alpha': { licenseUrl } } });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    const message = new Uint8Array([1, 2, 3]).buffer;

    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message }));

    await vi.waitFor(() =>
      expect(fetchDrm).toHaveBeenCalledWith(
        expect.objectContaining({ url: 'https://license.example.com/minted', method: 'POST', body: message }),
        expect.anything()
      )
    );

    reactor.destroy();
  });

  it("sends a key system's configured headers with its license request", async () => {
    const { sessions, reactor } = setupExchangeLicenses({
      drm: {
        'com.widevine.alpha': {
          licenseUrl: 'https://license.example.com/widevine',
          headers: { 'X-AxDRM-Message': 'entitlement', 'X-Extra': 'kept' },
        },
      },
    });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: new Uint8Array([1]).buffer }));

    await vi.waitFor(() =>
      expect(fetchDrm).toHaveBeenCalledWith(
        expect.objectContaining({
          // Merged with, not replacing, the content type the request already needs.
          headers: { 'Content-Type': 'application/octet-stream', 'X-AxDRM-Message': 'entitlement', 'X-Extra': 'kept' },
        }),
        expect.anything()
      )
    );

    reactor.destroy();
  });

  it("sends a key system's configured credentials mode with its license request", async () => {
    // A cookie-credentialed license server — the escape hatch Shaka calls allowCrossSiteCredentials.
    const { sessions, reactor } = setupExchangeLicenses({
      drm: {
        'com.widevine.alpha': { licenseUrl: 'https://license.example.com/widevine', credentials: 'include' },
      },
    });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: new Uint8Array([1]).buffer }));

    await vi.waitFor(() =>
      expect(fetchDrm).toHaveBeenCalledWith(expect.objectContaining({ credentials: 'include' }), expect.anything())
    );

    reactor.destroy();
  });

  it('lets the shaped request win over a configured header of the same name', async () => {
    const { sessions, reactor } = setupExchangeLicenses({
      drm: {
        'com.widevine.alpha': {
          licenseUrl: 'https://license.example.com/widevine',
          // A CDM naming its own Content-Type is not negotiable.
          headers: { 'Content-Type': 'application/json' },
        },
      },
    });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: new Uint8Array([1]).buffer }));

    await vi.waitFor(() =>
      expect(fetchDrm).toHaveBeenCalledWith(
        expect.objectContaining({ headers: { 'Content-Type': 'application/octet-stream' } }),
        expect.anything()
      )
    );

    reactor.destroy();
  });

  it('composes a per-source licenseRequest after the module default, letting it override', async () => {
    const { sessions, reactor } = setupExchangeLicenses({
      drm: {
        'com.widevine.alpha': {
          licenseUrl: 'https://license.example.com/widevine',
          // Runs on the module-shaped request: overrides the octet-stream
          // Content-Type the module set and redirects the URL, which only holds
          // if the module ran first and the source override ran over its output.
          licenseRequest: (request) => ({
            ...request,
            url: 'https://gateway.example.com/proxy',
            headers: { ...request.headers, 'Content-Type': 'application/json', 'X-Tok': 'minted' },
          }),
        },
      },
    });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    const message = new Uint8Array([1, 2, 3]).buffer;

    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message }));

    await vi.waitFor(() =>
      expect(fetchDrm).toHaveBeenCalledWith(
        {
          url: 'https://gateway.example.com/proxy',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Tok': 'minted' },
          body: message,
        },
        expect.anything()
      )
    );

    reactor.destroy();
  });

  it('applies a per-source licenseResponse before session.update', async () => {
    vi.mocked(fetchDrm).mockResolvedValue(new Uint8Array([1]));
    const { sessions, reactor } = setupExchangeLicenses({
      drm: {
        'com.widevine.alpha': {
          licenseUrl: 'https://l',
          // Unwrap a wrapped license: the CDM must see the transformed bytes.
          licenseResponse: (response) => new Uint8Array([response[0]! + 100]),
        },
      },
    });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: new Uint8Array([1]).buffer }));

    await vi.waitFor(() => expect(sessions[0]!.update).toHaveBeenCalledTimes(1));
    expect([...(sessions[0]!.update.mock.calls[0]![0] as Uint8Array)]).toEqual([101]);

    reactor.destroy();
  });

  it('reports 4004 when a per-source licenseRequest throws, before any fetch', async () => {
    const { state, sessions, reactor } = setupExchangeLicenses({
      drm: {
        'com.widevine.alpha': {
          licenseUrl: 'https://l',
          licenseRequest: () => {
            throw new Error('token mint failed');
          },
        },
      },
    });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: new Uint8Array([1]).buffer }));

    await vi.waitFor(() => expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_BAD_LICENSE_REQUEST]));
    expect(fetchDrm).not.toHaveBeenCalled();
    expect(sessions[0]!.update).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('reports 4016 when a per-source licenseResponse throws', async () => {
    const { state, sessions, reactor } = setupExchangeLicenses({
      drm: {
        'com.widevine.alpha': {
          licenseUrl: 'https://l',
          licenseResponse: () => {
            throw new Error('bad envelope');
          },
        },
      },
    });

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: new Uint8Array([1]).buffer }));

    await vi.waitFor(() =>
      expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_DRM_LICENSE_RESPONSE_REJECTED])
    );
    expect(sessions[0]!.update).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('reports 4004 when the license request fails, without dropping the session', async () => {
    vi.mocked(fetchDrm).mockRejectedValue(new Error('license server said no'));
    const { state, sessions, reactor } = setupExchangeLicenses();

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: new Uint8Array([1]).buffer }));

    await vi.waitFor(() => expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_BAD_LICENSE_REQUEST]));
    expect(state.errors.get()?.[0]?.data).toMatchObject({ keySystem: 'com.widevine.alpha' });
    expect(sessions[0]!.update).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('reports 4016 when the CDM rejects the license', async () => {
    const { state, sessions, reactor } = setupExchangeLicenses();

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0]!.update.mockRejectedValue(new TypeError('bad CKC'));
    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: new Uint8Array([1]).buffer }));

    await vi.waitFor(() =>
      expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_DRM_LICENSE_RESPONSE_REJECTED])
    );

    reactor.destroy();
  });

  it('reports 4021 when the CDM cannot generate a license request', async () => {
    const { mediaKeys, sessions } = makeFakeMediaKeys();
    const failingSession = makeFakeSession();

    failingSession.generateRequest.mockRejectedValue(new Error('no CDM for you'));
    (mediaKeys.createSession as ReturnType<typeof vi.fn>).mockReturnValue(failingSession);
    const state = {
      presentation: signal<ExchangeLicensesState['presentation']>(makePresentation([WIDEVINE_KEY])),
      negotiatedKeySystem: signal<string | undefined>('com.widevine.alpha'),
      errors: signal<SvtaError[] | undefined>(undefined),
    };
    const context = {
      mediaElement: signal<ExchangeLicensesContext['mediaElement']>(document.createElement('video')),
      mediaKeys: signal<MediaKeys | undefined>(mediaKeys),
    };
    const reactor = exchangeLicenses.setup({
      state,
      context,
      config: { drm: DRM_CONFIG, keySystems: DEFAULT_KEY_SYSTEMS },
    });

    await vi.waitFor(() =>
      expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_DRM_LICENSE_REQUEST_GENERATION_FAILED])
    );
    expect(sessions).toHaveLength(0);

    reactor.destroy();
  });

  it('licenses every declared key eagerly — one session per distinct key, selection never consulted', async () => {
    // The studio-policy multi-key shape (Axinom's MultiKey vector, per-tier
    // keys): the manifest loop opens a session — and with it a license
    // request — for every distinct declared key at entry, including tiers
    // that will never be selected; nothing here reads selection state.
    // Pinned so a move to on-demand licensing (license the selected
    // renditions first) surfaces as this expectation changing rather than
    // as a silent scope shift. Duplicate declarations across tracks stay
    // one session: `declaredDrmKeys` dedupes by attribute identity.
    const keyFor = (payload: string) => ({
      method: 'SAMPLE-AES',
      uri: `data:text/plain;base64,${btoa(payload)}`,
      keyFormat: 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
    });
    // Loosely typed like makePresentation's track literal, so the
    // `as Presentation` cast below stays a plain widening.
    const track = (id: string, keys: object[]): object => ({
      type: 'video' as const,
      id,
      url: `https://example.com/${id}.m3u8`,
      bandwidth: 1000,
      mimeType: 'video/mp4',
      codecs: ['avc1.4d401f'],
      segments: [{ id: 's0', url: `https://example.com/${id}-0.m4s`, startTime: 0, duration: 4 }],
      startTime: 0,
      duration: 4,
      metadata: { mediaPlaylist: { targetDuration: 4, mediaSequence: 0, endList: true, keys } },
    });
    const presentation = {
      id: 'p1',
      url: 'https://example.com/multivariant.m3u8',
      selectionSets: [
        {
          id: 'ss1',
          type: 'video' as const,
          switchingSets: [
            {
              id: 'sw1',
              type: 'video' as const,
              tracks: [
                track('v-sd', [keyFor('sd')]),
                track('v-hd', [keyFor('hd')]),
                track('v-uhd', [keyFor('uhd')]),
                // A second rendition under the hd key — a repeat, not a new key.
                track('v-hd-2', [keyFor('hd')]),
              ],
            },
          ],
        },
      ],
    } as Presentation;
    const { mediaKeys, sessions } = makeFakeMediaKeys();
    const state = {
      presentation: signal<ExchangeLicensesState['presentation']>(presentation),
      negotiatedKeySystem: signal<string | undefined>('com.widevine.alpha'),
      errors: signal<SvtaError[] | undefined>(undefined),
    };
    const context = {
      mediaElement: signal<ExchangeLicensesContext['mediaElement']>(document.createElement('video')),
      mediaKeys: signal<MediaKeys | undefined>(mediaKeys),
    };
    const reactor = exchangeLicenses.setup({
      state,
      context,
      config: { drm: DRM_CONFIG, keySystems: DEFAULT_KEY_SYSTEMS },
    });

    await vi.waitFor(() => expect(sessions).toHaveLength(3));
    const initDatas = sessions.map((session) =>
      new TextDecoder().decode(session.generateRequest.mock.calls[0]![1] as Uint8Array)
    );

    expect(initDatas.sort()).toEqual(['hd', 'sd', 'uhd']);

    reactor.destroy();
  });

  it('reports 4004 and opens nothing when the license server resolves to nothing after negotiation', async () => {
    // The resolver answered a URL when negotiation offered the system, then
    // the source mutated underneath it — the re-read when the session opens
    // answers nothing, and the failure must be a report, not a POST to
    // "undefined".
    const { state, sessions, reactor } = setupExchangeLicenses({
      drm: { 'com.widevine.alpha': { licenseUrl: () => undefined } },
    });

    await vi.waitFor(() => expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_BAD_LICENSE_REQUEST]));
    expect(state.errors.get()?.[0]?.data).toMatchObject({ keySystem: 'com.widevine.alpha' });
    expect(sessions).toHaveLength(0);
    expect(fetchDrm).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('resolves the license server per session, so a source swap that drops it is reported on the next request', async () => {
    // Event-driven path: each `encrypted` event is its own session, and a
    // same-URL source swap that changes only `drm` never resets the
    // presentation, so the behavior stays in `licensing` while the resolver
    // starts answering nothing.
    let licenseUrl: string | undefined = 'https://license.example.com/fairplay';
    const { state, sessions, mediaElement, reactor } = setupExchangeLicenses({
      keys: [FAIRPLAY_KEY],
      keySystem: 'com.apple.fps',
      drm: { 'com.apple.fps': { licenseUrl: () => licenseUrl } },
    });

    mediaElement.dispatchEvent(
      Object.assign(new Event('encrypted'), { initDataType: 'sinf', initData: new Uint8Array([1]).buffer })
    );
    await vi.waitFor(() => expect(sessions).toHaveLength(1));

    licenseUrl = undefined;
    mediaElement.dispatchEvent(
      Object.assign(new Event('encrypted'), { initDataType: 'sinf', initData: new Uint8Array([2]).buffer })
    );

    await vi.waitFor(() => expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_BAD_LICENSE_REQUEST]));
    expect(sessions).toHaveLength(1);

    reactor.destroy();
  });

  it('reports a key transitioning to expired, with the key id in the data', async () => {
    const { state, sessions, reactor } = setupExchangeLicenses();

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    const session = sessions[0]!;

    session.keyStatuses.set(new Uint8Array([0xab, 0x01]), 'expired');
    session.dispatchEvent(new Event('keystatuschange'));

    await vi.waitFor(() => expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_LICENSE_EXPIRED]));
    expect(state.errors.get()?.[0]?.data).toMatchObject({
      keySystem: 'com.widevine.alpha',
      status: 'expired',
      keyId: 'ab01',
    });

    reactor.destroy();
  });

  it('reports nothing after teardown aborts in-flight license work', async () => {
    let rejectLicense!: (reason: Error) => void;

    vi.mocked(fetchDrm).mockImplementation(() => new Promise((_resolve, reject) => (rejectLicense = reject)));
    const { state, sessions, reactor } = setupExchangeLicenses();

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: new Uint8Array([1]).buffer }));
    await vi.waitFor(() => expect(fetchDrm).toHaveBeenCalled());

    state.presentation.set(undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));
    rejectLicense(new Error('aborted'));
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(state.errors.get() ?? []).toEqual([]);

    reactor.destroy();
  });

  it('closes its sessions when the negotiation is torn down', async () => {
    const { context, sessions, reactor } = setupExchangeLicenses();

    await vi.waitFor(() => expect(sessions).toHaveLength(1));

    // What `setupMediaKeys` does on source clear, right before it detaches.
    context.mediaKeys.set(undefined);

    await vi.waitFor(() => expect(sessions[0]!.close).toHaveBeenCalled());

    reactor.destroy();
  });

  it('tears down on destroy', async () => {
    const { sessions, reactor } = setupExchangeLicenses();

    await vi.waitFor(() => expect(sessions).toHaveLength(1));
    reactor.destroy();

    await vi.waitFor(() => expect(sessions[0]!.close).toHaveBeenCalled());
  });
});
