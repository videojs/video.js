import type { JSXElement } from '@oxc-project/types';
import { parseSync } from 'oxc-parser';
import { describe, expect, it } from 'vite-plus/test';

import { createSourceText } from '../../ast';
import { createSourceChildren, createSourceProps, significantJsxChildren } from '../source';

describe('createSourceChildren', () => {
  it('renders children with the edits inside them and locates a surviving root opening tag', () => {
    const code = `<Host><Child a="1"><Box /></Child></Host>`;
    const host = element(code);
    const child = host.children[0] as JSXElement;
    const box = code.indexOf('<Box />');
    const children = createSourceChildren(
      createSourceText(code, [{ start: box, end: box + 7, content: '<div />' }]),
      host,
      child.openingElement
    );

    expect(children.value).toBe('<Child a="1"><div /></Child>');
    expect(children.expression).toBe(false);
    expect(children.value.slice(0, children.rootOpeningEnd)).toBe('<Child a="1">');
    expect(children.rootComponent).toBe(true);
  });

  it('marks one expression child and drops the root offset when an edit replaced the root', () => {
    const expression = element(`<Host>{items}</Host>`);
    const code = `<Host><span /></Host>`;
    const host = element(code);
    const span = host.children[0] as JSXElement;
    const replaced = createSourceChildren(
      createSourceText(code, [{ start: span.start, end: span.end, content: '<b />' }]),
      host,
      span.openingElement
    );

    expect(createSourceChildren(`<Host>{items}</Host>`, expression).expression).toBe(true);
    expect(replaced.rootOpeningEnd).toBeUndefined();
    expect(replaced.rootComponent).toBe(false);
  });
});

describe('createSourceProps', () => {
  it('reads, omits, and merges authored attributes within one module', () => {
    const code = `<><A id="a" hidden /><B title="b" /></>`;
    const [a, b] = significantJsxChildren(fragmentRoot(code)) as JSXElement[];
    const children = createSourceChildren(code, a!);
    const props = createSourceProps<{ id: string; hidden: boolean }>(code, a!.openingElement, children);
    const other = createSourceProps<{ title: string }>(code, b!.openingElement, children);

    expect(props.has('id')).toBe(true);
    const omitted = props.omit('id') as typeof props;

    expect(omitted.has('id')).toBe(false);
    expect(omitted.get('id')).toMatchObject({ attribute: undefined });
    expect(props.merge(other).has('title')).toBe(true);
    expect(() => props.merge(createSourceProps<object>(`<C />`, element(`<C />`).openingElement, children))).toThrow(
      'source props can only merge within one module'
    );
  });
});

function element(code: string): JSXElement {
  const statement = parseSync('fixture.tsx', code).program.body[0];
  if (statement?.type !== 'ExpressionStatement' || statement.expression.type !== 'JSXElement') throw new Error();

  return statement.expression;
}

function fragmentRoot(code: string): JSXElement {
  const statement = parseSync('fixture.tsx', code).program.body[0];
  if (statement?.type !== 'ExpressionStatement' || statement.expression.type !== 'JSXFragment') throw new Error();

  return statement.expression as unknown as JSXElement;
}
