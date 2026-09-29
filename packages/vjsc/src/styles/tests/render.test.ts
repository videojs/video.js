import { describe, expect, it } from 'vite-plus/test';

import type { DesignSystem } from '../design-system';
import type { StyleOutputFile } from '../output';
import { renderStylesheets } from '../render';

describe('renderStylesheets', () => {
  it('reports the earliest failed file in order, not the one that failed first', async () => {
    // SAFETY: rendering reaches the design only through `compileCss`, which fails the first file last.
    const design = {
      compileCss: (source: string) =>
        new Promise<string>((_, reject) => {
          const first = source.includes('media-first');

          setTimeout(() => reject(new Error(first ? 'first failed' : 'second failed')), first ? 20 : 0);
        }),
    } as unknown as DesignSystem;

    await expect(renderStylesheets({ design, files: [file('first'), file('second')] })).rejects.toThrow('first failed');
  });
});

function file(name: string): StyleOutputFile {
  return {
    name: `${name}.css`,
    layer: 'components',
    rules: [{ className: `media-${name}`, candidates: ['block'], scopeRoot: false, shadowHost: false }],
    groupOwners: new Map(),
  };
}
