import { describe, expect, it, vi } from 'vite-plus/test';

import {
  buildKeySystemConfigurations,
  fetchDrm,
  fetchServerCertificate,
  type KeySystemModule,
  requestKeySystemAccess,
  applyLicenseRequest,
  applyLicenseResponse,
  applyCertificateRequest,
  applyCertificateResponse,
} from '../eme';
import { fairPlayKeySystem, playReadyKeySystem, widevineKeySystem } from '../key-systems';

const VIDEO_TYPE = 'video/mp4; codecs="avc1.4d401f"';
const AUDIO_TYPE = 'audio/mp4; codecs="mp4a.40.2"';

describe('requestKeySystemAccess', () => {
  it("walks a module's request variants in order and reports the module", async () => {
    const spy = vi.spyOn(navigator, 'requestMediaKeySystemAccess');
    const access = {} as MediaKeySystemAccess;

    spy.mockRejectedValueOnce(new Error('no plain CDM')).mockResolvedValueOnce(access);

    const result = await requestKeySystemAccess([playReadyKeySystem], { video: [], audio: [] });

    expect(spy.mock.calls.map(([keySystem]) => keySystem)).toEqual([
      'com.microsoft.playready',
      'com.microsoft.playready.recommendation',
    ]);
    // The module, not the variant that happened to win: license-server lookup
    // and message shaping key off the configured id.
    expect(result).toEqual({ module: playReadyKeySystem, access });
    spy.mockRestore();
  });

  it('stops at the first variant a CDM accepts', async () => {
    const spy = vi.spyOn(navigator, 'requestMediaKeySystemAccess');

    spy.mockResolvedValue({} as MediaKeySystemAccess);

    await requestKeySystemAccess([playReadyKeySystem], { video: [], audio: [] });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toBe('com.microsoft.playready');
    spy.mockRestore();
  });

  it('falls through to the next module and defaults its request string to its key system', async () => {
    const spy = vi.spyOn(navigator, 'requestMediaKeySystemAccess');
    const access = {} as MediaKeySystemAccess;

    spy.mockRejectedValueOnce(new Error('no FairPlay here')).mockResolvedValueOnce(access);

    const result = await requestKeySystemAccess([fairPlayKeySystem, widevineKeySystem], { video: [], audio: [] });

    expect(spy.mock.calls.map(([keySystem]) => keySystem)).toEqual(['com.apple.fps', 'com.widevine.alpha']);
    expect(result?.module).toBe(widevineKeySystem);
    spy.mockRestore();
  });

  // The availability half of the robustness ladder. The stamped pass names a tier on
  // every capability so nothing warns; this pass exists so a CDM holding none of
  // those tiers still gets access instead of failing to build a session at all.
  it('retries unstamped when every candidate refuses the stamped ladder', async () => {
    const spy = vi.spyOn(navigator, 'requestMediaKeySystemAccess');
    const access = {} as MediaKeySystemAccess;

    // Refuse anything naming a robustness; accept once it is dropped.
    spy.mockImplementation(async (_keySystem, configs) => {
      const named = [...configs].some((config) =>
        [...(config.videoCapabilities ?? []), ...(config.audioCapabilities ?? [])].some((c) => c.robustness)
      );
      if (named) throw new Error('no such tier');

      return access;
    });

    const result = await requestKeySystemAccess([widevineKeySystem], { video: [VIDEO_TYPE], audio: [AUDIO_TYPE] });

    expect(result?.access).toBe(access);
    // Stamped first, unstamped only after it was refused.
    const stamped = spy.mock.calls.map(([, configs]) =>
      [...configs].some((config) => config.videoCapabilities?.some((capability) => capability.robustness))
    );

    expect(stamped[0]).toBe(true);
    expect(stamped.at(-1)).toBe(false);
    spy.mockRestore();
  });

  it('does not retry unstamped when the ladder is accepted', async () => {
    const spy = vi.spyOn(navigator, 'requestMediaKeySystemAccess');

    spy.mockResolvedValue({} as MediaKeySystemAccess);

    await requestKeySystemAccess([widevineKeySystem], { video: [VIDEO_TYPE], audio: [AUDIO_TYPE] });

    // One call, and every configuration in it names a tier — nothing unstamped is
    // ever requested on the happy path, which is what keeps Chromium quiet.
    expect(spy).toHaveBeenCalledTimes(1);

    for (const config of [...spy.mock.calls[0]![1]]) {
      for (const capability of [...(config.videoCapabilities ?? []), ...(config.audioCapabilities ?? [])]) {
        expect(capability.robustness).toBeTruthy();
      }
    }

    spy.mockRestore();
  });

  it('resolves undefined when every candidate is refused, or none were given', async () => {
    const spy = vi.spyOn(navigator, 'requestMediaKeySystemAccess');

    spy.mockRejectedValue(new Error('refused'));

    expect(await requestKeySystemAccess([widevineKeySystem], { video: [], audio: [] })).toBeUndefined();
    expect(await requestKeySystemAccess([], { video: [], audio: [] })).toBeUndefined();
    spy.mockRestore();
  });
});

