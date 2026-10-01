import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  SVTA_BAD_LICENSE_REQUEST,
  SVTA_DRM_LICENSE_REQUEST_GENERATION_FAILED,
  SVTA_DRM_LICENSE_RESPONSE_REJECTED,
  SVTA_DRM_SESSION_ERROR,
  SVTA_INSUFFICIENT_OUTPUT_PROTECTION,
  SVTA_LICENSE_EXPIRED,
  type SvtaError,
} from '../../errors';
import { fetchDrm } from '../eme';
import { widevineKeySystem } from '../key-systems';
import {
  fetchLicense,
  listenForEncryptedInitData,
  observeKeyStatuses,
  openLicenseSession,
  unwrapLicense,
} from '../license-sessions';

// The one network seam; everything above it runs real.
vi.mock('../eme', async () => {
  const actual = await vi.importActual<typeof import('../eme')>('../eme');

  return { ...actual, fetchDrm: vi.fn() };
});

const LICENSE_URL = 'https://license.example.com/wv';
const MESSAGE = new Uint8Array([1, 2, 3]);

type FakeSession = MediaKeySession & {
  generateRequest: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  keyStatuses: Map<BufferSource, MediaKeyStatus>;
};

function makeFakeSession(): FakeSession {
  const session = new EventTarget() as FakeSession;

  session.generateRequest = vi.fn(async () => {});
  session.update = vi.fn(async () => {});
  session.close = vi.fn(async () => {});
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

function message(session: FakeSession, body: Uint8Array = MESSAGE) {
  session.dispatchEvent(Object.assign(new Event('message'), { message: body.buffer, messageType: 'license-request' }));
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.mocked(fetchDrm).mockReset();
});

describe('fetchLicense', () => {
  it('POSTs the message with the configured headers and credentials, the per-source override composing last', async () => {
    vi.mocked(fetchDrm).mockResolvedValue(new Uint8Array([9]));

    const signal = new AbortController().signal;
    const license = await fetchLicense(
      widevineKeySystem,
      {
        licenseUrl: LICENSE_URL,
        headers: { Authorization: 'Bearer t' },
        credentials: 'include',
        licenseRequest: (request) => ({
          ...request,
          headers: {
            ...request.headers,
            'x-module-content-type': request.headers['Content-Type']!,
            'Content-Type': 'application/source-license',
          },
        }),
      },
      LICENSE_URL,
      MESSAGE,
      signal
    );

    expect(fetchDrm).toHaveBeenCalledWith(
      {
        url: LICENSE_URL,
        method: 'POST',
        credentials: 'include',
        body: MESSAGE,
        headers: {
          Authorization: 'Bearer t',
          'x-module-content-type': 'application/octet-stream',
          'Content-Type': 'application/source-license',
        },
      },
      signal
    );
    expect(license).toEqual(new Uint8Array([9]));
  });

  it('rejects when the per-source request transform throws, before any fetch', async () => {
    await expect(
      fetchLicense(
        widevineKeySystem,
        {
          licenseUrl: LICENSE_URL,
          licenseRequest: () => {
            throw new Error('mint failed');
          },
        },
        LICENSE_URL,
        MESSAGE,
        new AbortController().signal
      )
    ).rejects.toThrow('mint failed');
    expect(fetchDrm).not.toHaveBeenCalled();
  });
});

describe('unwrapLicense', () => {
  it('applies the module default, then the per-source override', async () => {
    const unwrapped = await unwrapLicense(
      {
        ...widevineKeySystem,
        licenseResponse: (response) => new Uint8Array([response[0]! * 2]),
      },
      { licenseUrl: LICENSE_URL, licenseResponse: (response) => new Uint8Array([response[0]! + 1]) },
      new Uint8Array([41])
    );

    expect(unwrapped).toEqual(new Uint8Array([83]));
  });
});

describe('openLicenseSession', () => {
  function open(overrides: { entry?: object; signal?: AbortSignal } = {}) {
    const { mediaKeys, sessions } = makeFakeMediaKeys();
    const reports: SvtaError[] = [];
    const controller = new AbortController();
    const session = openLicenseSession({
      mediaKeys,
      keySystem: 'com.widevine.alpha',
      module: widevineKeySystem,
      entry: { licenseUrl: LICENSE_URL, ...overrides.entry },
      licenseUrl: LICENSE_URL,
      initDataType: 'cenc',
      initData: new Uint8Array([7]),
      signal: overrides.signal ?? controller.signal,
      report: (error) => reports.push(error),
    }) as FakeSession;

    return { session, sessions, reports, controller };
  }

  it('generates the request for its init data and exchanges the license on message', async () => {
    vi.mocked(fetchDrm).mockResolvedValue(new Uint8Array([9]));
    const { session, reports } = open();

    expect(session.generateRequest).toHaveBeenCalledWith('cenc', new Uint8Array([7]));

    message(session);
    await flush();

    expect(session.update).toHaveBeenCalledWith(new Uint8Array([9]));
    expect(reports).toEqual([]);
  });

  it('reports 4004 when the request fails and 4016 when the CDM rejects the response, keeping the session', async () => {
    vi.mocked(fetchDrm)
      .mockRejectedValueOnce(new Error('503'))
      .mockResolvedValueOnce(new Uint8Array([9]));
    const { session, reports } = open();

    session.update.mockRejectedValueOnce(new Error('bad license'));
    message(session);
    await flush();
    message(session);
    await flush();

    expect(reports.map((error) => error.code)).toEqual([SVTA_BAD_LICENSE_REQUEST, SVTA_DRM_LICENSE_RESPONSE_REJECTED]);
    expect(session.close).not.toHaveBeenCalled();
  });

  it('reports 4021 when the CDM cannot generate the request', async () => {
    const { mediaKeys } = makeFakeMediaKeys();
    const reports: SvtaError[] = [];

    vi.mocked(mediaKeys.createSession).mockImplementationOnce(() => {
      const session = makeFakeSession();

      session.generateRequest.mockRejectedValue(new Error('unsupported init data'));
      return session;
    });
    openLicenseSession({
      mediaKeys,
      keySystem: 'com.widevine.alpha',
      module: widevineKeySystem,
      entry: { licenseUrl: LICENSE_URL },
      licenseUrl: LICENSE_URL,
      initDataType: 'cenc',
      initData: new Uint8Array([7]),
      signal: new AbortController().signal,
      report: (error) => reports.push(error),
    });
    await flush();

    expect(reports.map((error) => error.code)).toEqual([SVTA_DRM_LICENSE_REQUEST_GENERATION_FAILED]);
  });

  it('closes the session and reports nothing more once its signal aborts', async () => {
    let resolveFetch!: (value: Uint8Array<ArrayBuffer>) => void;

    vi.mocked(fetchDrm).mockImplementation(() => new Promise((resolve) => (resolveFetch = resolve)));
    const { session, reports, controller } = open();

    message(session);
    await flush();
    controller.abort();
    resolveFetch(new Uint8Array([9]));
    await flush();

    expect(session.close).toHaveBeenCalledTimes(1);
    expect(session.update).not.toHaveBeenCalled();
    expect(reports).toEqual([]);
  });
});

