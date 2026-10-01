import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { defaultFairPlayContentId } from '../../drm';
import { keyUriFromInitData, openLegacyLicenseSession, packInitData } from '../fairplay-legacy';
import { openLicenseSession } from '../license-sessions';

/** What `webkitneedkey` delivers: a 4-byte little-endian count, then the URI as UTF-16LE. */
function lengthPrefixedUtf16(uri: string): ArrayBuffer {
  const bytes = new Uint8Array(4 + uri.length * 2);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, uri.length * 2, true);

  for (let i = 0; i < uri.length; i++) view.setUint16(4 + i * 2, uri.charCodeAt(i), true);

  return bytes.buffer;
}

const MUX_URI = 'skd://mux?keyId=bfd7ce06e7f24ca811498a15d29b0376&playbackId=FefhWnSMzDqz5z9yxssihdRx8dV6srhYJ8301u';
const EZDRM_URI = 'skd://fps.ezdrm.com/;b99ed9e5-c641-49d1-bfa8-43692b686ddb';

afterEach(() => vi.unstubAllGlobals());

describe.each(['openLicenseSession', 'openLegacyLicenseSession'] as const)('%s', (owner) => {
  it('does not update a closed session after an asynchronous license response transform', async () => {
    vi.stubGlobal('fetch', async () => new Response(new Uint8Array([9])));
    let resolveLicense!: (license: Uint8Array<ArrayBuffer>) => void;

    const licenseResponse = vi.fn(() => new Promise<Uint8Array<ArrayBuffer>>((resolve) => (resolveLicense = resolve)));
    const controller = new AbortController();
    // SAFETY: This EventTarget is a session double; the APIs used by either owner are supplied below.
    const session = Object.assign(new EventTarget() as MediaKeySession, {
      generateRequest: vi.fn(async () => {}),
      update: owner === 'openLicenseSession' ? vi.fn(async () => {}) : vi.fn(),
      close: owner === 'openLicenseSession' ? vi.fn(async () => {}) : vi.fn(),
      keyStatuses: new Map(),
    });
    const options = {
      module: undefined,
      entry: { licenseUrl: 'https://license.example.com/fps', licenseResponse },
      licenseUrl: 'https://license.example.com/fps',
      signal: controller.signal,
      report: vi.fn(),
    };

    if (owner === 'openLicenseSession') {
      // SAFETY: The owner only calls createSession; the returned double implements the session APIs it uses.
      openLicenseSession({
        ...options,
        mediaKeys: { createSession: (): MediaKeySession => session } as MediaKeys,
        keySystem: 'com.widevine.alpha',
        initDataType: 'cenc',
        initData: new Uint8Array([7]),
      });
    } else {
      const video = Object.assign(document.createElement('video'), {
        webkitKeys: { createSession: () => session },
        webkitSetMediaKeys: vi.fn(),
      });

      openLegacyLicenseSession({
        ...options,
        mediaElement: video,
        certificate: new Uint8Array([1]),
        initData: lengthPrefixedUtf16(MUX_URI),
      });
    }

    session.dispatchEvent(
      Object.assign(new Event(owner === 'openLicenseSession' ? 'message' : 'webkitkeymessage'), {
        message: new Uint8Array([3]).buffer,
      })
    );
    await vi.waitFor(() => expect(licenseResponse).toHaveBeenCalledTimes(1));
    controller.abort();
    expect(session.close).toHaveBeenCalledTimes(1);

    resolveLicense(new Uint8Array([9]));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(session.update).not.toHaveBeenCalled();
    expect(options.report).not.toHaveBeenCalled();
  });
});

describe('keyUriFromInitData', () => {
  it('recovers the whole URI from the length-prefixed form, scheme included', () => {
    expect(keyUriFromInitData(lengthPrefixedUtf16(EZDRM_URI))).toBe(EZDRM_URI);
  });

  it('recovers it from the bare form older WebKit sends', () => {
    const bare = lengthPrefixedUtf16(EZDRM_URI).slice(4);

    expect(keyUriFromInitData(bare)).toBe(EZDRM_URI);
  });
});

describe('defaultFairPlayContentId', () => {
  it('takes everything after the scheme, which is what Mux expects', () => {
    expect(defaultFairPlayContentId(MUX_URI)).toBe(MUX_URI.slice('skd://'.length));
  });

  it('leaves a URI carrying no scheme alone', () => {
    expect(defaultFairPlayContentId('bare-content-id')).toBe('bare-content-id');
  });

  it("does not know EZDRM's delimiter — which is why the field exists", () => {
    // The whole reason a provider resolver is configurable: the default keeps
    // the host and the `;`, and EZDRM's server wants only what follows them.
    expect(defaultFairPlayContentId(EZDRM_URI)).toBe('fps.ezdrm.com/;b99ed9e5-c641-49d1-bfa8-43692b686ddb');
    expect(EZDRM_URI.slice(EZDRM_URI.lastIndexOf(';') + 1)).toBe('b99ed9e5-c641-49d1-bfa8-43692b686ddb');
  });
});

describe('packInitData', () => {
  it('lays out the raw init data, then the content id and certificate behind their own byte counts', () => {
    const initData = lengthPrefixedUtf16(EZDRM_URI);
    const certificate = new Uint8Array([1, 2, 3]);
    const contentId = 'b99ed9e5';

    const packed = packInitData(initData, contentId, certificate);
    const view = new DataView(packed.buffer);

    let offset = initData.byteLength;

    expect(packed.slice(0, offset)).toEqual(new Uint8Array(initData));

    const idBytes = view.getUint32(offset, true);

    expect(idBytes).toBe(contentId.length * 2);
    offset += 4;
    expect(new TextDecoder('utf-16le').decode(packed.slice(offset, offset + idBytes))).toBe(contentId);
    offset += idBytes;

    expect(view.getUint32(offset, true)).toBe(certificate.byteLength);
    expect(packed.slice(offset + 4)).toEqual(certificate);
  });
});
