import { type Plugin, rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { defineSchema } from '../../components/definition';
import { defineComponentTarget } from '../../target/definition';
import { Host, jsx } from '../../target/jsx-runtime';
import { templateTargetPlugin } from '../template-target';

const MODULE_ID = '\0fixture.tsx?target=react';
const schema = defineSchema('@fixture/components', {});

const target = defineComponentTarget<typeof schema>()(({ code, element }) => {
  const Div = element('div');
  const Span = element('span');
  const Sup = element('sup');

  const props = code.param('props');
  const item = code.param<{ label: unknown; tier: unknown }>('item');

  return {
    source: '@fixture/components',
    components: { resolve: () => undefined },
    primitives: {
      Template: {
        item: {
          render: ({ children }) =>
            jsx(Host, {
              renderItem: code.fn([props, item], code.withProps(children, props)),
            }),
          parts: {
            label: ({ props: source }) => jsx(Span, { ...source, children: item.label }),
            tier: ({ props: source }) => code.when(item.tier, jsx(Sup, { ...source, children: item.tier })),
          },
        },
        text: {
          render: ({ children }) =>
            jsx(Host, {
              renderItem: code.fn([item], code.withProps(children, { children: item.label })),
            }),
        },
        chapter: {
          render: ({ props: source, children }) =>
            jsx(Host, {
              renderChapter: code.fn([props], jsx(Div, { ...source, children: code.withProps(children, props) })),
            }),
        },
      },
    },
    jsx: { importSource: 'react', attributes: 'react' },
  };
});

describe('templateTargetPlugin', () => {
  it('passes explicit children through host props', async () => {
    const source = await transform(`
      import { Template } from 'vjsc/components';
      export const list = <List><Template name="text"><div className="title" /></Template></List>;
    `);

    expect(source).toContain('children={item.label}');
  });

  it('lowers host callbacks and template parts from source-backed JSX', async () => {
    const source = await transform(`
      import { Template } from 'vjsc/components';

      export const list = (
        <List>
          <Template name="item">
            <Row className="row">
              <Template.Part name="label" className="label" />
              <Template.Part name="tier" />
            </Row>
          </Template>
        </List>
      );
    `);

    expect(source).toContain('renderItem={(props, item) => (<Row className="row" {...props}>');
    expect(source).toContain('<span className="label">{item.label}</span>');
    expect(source).toContain('{item.tier ? <sup>{item.tier}</sup> : null}');
    expect(source).not.toContain('<Template');
  });
});

async function transform(source: string): Promise<string> {
  let output: string | undefined;
  const inspect: Plugin = {
    name: 'fixture:inspect',
    buildEnd() {
      output = this.getModuleInfo(MODULE_ID)?.code ?? undefined;
    },
  };
  const bundle = await rolldown({
    input: 'fixture',
    experimental: { nativeMagicString: true },
    external: ['vjsc/components'],
    transform: { jsx: 'preserve' },
    plugins: [fixturePlugin(source), templateTargetPlugin({ targets: [target] }), inspect],
  });

  await bundle.generate({ format: 'es' });

  if (output === undefined) throw new Error('Fixture build did not retain editable source.');

  return output;
}

function fixturePlugin(source: string): Plugin {
  return {
    name: 'fixture:module',
    resolveId(id) {
      return id === 'fixture' ? MODULE_ID : null;
    },
    load(id) {
      return id === MODULE_ID ? { code: source, moduleType: 'tsx' } : null;
    },
  };
}