describe('applyLicenseRequest', () => {
  const req = (body: BufferSource, headers: Record<string, string> = {}) => ({
    url: 'https://lic',
    method: 'POST',
    headers,
    body,
  });

  it('posts raw bytes as octet-stream for a module declaring no transform', async () => {
    const message = new Uint8Array([1, 2, 3]).buffer;
    const request = await applyLicenseRequest(widevineKeySystem, req(message));

    expect(request.body).toBe(message);
    expect(request.headers).toEqual({ 'Content-Type': 'application/octet-stream' });
  });

  it('octet-stream default wins over a configured Content-Type', async () => {
    const request = await applyLicenseRequest(
      widevineKeySystem,
      req(new Uint8Array([1]).buffer, { 'Content-Type': 'x/y' })
    );

    expect(request.headers['Content-Type']).toBe('application/octet-stream');
  });

  it('delegates to the module when it declares its own transform', async () => {
    const module_: KeySystemModule = {
      keySystem: 'com.example.drm',
      keyFormats: [],
      licenseRequest: (request) => ({
        ...request,
        body: new Uint8Array([7]),
        headers: { 'Content-Type': 'application/json' },
      }),
    };

    expect(await applyLicenseRequest(module_, req(new Uint8Array([1]).buffer))).toEqual({
      url: 'https://lic',
      method: 'POST',
      body: new Uint8Array([7]),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('falls back to octet-stream for an absent module', async () => {
    const message = new Uint8Array([1]).buffer;

    expect(await applyLicenseRequest(undefined, req(message))).toEqual({
      url: 'https://lic',
      method: 'POST',
      body: message,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  });
});

describe('applyLicenseResponse', () => {
  it('passes the response through unchanged for a module declaring no transform', async () => {
    const license = new Uint8Array([9, 9, 9]);

    expect(await applyLicenseResponse(widevineKeySystem, license)).toBe(license);
    expect(await applyLicenseResponse(undefined, license)).toBe(license);
  });

  it('delegates to the module when it declares its own transform', async () => {
    const module_: KeySystemModule = {
      keySystem: 'com.example.drm',
      keyFormats: [],
      licenseResponse: (response) => new Uint8Array([response[0]! + 1]),
    };

    expect([...(await applyLicenseResponse(module_, new Uint8Array([4])))]).toEqual([5]);
  });
});

describe('applyCertificateRequest / applyCertificateResponse', () => {
  const certRequest = { url: 'https://cert', method: 'GET', headers: {}, body: null };

  it('are identity for a module declaring no certificate transforms', async () => {
    const bytes = new Uint8Array([1, 2]);

    expect(await applyCertificateRequest(fairPlayKeySystem, certRequest)).toBe(certRequest);
    expect(await applyCertificateResponse(fairPlayKeySystem, bytes)).toBe(bytes);
    expect(await applyCertificateRequest(undefined, certRequest)).toBe(certRequest);
    expect(await applyCertificateResponse(undefined, bytes)).toBe(bytes);
  });

  it('delegate to the module when it declares them', async () => {
    const module_: KeySystemModule = {
      keySystem: 'com.example.drm',
      keyFormats: [],
      certificateRequest: (request) => ({ ...request, method: 'POST' }),
      certificateResponse: (response) => new Uint8Array([response[0]! + 1]),
    };

    expect((await applyCertificateRequest(module_, certRequest)).method).toBe('POST');
    expect([...(await applyCertificateResponse(module_, new Uint8Array([4])))]).toEqual([5]);
  });
});

describe('buildKeySystemConfigurations', () => {
  it('builds one configuration with per-type capabilities from track content types', () => {
    const [config] = buildKeySystemConfigurations(playReadyKeySystem, { video: [VIDEO_TYPE], audio: [AUDIO_TYPE] });

    expect(config?.initDataTypes).toEqual(['cenc']);
    expect(config?.videoCapabilities).toEqual([{ contentType: VIDEO_TYPE }]);
    expect(config?.audioCapabilities).toEqual([{ contentType: AUDIO_TYPE }]);
  });

  it("uses the module's own init-data types when it declares them", () => {
    const [config] = buildKeySystemConfigurations(fairPlayKeySystem, { video: [VIDEO_TYPE], audio: [] });

    expect(config?.initDataTypes).toEqual(['sinf', 'cenc']);
  });

  it('stamps the declared encryption scheme on every capability', () => {
    const [config] = buildKeySystemConfigurations(
      playReadyKeySystem,
      { video: [VIDEO_TYPE], audio: [AUDIO_TYPE] },
      'cbcs'
    );

    expect(config?.videoCapabilities).toEqual([{ contentType: VIDEO_TYPE, encryptionScheme: 'cbcs' }]);
    expect(config?.audioCapabilities).toEqual([{ contentType: AUDIO_TYPE, encryptionScheme: 'cbcs' }]);
  });

  it('offers an unstamped fallback after the declared scheme', () => {
    const configs = buildKeySystemConfigurations(
      playReadyKeySystem,
      { video: [VIDEO_TYPE], audio: [AUDIO_TYPE] },
      'cbcs'
    );

    // `requestMediaKeySystemAccess` picks the first supported entry, so a CDM that refuses the
    // `encryptionScheme` member still negotiates on the second.
    expect(configs).toHaveLength(2);
    expect(configs[1]?.videoCapabilities).toEqual([{ contentType: VIDEO_TYPE }]);
    expect(configs[1]?.audioCapabilities).toEqual([{ contentType: AUDIO_TYPE }]);
    expect(configs[1]?.initDataTypes).toEqual(['cenc']);
  });

  it('offers the stamped configuration alone when the module opts out of the fallback', () => {
    // The composable half of the scheme permutation: a system whose CDMs honour
    // the member negotiates once instead of twice.
    const module_: KeySystemModule = { ...playReadyKeySystem, schemeFallback: false };
    const configs = buildKeySystemConfigurations(module_, { video: [VIDEO_TYPE], audio: [] }, 'cbcs');

    expect(configs).toHaveLength(1);
    expect(configs[0]?.videoCapabilities).toEqual([{ contentType: VIDEO_TYPE, encryptionScheme: 'cbcs' }]);
  });

  // The reason the ladder has a floor instead of an unstamped last resort.
  // Chromium warns for any *requested* configuration that omits `robustness`, not
  // only the one it accepts — measured four ways against a real CDM: the same
  // ladder warns with a trailing unstamped entry and is silent without it, while
  // the accepted configuration is identical either way. So a stamped rung winning
  // is not enough; nothing in the list may be unstamped.
  it("descends the module's robustness tiers, strongest rung first", () => {
    const configs = buildKeySystemConfigurations(widevineKeySystem, { video: [VIDEO_TYPE], audio: [AUDIO_TYPE] });

    expect(
      configs.map((config) => [config.videoCapabilities?.[0]?.robustness, config.audioCapabilities?.[0]?.robustness])
    ).toEqual([
      ['HW_SECURE_ALL', 'SW_SECURE_CRYPTO'],
      ['SW_SECURE_DECODE', 'SW_SECURE_CRYPTO'],
      ['SW_SECURE_CRYPTO', 'SW_SECURE_CRYPTO'],
    ]);
  });

  // The weakest tier stands in for the unstamped entry, so a CDM without the
  // stronger rungs still negotiates rather than being refused.
  it('ends the ladder on the weakest tier', () => {
    const configs = buildKeySystemConfigurations(widevineKeySystem, { video: [VIDEO_TYPE], audio: [AUDIO_TYPE] });

    expect(configs.at(-1)?.videoCapabilities).toEqual([{ contentType: VIDEO_TYPE, robustness: 'SW_SECURE_CRYPTO' }]);
  });

  // An audio-only source still gets a stamped rung: the tier lives on the audio
  // capability, so counting rungs off video alone would leave it unnamed. One rung,
  // because the audio ladder has one tier — the video rungs have nothing to carry.
  it('offers the tier for an audio-only source', () => {
    const configs = buildKeySystemConfigurations(widevineKeySystem, { video: [], audio: [AUDIO_TYPE] });

    expect(configs.map((config) => config.audioCapabilities?.[0]?.robustness)).toEqual(['SW_SECURE_CRYPTO']);
    expect(configs[0]?.videoCapabilities).toBeUndefined();
  });

  it('leaves robustness unset for a module with no preferred tier', () => {
    const configs = buildKeySystemConfigurations(playReadyKeySystem, { video: [VIDEO_TYPE], audio: [] });

    expect(configs).toHaveLength(1);
    expect(configs[0]?.videoCapabilities).toEqual([{ contentType: VIDEO_TYPE }]);
  });

  it('composes scheme and robustness preferences, scheme outermost', () => {
    const configs = buildKeySystemConfigurations(widevineKeySystem, { video: [VIDEO_TYPE], audio: [] }, 'cbcs');

    expect(
      configs.map((config) => [
        config.videoCapabilities?.[0]?.encryptionScheme,
        config.videoCapabilities?.[0]?.robustness,
      ])
    ).toEqual([
      ['cbcs', 'HW_SECURE_ALL'],
      ['cbcs', 'SW_SECURE_DECODE'],
      ['cbcs', 'SW_SECURE_CRYPTO'],
      [undefined, 'HW_SECURE_ALL'],
      [undefined, 'SW_SECURE_DECODE'],
      [undefined, 'SW_SECURE_CRYPTO'],
    ]);
  });

  it('omits a capability list when that type has no content types', () => {
    const [config] = buildKeySystemConfigurations(playReadyKeySystem, { video: [VIDEO_TYPE], audio: [] });

    expect(config?.videoCapabilities).toHaveLength(1);
    expect(config?.audioCapabilities).toBeUndefined();
  });
});

describe('fetchDrm', () => {
  it('forwards the request credentials mode to fetch', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Uint8Array([1])));

    try {
      await fetchDrm(
        { url: 'https://license.example.com/wv', method: 'POST', headers: {}, body: null, credentials: 'include' },
        new AbortController().signal
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://license.example.com/wv',
        expect.objectContaining({ credentials: 'include' })
      );
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe('fetchServerCertificate', () => {
  const CERT_URL = 'https://license.example.com/appcert';

  function stubFetch(body = new Uint8Array([1])) {
    return vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body));
  }

  it('GETs the certificate with the configured certificate headers and credentials, never the license headers', async () => {
    const fetchSpy = stubFetch();

    try {
      const certificate = await fetchServerCertificate(
        fairPlayKeySystem,
        {
          licenseUrl: 'https://license.example.com/fairplay',
          serverCertificateUrl: CERT_URL,
          headers: { 'X-License-Only': 'never-on-the-cert' },
          certificateHeaders: { 'x-vudrm-token': 'ent' },
          credentials: 'include',
        },
        CERT_URL,
        new AbortController().signal
      );

      expect(fetchSpy).toHaveBeenCalledWith(
        CERT_URL,
        expect.objectContaining({ method: 'GET', headers: { 'x-vudrm-token': 'ent' }, credentials: 'include' })
      );
      expect(certificate).toEqual(new Uint8Array([1]));
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('applies the per-source request and response transforms around the fetch', async () => {
    // A provider that gates the cert behind an entitlement header (Vualto's
    // shape) and wraps the certificate; the transforms shape the request and
    // unwrap the response.
    const fetchSpy = stubFetch(new Uint8Array([1]));

    try {
      const certificate = await fetchServerCertificate(
        fairPlayKeySystem,
        {
          licenseUrl: 'https://license.example.com/fairplay',
          serverCertificateUrl: CERT_URL,
          certificateRequest: (request) => ({ ...request, headers: { ...request.headers, 'x-token': 'ent' } }),
          certificateResponse: (response) => new Uint8Array([response[0]! + 40]),
        },
        CERT_URL,
        new AbortController().signal
      );

      expect(fetchSpy).toHaveBeenCalledWith(CERT_URL, expect.objectContaining({ headers: { 'x-token': 'ent' } }));
      expect(certificate).toEqual(new Uint8Array([41]));
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('rejects on a non-OK response, so the caller can report the certificate phase', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 403 }));

    try {
      await expect(
        fetchServerCertificate(
          fairPlayKeySystem,
          { licenseUrl: 'https://license.example.com/fairplay', serverCertificateUrl: CERT_URL },
          CERT_URL,
          new AbortController().signal
        )
      ).rejects.toThrow(/403/);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
