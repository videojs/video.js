import { describe, expect, it } from 'vite-plus/test';

import {
  clearKeySystem,
  DEFAULT_KEY_SYSTEMS,
  fairPlayKeySystem,
  initDataFromKeyUri,
  playReadyKeySystem,
  widevineKeySystem,
} from '../key-systems';

// "ping" in base64 — small stand-in for a PSSH payload.
const PSSH_BASE64 = 'cGluZw==';
const PSSH_BYTES = new Uint8Array([0x70, 0x69, 0x6e, 0x67]);

/** A minimal well-formed v0 PSSH box wrapping `payload`. */
function psshBox(payload: Uint8Array): Uint8Array<ArrayBuffer> {
  const box = new Uint8Array(32 + payload.length);
  const view = new DataView(box.buffer);

  view.setUint32(0, box.length);
  box.set([0x70, 0x73, 0x73, 0x68], 4); // 'pssh'
  view.setUint32(28, payload.length);
  box.set(payload, 32);
  return box;
}

function utf16(text: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(text.length * 2);

  for (let i = 0; i < text.length; i++) new DataView(bytes.buffer).setUint16(i * 2, text.charCodeAt(i), true);

  return bytes;
}

describe('initDataFromKeyUri', () => {
  it('decodes a base64 data: URI to bytes', () => {
    expect(initDataFromKeyUri(`data:text/plain;base64,${PSSH_BASE64}`)).toEqual(PSSH_BYTES);
  });

  it('decodes with media-type parameters before the base64 marker', () => {
    expect(initDataFromKeyUri(`data:text/plain;charset=UTF-16;base64,${PSSH_BASE64}`)).toEqual(PSSH_BYTES);
  });

  it('carries no init data for non-data: URIs (skd://, https://)', () => {
    expect(initDataFromKeyUri('skd://mux?keyId=abc')).toBeUndefined();
    expect(initDataFromKeyUri('https://example.com/key.bin')).toBeUndefined();
  });

  it('carries no init data for a non-base64 data: URI', () => {
    expect(initDataFromKeyUri('data:text/plain,hello')).toBeUndefined();
  });
});

describe('widevineKeySystem', () => {
  it('claims the DASH system-id URN KEYFORMAT', () => {
    expect(widevineKeySystem.keyFormats).toEqual(['urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed']);
  });

  it('projects a data: URI to cenc init data untouched — Mux ships a complete PSSH', () => {
    const box = psshBox(new Uint8Array([1, 2, 3, 4]));
    const encoded = btoa(String.fromCharCode(...box));

    expect(widevineKeySystem.toInitData?.(`data:text/plain;base64,${encoded}`)).toEqual({
      initDataType: 'cenc',
      initData: box,
    });
  });

  it('projects nothing from a URI carrying no inline init data', () => {
    expect(widevineKeySystem.toInitData?.('skd://mux?keyId=abc')).toBeUndefined();
  });

  it('descends from the L1 tier to the software rung, and transforms no license request of its own', () => {
    // The second rung matters: macOS Chrome refuses `HW_SECURE_ALL`, and without
    // somewhere to descend to, both levels fall through to an unstamped
    // configuration.
    expect(widevineKeySystem.videoRobustnessTiers).toEqual(['HW_SECURE_ALL', 'SW_SECURE_DECODE', 'SW_SECURE_CRYPTO']);
    expect(widevineKeySystem.audioRobustnessTiers).toEqual(['SW_SECURE_CRYPTO']);
    expect(widevineKeySystem.licenseRequest).toBeUndefined();
  });
});

