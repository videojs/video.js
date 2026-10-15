import { getLegacyErrorUrl, type LegacyErrorCode } from './codes';
import { LEGACY_ERRORS, LEGACY_V8_LINE } from './registry';

/**
 * Formats the message thrown for a code.
 *
 * Dev builds carry the full explanation, both v10 equivalents, and the stay-on-v8 line. Production builds carry only
 * the code and URL; with `__DEV__` compiled out, the `./registry` import above is dead and its text never ships.
 *
 * @internal
 */
export function formatLegacyError(code: LegacyErrorCode): string {
  const url = getLegacyErrorUrl(code);

  if (!__DEV__) return `${code} → ${url}`;

  const entry = LEGACY_ERRORS[code];

  return [
    `${code} — ${entry.summary}`,
    `HTML: ${entry.html}`,
    `React: ${entry.react}`,
    LEGACY_V8_LINE,
    `→ ${url}`,
  ].join('\n\n');
}

/** @internal */
export class LegacyError extends Error {
  readonly code: LegacyErrorCode;
  readonly url: string;

  constructor(code: LegacyErrorCode) {
    super(formatLegacyError(code));
    this.name = 'LegacyError';
    this.code = code;
    this.url = getLegacyErrorUrl(code);
  }
}

/** @internal */
export function isLegacyError(error: unknown): error is LegacyError {
  return error instanceof LegacyError;
}

/** @internal */
export function throwLegacyError(code: LegacyErrorCode): never {
  throw new LegacyError(code);
}
