import { resolve } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { localCssImports } from '../css-imports';

const root = resolve('/project');
const entry = resolve(root, 'styles/base.css');

describe('localCssImports', () => {
  it('reads quoted and url() imports with the conditions after them', () => {
    const imports = localCssImports(
      `@import "./tokens.css" layer(tokens);\n@import url(./print.css) print;\n@import url("./wide.css");`,
      entry,
      root
    );

    expect(imports.map(({ specifier, conditions }) => [specifier, conditions])).toEqual([
      ['./tokens.css', 'layer(tokens)'],
      ['./print.css', 'print'],
      ['./wide.css', ''],
    ]);
    expect(imports[0]?.filename).toBe(resolve(root, 'styles/tokens.css'));
  });

  it('ignores imports inside comments but not comment-like text inside strings', () => {
    const source = `/* @import url(./missing.css); */\n.a { content: "/*"; }\n@import "./kept.css";`;
    const [kept] = localCssImports(source, entry, root);

    expect(localCssImports(source, entry, root)).toHaveLength(1);
    expect(kept?.specifier).toBe('./kept.css');
    expect(source.slice(kept!.start, kept!.end)).toBe('@import "./kept.css";');
  });

  it('rejects an import that leaves the root', () => {
    expect(() => localCssImports(`@import "../../outside.css";`, entry, root)).toThrow(
      'VJSC graph style is outside its root: `../../outside.css`.'
    );
  });
});
