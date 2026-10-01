import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../../../core/signals/primitives';
import type { DrmSystemsConfig } from '../../../../media/dom/eme';
import { DEFAULT_KEY_SYSTEMS, fairPlayAirPlayKeySystem, widevineKeySystem } from '../../../../media/dom/key-systems';
import {
  SVTA_DRM_CERTIFICATE_ERROR,
  SVTA_DRM_LICENSE_REQUEST_GENERATION_FAILED,
  SVTA_UNSUPPORTED_DRM_SYSTEM,
  type SvtaError,
} from '../../../../media/errors';
import type { Presentation } from '../../../../media/types';
import {
  type AirPlayFairPlayContext,
  type AirPlayFairPlayState,
  setupAirPlayFairPlay,
} from '../setup-airplay-fairplay';

const FAIRPLAY_KEY = {
  method: 'SAMPLE-AES',
  uri: 'skd://mux?keyId=abc',
  keyFormat: 'com.apple.streamingkeydelivery',
};
const WIDEVINE_KEY = {
  method: 'SAMPLE-AES',
  uri: 'data:text/plain;base64,cGluZw==',
  keyFormat: 'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
};

const LICENSE_URL = 'https://license.example.com/fairplay';
const CERT_URL = 'https://license.example.com/appcert';

const DRM_CONFIG: DrmSystemsConfig = {
  'com.apple.fps': { licenseUrl: LICENSE_URL, serverCertificateUrl: CERT_URL },
};

const requestMediaKeySystemAccess = vi.fn<Navigator['requestMediaKeySystemAccess']>();
const setMediaKeys = vi.fn<HTMLMediaElement['setMediaKeys']>();
const fetch = vi.fn<typeof globalThis.fetch>();

