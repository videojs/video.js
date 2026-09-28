import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const referenceDirectory = resolve(process.cwd(), 'src/content/docs/reference/api');
const importPattern = /## Import\n\n<FeatureImports feature="(\w+)" \/>/;

describe('feature reference imports', () => {
  it('documents the feature import before the generated feature reference', () => {
    const featureReferences = readdirSync(referenceDirectory)
      .filter((file) => file.endsWith('.mdx') && file !== 'write-references.mdx')
      .map((file) => ({
        file,
        source: readFileSync(resolve(referenceDirectory, file), 'utf8'),
      }))
      .filter(({ source }) => source.includes('<FeatureReference feature="'));

    expect(featureReferences.length).toBeGreaterThan(0);

    for (const { file, source } of featureReferences) {
      const section = importPattern.exec(source);

      expect(section, file).not.toBeNull();
      expect(source, file).toContain('/components/docs/api-reference/FeatureImports.astro');
      expect(source.indexOf('## Import'), file).toBeLessThan(source.indexOf('<FeatureReference feature="'));

      // The Import section must name the same feature the generated reference renders.
      const referenced = /<FeatureReference feature="(\w+)"/.exec(source);

      expect(section?.[1], file).toBe(referenced?.[1]);
    }
  });
});
