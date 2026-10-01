import { type DrmSystemConfig, MediaError } from '@videojs/media';

/** Key system identifier the legacy `WebKitMediaKeys` API answers to. */
export const FAIRPLAY_LEGACY_KEY_SYSTEM = 'com.apple.fps.1_0';

/** Initialization data type Safari reports for an `EXT-X-KEY` `skd://` URI. */
export const FAIRPLAY_INIT_DATA_TYPE = 'skd';

/** What FairPlay negotiates capabilities against — the manifest, not a codec. */
export const FAIRPLAY_CONTENT_TYPE = 'application/vnd.apple.mpegurl';

/**
 * `context` values carried by the `MediaError`s key exchange produces. The message is prose meant for a person; this is
 * the part to branch on.
 *
 * @internal
 */
export const NativeHlsDrmErrors = {
  /** The content is encrypted but `source.engine.nativeHls.drmSystems` is missing something required. */
  MISSING_CONFIGURATION: 'drmMissingConfiguration',
  /** No FairPlay CDM here, or it refused the requested configuration. */
  UNSUPPORTED_KEY_SYSTEM: 'drmUnsupportedKeySystem',
  /** The application certificate could not be fetched. */
  CERTIFICATE_REQUEST_FAILED: 'drmCertificateRequestFailed',
  /** The CDM rejected the application certificate. */
  SERVER_CERTIFICATE_FAILED: 'drmServerCertificateFailed',
  /** The CDM could not produce a license request (SPC). */
  GENERATE_REQUEST_FAILED: 'drmGenerateRequestFailed',
  /** The license server could not be reached, or answered with an error. */
  LICENSE_REQUEST_FAILED: 'drmLicenseRequestFailed',
  /** The CDM rejected the license (CKC). */
  UPDATE_LICENSE_FAILED: 'drmUpdateLicenseFailed',
  /** The CDM failed internally and cannot decrypt. */
  CDM_ERROR: 'drmCdmError',
  /** Non-fatal: this output is not secure enough for full-quality rendering. */
  OUTPUT_RESTRICTED: 'drmOutputRestricted',
} as const;

/** @internal */
export type NativeHlsDrmErrorContext = (typeof NativeHlsDrmErrors)[keyof typeof NativeHlsDrmErrors];

export const NativeHlsDrmMessages = {
  MISSING_CONFIGURATION: 'This media is DRM-protected, but no DRM license server was configured for it.',
  MISSING_CERTIFICATE_URL: 'This media is DRM-protected, but no DRM application certificate was configured for it.',
  UNSUPPORTED_KEY_SYSTEM:
    'This browser cannot play DRM-protected content with its current security configuration. Try another browser.',
  CERTIFICATE_REQUEST_FAILED: 'The DRM application certificate could not be loaded.',
  SERVER_CERTIFICATE_FAILED: 'The DRM application certificate was rejected. It may no longer be valid.',
  GENERATE_REQUEST_FAILED: 'A DRM license could not be requested for this media.',
  LICENSE_REQUEST_FAILED: 'The DRM license could not be loaded.',
  UPDATE_LICENSE_FAILED: 'The DRM license was rejected for this media.',
  CDM_ERROR:
    'The DRM Content Decryption Module failed. Try reloading the page, updating your browser, or another browser.',
  OUTPUT_RESTRICTED: 'This output is not secure enough for DRM playback. The video may render as a black screen.',
} as const;

/**
 * One FairPlay implementation, driven by the DRM mixin: it hands over each key request the media element makes and
 * closes everything down between sources.
 */
export interface FairPlayKeySystem {
  /** Serve a single key request (`encrypted` or `webkitneedkey`). */
  request(event: MediaEncryptedEvent): Promise<void>;
  /** Close every open session and release the element's media keys. */
  close(): Promise<void>;
}

/** Everything a FairPlay implementation is given to work with. */
export interface FairPlayContext {
  /** The element the CDM is bound to. */
  media: HTMLMediaElement;
  /**
   * The FairPlay entry of the source's DRM configuration, read on every use rather than captured — a license server
   * updated on a playing source (a rotated token, say) has to reach the next request.
   */
  readonly config: DrmSystemConfig;
  /** Aborted when the source is replaced or the media detaches. */
  signal: AbortSignal;
  /** Surface an error on the media adapter. Non-fatal ones are announced only. */
  reportError(error: MediaError): void;
}

/** Build an encrypted-media `MediaError` tagged with a {@link NativeHlsDrmErrors} context. */
export function createDrmError(message: string, context: NativeHlsDrmErrorContext, fatal = true): MediaError {
  return new MediaError(message, MediaError.MEDIA_ERR_ENCRYPTED, fatal, context);
}

/**
 * Coerce anything thrown during key exchange into a reportable error. An error raised further down already describes
 * what failed, so it passes through rather than being flattened into the caller's more general message.
 */
export function toDrmError(cause: unknown, message: string, context: NativeHlsDrmErrorContext): MediaError {
  if (cause instanceof MediaError) return cause;

  const error = createDrmError(message, context);

  error.data = cause;
  return error;
}

/**
 * Fetch the FairPlay application certificate. Resolves `null` when the source names no certificate URL — EME can still
 * negotiate with a pre-provisioned CDM, so whether that is fatal is the caller's call.
 */
export async function requestAppCertificate({ config, signal }: FairPlayContext): Promise<ArrayBuffer | null> {
  const { serverCertificateUrl } = config;
  if (!serverCertificateUrl) return null;

  const response = await fetch(serverCertificateUrl, { signal }).catch((cause) => {
    throw toDrmError(
      cause,
      NativeHlsDrmMessages.CERTIFICATE_REQUEST_FAILED,
      NativeHlsDrmErrors.CERTIFICATE_REQUEST_FAILED
    );
  });

  if (!response.ok) {
    throw createDrmError(
      NativeHlsDrmMessages.CERTIFICATE_REQUEST_FAILED,
      NativeHlsDrmErrors.CERTIFICATE_REQUEST_FAILED
    );
  }

  return response.arrayBuffer();
}

/**
 * Exchange a server playback context (SPC) for a content key context (CKC). FairPlay license servers take the raw SPC
 * bytes as the request body.
 */
export async function requestLicenseKey(
  { config, signal }: FairPlayContext,
  spc: BufferSource
): Promise<Uint8Array<ArrayBuffer>> {
  const response = await fetch(config.licenseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: spc,
    signal,
  }).catch((cause) => {
    throw toDrmError(cause, NativeHlsDrmMessages.LICENSE_REQUEST_FAILED, NativeHlsDrmErrors.LICENSE_REQUEST_FAILED);
  });

  if (!response.ok) {
    throw createDrmError(NativeHlsDrmMessages.LICENSE_REQUEST_FAILED, NativeHlsDrmErrors.LICENSE_REQUEST_FAILED);
  }

  return new Uint8Array(await response.arrayBuffer());
}
