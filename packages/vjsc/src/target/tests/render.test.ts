import { parseSync } from 'oxc-parser';
import { RolldownMagicString } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { ModuleImports } from '../../ast';
import { defineSchema } from '../../components/definition';
import {
  type ComponentTarget,
  createElementTarget,
  createImportedTarget,
  defineComponentTarget,
  htmlJsx,
} from '../definition';
import { createTargetCode } from '../expression';
import { Fragment, Host, jsx } from '../jsx-runtime';
import { renderTargetOutput, renderTargetPropsType } from '../render';
import { createSourceChildren } from '../source';

const schema = defineSchema('@fixture/components', {});
const code = createTargetCode();

const htmlTarget = defineComponentTarget<typeof schema>()(() => ({
  source: '@fixture/components',
  components: { resolve: () => undefined },
  jsx: htmlJsx,
}));

const reactTarget = defineComponentTarget<typeof schema>()(() => ({
  source: '@fixture/components',
  components: { resolve: () => undefined },
  jsx: { importSource: 'react', attributes: 'react' },
}));

describe('renderTargetOutput', () => {
  it('renders elements with the target attribute names and imports what they need', () => {
    const { imports, render } = context(htmlTarget);
    const Label = createElementTarget('media-label', { import: { from: '@fixture/html/label', sideEffect: true } });
    const Text = createImportedTarget({ from: '@fixture/html', name: 'Text' });

    expect(render(jsx(Label, { className: 'label', htmlFor: 'input', hidden: true, children: 'Hi' }))).toBe(
      '<media-label class="label" for="input" hidden>{"Hi"}</media-label>'
    );
    expect(render(jsx(Text, {}))).toBe('<Text />');
    expect(imports.reference({ from: '@fixture/html', name: 'Text' })).toBe('Text');
  });

  it('renders fragments, conditions, and callbacks as JSX', () => {
    const { render } = context(reactTarget);
    const item = code.param<{ label: string }>('item');

    expect(render([jsx(Fragment as never, { children: 'a' }), false, null])).toBe('<><>{"a"}</></>');
    expect(render(code.when(item.label, 'x'))).toBe('{item.label ? {"x"} : null}');
    expect(render(code.fn([item], item.label))).toBe('{(item) => (item.label)}');
  });

  it('adds host props to the children root, or wraps dynamic children in the host runtime', () => {
    const source = `<P><div className="a" /></P>`;
    const node = element(source);
    const rooted = createSourceChildren(source, node, (node.children[0] as typeof node).openingElement);
    const dynamic = createSourceChildren(`<P>{child}</P>`, element(`<P>{child}</P>`));

    expect(context(reactTarget).render(jsx(Host, { id: 'x', children: rooted }))).toMatch(
      /^<div className="a"\s+id="x"\s*\/>$/
    );
    expect(context(htmlTarget).render(jsx(Host, { id: 'x', children: dynamic }))).toBe('<Host id="x">{child}</Host>');
    expect(() => context(reactTarget).render(jsx(Host, { id: 'x', children: dynamic }))).toThrow(
      'dynamic host children require a target JSX host runtime'
    );
  });

  it('rejects output values it cannot render', () => {
    expect(() => context(reactTarget).render(Symbol('x') as never)).toThrow('unsupported output value');
  });
});

describe('renderTargetPropsType', () => {
  it('renders the public props type an element declares', () => {
    const { imports } = context(reactTarget);
    const Button = defineComponentTarget<typeof schema>()(({ element }) => ({
      source: '@fixture/components',
      components: { resolve: () => undefined },
      primitives: { Box: element('button', { props: { from: 'react', name: 'ComponentProps', intrinsic: 'button' } }) },
      jsx: { importSource: 'react', attributes: 'react' },
    }));

    expect(renderTargetPropsType(Button.primitives.Box as never, imports)).toBe('ComponentProps<"button">');
  });
});

function context(target: ComponentTarget) {
  const ast = parseSync('fixture.tsx', '').program;
  const imports = new ModuleImports(ast, new RolldownMagicString(''));

  return {
    imports,
    render: (output: Parameters<typeof renderTargetOutput>[0]) => renderTargetOutput(output, { target, imports }),
  };
}

function element(source: string) {
  const statement = parseSync('fixture.tsx', source).program.body[0];
  if (statement?.type !== 'ExpressionStatement' || statement.expression.type !== 'JSXElement') throw new Error();

  return statement.expression;
}
