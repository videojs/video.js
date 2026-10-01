import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

/**
 * Bundlers drop a bare `import './x.js'` unless `package.json#sideEffects` names the file. Every module that only
 * registers custom elements has to be listed, or a production build ships a skin whose parts never upgrade.
 */
const packageDir = resolve(import.meta.dirname, '../../..');
const { sideEffects } = JSON.parse(readFileSync(resolve(packageDir, 'package.json'), 'utf8')) as {
  sideEffects: string[];
};

function globToRegExp(glob: string): RegExp {
  const source = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\0')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\0/g, '(?:.*/)?');

  return new RegExp(`^${source}$`);
}

const patterns = sideEffects.map(globToRegExp);

function isSideEffectful(distPath: string): boolean {
  return patterns.some((pattern) => pattern.test(distPath));
}

function generatedSkins(): string[] {
  return readdirSync(resolve(packageDir, 'src/internal/skins'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe('sideEffects', () => {
  it('keeps every generated skin registration in both dist variants', () => {
    const skins = generatedSkins();

    expect(skins.length).toBeGreaterThan(0);

    for (const skin of skins) {
      for (const variant of ['default', 'dev']) {
        expect(isSideEffectful(`./dist/${variant}/internal/skins/${skin}/register.js`), skin).toBe(true);
      }
    }
  });

  it('keeps define and i18n entries side-effectful', () => {
    expect(isSideEffectful('./dist/default/define/video/skin.js')).toBe(true);
    expect(isSideEffectful('./dist/dev/define/ui/container.js')).toBe(true);
    expect(isSideEffectful('./dist/default/i18n/index.js')).toBe(true);
  });

  it('leaves pure modules alone', () => {
    expect(isSideEffectful('./dist/default/presets/video/skin.js')).toBe(false);
    expect(isSideEffectful('./dist/default/internal/skins/default-video/template.js')).toBe(false);
  });
});
