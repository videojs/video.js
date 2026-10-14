import { describe, expect, it } from 'vite-plus/test';

import { VERSIONS } from '../versions';

describe('VERSIONS', () => {
  it('writes only ranges npm can install, never workspace or catalog specifiers', () => {
    for (const [name, version] of Object.entries(VERSIONS)) {
      expect(version, name).toMatch(/^\^?\d+\.\d+\.\d+/);
    }
  });
});
