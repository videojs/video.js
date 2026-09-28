import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { isPlainObject } from '@videojs/utils/predicate';
import { type RegistryItem, registryItemSchema } from 'shadcn/schema';
import { describe, expect, it } from 'vite-plus/test';

const packageDir = resolve(import.meta.dirname, '../../..');
const registryDirs = {
  default: resolve(packageDir, 'dist/registry/source/r/react'),
  minimal: resolve(packageDir, 'dist/registry/source/r/react/minimal'),
} as const;
const cssRegistryDirs = {
  default: resolve(packageDir, 'dist/registry/source/r/react/css'),
  minimal: resolve(packageDir, 'dist/registry/source/r/react/css/minimal'),
} as const;

describe('React registry output', () => {
  const registries = {
    default: readRegistryItems(registryDirs.default),
    minimal: readRegistryItems(registryDirs.minimal),
  } as const;

  it('keeps the Video Skin installation notes concise', () => {
    for (const items of Object.values(registries)) {
      const docs = [...itemClosure(items, 'video')].map((name) => items.get(name)?.docs ?? '').join('\n');

      expect(docs.length).toBeLessThanOrEqual(3_800);
      expect(docs.split('\n').length).toBeLessThanOrEqual(60);
    }
  });

  it('marks every public module root as a client entry', () => {
    for (const theme of ['default', 'minimal'] as const) {
      const items = registries[theme];
      const missing = [...items.values()]
        .filter((item) => item.meta?.public)
        .filter((item) => !readItemRoot(registryDirs[theme], item).includes("'use client';"))
        .map((item) => item.name);

      expect(missing).toEqual([]);
    }
  });

  it('keeps project utilities, component styles, and skin-owned modules in stable boundaries', () => {
    const defaultItems = registries.default;
    const minimalItems = registries.minimal;
    const helper = defaultItems.get('_resolve-class-name');
    const defaultPlayButton = readItemRoot(registryDirs.default, defaultItems.get('play-button')!);
    const minimalPlayButton = readItemRoot(registryDirs.minimal, minimalItems.get('play-button')!);
    const defaultButton = readItemRoot(registryDirs.default, defaultItems.get('button')!);
    const minimalButton = readItemRoot(registryDirs.minimal, minimalItems.get('button')!);
    const defaultSkin = readItemRoot(registryDirs.default, defaultItems.get('video')!);
    const minimalSkin = readItemRoot(registryDirs.minimal, minimalItems.get('video')!);
    const defaultTargets = defaultItems.get('video')?.files?.map((file) => file.target) ?? [];
    const minimalTargets = minimalItems.get('video')?.files?.map((file) => file.target) ?? [];
    const defaultStyleTargets = [
      '@components/videojs/styles/audio/base.css',
      '@components/videojs/styles/audio/theme.css',
      '@components/videojs/styles/base.css',
      '@components/videojs/styles/themes/preferences.css',
      '@components/videojs/styles/themes/theme.css',
      '@components/videojs/styles/video/base.css',
      '@components/videojs/styles/video/captions.css',
      '@components/videojs/styles/video/theme.css',
    ];
    const minimalStyleTargets = [
      '@components/videojs/styles/audio/base.css',
      '@components/videojs/styles/audio/minimal.css',
      '@components/videojs/styles/audio/theme.css',
      '@components/videojs/styles/base.css',
      '@components/videojs/styles/themes/minimal.css',
      '@components/videojs/styles/themes/preferences.css',
      '@components/videojs/styles/themes/theme.css',
      '@components/videojs/styles/video/base.css',
      '@components/videojs/styles/video/captions.css',
      '@components/videojs/styles/video/minimal.css',
      '@components/videojs/styles/video/theme.css',
    ];
    const minimalComponentStyleTargets = minimalStyleTargets.filter(
      (style) => !style.endsWith('/audio/minimal.css') && !style.endsWith('/video/minimal.css')
    );
    const minimalAudioStyleTargets = [
      ...minimalComponentStyleTargets,
      '@components/videojs/styles/audio/minimal.css',
    ].sort();
    const minimalVideoStyleTargets = [
      ...minimalComponentStyleTargets,
      '@components/videojs/styles/video/minimal.css',
    ].sort();

    expect(helper?.files?.map((file) => file.target)).toEqual(['@lib/resolve-class-name.ts']);
    expect(defaultPlayButton).toContain(`import { resolveClassName } from '@/lib/resolve-class-name';`);
    expect(defaultPlayButton).toContain(`import { cn } from '@/lib/utils';`);
    expect(defaultPlayButton).not.toContain(`{ cn, resolveClassName }`);
    expect(styleImports(defaultPlayButton)).toEqual([
      '../styles/base.css',
      '../styles/audio/theme.css',
      '../styles/video/captions.css',
      '../styles/video/theme.css',
    ]);
    expect(styleImports(minimalPlayButton)).toEqual([
      '../styles/themes/minimal.css',
      '../styles/base.css',
      '../styles/audio/theme.css',
      '../styles/video/captions.css',
      '../styles/video/theme.css',
    ]);
    expect(defaultPlayButton).toContain(`from '@videojs/react/icons';`);
    expect(defaultPlayButton).not.toContain(`@videojs/react/icons/minimal`);
    expect(minimalPlayButton).toContain(`from '@videojs/react/icons/minimal';`);
    expect(defaultButton).not.toContain('corner-shape:squircle');
    expect(minimalButton).toContain('corner-shape:squircle');
    expect(defaultSkin).toContain(`import '../styles/video/base.css';`);
    expect(defaultSkin).toContain('export function VideoSkin');
    expect(defaultSkin).toContain('data-theme="default"');
    expect(minimalSkin).toContain(`import '../styles/video/minimal.css';`);
    expect(minimalSkin).toContain('export function VideoSkin');
    expect(minimalSkin).toContain('data-theme="minimal"');
    expect(defaultTargets).toEqual(minimalTargets);
    expect(defaultTargets).toContain('@components/videojs/video/skin.tsx');
    expect(defaultTargets).toContain('@components/videojs/video/behaviors/hotkeys.tsx');
    expect(defaultTargets).toContain('@components/videojs/video/display/status-indicators.tsx');
    expect(defaultTargets).toContain('@components/videojs/video/layout/controls.tsx');
    expect(defaultTargets).toContain('@components/videojs/video/menus/settings-menu.tsx');
    expect(defaultTargets.some((target) => target?.includes('/skins/') === true)).toBe(false);
    expect(defaultTargets.some((target) => target?.includes('/components/') === true)).toBe(false);
    expect(styleTargets(defaultItems, 'play-button')).toEqual(defaultStyleTargets);
    expect(styleTargets(minimalItems, 'play-button')).toEqual(minimalComponentStyleTargets);
    expect(styleTargets(defaultItems, 'video')).toEqual(defaultStyleTargets);
    expect(styleTargets(minimalItems, 'video')).toEqual(minimalVideoStyleTargets);
    expect(styleTargets(defaultItems, 'audio')).toEqual(defaultStyleTargets);
    expect(styleTargets(minimalItems, 'audio')).toEqual(minimalAudioStyleTargets);
  });

  it('publishes the same public names from each theme catalog', () => {
    const publicNames = (items: ReadonlyMap<string, RegistryItem>) =>
      [...items.values()]
        .filter((item) => item.meta?.public)
        .map((item) => item.name)
        .sort();

    expect(publicNames(registries.minimal)).toEqual(publicNames(registries.default));
    expect(publicNames(registries.default)).toContain('video');
    expect(publicNames(registries.default)).not.toContain('video-minimal');
    expect([...registries.default.keys()].some((name) => name.endsWith('-minimal'))).toBe(false);
  });

  it('publishes component categories that match the UI taxonomy', () => {
    for (const items of Object.values(registries)) {
      expect(items.get('buffering-indicator')?.categories).toEqual(['media', 'display']);
      expect(items.get('error-dialog')?.categories).toEqual(['media', 'dialogs']);
      expect(items.get('poster')?.categories).toEqual(['media', 'display']);
      expect(items.get('status-announcer')?.categories).toEqual(['media', 'behaviors']);
      expect(items.get('title')?.categories).toEqual(['media', 'display']);
      expect(items.get('volume-popover')?.categories).toEqual(['media', 'menus']);
      expect(items.get('container')?.categories).toEqual(['media', 'layout']);
    }
  });

  it('publishes title styles in the shared display stylesheet', () => {
    for (const registryDir of Object.values(cssRegistryDirs)) {
      const items = readRegistryItems(registryDir);

      expect(items.get('title')?.registryDependencies).toContain('@videojs/_style-display');
      expect(items.get('_style-display')?.files?.map((file) => file.target)).toEqual([
        '@components/videojs/styles/display.css',
      ]);
      expect(items.has('_style-title')).toBe(false);
    }
  });

  it('links registry metadata to published framework routes', () => {
    for (const items of Object.values(registries)) {
      for (const item of items.values()) {
        expect(item.docs ?? '').not.toMatch(/videojs\.org\/docs\/(?:concepts|how-to|reference)\//);
      }

      expect(items.get('container')?.docs).toContain('/docs/framework/react/reference/player-container/');
      expect(items.get('button')?.docs).toContain('/docs/framework/react/how-to/customize-skins/');
      expect(items.get('_style-theme')?.docs).toContain(`data-theme="${items.get('_style-theme')?.meta?.theme}"`);
      expect(items.get('video')?.docs).toContain('/docs/framework/react/concepts/media-sources/');
    }
  });

  it('imports the preset theme before each React CSS skin stylesheet', () => {
    for (const theme of ['default', 'minimal'] as const) {
      const items = readRegistryItems(cssRegistryDirs[theme]);

      for (const preset of ['audio', 'live-audio', 'live-video', 'video'] as const) {
        const source = readItemRoot(cssRegistryDirs[theme], items.get(preset)!);
        const media = preset.endsWith('audio') ? 'audio' : 'video';
        const base = `../styles/${media}/${theme === 'minimal' ? 'minimal' : 'base'}.css`;

        expect(source.indexOf(base), `${theme}/${preset}`).toBeGreaterThanOrEqual(0);
        expect(source.indexOf(base), `${theme}/${preset}`).toBeLessThan(source.indexOf('./skin.css'));
      }
    }
  });

  it('composes Minimal media styles from theme and preset entries', () => {
    for (const media of ['audio', 'video'] as const) {
      const source = readFileSync(
        resolve(cssRegistryDirs.minimal, `support/files/_style-${media}-minimal/styles/${media}/minimal.css`),
        'utf8'
      );

      expect(cssImports(source).sort()).toEqual(['../themes/minimal.css', './base.css'].sort());
    }
  });

  it('preserves utility groups as readable generated class-name arguments', () => {
    const files = Object.values(registryDirs).flatMap((registryDir) =>
      readdirSync(registryDir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
        .map((entry) => resolve(entry.parentPath, entry.name))
    );
    const longest = Math.max(
      ...files.flatMap((file) =>
        readFileSync(file, 'utf8')
          .split('\n')
          .map((line) => line.length)
      )
    );

    expect(longest).toBeLessThanOrEqual(300);

    for (const theme of ['default', 'minimal'] as const) {
      const items = registries[theme];
      const registryDir = registryDirs[theme];

      expect(readItemRoot(registryDir, items.get('slider')!)).toContain("'group-data-dragging/slider:scale-90',");
      expect(readItemRoot(registryDir, items.get('captions-menu')!)).toContain(
        "'not-data-submenu:data-child-open:-translate-x-full',"
      );
    }
  });
});

function readRegistryItems(registryDir: string): ReadonlyMap<string, RegistryItem> {
  const items = new Map<string, RegistryItem>();

  for (const group of ['skins', 'ui', 'support']) {
    const registry: unknown = JSON.parse(readFileSync(resolve(registryDir, group, 'registry.json'), 'utf8'));
    if (!isPlainObject(registry) || !Array.isArray(registry.items)) throw new Error(`Invalid ${group} registry.`);

    for (const item of registry.items) {
      const parsed = registryItemSchema.parse(item);

      items.set(parsed.name, parsed);
    }
  }

  return items;
}

function styleImports(source: string): string[] {
  return [...source.matchAll(/^import '([^']+\.css)';$/gm)].map((match) => match[1]!);
}

function cssImports(source: string): string[] {
  return [...source.matchAll(/^@import "([^"]+\.css)";$/gm)].map((match) => match[1]!);
}

function itemClosure(items: ReadonlyMap<string, RegistryItem>, root: string): ReadonlySet<string> {
  const names = new Set<string>();
  const pending = [root];

  while (pending.length > 0) {
    const name = pending.pop();
    if (!name || names.has(name)) continue;

    const item = items.get(name);
    if (!item) throw new Error(`Missing registry dependency ${name}.`);

    names.add(name);

    for (const dependency of item.registryDependencies ?? []) {
      const match = /^@videojs\/(.+)$/.exec(dependency);

      if (match?.[1]) pending.push(match[1]);
    }
  }

  return names;
}

function styleTargets(items: ReadonlyMap<string, RegistryItem>, root: string): string[] {
  const targets = new Set<string>();

  for (const name of itemClosure(items, root)) {
    for (const file of items.get(name)?.files ?? []) {
      if (file.target?.includes('/styles/') && file.target.endsWith('.css')) targets.add(file.target);
    }
  }

  return [...targets].sort();
}

function readItemRoot(registryDir: string, item: RegistryItem): string {
  const prefix = `files/${item.name}/`;
  const file = item.files?.find(
    (candidate) =>
      candidate.path?.startsWith(prefix) &&
      (candidate.path.endsWith('/skin.tsx') || candidate.path.endsWith(`/${item.name}.tsx`))
  );
  if (!file?.path) throw new Error(`Registry item ${item.name} has no root file.`);

  for (const group of ['skins', 'ui', 'support']) {
    const path = resolve(registryDir, group, file.path);

    try {
      return readFileSync(path, 'utf8');
    } catch {
      continue;
    }
  }

  throw new Error(`Could not read the root file for registry item ${item.name}.`);
}
