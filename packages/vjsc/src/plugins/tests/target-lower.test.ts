import { describe, expect, it } from 'vite-plus/test';

import { defineComponent, defineSchema } from '../../components/definition';
import { defineComponentTarget } from '../../target/definition';
import { jsx } from '../../target/jsx-runtime';
import { targetLowerPlugin } from '../target-lower';
import { lowerFixture } from './helpers/lower';

const schema = defineSchema('@fixture/components', {
  Button: defineComponent({ name: 'Button' }),
  Menu: defineComponent({
    name: 'Menu',
    root: 'Root',
    parts: { Root: defineComponent(), Trigger: defineComponent(), Content: defineComponent() },
  }),
});

const target = defineComponentTarget<typeof schema>()(({ element, imported }) => {
  const Span = element('span');

  return {
    source: '@fixture/components',
    components: {
      resolve: ({ component, parts }) =>
        imported({ from: '@fixture/react', name: component, ...(parts.length > 0 ? { path: parts } : {}) }),
      rules: {
        Menu: ({ parts, id }) =>
          jsx(imported({ from: '@fixture/react', name: 'Menu', path: ['Root'] }), {
            children: [
              parts.Trigger.replaceWith(jsx(Span, { id: id('trigger'), children: parts.Trigger.children })),
              parts.Content.children,
            ],
          }),
      },
    },
    primitives: {
      Box: element('div'),
      Text: ({ props, children, id }) => jsx(Span, { ...props, id: id('text'), children }),
    },
    jsx: { importSource: 'react', attributes: 'react' },
  };
});

describe('targetLowerPlugin', () => {
  it('rejects compiler directives that no source step consumed', async () => {
    const source = `import * as $ from '@fixture/components';\nexport const button = <$.Button $unknown />;`;

    await expect(transform(source)).rejects.toMatchObject({
      errors: [
        {
          message: expect.stringContaining('Unhandled VJSC compiler directive `$unknown`'),
          pos: source.indexOf('$unknown'),
        },
      ],
    });
  });

  it('lowers primitives and canonical components in one bottom-up walk', async () => {
    const output = await transform(`
      import * as $ from '@fixture/components';
      import { Box, Text } from 'vjsc/components';
      export const view = <Box><Text><$.Button /></Text></Box>;
    `);

    expect(output).toMatch(/<div><span id="vjsc-[\w-]+-p0-text"><Button \/><\/span><\/div>/);
  });

  it('replaces a part inside a primitive that lowers by renaming', async () => {
    const output = await transform(`
      import * as $ from '@fixture/components';
      import { Box } from 'vjsc/components';
      export const menu = (
        <$.Menu.Root>
          <Box><$.Menu.Trigger>Open</$.Menu.Trigger></Box>
          <$.Menu.Content>Items</$.Menu.Content>
        </$.Menu.Root>
      );
    `);

    expect(output).toMatch(/<Menu\.Root><div><span id="vjsc-[\w-]+-trigger">Open<\/span><\/div>Items<\/Menu\.Root>/);
  });

  it('locates rule errors at the element being lowered', async () => {
    const source = `import * as $ from '@fixture/components';\nexport const menu = <$.Menu.Root><$.Menu.Trigger /><$.Menu.Trigger /><$.Menu.Content /></$.Menu.Root>;`;

    await expect(transform(source)).rejects.toMatchObject({
      errors: [
        {
          message: expect.stringContaining('expected one <Trigger> part, found 2'),
          pos: source.indexOf('<$.Menu.Root>'),
        },
      ],
    });
  });
});

function transform(source: string): Promise<string> {
  return lowerFixture(source, { plugins: [targetLowerPlugin({ targets: [target] })] });
}
