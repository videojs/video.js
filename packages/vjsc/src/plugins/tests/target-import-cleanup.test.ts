import { describe, expect, it } from 'vite-plus/test';

import { defineComponent, defineSchema } from '../../components/definition';
import { defineComponentTarget } from '../../target/definition';
import { targetFinalizePlugin } from '../target-finalize';
import { targetLowerPlugin } from '../target-lower';
import { lowerFixture } from './helpers/lower';

const schema = defineSchema('@fixture/components', {
  PlayButton: defineComponent({ name: 'PlayButton' }),
  Menu: defineComponent({
    name: 'Menu',
    root: 'Root',
    parts: {
      Root: defineComponent(),
      Content: defineComponent(),
    },
  }),
});

const target = defineComponentTarget<typeof schema>()(({ element }) => ({
  source: '@fixture/components',
  components: {
    resolve: ({ component, parts }) =>
      parts[0] === 'Content' ? undefined : element(`media-${component.toLowerCase()}`),
  },
  primitives: { Box: element('div') },
  jsx: { importSource: 'react', attributes: 'react' },
}));

const plugins = [targetLowerPlugin({ targets: [target] }), targetFinalizePlugin({ targets: [target] })];

describe('pruneImports', () => {
  it('removes canonical imports once every reference is lowered', async () => {
    const source = await lowerFixture(
      `
        import * as $ from '@fixture/components';
        import { Box } from 'vjsc/components';
        export const play = <Box><$.PlayButton /></Box>;
      `,
      { plugins }
    );

    expect(source).toContain('<div><media-playbutton /></div>');
    expect(source).not.toContain('@fixture/components');
    expect(source).not.toContain('vjsc/components');
  });

  it('rejects canonical JSX that no target rule lowered', async () => {
    await expect(
      lowerFixture(
        `
          import * as $ from '@fixture/components';
          export const menu = <$.Menu.Root><$.Menu.Content>Options</$.Menu.Content></$.Menu.Root>;
        `,
        { plugins }
      )
    ).rejects.toThrow('<$.Menu.Content> was not lowered by the component target.');
  });

  it('rejects render markers that no component rule consumed', async () => {
    await expect(
      lowerFixture(
        `
          import * as $ from '@fixture/components';
          export const play = <$.PlayButton data-vjsc-render-button />;
        `,
        { plugins }
      )
    ).rejects.toThrow('`$render` marker `data-vjsc-render-button` was not consumed');
  });
});