beforeEach(() => {
  requestMediaKeySystemAccess.mockReset();
  setMediaKeys.mockReset().mockImplementation(async function (this: HTMLMediaElement, keys) {
    Object.defineProperty(this, 'mediaKeys', { value: keys, configurable: true });
  });
  fetch.mockReset().mockImplementation(async (url) => {
    if (url === CERT_URL) return new Response(new Uint8Array([7, 7]));

    if (url === LICENSE_URL) return new Response(new Uint8Array([9]));

    throw new Error(`Unexpected DRM URL: ${url}`);
  });

  vi.spyOn(navigator, 'requestMediaKeySystemAccess').mockImplementation(requestMediaKeySystemAccess);
  vi.spyOn(HTMLMediaElement.prototype, 'setMediaKeys').mockImplementation(setMediaKeys);
  vi.spyOn(globalThis, 'fetch').mockImplementation(fetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(globalThis, 'WebKitMediaKeys');
});

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

type FakeSession = MediaKeySession & {
  generateRequest: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  keyStatuses: Map<BufferSource, MediaKeyStatus>;
};

function makeFakeEme() {
  const sessions: FakeSession[] = [];
  const mediaKeys = {
    createSession: vi.fn(() => {
      const session = new EventTarget() as FakeSession;

      session.generateRequest = vi.fn(async () => {});
      session.update = vi.fn(async () => {});
      session.close = vi.fn(async () => {});
      session.keyStatuses = new Map();
      sessions.push(session);
      return session;
    }),
    setServerCertificate: vi.fn(async () => true),
  } as unknown as MediaKeys;
  const access = { createMediaKeys: vi.fn(async () => mediaKeys) } as unknown as MediaKeySystemAccess;

  return { module: fairPlayAirPlayKeySystem, access, mediaKeys, sessions };
}

/**
 * A composition carrying `setupAirPlay` (the only declarer of `loadingSuspended`) and `setupMediaKeys` (the owner of
 * `context.mediaKeys`). Defaults are a live session over a FairPlay source with the MSE negotiation already yielded —
 * the one state this behavior serves.
 */
function setup(
  overrides: {
    presentation?: AirPlayFairPlayState['presentation'];
    loadingSuspended?: boolean;
    mediaKeys?: MediaKeys;
    drm?: DrmSystemsConfig;
    keySystems?: readonly (typeof widevineKeySystem)[];
  } = {}
) {
  const state = {
    presentation: signal<AirPlayFairPlayState['presentation']>(
      'presentation' in overrides ? overrides.presentation : makePresentation([FAIRPLAY_KEY])
    ),
    loadingSuspended: signal<boolean | undefined>(overrides.loadingSuspended ?? true),
    errors: signal<SvtaError[] | undefined>(undefined),
  };
  const context = {
    mediaElement: signal<AirPlayFairPlayContext['mediaElement']>(document.createElement('video')),
    mediaKeys: signal<MediaKeys | undefined>(overrides.mediaKeys),
  };
  const reactor = setupAirPlayFairPlay.setup({
    state,
    context,
    config: { drm: overrides.drm ?? DRM_CONFIG, keySystems: overrides.keySystems ?? DEFAULT_KEY_SYSTEMS },
  });

  return { state, context, reactor };
}

/** What an AirPlay receiver's key request looks like arriving at the element. */
function receiverRequest(video: HTMLMediaElement, bytes = [1, 2, 3], initDataType = 'skd') {
  video.dispatchEvent(Object.assign(new Event('encrypted'), { initDataType, initData: new Uint8Array(bytes).buffer }));
}

describe('setupAirPlayFairPlay', () => {
  it('negotiates for skd, applies the certificate, attaches, and licenses the receiver request', async () => {
    const eme = makeFakeEme();
    let releaseCertificate!: (accepted: boolean) => void;
    let releaseAttach!: () => void;

    vi.mocked(eme.mediaKeys.setServerCertificate).mockReturnValueOnce(
      new Promise((resolve) => (releaseCertificate = resolve))
    );
    setMediaKeys.mockReturnValueOnce(new Promise<void>((resolve) => (releaseAttach = resolve)));

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    const { context, reactor } = setup();
    const video = context.mediaElement.get()!;

    // Nothing happens until the receiver actually asks: a session on a FairPlay
    // source is not itself evidence it wants anything from this CDM.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requestMediaKeySystemAccess).not.toHaveBeenCalled();

    receiverRequest(video);

    await vi.waitFor(() => expect(eme.mediaKeys.setServerCertificate).toHaveBeenCalled());
    expect(setMediaKeys).not.toHaveBeenCalled();
    expect(eme.mediaKeys.createSession).not.toHaveBeenCalled();

    releaseCertificate(true);
    await vi.waitFor(() => expect(setMediaKeys).toHaveBeenCalledWith(eme.mediaKeys));
    expect(eme.mediaKeys.createSession).not.toHaveBeenCalled();

    releaseAttach();
    await vi.waitFor(() => expect(eme.sessions).toHaveLength(1));

    // `skd`, against the manifest rather than a codec — the receiver plays the
    // native-HLS fallback, so the MSE renditions say nothing about its decode.
    expect(requestMediaKeySystemAccess).toHaveBeenCalledWith('com.apple.fps', [
      { initDataTypes: ['skd'], videoCapabilities: [{ contentType: 'application/vnd.apple.mpegurl' }] },
    ]);
    // Certificate before any generateRequest, carried by the shared promise.
    expect(eme.mediaKeys.setServerCertificate).toHaveBeenCalledWith(new Uint8Array([7, 7]));
    expect(setMediaKeys).toHaveBeenCalledWith(eme.mediaKeys);
    expect(eme.sessions[0]!.generateRequest).toHaveBeenCalledWith('skd', new Uint8Array([1, 2, 3]));

    const message = new Uint8Array([4, 5, 6]);

    eme.sessions[0]!.dispatchEvent(Object.assign(new Event('message'), { message: message.buffer }));
    await vi.waitFor(() => expect(eme.sessions[0]!.update).toHaveBeenCalledWith(new Uint8Array([9])));
    expect(fetch).toHaveBeenCalledWith(LICENSE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: message.buffer,
      credentials: undefined,
      signal: expect.any(AbortSignal),
    });

    reactor.destroy();
  });

  it('opens a session per receiver request, including a byte-identical repeat', async () => {
    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    const { context, reactor } = setup();
    const video = context.mediaElement.get()!;

    // The receiver proxies its own SPC on connect and again on disconnect.
    // Deduping by init-data bytes — right for MSE — would strand the second.
    receiverRequest(video, [1, 2, 3]);
    receiverRequest(video, [1, 2, 3]);

    await vi.waitFor(() => expect(eme.sessions).toHaveLength(2));
    // One negotiation, shared.
    expect(requestMediaKeySystemAccess).toHaveBeenCalledTimes(1);

    reactor.destroy();
  });

  it('resolves the license server per request, so a source swap that drops it is reported, not POSTed', async () => {
    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);

    // Resolver-backed, as the Media installs it: each field reads whatever
    // source is current. A same-URL swap that changes only `drm` does not
    // reset the presentation, so this state is never exited — the resolver
    // simply starts answering `undefined`.
    let licenseUrl: string | undefined = LICENSE_URL;
    const { state, context, reactor } = setup({
      drm: { 'com.apple.fps': { licenseUrl: () => licenseUrl, serverCertificateUrl: CERT_URL } },
    });
    const video = context.mediaElement.get()!;

    receiverRequest(video, [1, 2, 3]);
    await vi.waitFor(() => expect(eme.sessions).toHaveLength(1));

    licenseUrl = undefined;
    receiverRequest(video, [1, 2, 3]);

    await vi.waitFor(() => expect(state.errors.get()?.[0]?.code).toBe(SVTA_UNSUPPORTED_DRM_SYSTEM));
    expect(state.errors.get()?.[0]?.data).toMatchObject({ reason: 'no license server for the receiver' });
    // The disconnect-time request opens nothing rather than posting to "undefined".
    expect(eme.sessions).toHaveLength(1);

    reactor.destroy();
  });

  it('ignores sinf requests, which belong to the MSE pipeline', async () => {
    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    const { context, reactor } = setup();

    receiverRequest(context.mediaElement.get()!, [1, 2, 3], 'sinf');

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requestMediaKeySystemAccess).not.toHaveBeenCalled();
    expect(eme.sessions).toHaveLength(0);

    reactor.destroy();
  });

  it('never writes context.mediaKeys, so exchangeLicenses stays parked', async () => {
    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    const { context, reactor } = setup();

    receiverRequest(context.mediaElement.get()!);

    await vi.waitFor(() => expect(eme.sessions).toHaveLength(1));
    expect(context.mediaKeys.get()).toBeUndefined();

    reactor.destroy();
  });

  it('closes its sessions and releases the element when the session ends', async () => {
    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    const { state, context, reactor } = setup();
    const video = context.mediaElement.get()!;

    receiverRequest(video);
    await vi.waitFor(() => expect(eme.sessions).toHaveLength(1));

    expect(video.mediaKeys).toBe(eme.mediaKeys);
    setMediaKeys.mockClear();

    state.loadingSuspended.set(false);

    await vi.waitFor(() => expect(eme.sessions[0]!.close).toHaveBeenCalled());
    expect(setMediaKeys).toHaveBeenCalledWith(null);

    reactor.destroy();
  });

  it('leaves the element alone when MediaKeys it did not attach are on it', async () => {
    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    const { state, context, reactor } = setup();
    const video = context.mediaElement.get()!;

    receiverRequest(video);
    await vi.waitFor(() => expect(eme.sessions).toHaveLength(1));

    // `setupMediaKeys` re-negotiated off the same falling edge and got there
    // first; detaching now would strip the CDM it just attached.
    Object.defineProperty(video, 'mediaKeys', { value: {} as MediaKeys, configurable: true });
    setMediaKeys.mockClear();

    state.loadingSuspended.set(false);

    await vi.waitFor(() => expect(eme.sessions[0]!.close).toHaveBeenCalled());
    expect(setMediaKeys).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('reports a refused negotiation and a failed certificate', async () => {
    requestMediaKeySystemAccess.mockRejectedValue(new DOMException('Unsupported key system', 'NotSupportedError'));
    const refused = setup();

    receiverRequest(refused.context.mediaElement.get()!);
    await vi.waitFor(() => expect(refused.state.errors.get()?.[0]?.code).toBe(SVTA_UNSUPPORTED_DRM_SYSTEM));
    refused.reactor.destroy();

    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    fetch.mockResolvedValueOnce(new Response(null, { status: 403 }));
    const certFailed = setup();

    receiverRequest(certFailed.context.mediaElement.get()!);
    await vi.waitFor(() => expect(certFailed.state.errors.get()?.[0]?.code).toBe(SVTA_DRM_CERTIFICATE_ERROR));
    // Nothing attached, no session opened.
    expect(setMediaKeys).not.toHaveBeenCalled();
    expect(eme.sessions).toHaveLength(0);

    certFailed.reactor.destroy();
  });

  describe('gating', () => {
    const cases: Array<[string, Parameters<typeof setup>[0]]> = [
      ['no AirPlay session', { loadingSuspended: false }],
      ['setupMediaKeys has not yielded yet', { mediaKeys: {} as MediaKeys }],
      ['an unresolved presentation', { presentation: undefined }],
      ['a source declaring no FairPlay key', { presentation: makePresentation([WIDEVINE_KEY]) }],
      ['no com.apple.fps license server', { drm: { 'com.widevine.alpha': { licenseUrl: 'https://wv.example' } } }],
      ['a composition that carries no FairPlay module', { keySystems: [widevineKeySystem] }],
    ];

    it.each(cases)('stays out with %s', async (_label, overrides) => {
      const eme = makeFakeEme();

      requestMediaKeySystemAccess.mockResolvedValue(eme.access);
      const { context, reactor } = setup(overrides);

      receiverRequest(context.mediaElement.get()!);

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(requestMediaKeySystemAccess).not.toHaveBeenCalled();
      expect(eme.sessions).toHaveLength(0);

      reactor.destroy();
    });

    it('stays out entirely when no AirPlay bridge declares the slot', async () => {
      const eme = makeFakeEme();

      requestMediaKeySystemAccess.mockResolvedValue(eme.access);
      // No `loadingSuspended` at all — an engine composed without `setupAirPlay`.
      const state = {
        presentation: signal<AirPlayFairPlayState['presentation']>(makePresentation([FAIRPLAY_KEY])),
        errors: signal<SvtaError[] | undefined>(undefined),
      };
      const video = document.createElement('video');
      const context = {
        mediaElement: signal<AirPlayFairPlayContext['mediaElement']>(video),
        mediaKeys: signal<MediaKeys | undefined>(undefined),
      };
      const reactor = setupAirPlayFairPlay.setup({
        state,
        context,
        config: { drm: DRM_CONFIG, keySystems: DEFAULT_KEY_SYSTEMS },
      });

      receiverRequest(video);

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(requestMediaKeySystemAccess).not.toHaveBeenCalled();

      reactor.destroy();
    });
  });
});