describe('observeKeyStatuses', () => {
  it('reports a stopping status once per transition, and again only after it changes away and back', () => {
    const session = makeFakeSession();
    const reports: SvtaError[] = [];
    const keyId = new Uint8Array([0xab, 0xcd]);

    observeKeyStatuses(session, 'com.widevine.alpha', (error) => reports.push(error), new AbortController().signal);

    const quietStatuses: MediaKeyStatus[] = [
      'usable',
      'output-downscaled',
      'released',
      'status-pending',
      'usable-in-future',
    ];

    quietStatuses.forEach((status, i) => session.keyStatuses.set(new Uint8Array([0x10 + i]), status));
    session.dispatchEvent(new Event('keystatuschange'));
    expect(reports).toEqual([]);

    session.keyStatuses.set(keyId, 'expired');
    session.dispatchEvent(new Event('keystatuschange'));
    session.dispatchEvent(new Event('keystatuschange'));
    session.keyStatuses.set(keyId, 'usable');
    session.dispatchEvent(new Event('keystatuschange'));
    session.keyStatuses.set(keyId, 'expired');
    session.dispatchEvent(new Event('keystatuschange'));
    session.dispatchEvent(new Event('keystatuschange'));
    session.keyStatuses.set(keyId, 'output-restricted');
    session.keyStatuses.set(new Uint8Array([0x02]), 'internal-error');
    session.dispatchEvent(new Event('keystatuschange'));

    expect(reports).toEqual([
      { code: SVTA_LICENSE_EXPIRED, data: { keySystem: 'com.widevine.alpha', status: 'expired', keyId: 'abcd' } },
      { code: SVTA_LICENSE_EXPIRED, data: { keySystem: 'com.widevine.alpha', status: 'expired', keyId: 'abcd' } },
      {
        code: SVTA_INSUFFICIENT_OUTPUT_PROTECTION,
        data: { keySystem: 'com.widevine.alpha', status: 'output-restricted', keyId: 'abcd' },
      },
      {
        code: SVTA_DRM_SESSION_ERROR,
        data: { keySystem: 'com.widevine.alpha', status: 'internal-error', keyId: '02' },
      },
    ]);
  });
});

describe('listenForEncryptedInitData', () => {
  it('hands each distinct init data over once, by bytes', () => {
    const video = document.createElement('video');
    const seen: string[] = [];

    listenForEncryptedInitData(
      video,
      (type, bytes) => seen.push(`${type}:${[...bytes].join(',')}`),
      new AbortController().signal
    );

    const fire = (bytes: number[]) =>
      video.dispatchEvent(
        Object.assign(new Event('encrypted'), { initDataType: 'sinf', initData: new Uint8Array(bytes).buffer })
      );

    fire([1, 2]);
    fire([1, 2]);
    fire([3]);

    expect(seen).toEqual(['sinf:1,2', 'sinf:3']);
  });

  it('serves every repeat when dedupe is off', () => {
    const video = document.createElement('video');
    const seen: string[] = [];

    listenForEncryptedInitData(
      video,
      (type, bytes) => seen.push(`${type}:${[...bytes].join(',')}`),
      new AbortController().signal,
      {
        dedupe: false,
      }
    );

    const fire = (bytes: number[]) =>
      video.dispatchEvent(
        Object.assign(new Event('encrypted'), { initDataType: 'skd', initData: new Uint8Array(bytes).buffer })
      );

    // An AirPlay receiver re-proxies the same content id on connect and on
    // disconnect; collapsing the second request strands the session.
    fire([1, 2]);
    fire([1, 2]);

    expect(seen).toEqual(['skd:1,2', 'skd:1,2']);
  });

  it('ignores init-data types it was not asked for', () => {
    const video = document.createElement('video');
    const seen: string[] = [];

    listenForEncryptedInitData(video, (type) => seen.push(type), new AbortController().signal, {
      initDataTypes: ['skd'],
    });

    const fire = (initDataType: string) =>
      video.dispatchEvent(
        Object.assign(new Event('encrypted'), { initDataType, initData: new Uint8Array([1]).buffer })
      );

    fire('sinf');
    fire('skd');
    fire('cenc');

    expect(seen).toEqual(['skd']);
  });
});
