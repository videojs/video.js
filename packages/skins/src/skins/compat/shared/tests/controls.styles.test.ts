import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const videoTheme = readFileSync(resolve(import.meta.dirname, '../../../../styles/video/theme.css'), 'utf8');

describe('controlsStyles', () => {
  it('paints the backdrop with the themeable controls gradient', () => {
    const source = readFileSync(resolve(import.meta.dirname, '../controls.styles.ts'), 'utf8');

    expect(source).toContain('bg-(image:--media-controls-gradient)');
    expect(source).not.toContain('bg-[linear-gradient(');
  });

  it('keeps the compat gradient as the compat theme default', () => {
    const compatTheme = videoTheme.match(/\[data-theme="compat"\] \{([^}]*)\}/)?.[1] ?? '';

    expect(compatTheme).toContain('--media-controls-gradient');
    expect(compatTheme).toContain('rgb(0 0 0 / 0.7)');
  });
});