/**
 * The pre-EME key API, installed on `globalThis` and on the element the way Safari exposes it. Returns the sessions it
 * creates so the exchange can be driven and asserted.
 */
function stubWebKitMediaKeys(video: HTMLMediaElement, preinstalled = true) {
  const sessions: Array<EventTarget & { update: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }> = [];
  const created: Array<{ mimeType: string; initData: Uint8Array }> = [];
  const keys = {
    createSession: vi.fn((mimeType: string, initData: BufferSource) => {
      const session = new EventTarget() as (typeof sessions)[number] & { error: null };

      session.update = vi.fn();
      session.close = vi.fn();
      session.error = null;
      created.push({ mimeType, initData: new Uint8Array(initData as ArrayBuffer) });
      sessions.push(session);
      return session;
    }),
  };

  const construct = vi.fn();
  const setMediaKeys = vi.fn((installed: typeof keys | null) => {
    Object.defineProperty(video, 'webkitKeys', { value: installed, configurable: true, writable: true });
  });

  (globalThis as Record<string, unknown>).WebKitMediaKeys = class {
    createSession = keys.createSession;

    constructor(keySystem: string) {
      construct(keySystem);
    }
  };
  Object.defineProperty(video, 'webkitSetMediaKeys', { value: setMediaKeys, configurable: true, writable: true });
  Object.defineProperty(video, 'webkitKeys', { value: preinstalled ? keys : null, configurable: true, writable: true });

  return { sessions, created, construct, setMediaKeys };
}

