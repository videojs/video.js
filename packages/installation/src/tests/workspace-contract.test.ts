import { existsSync, globSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { CDN_MEDIA_SUBPATHS } from '../defaults';
import { INSTALLATION_EXTENSION_DEFINITIONS } from '../extensions';
import { INSTALLATION_RENDERERS } from '../renderers';

const workspaceRoot = resolve(import.meta.dirname, '../../../..');

interface PackageManifest {
  name: string;
  private?: boolean;
  publishConfig?: { access?: string };
  peerDependencies?: Record<string, string>;
}

function readJson<T>(path: string): T {
  // SAFETY: callers provide checked-in package manifests and own the matching manifest shape.
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

const manifests = new Map(
  globSync('packages/{*,adapters/*,extensions/*}/package.json', { cwd: workspaceRoot }).map((path) => {
    const manifest = readJson<PackageManifest>(resolve(workspaceRoot, path));

    return [manifest.name, { manifest, path }] as const;
  })
);

const adapterPackages = new Set(
  Object.values(INSTALLATION_RENDERERS).flatMap(({ adapterPackage }) => (adapterPackage ? [adapterPackage] : []))
);
const extensionPackages = new Set(
  Object.values(INSTALLATION_EXTENSION_DEFINITIONS).map(({ packageName }) => packageName)
);

describe('installation workspace contract', () => {
  it('keeps CDN media support aligned with the definitions its build republishes', () => {
    const definitions = globSync('packages/html/src/define/media/**/*.ts', { cwd: workspaceRoot })
      .map((path) =>
        path
          .replace('packages/html/src/define/media/', '')
          .replace(/\/index\.ts$/, '')
          .replace(/\.ts$/, '')
      )
      .sort();

    expect([...CDN_MEDIA_SUBPATHS].sort()).toEqual(definitions);
  });

  it('references public adapter packages and facade entry points that exist', () => {
    const html = manifests.get('@videojs/html')!.manifest;
    const react = manifests.get('@videojs/react')!.manifest;

    for (const [renderer, definition] of Object.entries(INSTALLATION_RENDERERS)) {
      if (!definition.adapterPackage || !definition.mediaSubpath) continue;

      const entry = manifests.get(definition.adapterPackage);

      expect(entry, `${renderer} package`).toBeDefined();
      expect(entry?.manifest.private, definition.adapterPackage).not.toBe(true);
      expect(entry?.manifest.publishConfig?.access, definition.adapterPackage).toBe('public');
      expect(html.peerDependencies, `@videojs/html peer for ${renderer}`).toHaveProperty(definition.adapterPackage);
      expect(react.peerDependencies, `@videojs/react peer for ${renderer}`).toHaveProperty(definition.adapterPackage);
      expect(
        existsSync(resolve(workspaceRoot, `packages/html/src/media/${definition.mediaSubpath}/index.ts`)),
        `@videojs/html/media/${definition.mediaSubpath}`
      ).toBe(true);
      expect(
        existsSync(resolve(workspaceRoot, `packages/react/src/media/${definition.mediaSubpath}/index.ts`)),
        `@videojs/react/media/${definition.mediaSubpath}`
      ).toBe(true);
    }
  });

  it('keeps generated extensions available from both facades', () => {
    const html = manifests.get('@videojs/html')!.manifest;
    const react = manifests.get('@videojs/react')!.manifest;

    for (const definition of Object.values(INSTALLATION_EXTENSION_DEFINITIONS)) {
      expect(manifests.get(definition.packageName)?.manifest.publishConfig?.access).toBe('public');
      expect(html.peerDependencies).toHaveProperty(definition.packageName);
      expect(react.peerDependencies).toHaveProperty(definition.packageName);
      expect(
        existsSync(resolve(workspaceRoot, `packages/html/src/extensions/${definition.htmlSubpath}/index.ts`))
      ).toBe(true);
      expect(
        existsSync(resolve(workspaceRoot, `packages/react/src/extensions/${definition.htmlSubpath}/index.ts`))
      ).toBe(true);
    }
  });

  it('keeps AI Quickstart scoped to packages represented by installation instructions', () => {
    const required = new Set([
      '@videojs/html',
      '@videojs/react',
      '@videojs/cdn',
      ...adapterPackages,
      ...extensionPackages,
    ]);

    for (const packageName of required) {
      const entry = manifests.get(packageName);

      expect(entry, packageName).toBeDefined();

      const readme = readFileSync(resolve(workspaceRoot, dirname(entry!.path), 'README.md'), 'utf8');

      expect(readme, `${packageName} AI Quickstart`).toContain('## AI Quickstart');
      expect(readme, `${packageName} skill link`).toContain('https://github.com/videojs/skills');
      expect(readme, `${packageName} agents init command`).toContain('agents init');
    }

    for (const [packageName, entry] of manifests) {
      if (required.has(packageName) || entry.manifest.private) continue;

      const readme = readFileSync(resolve(workspaceRoot, dirname(entry.path), 'README.md'), 'utf8');

      expect(readme, `${packageName} should not advertise unrelated installation instructions`).not.toContain(
        '## AI Quickstart'
      );
    }

    const rootReadme = readFileSync(resolve(workspaceRoot, 'README.md'), 'utf8');

    expect(rootReadme).toContain('## AI Quickstart');
    expect(rootReadme).toContain('https://github.com/videojs/skills');
    expect(rootReadme).toContain('agents init');
  });
});
