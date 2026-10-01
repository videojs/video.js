const readVersion = (): string => {
  try {
    return __PLAYER_VERSION__;
  } catch {}

  return 'UNKNOWN';
};

/**
 * Version of the `@videojs/core` build in use, matching the package's published version — for example `'10.0.0-rc.4'`.
 * The string is replaced at build time, so it identifies the exact published build rather than the version range a
 * consumer installed, which makes it useful for bug reports, diagnostics, and analytics.
 *
 * Falls back to `'UNKNOWN'` when the source is consumed without the build-time replacement applied.
 *
 * @example
 *   Core package
 *   ```ts
 *   import { VERSION } from '@videojs/core';
 *
 *   console.log(VERSION); // '10.0.0-rc.4'
 *   ```
 *
 * @internal
 */
export const VERSION: string = readVersion();
