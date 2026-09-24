import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { styleRuleLocation } from '../locate';

describe('styleRuleLocation', () => {
  it('points at the property that declares a nested rule', async () => {
    const modulePath = await styleModule(
      [
        `import { styles } from 'vjsc/styles';`,
        ``,
        `export default styles({`,
        `  file: 'menu.css',`,
        `  rules: {`,
        `    root: { utilities: 'grid' },`,
        `    item: {`,
        `      'icon': { utilities: 'size-4' },`,
        `    },`,
        `  },`,
        `});`,
      ].join('\n')
    );

    expect(styleRuleLocation({ modulePath, tokenPath: ['root'] })).toBe(`${modulePath}:6:5`);
    expect(styleRuleLocation({ modulePath, tokenPath: ['item', 'icon'] })).toBe(`${modulePath}:8:7`);
  });

  it('follows rules bound to a top-level constant', async () => {
    const modulePath = await styleModule(
      [
        `import { styles } from 'vjsc/styles';`,
        `const rules = {`,
        `  root: { utilities: 'grid' },`,
        `};`,
        `export default styles({ file: 'a.css', rules });`,
      ].join('\n')
    );

    expect(styleRuleLocation({ modulePath, tokenPath: ['root'] })).toBe(`${modulePath}:3:3`);
  });

  it('falls back to the module path when the rule cannot be traced', async () => {
    const modulePath = await styleModule(`export default styles({ file: 'a.css', rules: build() });`);

    expect(styleRuleLocation({ modulePath, tokenPath: ['root'] })).toBe(modulePath);
    expect(styleRuleLocation({ modulePath: join(modulePath, 'missing.styles.ts'), tokenPath: ['root'] })).toBe(
      join(modulePath, 'missing.styles.ts')
    );
  });
});

async function styleModule(source: string): Promise<string> {
  const path = join(await mkdtemp(join(tmpdir(), 'vjsc-locate-')), 'fixture.styles.ts');

  await writeFile(path, source);
  return path;
}
