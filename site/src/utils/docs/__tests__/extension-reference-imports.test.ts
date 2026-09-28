import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

const referenceDirectory = resolve(process.cwd(), 'src/content/docs/reference/components');
const extensions = [
  { file: 'google-cast.mdx', extension: 'google-cast', react: 'GoogleCast' },
  { file: 'mux-data.mdx', extension: 'mux-data', react: 'MuxData' },
];

describe('extension reference imports', () => {
  it('documents the extension import renderer on every extension reference page', () => {
    for (const { file, extension, react } of extensions) {
      const source = readFileSync(resolve(referenceDirectory, file), 'utf8');

      expect(source, file).toContain('/components/docs/api-reference/ExtensionImports.astro');
      expect(source, file).toMatch(
        new RegExp(
          `## Import\\n\\n<ExtensionImports extension="${extension}" (?:package="@videojs/[^"]+" )?react="${react}" />`
        )
      );
      expect(source, file).not.toContain('<MediaImports');
    }
  });
});
