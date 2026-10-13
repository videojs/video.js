import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { parseFlags, resolveDefaults } from '../options';
import { createProject } from '../project';

const registry = resolve(import.meta.dirname, 'fixtures/registry');
const templates = resolve(import.meta.dirname, '../../../templates/skin');

function options(...argv: string[]) {
  return resolveDefaults(
    parseFlags([
      'my-skin',
      '--name',
      'My Skin',
      '--registry',
      registry,
      '--templates',
      templates,
      '--package-manager',
      'pnpm',
      ...argv,
    ])
  );
}

describe('createProject', () => {
  it('keeps the skin alone in src and the Shadcn workbench in apps/preview', async () => {
    const { files, skinDirectory } = await createProject(options(), 'my-skin');
    const skinFiles = [...files.keys()].filter((path) => path.startsWith('src/'));

    expect(skinDirectory).toBe('src/video');
    expect(skinFiles.sort()).toEqual([
      'src/lib/resolve-class-name.ts',
      'src/skin.css',
      'src/styles/theme.css',
      'src/video/skin.tsx',
    ]);
    expect(files.has('apps/preview/src/shell/components/ui/sidebar.tsx')).toBe(true);
    expect(files.has('apps/preview/src/frame/main.tsx')).toBe(true);
    expect(files.get('apps/preview/src/frame/player.tsx')).toContain("from '@/video/skin'");
    expect(files.get('src/skin.css')).toContain('@theme inline');
    expect(files.get('apps/preview/preview.html')).toContain('/src/frame/main.tsx');
    expect(files.get('vite.config.ts')).toContain("root: path('./apps/preview')");
    expect(files.has('.gitignore')).toBe(true);
    expect(files.has('tsconfig.json')).toBe(true);

    const manifest = JSON.parse(files.get('package.json')!);

    expect(manifest.dependencies).toMatchObject({
      '@videojs/react': '10.1.0',
      '@base-ui/react': expect.any(String),
      react: expect.any(String),
    });
    expect(JSON.parse(files.get('skin.json')!)).toMatchObject({ base: 'scaffold', videojs: '10.1.0' });
  });

  it('mounts an HTML skin template in the preset player', async () => {
    const { files } = await createProject(options('--framework', 'html'), 'my-skin');
    const player = files.get('apps/preview/src/frame/player.ts')!;

    expect(player).toContain("import '@videojs/html/video/player';");
    expect(player).toContain("skin.html?raw'");
    expect(files.has('apps/preview/src/frame/main.tsx')).toBe(false);
    expect(files.get('apps/preview/preview.html')).toContain('/src/frame/main.ts"');
    expect(JSON.parse(files.get('package.json')!).dependencies).not.toHaveProperty('@videojs/react');
  });

  it('publishes through each host CLI with the project package manager, from relative URLs', async () => {
    const pnpm = await createProject(options(), 'my-skin');
    const npm = await createProject(options('--package-manager', 'npm'), 'my-skin');

    expect(JSON.parse(pnpm.files.get('package.json')!).scripts).toMatchObject({
      deploy: 'node apps/preview/deploy.mjs',
      'deploy:vercel': 'pnpm dlx vercel@latest build && pnpm dlx vercel@latest deploy --prebuilt',
      'deploy:netlify': 'pnpm dlx netlify-cli@latest deploy --build',
      'deploy:cloudflare': 'pnpm run build && pnpm dlx wrangler@latest pages deploy dist --project-name my-skin',
    });
    expect(JSON.parse(npm.files.get('package.json')!).scripts['deploy:vercel']).toBe(
      'npx --yes vercel@latest build && npx --yes vercel@latest deploy --prebuilt'
    );
    expect(JSON.parse(pnpm.files.get('vercel.json')!)).toMatchObject({
      buildCommand: 'pnpm run build',
      outputDirectory: 'dist',
    });
    expect(pnpm.files.get('netlify.toml')).toContain('command = "pnpm run build"');
    expect(pnpm.files.get('README.md')).toContain('pnpm run deploy');
    expect(pnpm.files.get('vite.config.ts')).toContain("base: './'");
    expect(pnpm.files.get('apps/preview/src/shell/app.tsx')).toContain('`./preview.html#');
    expect(pnpm.files.get('apps/preview/src/frame/player.tsx')).toContain("'./cosmic-dawn-chapters.vtt'");
    expect(pnpm.files.has('apps/preview/deploy.mjs')).toBe(true);
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