/** The exact refusal `generateRequest` raises during an AirPlay session on an affected sender. */
const airPlayRefusal = () => new DOMException('The operation is not supported.', 'NotSupportedError');

/** A negotiated CDM that accepts everything up to `generateRequest`, then refuses it the way an affected sender does. */
function makeRefusingEme() {
  const eme = makeFakeEme();

  vi.mocked(eme.mediaKeys.createSession).mockImplementation(() => {
    const session = new EventTarget() as never as MediaKeySession;

    (session as { generateRequest: unknown }).generateRequest = vi.fn(async () => {
      throw airPlayRefusal();
    });
    (session as { update: unknown }).update = vi.fn(async () => {});
    (session as { close: unknown }).close = vi.fn(async () => {});
    (session as { keyStatuses: unknown }).keyStatuses = new Map();
    return session;
  });
  requestMediaKeySystemAccess.mockResolvedValue(eme.access);

  return eme;
}

function goWireless(video: HTMLMediaElement, wireless: boolean) {
  Object.defineProperty(video, 'webkitCurrentPlaybackTargetIsWireless', {
    value: wireless,
    configurable: true,
    writable: true,
  });
}

/** What the legacy API delivers for the same key: the `skd://` URI as UTF-16LE. */
function legacyInitData(uri = 'skd://mux?keyId=abc'): ArrayBuffer {
  const bytes = new Uint8Array(uri.length * 2);
  const view = new DataView(bytes.buffer);

  for (let i = 0; i < uri.length; i++) view.setUint16(i * 2, uri.charCodeAt(i), true);

  return bytes.buffer;
}

