import { join } from 'node:path';

import { renderComponentSchema } from 'vjsc/plugins';

import { DIST_DIR } from '../internal/paths.js';
import type { IconFamily } from './model.js';
import { writeOutput } from './output.js';

/** Emit the canonical VJSC components for one icon family, with the schema its component targets lower. */
export function emitVjscFamily({ name: family, icons }: IconFamily): void {
  const schema = renderComponentSchema({
    source: '@videojs/icons/vjsc',
    components: icons.map(({ pascalName }) => `${pascalName}Icon`),
    language: 'js',
  });
  const directory = join(DIST_DIR, 'vjsc', family);

  writeOutput(join(directory, 'index.js'), schema.code);
  writeOutput(join(directory, 'index.d.ts'), schema.declaration);
}
