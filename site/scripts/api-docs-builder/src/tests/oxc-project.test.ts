import * as path from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { OxcProject } from '../oxc-project';

const FIXTURE_ROOT = path.join(import.meta.dirname, 'fixtures/monorepo');

describe('OxcProject', () => {
  it('resolves a package subpath to source under src/playback', () => {
    const project = new OxcProject(FIXTURE_ROOT);
    const fromFile = path.join(FIXTURE_ROOT, 'packages/html/src/index.ts');

    expect(project.resolveModule(fromFile, '@videojs/spf/adapters/hls-video')).toBe(
      path.join(FIXTURE_ROOT, 'packages/spf/src/playback/adapters/hls-video/index.ts')
    );
  });
});
