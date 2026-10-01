/**
 * The pre-EME WebKit key API, for the one case EME cannot serve: Safari refuses `generateRequest` while the playback
 * target is an AirPlay receiver, and the legacy API still works. Measured on macOS/Safari 26.6.2 — the CDM grants
 * access for `initDataTypes: ['skd']` and then throws `NotSupportedError` from `generateRequest`, self-inconsistently.
 *
 * The legacy twin of `license-sessions.ts`, and shaped like it: everything binds to one `AbortSignal` and reports
 * through a callback, so it reads no signals and imports nothing from the behavior layer. Two differences the caller
 * has to care about — the application certificate is **mandatory** (it is packed into the session's initialization data
 * rather than handed to the CDM), and `webkitSetMediaKeys` / `update` are synchronous.
 *
 * Ported from the shipped `adapters/native-hls-video/src/fairplay-webkit.ts`, which serves the same bug on the native
 * engine. Delete both once WebKit fixes it.
 *
 * @see https://developer.apple.com/streaming/fps/
 */
import { listen } from '@videojs/utils/dom';

import { defaultFairPlayContentId, type DrmSystemConfig, type KeySystemModule } from '../drm';
import { SVTA_BAD_LICENSE_REQUEST, SVTA_DRM_LICENSE_RESPONSE_REJECTED, SVTA_DRM_SESSION_ERROR } from '../errors';
import { fetchLicense, type ReportDrmCondition, unwrapLicense } from './license-sessions';

/** Key system identifier the legacy `WebKitMediaKeys` API answers to. */
export const FAIRPLAY_LEGACY_KEY_SYSTEM = 'com.apple.fps.1_0';

/** What FairPlay negotiates capabilities against — the manifest, not a codec. */
const FAIRPLAY_CONTENT_TYPE = 'application/vnd.apple.mpegurl';

// Undeclared in `lib.dom`; reachable only through `globalThis.WebKitMediaKeys`.
interface WebKitMediaKeySession extends EventTarget {
  readonly error: { code: number; systemCode: number } | null;
  update(response: BufferSource): void;
  close(): void;
}

interface WebKitMediaKeys {
  createSession(mimeType: string, initData: BufferSource): WebKitMediaKeySession;
}

interface WebKitMediaKeysConstructor {
  new (keySystem: string): WebKitMediaKeys;
  isTypeSupported(keySystem: string, mimeType?: string): boolean;
}

interface WebKitEncryptedMediaElement extends HTMLMediaElement {
  readonly webkitKeys: WebKitMediaKeys | null;
  webkitSetMediaKeys(keys: WebKitMediaKeys | null): void;
}

/** Whether this realm still exposes the legacy WebKit key API for `mediaElement`. */
export function supportsWebKitFairPlay(mediaElement: HTMLMediaElement): boolean {
  return 'WebKitMediaKeys' in globalThis && 'webkitSetMediaKeys' in mediaElement;
}

/**
 * Whether a `generateRequest` rejection is the AirPlay-session refusal this module exists for, rather than a real
 * failure. Matched on the error and the live session only — no OS sniffing, so it stops applying by itself the moment
 * WebKit starts serving EME during a session.
 */
export function isAirPlayGenerateRequestRefusal(error: unknown, mediaElement: HTMLMediaElement): boolean {
  return (
    error instanceof DOMException &&
    error.name === 'NotSupportedError' &&
    !!(mediaElement as { webkitCurrentPlaybackTargetIsWireless?: boolean }).webkitCurrentPlaybackTargetIsWireless
  );
}

/** Install the legacy key system on the element, once. Throws when this realm cannot. */
function installKeys(mediaElement: WebKitEncryptedMediaElement): void {
  if (mediaElement.webkitKeys) return;

  const Constructor = (globalThis as { WebKitMediaKeys?: WebKitMediaKeysConstructor }).WebKitMediaKeys;
  if (!Constructor) throw new Error('WebKitMediaKeys is unavailable');

  mediaElement.webkitSetMediaKeys(new Constructor(FAIRPLAY_LEGACY_KEY_SYSTEM));
}

/**
 * Open one legacy session for a `webkitneedkey` payload and drive it for its lifetime: exchange its license on every
 * `webkitkeymessage` through the same fetch and transform layers as the EME path, and report what the CDM rejects. The
 * session closes when `signal` aborts, which also releases the element's legacy keys.
 *
 * `certificate` is required: the legacy API packs it into the session's initialization data, so unlike EME there is no
 * going without one.
 */
