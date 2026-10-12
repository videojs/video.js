import { describe, expect, it } from 'vite-plus/test';

import { defineSchema } from '../../components/definition';
import { defineComponentTarget } from '../../target/definition';
import { Host, jsx } from '../../target/jsx-runtime';
import { targetFinalizePlugin } from '../target-finalize';
import { lowerFixture } from './helpers/lower';

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

describe('lowerTemplates', () => {
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

  it('lowers templates in the subtrees beside a direct template', async () => {
    const source = await transform(`
      import { Template } from 'vjsc/components';
      export const list = (
        <List>
          <Template name="text"><b /></Template>
          <div>
            <List><Template name="text"><i /></Template></List>
          </div>
        </List>
      );
    `);

    expect(source.match(/renderItem=/g)).toHaveLength(2);
    expect(source).not.toContain('<Template');
  });

  it('rejects a template nested inside another template', async () => {
    await expect(
      transform(`
        import { Template } from 'vjsc/components';
        export const list = (
          <List>
            <Template name="text"><List><Template name="text"><i /></Template></List></Template>
          </List>
        );
      `)
    ).rejects.toThrow('<Template> cannot be nested inside another <Template>.');
  });

  it('rejects a template nested inside a template part', async () => {
    await expect(
      transform(`
        import { Template } from 'vjsc/components';
        export const list = (
          <List>
            <Template name="item">
              <Template.Part name="label"><Template name="text"><i /></Template></Template.Part>
            </Template>
          </List>
        );
      `)
    ).rejects.toThrow('<Template> cannot be nested inside another <Template>.');
  });
});

describe('lowerTemplates ids and class names', () => {
  const ids = defineComponentTarget<typeof schema>()(({ element }) => {
    const Span = element('span');

    return {
      source: '@fixture/components',
      components: { resolve: () => undefined },
      primitives: {
        Template: {
          label: {
            render: ({ props, children, id }) => jsx(Span, { ...props, id: id('label'), children }),
          },
        },
      },
      jsx: {
        importSource: 'react',
        attributes: 'react',
        className: { merge: { from: 'cn', name: 'cn' } },
      },
    };
  });

  it('gives every template occurrence its own ids and lowers class arrays inside it', async () => {
    const source = await lowerFixture(
      `
        import { Template } from 'vjsc/components';
        export const list = (
          <List>
            <Template name="label" className={['a', 'b']}><b className={['c', 'd']} /></Template>
            <Template name="label" />
          </List>
        );
      `,
      { plugins: [targetFinalizePlugin({ targets: [ids] })] }
    );
    const generated = [...source.matchAll(/id="(vjsc-[^"]+)"/g)].map((match) => match[1]);

    expect(generated).toHaveLength(2);
    expect(new Set(generated).size).toBe(2);
    expect(source).toContain(`className={cn('a', 'b')}`);
    expect(source).toContain(`<b className={cn('c', 'd')} />`);
    expect(source).not.toContain('vjsc/components');
  });
});

function transform(source: string): Promise<string> {
  return lowerFixture(source, { plugins: [targetFinalizePlugin({ targets: [target] })] });
}