function needKey(video: HTMLMediaElement, initData = legacyInitData()) {
  video.dispatchEvent(Object.assign(new Event('webkitneedkey'), { initData }));
}

describe('setupAirPlayFairPlay', () => {
  /** EME reaches `generateRequest` and is refused, with the legacy API available and its payload already delivered. */
  async function refuseEme(overrides: Parameters<typeof setup>[0] = {}, preinstalled = true) {
    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    const harness = setup(overrides);
    const video = harness.context.mediaElement.get()!;

    goWireless(video, true);
    const webkit = stubWebKitMediaKeys(video, preinstalled);

    vi.mocked(eme.mediaKeys.createSession).mockImplementation(() => {
      const session = new EventTarget() as never as MediaKeySession & { generateRequest: ReturnType<typeof vi.fn> };

      (session as { generateRequest: unknown }).generateRequest = vi.fn(async () => {
        throw airPlayRefusal();
      });
      (session as { update: unknown }).update = vi.fn(async () => {});
      (session as { close: unknown }).close = vi.fn(async () => {});
      (session as { keyStatuses: unknown }).keyStatuses = new Map();
      return session;
    });

    // The reload is the handover's first step, so it is stubbed rather than
    // run — a real one in a test element resets nothing useful and races the
    // assertions.
    const load = vi.fn();

    Object.defineProperty(video, 'load', { value: load, configurable: true });

    if (!preinstalled) expect((video as unknown as { webkitKeys: unknown }).webkitKeys).toBeNull();

    receiverRequest(video);

    // EME is refused, the element is released, and the resource reloads.
    await vi.waitFor(() => expect(load).toHaveBeenCalled());

    // Only the request delivered *after* that reload can be served: the one
    // from before it belongs to the resource being replaced.
    needKey(video);

    return { ...harness, video, webkit, eme, load };
  }

  it('hands the session to the legacy key system on the AirPlay refusal, and licenses through it', async () => {
    const { webkit, state, reactor, video } = await refuseEme({}, false);

    await vi.waitFor(() => expect(webkit.created).toHaveLength(1));

    expect(webkit.construct).toHaveBeenCalledExactlyOnceWith('com.apple.fps.1_0');
    expect(webkit.setMediaKeys).toHaveBeenCalledExactlyOnceWith(
      (video as unknown as { webkitKeys: unknown }).webkitKeys
    );
    expect((video as unknown as { webkitKeys: unknown }).webkitKeys).not.toBeNull();

    // Negotiated against the manifest, and the certificate is packed into the
    // session rather than handed to the CDM.
    expect(webkit.created[0]!.mimeType).toBe('application/vnd.apple.mpegurl');
    expect([...webkit.created[0]!.initData].slice(-2)).toEqual([7, 7]);

    // EME released the element before the legacy API claimed it.
    expect(setMediaKeys).toHaveBeenCalledWith(null);

    // The exchange runs through the same fetch and transform layers.
    webkit.sessions[0]!.dispatchEvent(
      Object.assign(new Event('webkitkeymessage'), { message: new Uint8Array([1]).buffer })
    );
    await vi.waitFor(() => expect(webkit.sessions[0]!.update).toHaveBeenCalledWith(new Uint8Array([9])));

    // The refusal it recovered from is not reported: it no longer decides anything.
    expect(state.errors.get() ?? []).toEqual([]);

    reactor.destroy();
  });

  it('reports a license server that drops out mid-session instead of opening a legacy session', async () => {
    let licenseUrl: string | undefined = LICENSE_URL;
    const { webkit, state, reactor, video } = await refuseEme({
      drm: { 'com.apple.fps': { licenseUrl: () => licenseUrl, serverCertificateUrl: CERT_URL } },
    });

    await vi.waitFor(() => expect(webkit.created).toHaveLength(1));

    // The same-URL swap that drops the entry: the state is never exited, the
    // resolver just starts answering nothing. The receiver's next key request
    // must be reported, as the EME path reports it, not silently dropped.
    licenseUrl = undefined;
    needKey(video);

    await vi.waitFor(() => expect(state.errors.get()?.[0]?.code).toBe(SVTA_UNSUPPORTED_DRM_SYSTEM));
    expect(state.errors.get()?.[0]?.data).toMatchObject({ reason: 'no license server for the receiver' });
    expect(webkit.created).toHaveLength(1);

    reactor.destroy();
  });

  it('serves only fresh legacy requests after EME detachment and reload', async () => {
    const eme = makeRefusingEme();
    let releaseDetach!: () => void;
    const detach = new Promise<void>((resolve) => {
      releaseDetach = resolve;
    });

    setMediaKeys.mockImplementation(async function (this: HTMLMediaElement, keys) {
      if (keys === null) await detach;

      Object.defineProperty(this, 'mediaKeys', { value: keys, configurable: true });
    });
    const { context, state, reactor } = setup();
    const video = context.mediaElement.get()!;

    goWireless(video, true);
    const webkit = stubWebKitMediaKeys(video, false);
    const blob = document.createElement('source');
    const load = vi.fn();

    blob.src = 'blob:https://example.com/dead';
    video.prepend(blob);
    Object.defineProperty(video, 'load', { value: load, configurable: true });

    try {
      needKey(video);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(webkit.created).toHaveLength(0);

      receiverRequest(video);
      await vi.waitFor(() => expect(setMediaKeys).toHaveBeenLastCalledWith(null));

      expect(video.mediaKeys).toBe(eme.mediaKeys);

      needKey(video);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(load).not.toHaveBeenCalled();
      expect(webkit.setMediaKeys).not.toHaveBeenCalled();
      expect(webkit.created).toHaveLength(0);

      releaseDetach();
      await vi.waitFor(() => expect(video.mediaKeys).toBeNull());

      // Detachment alone does not make payloads from the old resource usable.
      needKey(video);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(load).not.toHaveBeenCalled();
      expect(webkit.setMediaKeys).not.toHaveBeenCalled();
      expect(webkit.created).toHaveLength(0);

      blob.remove();
      await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(1));
      needKey(video);
      await vi.waitFor(() => expect(webkit.sessions).toHaveLength(1));
      webkit.sessions[0]!.dispatchEvent(
        Object.assign(new Event('webkitkeymessage'), { message: new Uint8Array([1]).buffer })
      );
      await vi.waitFor(() => expect(webkit.sessions[0]!.update).toHaveBeenCalledWith(new Uint8Array([9])));
      expect(state.errors.get() ?? []).toEqual([]);
    } finally {
      releaseDetach();
      reactor.destroy();
    }
  });

  it('reports 4021 instead of falling back when the legacy API is absent', async () => {
    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    vi.mocked(eme.mediaKeys.createSession).mockImplementation(() => {
      const session = new EventTarget() as never as MediaKeySession;

      (session as { generateRequest: unknown }).generateRequest = vi.fn(async () => {
        throw airPlayRefusal();
      });
      (session as { close: unknown }).close = vi.fn(async () => {});
      (session as { keyStatuses: unknown }).keyStatuses = new Map();
      return session;
    });
    const { state, context, reactor } = setup();

    goWireless(context.mediaElement.get()!, true);
    receiverRequest(context.mediaElement.get()!);

    await vi.waitFor(() =>
      expect(state.errors.get()?.map((error) => error.code)).toContain(SVTA_DRM_LICENSE_REQUEST_GENERATION_FAILED)
    );

    reactor.destroy();
  });

  it('reports a generateRequest failure that is not the AirPlay refusal', async () => {
    const eme = makeFakeEme();

    requestMediaKeySystemAccess.mockResolvedValue(eme.access);
    vi.mocked(eme.mediaKeys.createSession).mockImplementation(() => {
      const session = new EventTarget() as never as MediaKeySession;

      (session as { generateRequest: unknown }).generateRequest = vi.fn(async () => {
        throw new DOMException('bad init data', 'InvalidAccessError');
      });
      (session as { close: unknown }).close = vi.fn(async () => {});
      (session as { keyStatuses: unknown }).keyStatuses = new Map();
      return session;
    });
    const { state, context, reactor } = setup();
    const video = context.mediaElement.get()!;

    goWireless(video, true);
    stubWebKitMediaKeys(video);
    receiverRequest(video);

    await vi.waitFor(() =>
      expect(state.errors.get()?.map((error) => error.code)).toContain(SVTA_DRM_LICENSE_REQUEST_GENERATION_FAILED)
    );

    reactor.destroy();
  });

  it('restores position and playback across the reload', async () => {
    makeRefusingEme();
    const { context, reactor } = setup();
    const video = context.mediaElement.get()!;

    goWireless(video, true);
    stubWebKitMediaKeys(video);

    // Mid-playback when the handover fires. `load()` would reset both.
    Object.defineProperty(video, 'currentTime', { value: 42, configurable: true, writable: true });
    Object.defineProperty(video, 'paused', { value: false, configurable: true, writable: true });
    const play = vi.fn(async () => {});

    Object.defineProperty(video, 'play', { value: play, configurable: true });
    Object.defineProperty(video, 'load', {
      value: vi.fn(() => {
        // What the real load algorithm does to the element.
        Object.defineProperty(video, 'currentTime', { value: 0, configurable: true, writable: true });
        Object.defineProperty(video, 'paused', { value: true, configurable: true, writable: true });
      }),
      configurable: true,
    });

    receiverRequest(video);

    await vi.waitFor(() => expect(video.currentTime).toBe(0));

    video.dispatchEvent(new Event('loadedmetadata'));

    expect(video.currentTime).toBe(42);
    expect(play).toHaveBeenCalled();

    reactor.destroy();
  });

  it('does not resume playback that was paused before the handover', async () => {
    makeRefusingEme();
    const { context, reactor } = setup();
    const video = context.mediaElement.get()!;

    goWireless(video, true);
    stubWebKitMediaKeys(video);

    Object.defineProperty(video, 'paused', { value: true, configurable: true, writable: true });
    const play = vi.fn(async () => {});

    Object.defineProperty(video, 'play', { value: play, configurable: true });
    Object.defineProperty(video, 'load', { value: vi.fn(), configurable: true });

    receiverRequest(video);

    await vi.waitFor(() => expect((video as unknown as { load: ReturnType<typeof vi.fn> }).load).toHaveBeenCalled());
    video.dispatchEvent(new Event('loadedmetadata'));

    expect(play).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('waits for the revoked MediaSource blob to detach before reloading', async () => {
    makeRefusingEme();
    const { context, reactor } = setup();
    const video = context.mediaElement.get()!;

    goWireless(video, true);
    stubWebKitMediaKeys(video);

    // The engine prepends its MediaSource blob; the AirPlay fallback follows.
    // Reloading now would select the blob.
    const blob = document.createElement('source');

    blob.type = 'video/mp4';
    blob.src = 'blob:https://example.com/dead';
    video.prepend(blob);

    const load = vi.fn();

    Object.defineProperty(video, 'load', { value: load, configurable: true });

    receiverRequest(video);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(load).not.toHaveBeenCalled();

    // `setupMediaSource` finishes its detach.
    blob.remove();

    await vi.waitFor(() => expect(load).toHaveBeenCalled());

    reactor.destroy();
  });

  it('closes the legacy session and releases the element on state exit', async () => {
    const { webkit, state, reactor, video } = await refuseEme();

    await vi.waitFor(() => expect(webkit.sessions).toHaveLength(1));

    state.loadingSuspended.set(false);

    await vi.waitFor(() => expect(webkit.sessions[0]!.close).toHaveBeenCalled());
    expect(
      (video as unknown as { webkitSetMediaKeys: ReturnType<typeof vi.fn> }).webkitSetMediaKeys
    ).toHaveBeenCalledWith(null);

    reactor.destroy();
  });
});
