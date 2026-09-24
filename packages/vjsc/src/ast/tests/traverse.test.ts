import type { JSXElement } from '@oxc-project/types';
import { parseSync } from 'oxc-parser';
import { walk } from 'oxc-walker';
import { describe, expect, it } from 'vite-plus/test';

import { findJsxAttribute, jsxNamePath, moduleExportName } from '..';

const source = `
export function Root() {
  function Nested() {
    return <UI.Popover.Root selectedLabel={<span />} />;
  }
  return <Nested />;
}
`;
const ast = parseSync('fixture.tsx', source).program;
const element = findElement('UI.Popover.Root');

describe('findJsxAttribute', () => {
  it('finds named attributes on JSX elements', () => {
    expect(findJsxAttribute(element, 'selectedLabel')?.name).toMatchObject({
      type: 'JSXIdentifier',
      name: 'selectedLabel',
    });
  });
});

describe('jsxNamePath', () => {
  it('reads member-expression names as paths', () => {
    expect(jsxNamePath(element.openingElement.name)).toEqual(['UI', 'Popover', 'Root']);
  });

  it('reads plain identifiers as single-segment paths', () => {
    expect(jsxNamePath(findElement('Nested').openingElement.name)).toEqual(['Nested']);
  });
});

function findElement(name: string): JSXElement {
  let found: JSXElement | undefined;

  walk(ast, {
    enter(node) {
      if (node.type === 'JSXElement' && jsxNamePath(node.openingElement.name).join('.') === name) found = node;
    },
  });

  if (!found) throw new Error(`Fixture has no <${name}> element.`);

  return found;
}

describe('moduleExportName', () => {
  it('reads identifier and string specifier names', () => {
    const parsed = parseSync('fixture.ts', `import { Menu as Local, "a b" as other } from 'x';`);
    const declaration = parsed.program.body[0];
    const names =
      declaration?.type === 'ImportDeclaration'
        ? declaration.specifiers.flatMap((specifier) =>
            specifier.type === 'ImportSpecifier' ? [moduleExportName(specifier.imported)] : []
          )
        : [];

    expect(names).toEqual(['Menu', 'a b']);
  });
});
