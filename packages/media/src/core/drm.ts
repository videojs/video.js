/**
 * EME key system identifiers. The value is what a CDM is asked for, and what `source.drm` — and each engine's own DRM
 * configuration — is keyed by.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMediaKeySystemAccess
 */
export const KeySystems = {
  FAIRPLAY: 'com.apple.fps',
  WIDEVINE: 'com.widevine.alpha',
  PLAYREADY: 'com.microsoft.playready',
  CLEARKEY: 'org.w3.clearkey',
} as const;

export type KeySystem = (typeof KeySystems)[keyof typeof KeySystems];

/** Where one key system's licenses come from. */
export interface DrmSystemConfig {
  /** License server the CDM's license request is POSTed to. */
  licenseUrl: string;
  /**
   * URL of the DRM server (application) certificate. FairPlay needs one unless its CDM is pre-provisioned; Widevine and
   * PlayReady ignore it.
   */
  serverCertificateUrl?: string | undefined;
}

/**
 * License servers keyed by EME key system id — the shape of `source.drm`.
 *
 * Which key system is negotiated is the browser's choice, and each playback path reads the key systems it can reach.
 * hls.js's own `drmSystems` takes the same shape.
 */
export type DrmSystemsConfig = Partial<Record<KeySystem, DrmSystemConfig>>;
