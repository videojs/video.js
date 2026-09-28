import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const referenceDirectory = resolve(process.cwd(), 'src/content/docs/reference/components');
const importPattern = /## Import\n\n<MediaImports media="[^"]+" (?:package="@videojs\/[^"]+" )?react="[^"]+" \/>/;

function readReferencePages() {
  return readdirSync(referenceDirectory)
    .filter((file) => file.endsWith('.mdx') && file !== 'write-references.mdx')
    .map((file) => ({
      file,
      source: readFileSync(resolve(referenceDirectory, file), 'utf8'),
    }));
}

describe('media reference imports', () => {
  it('documents the public import before the generated media reference', () => {
    const mediaReferences = readReferencePages().filter(({ source }) => source.includes('<MediaReference media="'));

    expect(mediaReferences.length).toBeGreaterThan(0);

    for (const { file, source } of mediaReferences) {
      expect(source, file).toMatch(importPattern);
      expect(source.indexOf('## Import'), file).toBeLessThan(source.indexOf('<MediaReference media="'));
    }
  });

  it('renders every MediaImports usage as an Import section', () => {
    const mediaImports = readReferencePages().filter(({ source }) => source.includes('<MediaImports media="'));

    expect(mediaImports.length).toBeGreaterThan(0);

    for (const { file, source } of mediaImports) {
      expect(source, file).toContain('/components/docs/api-reference/MediaImports.astro');
      expect(source, file).toMatch(importPattern);
    }
  });
});
