import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const referenceDirectory = resolve(process.cwd(), 'src/content/docs/reference/components');
const componentImport = 'import ComponentImports from "@/components/docs/api-reference/ComponentImports.astro";';

describe('component reference imports', () => {
  it('documents the public import before component anatomy', () => {
    const componentReferences = readdirSync(referenceDirectory)
      .filter((file) => file.endsWith('.mdx') && file !== 'write-references.mdx')
      .map((file) => ({
        file,
        source: readFileSync(resolve(referenceDirectory, file), 'utf8'),
      }))
      .filter(({ source }) => source.includes('<ComponentReference component="'));

    expect(componentReferences.length).toBeGreaterThan(0);

    for (const { file, source } of componentReferences) {
      expect(source, file).toContain(componentImport);
      // `html` is one `ui/*` entry, or a list of the root plus every part entry for compound components.
      expect(source, file).toMatch(
        /## Import\n\n<ComponentImports component="[^"]+" html=("[^"]+"|\{\["[^"]+"(, "[^"]+")*\]\})( reactFrom="[^"]+")? \/>/
      );
      expect(source.indexOf('## Import'), file).toBeLessThan(source.indexOf('## Anatomy'));
      expect(source.indexOf('## Anatomy'), file).toBeLessThan(source.indexOf('<ComponentReference component="'));
    }
  });
});
