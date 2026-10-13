import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { tailwindStylesheet } from '../css';
import { projectPath, registryCatalog, resolveRegistrySkin, rewriteImports, splitDependency } from '../registry';

const registry = resolve(import.meta.dirname, 'fixtures/registry');

describe('resolveRegistrySkin', () => {
  it('collects the files, dependencies, and theme of a skin and every item it depends on', async () => {
    const skin = await resolveRegistrySkin({
      registry,
      framework: 'react',
      styling: 'tailwind',
      theme: 'scaffold',
      preset: 'video',
    });

    expect([...skin.files.keys()].sort()).toEqual([
      'src/lib/resolve-class-name.ts',
      'src/lib/utils.ts',
      'src/styles/theme.css',
      'src/video/skin.tsx',
    ]);
    expect(Object.fromEntries(skin.dependencies)).toEqual({
      '@videojs/core': '10.1.0',
      '@videojs/react': '10.1.0',
      cn: '',
      react: '',
    });
    expect(Object.fromEntries(skin.themeVars)).toEqual({ 'color-media-accent': 'var(--media-accent)' });
    // A plain `cn` reads `text-media` as a color and drops the skin's `text-media-*` colors.
    expect(skin.files.get('src/lib/utils.ts')).toContain(
      "text: ['media', 'media-xs', 'media-sm', 'media-lg', 'media-xl']"
    );
  });

  it('reports a missing local registry build', async () => {
    await expect(
      resolveRegistrySkin({ registry, framework: 'html', styling: 'css', theme: 'neutral', preset: 'video' })
    ).rejects.toThrow(/pnpm build:shadcn/);
  });
});

describe('registryCatalog', () => {
  it('matches the published catalog paths', () => {
    expect(registryCatalog('react', 'tailwind', 'default')).toBe('react');
    expect(registryCatalog('react', 'css', 'neutral')).toBe('react/css/neutral');
    expect(registryCatalog('html', 'css', 'scaffold')).toBe('html/scaffold');
  });
});

describe('projectPath', () => {
  it('gives the skin all of src', () => {
    expect(projectPath('@components/videojs/video/skin.tsx')).toBe('src/video/skin.tsx');
    expect(projectPath('@components/other/thing.tsx')).toBe('src/components/other/thing.tsx');
    expect(projectPath('@lib/utils.ts')).toBe('src/lib/utils.ts');
    expect(() => projectPath('~/elsewhere.ts')).toThrow(/Unsupported/);
  });
});

describe('rewriteImports', () => {
  it('points imports at the flattened skin', () => {
    expect(
      rewriteImports("import { Button } from '@/components/videojs/ui/button';\nimport { cn } from '@/lib/utils';")
    ).toBe("import { Button } from '@/ui/button';\nimport { cn } from '@/lib/utils';");
  });
});

describe('splitDependency', () => {
  it('separates scoped names from pinned versions', () => {
    expect(splitDependency('@videojs/react@10.1.0')).toEqual(['@videojs/react', '10.1.0']);
    expect(splitDependency('react')).toEqual(['react', '']);
  });
});

describe('tailwindStylesheet', () => {
  it('writes the theme and rules the way `shadcn add` does, scanning only the skin', async () => {
    const skin = await resolveRegistrySkin({
      registry,
      framework: 'react',
      styling: 'tailwind',
      theme: 'scaffold',
      preset: 'video',
    });

    expect(tailwindStylesheet(skin.themeVars, skin.css)).toBe(`@import "tailwindcss" source(none);

@source "./";

@theme inline {
  --color-media-accent: var(--media-accent);
}

@utility font-media {
  font-family: var(--media-font-family);
}

@custom-variant media-sm {
  @container media-root (width >= 24rem) {
    @slot;
  }
}
`);
  });
});
