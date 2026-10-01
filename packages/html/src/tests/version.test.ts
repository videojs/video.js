import { describe, expect, it } from 'vite-plus/test';

import packageJson from '../../package.json' with { type: 'json' };
import { VERSION } from '../version';

describe('VERSION', () => {
  it('reports the published package version', () => {
    expect(VERSION).toBe(packageJson.version);
  });

  it('never falls back when the build-time replacement is applied', () => {
    expect(VERSION).not.toBe('UNKNOWN');
  });
});
