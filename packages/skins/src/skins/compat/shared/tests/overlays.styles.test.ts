import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';
import { loadDesignSystem } from 'vjsc/graph';

const sharedDir = resolve(import.meta.dirname, '..');
const compilerEntry = resolve(import.meta.dirname, '../../../../styles/tailwind.compiler.css');

// Compat keeps its look, but its translucent black overlays read the shared `--media-backdrop` token, like Default and
// Neutral, instead of hardcoded colors that bypass the theme layer.
const overlays = [
  { file: 'dialog.styles.ts', candidates: ['bg-media-backdrop/75'] },
  { file: 'indicator.styles.ts', candidates: ['bg-media-backdrop/50'] },
  { file: 'thumbnail.styles.ts', candidates: ['bg-media-backdrop/50'] },
  { file: 'controls.styles.ts', candidates: ['bg-media-backdrop/40!', 'hover:bg-media-backdrop/85!'] },
] as const;

describe('compat overlays', () => {
  it.each(overlays)('$file paints its overlays from the backdrop token', ({ file, candidates }) => {
    const source = readFileSync(resolve(sharedDir, file), 'utf8');

    expect(source).not.toMatch(/rgba\(0,\s*0,\s*0,/);

    for (const candidate of candidates) expect(source).toContain(candidate);
  });

  it('compiles each overlay to the backdrop token at the original opacity', async () => {
    const system = await loadDesignSystem(compilerEntry);
    const expected = {
      'bg-media-backdrop/75': 'color-mix(in oklab, var(--media-backdrop) 75%, transparent)',
      'bg-media-backdrop/50': 'color-mix(in oklab, var(--media-backdrop) 50%, transparent)',
      'bg-media-backdrop/40!': 'color-mix(in oklab, var(--media-backdrop) 40%, transparent) !important',
      'bg-media-backdrop/85!': 'color-mix(in oklab, var(--media-backdrop) 85%, transparent) !important',
    };

    for (const [candidate, value] of Object.entries(expected)) {
      expect(system.recognizesCandidate(candidate)).toBe(true);
      expect(system.candidateCss(candidate)).toContain(`background-color: ${value};`);
    }
  }, 60_000);
});