describe('playReadyKeySystem', () => {
  it('wraps a raw PlayReady Object into a v0 PSSH box', () => {
    const projected = playReadyKeySystem.toInitData?.(`data:text/plain;base64,${PSSH_BASE64}`);
    const initData = projected!.initData;

    expect(projected!.initDataType).toBe('cenc');
    expect(initData.length).toBe(32 + PSSH_BYTES.length);
    expect(new DataView(initData.buffer).getUint32(0)).toBe(initData.length);
    expect([...initData.slice(4, 8)]).toEqual([0x70, 0x73, 0x73, 0x68]); // 'pssh'
    expect(new DataView(initData.buffer).getUint32(8)).toBe(0); // v0, no flags
    // The PlayReady system id, 9a04f079-9840-4286-ab92-e65be0885f95.
    expect([...initData.slice(12, 28)]).toEqual([
      0x9a, 0x04, 0xf0, 0x79, 0x98, 0x40, 0x42, 0x86, 0xab, 0x92, 0xe6, 0x5b, 0xe0, 0x88, 0x5f, 0x95,
    ]);
    expect(new DataView(initData.buffer).getUint32(28)).toBe(PSSH_BYTES.length);
    expect([...initData.slice(32)]).toEqual([...PSSH_BYTES]);
  });

  it('leaves an already-PSSH declaration alone', () => {
    const box = psshBox(new Uint8Array([1, 2, 3, 4]));
    const encoded = btoa(String.fromCharCode(...box));

    expect(playReadyKeySystem.toInitData?.(`data:text/plain;base64,${encoded}`)?.initData).toEqual(box);
  });

  it('unwraps a PlayReadyKeyMessage envelope into headers and the decoded challenge', async () => {
    // btoa('challenge!') carried inside the classic UTF-16 XML envelope.
    const envelope = utf16(
      '<PlayReadyKeyMessage><LicenseAcquisition Version="1">' +
        '<Challenge encoding="base64encoded">Y2hhbGxlbmdlIQ==</Challenge>' +
        '<HttpHeaders><HttpHeader><name>Content-Type</name><value>text/xml; charset=utf-8</value></HttpHeader>' +
        '<HttpHeader><name>SOAPAction</name><value>AcquireLicense</value></HttpHeader></HttpHeaders>' +
        '</LicenseAcquisition></PlayReadyKeyMessage>'
    );
    const request = await playReadyKeySystem.licenseRequest!({
      url: 'https://lic',
      method: 'POST',
      headers: {},
      body: envelope.buffer,
    });

    expect(new TextDecoder().decode(request.body as ArrayBuffer | Uint8Array)).toBe('challenge!');
    expect(request.headers).toEqual({ 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: 'AcquireLicense' });
  });

  it('preserves configured request headers, and its own win on collision', async () => {
    // The widened DrmRequest carries source-configured headers in; the envelope's
    // headers must survive alongside them and override on a name clash.
    const envelope = utf16(
      '<PlayReadyKeyMessage><LicenseAcquisition Version="1">' +
        '<Challenge encoding="base64encoded">Y2hhbGxlbmdlIQ==</Challenge>' +
        '<HttpHeaders><HttpHeader><name>Content-Type</name><value>text/xml; charset=utf-8</value></HttpHeader>' +
        '</HttpHeaders></LicenseAcquisition></PlayReadyKeyMessage>'
    );
    const request = await playReadyKeySystem.licenseRequest!({
      url: 'https://lic',
      method: 'POST',
      headers: { 'X-Auth': 'keep', 'Content-Type': 'application/octet-stream' },
      body: envelope.buffer,
    });

    expect(request.headers['X-Auth']).toBe('keep');
    expect(request.headers['Content-Type']).toBe('text/xml; charset=utf-8');
  });

  it('sends an unwrapped challenge as XML — modern CDMs skip the envelope', async () => {
    const raw = utf16('<soap:Envelope>raw challenge</soap:Envelope>');
    const request = await playReadyKeySystem.licenseRequest!({
      url: 'https://lic',
      method: 'POST',
      headers: {},
      body: raw.buffer,
    });

    expect(request.body).toBe(raw.buffer);
    expect(request.headers).toEqual({ 'Content-Type': 'text/xml; charset=utf-8' });
  });
});

describe('fairPlayKeySystem', () => {
  it('asks for its own init-data types — Safari rejects cenc-only', () => {
    expect(fairPlayKeySystem.initDataTypes).toEqual(['sinf', 'cenc']);
  });

  it('projects no manifest init data, which routes it to the encrypted-event path', () => {
    expect(fairPlayKeySystem.toInitData).toBeUndefined();
  });
});

describe('clearKeySystem', () => {
  it('claims the W3C common-PSSH system-id URN KEYFORMAT', () => {
    expect(clearKeySystem.keyFormats).toEqual(['urn:uuid:1077efec-c0b2-4d02-ace3-3c1e52e2fb4b']);
  });

  it('projects a data: URI to cenc init data untouched, like Widevine', () => {
    const box = psshBox(new Uint8Array([9, 8, 7]));
    const encoded = btoa(String.fromCharCode(...box));

    expect(clearKeySystem.toInitData?.(`data:video/mp4;base64,${encoded}`)).toEqual({
      initDataType: 'cenc',
      initData: box,
    });
    expect(clearKeySystem.toInitData?.('skd://mux?keyId=abc')).toBeUndefined();
  });

  it('sends its license message as JSON with the body untouched', async () => {
    const body = new TextEncoder().encode('{"kids":["AA"]}');
    const shaped = await clearKeySystem.licenseRequest!({ url: 'https://l', method: 'POST', headers: {}, body });

    expect(shaped.headers['Content-Type']).toBe('application/json');
    expect(shaped.body).toBe(body);
  });
});

describe('DEFAULT_KEY_SYSTEMS', () => {
  it("lists all three in hls.js's order — the platform-native system first", () => {
    expect(DEFAULT_KEY_SYSTEMS.map((module_) => module_.keySystem)).toEqual([
      'com.apple.fps',
      'com.widevine.alpha',
      'com.microsoft.playready',
    ]);
  });

  it('claims every HLS DRM KEYFORMAT identity exactly once', () => {
    const keyFormats = DEFAULT_KEY_SYSTEMS.flatMap((module_) => module_.keyFormats);

    expect(keyFormats).toEqual([
      'com.apple.streamingkeydelivery',
      'urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed',
      'com.microsoft.playready',
    ]);
    expect(new Set(keyFormats).size).toBe(keyFormats.length);
  });
});
