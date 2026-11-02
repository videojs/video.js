import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const stylesDir = resolve(import.meta.dirname, '../styles');
const layerOrder = '@layer base.theme, base.preferences;';
const skinThemes = ['default', 'neutral', 'compat', 'scaffold'] as const;
const tokenStyles = ['base.css', 'themes/preferences.css', ...skinThemes.map((theme) => `themes/${theme}.css`)];

function readStyle(path: string): string {
  return readFileSync(resolve(stylesDir, path), 'utf8');
}

function declaredTokens(source: string): Set<string> {
  return new Set([...source.matchAll(/(--media-[a-zA-Z0-9_-]+):/g)].map(([, name]) => name!));
}

describe('style token layers', () => {
  it('establishes stable precedence in every independently imported stylesheet', () => {
    for (const path of tokenStyles) {
      expect(readStyle(path), path).toContain(layerOrder);
    }
  });

  it('places skin tokens below preference overrides', () => {
    for (const theme of skinThemes) {
      expect(readStyle(`themes/${theme}.css`), theme).toContain('@layer base.theme {');
    }

    expect(readStyle('themes/preferences.css')).toContain('@layer base.preferences {');
  });

  it('scopes every skin token rule to its own theme', () => {
    for (const theme of skinThemes) {
      const selectors = [...readStyle(`themes/${theme}.css`).matchAll(/^\s*(\.media-skin[^{]*)\{/gm)];

      expect(selectors.length, theme).toBeGreaterThan(0);

      for (const [, selector] of selectors) {
        expect(selector, theme).toContain(`.media-skin[data-theme="${theme}"]`);
      }
    }
  });

  it('declares every default token in each skin', () => {
    const defaults = declaredTokens(readStyle('themes/default.css'));

    for (const theme of skinThemes) {
      const tokens = declaredTokens(readStyle(`themes/${theme}.css`));
      const missing = [...defaults].filter((name) => !tokens.has(name));

      expect(missing, theme).toEqual([]);
    }
  });
});
