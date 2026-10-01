import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { isPlainObject } from '@videojs/utils/predicate';
import { type RegistryItem, registryItemSchema } from 'shadcn/schema';
import { describe, expect, it } from 'vite-plus/test';

const packageDir = resolve(import.meta.dirname, '../../..');
const registryDirs = {
  default: resolve(packageDir, 'dist/registry/source/r/react'),
  neutral: resolve(packageDir, 'dist/registry/source/r/react/neutral'),
  compat: resolve(packageDir, 'dist/registry/source/r/react/compat'),
} as const;
const cssRegistryDirs = {
  default: resolve(packageDir, 'dist/registry/source/r/react/css'),
  neutral: resolve(packageDir, 'dist/registry/source/r/react/css/neutral'),
  compat: resolve(packageDir, 'dist/registry/source/r/react/css/compat'),
} as const;

describe('React registry output', () => {
  const registries = {
    default: readRegistryItems(registryDirs.default),
    neutral: readRegistryItems(registryDirs.neutral),
    compat: readRegistryItems(registryDirs.compat),
  } as const;

  it('keeps the Video Skin installation notes concise', () => {
    for (const items of Object.values(registries)) {
      const docs = [...itemClosure(items, 'video')].map((name) => items.get(name)?.docs ?? '').join('\n');

      expect(docs.length).toBeLessThanOrEqual(3_800);
      expect(docs.split('\n').length).toBeLessThanOrEqual(60);
    }
  });

  it('marks every public module root as a client entry', () => {
    for (const theme of ['default', 'neutral', 'compat'] as const) {
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
    const neutralItems = registries.neutral;
    const helper = defaultItems.get('_resolve-class-name');
    const defaultPlayButton = readItemRoot(registryDirs.default, defaultItems.get('play-button')!);
    const neutralPlayButton = readItemRoot(registryDirs.neutral, neutralItems.get('play-button')!);
    const defaultButton = readItemRoot(registryDirs.default, defaultItems.get('button')!);
    const neutralButton = readItemRoot(registryDirs.neutral, neutralItems.get('button')!);
    const defaultSkin = readItemRoot(registryDirs.default, defaultItems.get('video')!);
    const neutralSkin = readItemRoot(registryDirs.neutral, neutralItems.get('video')!);
    const defaultTargets = defaultItems.get('video')?.files?.map((file) => file.target) ?? [];
    const neutralTargets = neutralItems.get('video')?.files?.map((file) => file.target) ?? [];
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
    const neutralStyleTargets = [
      '@components/videojs/styles/audio/base.css',
      '@components/videojs/styles/audio/neutral.css',
      '@components/videojs/styles/audio/theme.css',
      '@components/videojs/styles/base.css',
      '@components/videojs/styles/themes/neutral.css',
      '@components/videojs/styles/themes/preferences.css',
      '@components/videojs/styles/themes/theme.css',
      '@components/videojs/styles/video/base.css',
      '@components/videojs/styles/video/captions.css',
      '@components/videojs/styles/video/neutral.css',
      '@components/videojs/styles/video/theme.css',
    ];
    const neutralComponentStyleTargets = neutralStyleTargets.filter(
      (style) => !style.endsWith('/audio/neutral.css') && !style.endsWith('/video/neutral.css')
    );
    const neutralAudioStyleTargets = [
      ...neutralComponentStyleTargets,
      '@components/videojs/styles/audio/neutral.css',
    ].sort();
    const neutralVideoStyleTargets = [
      ...neutralComponentStyleTargets,
      '@components/videojs/styles/video/neutral.css',
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
    expect(styleImports(neutralPlayButton)).toEqual([
      '../styles/themes/neutral.css',
      '../styles/base.css',
      '../styles/audio/theme.css',
      '../styles/video/captions.css',
      '../styles/video/theme.css',
    ]);
    expect(defaultPlayButton).toContain(`from '@videojs/react/icons';`);
    expect(defaultPlayButton).not.toContain(`@videojs/react/icons/neutral`);
    expect(neutralPlayButton).toContain(`from '@videojs/react/icons/neutral';`);
    expect(defaultButton).not.toContain('corner-shape:squircle');
    expect(neutralButton).toContain('corner-shape:squircle');
    expect(defaultSkin).toContain(`import '../styles/video/base.css';`);
    expect(defaultSkin).toContain('export function VideoSkin');
    expect(defaultSkin).toContain('data-theme="default"');
    expect(neutralSkin).toContain(`import '../styles/video/neutral.css';`);
    expect(neutralSkin).toContain('export function VideoSkin');
    expect(neutralSkin).toContain('data-theme="neutral"');
    expect(defaultTargets).toEqual(neutralTargets);
    expect(defaultTargets).toContain('@components/videojs/video/skin.tsx');
    expect(defaultTargets).toContain('@components/videojs/video/behaviors/hotkeys.tsx');
    expect(defaultTargets).toContain('@components/videojs/video/display/status-indicators.tsx');
    expect(defaultTargets).toContain('@components/videojs/video/layout/controls.tsx');
    expect(defaultTargets).toContain('@components/videojs/video/menus/settings-menu.tsx');
    expect(defaultTargets.some((target) => target?.includes('/skins/') === true)).toBe(false);
    expect(defaultTargets.some((target) => target?.includes('/components/') === true)).toBe(false);
    expect(styleTargets(defaultItems, 'play-button')).toEqual(defaultStyleTargets);
    expect(styleTargets(neutralItems, 'play-button')).toEqual(neutralComponentStyleTargets);
    expect(styleTargets(defaultItems, 'video')).toEqual(defaultStyleTargets);
    expect(styleTargets(neutralItems, 'video')).toEqual(neutralVideoStyleTargets);
    expect(styleTargets(defaultItems, 'audio')).toEqual(defaultStyleTargets);
    expect(styleTargets(neutralItems, 'audio')).toEqual(neutralAudioStyleTargets);
  });

  it('publishes the same public names from each theme catalog', () => {
    const publicNames = (items: ReadonlyMap<string, RegistryItem>) =>
      [...items.values()]
        .filter((item) => item.meta?.public)
        .map((item) => item.name)
        .sort();

    expect(publicNames(registries.neutral)).toEqual(publicNames(registries.default));
    expect(publicNames(registries.compat)).toEqual(['audio', 'live-audio', 'live-video', 'video']);
    expect(publicNames(registries.default)).toContain('video');
    expect(publicNames(registries.default)).not.toContain('video-neutral');
    expect([...registries.default.keys()].some((name) => name.endsWith('-neutral'))).toBe(false);
  });

  it('publishes component categories that match the UI taxonomy', () => {
    for (const items of [registries.default, registries.neutral]) {
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
    for (const registryDir of [cssRegistryDirs.default, cssRegistryDirs.neutral]) {
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
    }

    for (const items of [registries.default, registries.neutral]) {
      expect(items.get('container')?.docs).toContain('/docs/framework/react/reference/player-container/');
      expect(items.get('button')?.docs).toContain('/docs/framework/react/how-to/customize-skins/');
      expect(items.get('_style-theme')?.docs).toContain(`data-theme="${items.get('_style-theme')?.meta?.theme}"`);
      expect(items.get('video')?.docs).toContain('/docs/framework/react/concepts/media-sources/');
    }
  });

  it('imports the preset theme before each React CSS skin stylesheet', () => {
    for (const theme of ['default', 'neutral', 'compat'] as const) {
      const items = readRegistryItems(cssRegistryDirs[theme]);

      for (const preset of ['audio', 'live-audio', 'live-video', 'video'] as const) {
        const source = readItemRoot(cssRegistryDirs[theme], items.get(preset)!);
        const media = preset.endsWith('audio') ? 'audio' : 'video';
        const base = `../styles/${media}/${theme === 'default' ? 'base' : theme}.css`;

        expect(source.indexOf(base), `${theme}/${preset}`).toBeGreaterThanOrEqual(0);
        expect(source.indexOf(base), `${theme}/${preset}`).toBeLessThan(source.indexOf('./skin.css'));
      }
    }
  });

  it('composes preset media styles from theme and base entries', () => {
    for (const theme of ['neutral', 'compat'] as const) {
      for (const media of ['audio', 'video'] as const) {
        const source = readFileSync(
          resolve(cssRegistryDirs[theme], `support/files/_style-${media}-${theme}/styles/${media}/${theme}.css`),
          'utf8'
        );

        expect(cssImports(source).sort()).toEqual([`../themes/${theme}.css`, './base.css'].sort());
      }
    }
  });

  it('includes the design system and media theme in Compat installation dependencies', () => {
    for (const preset of ['audio', 'video'] as const) {
      const closure = itemClosure(registries.compat, preset);

      expect(closure.has('_style-theme')).toBe(true);
      expect(closure.has('_style-compat')).toBe(true);
      expect(closure.has(`_style-${preset}-compat`)).toBe(true);
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

    for (const theme of ['default', 'neutral'] as const) {
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
    const path = resolve(registryDir, group, 'registry.json');

    // Compat intentionally has no standalone UI catalog. All other groups must exist.
    if (group === 'ui' && registryDir.endsWith('/compat')) continue;

    const registry: unknown = JSON.parse(readFileSync(path, 'utf8'));
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
