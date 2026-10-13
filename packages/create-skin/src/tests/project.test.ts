import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { parseFlags, resolveDefaults } from '../options';
import { createProject } from '../project';

const registry = resolve(import.meta.dirname, 'fixtures/registry');

function options(...argv: string[]) {
  return resolveDefaults(
    parseFlags(['my-skin', '--name', 'My Skin', '--registry', registry, '--package-manager', 'pnpm', ...argv])
  );
}

describe('createProject', () => {
  it('keeps the skin alone in src and its preview in apps/preview', async () => {
    const { files, skinDirectory } = await createProject(options(), 'my-skin');
    const skinFiles = [...files.keys()].filter((path) => path.startsWith('src/'));

    expect(skinDirectory).toBe('src/video');
    expect(skinFiles.sort()).toEqual([
      'src/lib/resolve-class-name.ts',
      'src/skin.css',
      'src/styles/theme.css',
      'src/video/skin.tsx',
    ]);
    expect(files.has('apps/preview/src/main.tsx')).toBe(true);
    expect(files.get('apps/preview/src/player.tsx')).toContain("from '@/video/skin'");
    expect(files.get('apps/preview/src/player.tsx')).toContain('<MuxVideo src={SRC}');
    expect(files.get('apps/preview/src/player.tsx')).toContain("'./cosmic-dawn-chapters.vtt'");
    expect(files.has('apps/preview/public/cosmic-dawn-chapters.vtt')).toBe(true);
    expect(files.get('src/skin.css')).toContain('@theme inline');
    expect(files.get('apps/preview/index.html')).toContain('/src/main.tsx');
    expect(files.get('vite.config.ts')).toContain("root: path('./apps/preview')");
    expect(files.has('.gitignore')).toBe(true);
    expect(files.has('tsconfig.json')).toBe(true);

    const manifest = JSON.parse(files.get('package.json')!);

    expect(manifest.dependencies).toMatchObject({
      '@videojs/mux-video': '10.1.0',
      '@videojs/react': '10.1.0',
      react: expect.any(String),
    });
    expect(manifest.devDependencies).toHaveProperty('tailwindcss');
    expect(JSON.parse(files.get('skin.json')!)).toMatchObject({ base: 'scaffold', videojs: '10.1.0' });
  });

  it('mounts an HTML skin template in the preset player', async () => {
    const { files } = await createProject(options('--framework', 'html'), 'my-skin');
    const player = files.get('apps/preview/src/player.ts')!;

    expect(player).toContain("import '@videojs/html/video/player';");
    expect(player).toContain("skin.html?raw'");
    expect(files.has('apps/preview/src/main.tsx')).toBe(false);
    expect(files.get('apps/preview/index.html')).toContain('/src/main.ts"');

    const manifest = JSON.parse(files.get('package.json')!);

    expect(manifest.dependencies).not.toHaveProperty('@videojs/react');
    expect(manifest.dependencies).not.toHaveProperty('react');
    expect(manifest.devDependencies).not.toHaveProperty('tailwindcss');
  });

  it('pins local packages for both npm and pnpm', async () => {
    const { files } = await createProject(options('--override', '@videojs/react=file:/tmp/react.tgz'), 'my-skin');

    expect(JSON.parse(files.get('package.json')!)).toMatchObject({
      dependencies: { '@videojs/react': 'file:/tmp/react.tgz' },
      overrides: { '@videojs/react': 'file:/tmp/react.tgz' },
    });
    expect(files.get('pnpm-workspace.yaml')).toContain("'@videojs/react': 'file:/tmp/react.tgz'");
  });
});
