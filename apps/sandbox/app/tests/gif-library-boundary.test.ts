import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const libraryDir = resolve(import.meta.dirname, '../usecases/gif-video/gif');

/** The GIF library stays usable outside Video.js: it may import only from itself. */
describe('gif library boundary', () => {
  it('imports nothing from @videojs or from outside its directory', () => {
    const offenders: string[] = [];

    for (const file of readdirSync(libraryDir).filter((name) => name.endsWith('.ts'))) {
      const source = readFileSync(resolve(libraryDir, file), 'utf8');

      for (const match of source.matchAll(/from\s+'([^']+)'/g)) {
        const specifier = match[1]!;

        if (specifier.startsWith('@videojs/') || specifier.startsWith('../')) offenders.push(`${file}: ${specifier}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
