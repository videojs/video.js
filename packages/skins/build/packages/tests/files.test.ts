import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { syncGeneratedFiles } from '../files.ts';

describe('syncGeneratedFiles', () => {
  it('writes changed files and removes stale files from owned paths', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'videojs-generated-'));

    mkdirSync(join(workspace, 'out/nested'), { recursive: true });
    writeFileSync(join(workspace, 'out/kept.ts'), 'kept');
    writeFileSync(join(workspace, 'out/nested/stale.ts'), 'stale');
    writeFileSync(join(workspace, 'single.css'), 'old');

    const changed = await syncGeneratedFiles(
      workspace,
      [
        { path: 'out/kept.ts', content: 'kept' },
        { path: 'out/new.ts', content: 'new' },
        { path: 'single.css', content: 'new' },
      ],
      ['out', 'single.css']
    );

    expect(changed).toBe(3);
    expect(existsSync(join(workspace, 'out/nested/stale.ts'))).toBe(false);
    expect(readFileSync(join(workspace, 'out/new.ts'), 'utf8')).toBe('new');
    expect(readFileSync(join(workspace, 'single.css'), 'utf8')).toBe('new');
  });

  it('refuses to write outside the owned paths', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'videojs-generated-'));

    await expect(syncGeneratedFiles(workspace, [{ path: 'elsewhere/file.ts', content: '' }], ['out'])).rejects.toThrow(
      'Generated files are outside every owned path: `elsewhere/file.ts`.'
    );
  });

  it('checks ownership on normalized paths', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'videojs-generated-'));

    await expect(
      syncGeneratedFiles(workspace, [{ path: 'out/../outside.txt', content: 'escaped' }], ['out'])
    ).rejects.toThrow('Generated files are outside every owned path: `outside.txt`.');
    expect(existsSync(join(workspace, 'outside.txt'))).toBe(false);
  });

  it('rejects paths that leave the workspace', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'videojs-generated-'));

    await expect(syncGeneratedFiles(workspace, [{ path: '/tmp/file.txt', content: '' }], ['out'])).rejects.toThrow(
      'must be relative to the workspace'
    );
    await expect(syncGeneratedFiles(workspace, [{ path: 'out/file.txt', content: '' }], ['../out'])).rejects.toThrow(
      'must be relative to the workspace'
    );
  });
});
