/**
 * Every Video.js 8 pattern the `video.js` package rejects with a coded error, in the order the docs list them.
 *
 * Each code is a string that exists nowhere else, so a search for it can only land on its API reference page. Adding a
 * code here without a matching `LEGACY_ERRORS` entry is a type error, which keeps the registry complete.
 *
 * This module carries no message text, so the production stubs can import it without shipping the registry.
 *
 * @internal
 */
export const LEGACY_ERROR_CODES = [
  /** `videojs('id')` / `videojs(el, options)` — the v8 factory. */
  'VJS8_LEGACY_INIT',
  /** `videojs.registerPlugin` / `videojs.getPlugin`. */
  'VJS8_LEGACY_PLUGIN',
  /** `videojs.registerComponent` / `videojs.getComponent`. */
  'VJS8_LEGACY_COMPONENT',
  /** `videojs.getPlayer(id)`. */
  'VJS8_LEGACY_GET_PLAYER',
  /** `videojs.options`. */
  'VJS8_LEGACY_OPTIONS',
] as const;

/** @internal */
export type LegacyErrorCode = (typeof LEGACY_ERROR_CODES)[number];

/** @internal */
export const LEGACY_ERROR_DOCS_URL = 'https://videojs.org/docs/reference/api/';

/** @internal */
export function isLegacyErrorCode(value: unknown): value is LegacyErrorCode {
  return (LEGACY_ERROR_CODES as readonly unknown[]).includes(value);
}

/**
 * The docs slug for a code: `VJS8_LEGACY_INIT` → `vjs8-legacy-init`.
 *
 * @internal
 */
export function getLegacyErrorSlug(code: LegacyErrorCode): string {
  return code.toLowerCase().replaceAll('_', '-');
}

/** @internal */
export function getLegacyErrorUrl(code: LegacyErrorCode): string {
  return `${LEGACY_ERROR_DOCS_URL}${getLegacyErrorSlug(code)}`;
}
