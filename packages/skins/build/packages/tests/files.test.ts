import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { syncGeneratedFiles } from '../files.ts';

const packageDir = resolve(import.meta.dirname, '../../..');

describe('syncGeneratedFiles', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });

    root = undefined;
  });

  it('removes stale files matched by an owned glob and leaves unmatched files alone', async () => {
    root = await mkdtemp(resolve(packageDir, 'node_modules/skins-sync-'));
    await mkdir(resolve(root, 'presets/video'), { recursive: true });
    await writeFile(resolve(root, 'presets/video/retired-skin.tsx'), 'stale');
    await writeFile(resolve(root, 'presets/video/index.ts'), 'authored');

    const files = [{ path: 'presets/video/skin.tsx', content: 'generated' }];
    const owned = ['presets/*/*skin.tsx'];

    expect(await syncGeneratedFiles(root, files, owned)).toBe(2);
    expect(existsSync(resolve(root, 'presets/video/retired-skin.tsx'))).toBe(false);
    expect(readFileSync(resolve(root, 'presets/video/skin.tsx'), 'utf8')).toBe('generated');
    expect(readFileSync(resolve(root, 'presets/video/index.ts'), 'utf8')).toBe('authored');

    // A glob match that is still generated stays in place rather than being deleted and rewritten.
    expect(await syncGeneratedFiles(root, files, owned)).toBe(0);
  });
});