export function openLegacyLicenseSession({
  mediaElement,
  module: module_,
  entry,
  licenseUrl,
  certificate,
  initData,
  signal,
  report,
}: {
  mediaElement: HTMLMediaElement;
  module: KeySystemModule | undefined;
  entry: DrmSystemConfig;
  licenseUrl: string;
  certificate: Uint8Array<ArrayBuffer>;
  initData: ArrayBuffer;
  signal: AbortSignal;
  report: ReportDrmCondition;
}): void {
  const element = mediaElement as WebKitEncryptedMediaElement;

  installKeys(element);

  // The provider decides what part of its own `skd://` URI names the asset;
  // the CDM seals that into the SPC, so this is the last point it can be set.
  const keyUri = keyUriFromInitData(initData);
  const contentId = (entry.fairPlayContentId ?? defaultFairPlayContentId)(keyUri);

  // `webkitKeys` is set by `installKeys`, or it threw.
  const session = element.webkitKeys!.createSession(
    FAIRPLAY_CONTENT_TYPE,
    packInitData(initData, contentId, certificate)
  );

  const exchange = async (message: BufferSource) => {
    let license: Uint8Array<ArrayBuffer>;

    try {
      license = await fetchLicense(module_, entry, licenseUrl, message, signal);
    } catch (error) {
      if (signal.aborted) return;

      report({
        code: SVTA_BAD_LICENSE_REQUEST,
        data: { keySystem: FAIRPLAY_LEGACY_KEY_SYSTEM, reason: String(error) },
      });
      return;
    }

    if (signal.aborted) return;

    try {
      const unwrapped = await unwrapLicense(module_, entry, license);

      if (signal.aborted) return;

      // Synchronous, unlike EME's `MediaKeySession.update`.
      session.update(unwrapped);
    } catch (error) {
      if (signal.aborted) return;

      report({
        code: SVTA_DRM_LICENSE_RESPONSE_REJECTED,
        data: { keySystem: FAIRPLAY_LEGACY_KEY_SYSTEM, reason: String(error) },
      });
    }
  };

  // Whether the CDM ever asked for a license. It separates the two ways this
  // session fails: rejecting the initialization data outright — a malformed
  // content id or certificate — from accepting it and then rejecting the
  // license that came back. Without it `webkitkeyerror` says only "something".
  let requested = false;

  listen(
    session,
    'webkitkeymessage',
    (event) => {
      requested = true;
      void exchange((event as Event & { message: ArrayBuffer }).message);
    },
    { signal }
  );
  listen(
    session,
    'webkitkeyerror',
    () =>
      report({
        code: SVTA_DRM_SESSION_ERROR,
        data: {
          keySystem: FAIRPLAY_LEGACY_KEY_SYSTEM,
          // Read field by field: `WebKitMediaKeyError` carries these on its
          // prototype, so serializing the object yields `{}` and loses the
          // only part worth reporting. `systemCode` is the underlying
          // OSStatus, which is what actually identifies a FairPlay failure.
          errorCode: session.error?.code,
          systemCode: session.error?.systemCode,
          licenseRequested: requested,
        },
      }),
    { signal }
  );

  signal.addEventListener(
    'abort',
    () => {
      // Throws when the session is already closed.
      try {
        session.close();
      } catch {}

      try {
        element.webkitSetMediaKeys(null);
      } catch {}
    },
    { once: true }
  );
}

/**
 * Repack `webkitneedkey` initialization data into what `WebKitMediaKeys.createSession()` expects.
 *
 * In: the raw event data — a `skd://` URI as UTF-16LE, in newer WebKit builds behind a 4-byte little-endian byte count
 * — plus the content id its provider derives from that URI. Out: that data verbatim, then the content ID and the
 * application certificate, each behind their own 4-byte little-endian byte count.
 */
export function packInitData(
  initData: ArrayBuffer,
  contentIdText: string,
  certificate: Uint8Array<ArrayBuffer>
): Uint8Array<ArrayBuffer> {
  const source = new Uint8Array(initData);
  const contentId = toUtf16LE(contentIdText);

  const packed = new Uint8Array(source.byteLength + 4 + contentId.byteLength + 4 + certificate.byteLength);
  const view = new DataView(packed.buffer);
  let offset = 0;

  const append = (bytes: Uint8Array) => {
    packed.set(bytes, offset);
    offset += bytes.byteLength;
  };

  const appendWithLength = (bytes: Uint8Array) => {
    view.setUint32(offset, bytes.byteLength, true);
    offset += 4;
    append(bytes);
  };

  append(source);
  appendWithLength(contentId);
  appendWithLength(certificate);

  return packed;
}

/**
 * The `skd://` URI out of `webkitneedkey`'s initialization data, whole — scheme included, so a provider's resolver sees
 * exactly what its manifest declared. Locating the scheme rather than skipping a fixed prefix covers both the bare URI
 * older WebKit sends and the length-prefixed form newer builds do.
 */
export function keyUriFromInitData(initData: ArrayBuffer): string {
  const decoded = new TextDecoder('utf-16le').decode(initData);
  const start = decoded.indexOf('skd://');

  return start === -1 ? decoded : decoded.slice(start);
}

function toUtf16LE(value: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(value.length * 2);
  const view = new DataView(bytes.buffer);

  for (let i = 0; i < value.length; i++) view.setUint16(i * 2, value.charCodeAt(i), true);

  return bytes;
}
