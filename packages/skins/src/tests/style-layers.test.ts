import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const stylesDir = resolve(import.meta.dirname, '../styles');
const layerOrder = '@layer base.theme, base.preset, base.preferences;';
const tokenStyles = [
  'base.css',
  'themes/theme.css',
  'themes/neutral.css',
  'themes/preferences.css',
  'audio/theme.css',
  'video/theme.css',
] as const;

function readStyle(path: (typeof tokenStyles)[number]): string {
  return readFileSync(resolve(stylesDir, path), 'utf8');
}

describe('style token layers', () => {
  it('establishes stable precedence in every independently imported stylesheet', () => {
    for (const path of tokenStyles) {
      expect(readStyle(path), path).toContain(layerOrder);
    }
  });

  it('places media preset adaptations after theme tokens', () => {
    expect(readStyle('themes/theme.css')).toContain('@layer base.theme {');
    expect(readStyle('themes/neutral.css')).toContain('@layer base.theme {');
    expect(readStyle('audio/theme.css')).toContain('@layer base.preset {');
    expect(readStyle('video/theme.css')).toContain('@layer base.preset {');
    expect(readStyle('themes/preferences.css')).toContain('@layer base.preferences {');
  });
});
