import { describe, expect, it } from 'vite-plus/test';

import type { ComponentTarget } from '../../target/definition';
import { targetFinalizePlugin } from '../target-finalize';
import { lowerFixture } from './helpers/lower';

const reactTarget = {
  source: '@fixture/components',
  components: { resolve: () => undefined, rules: {} },
  primitives: {},
  types: {},
  transforms: [],
  renderTargets: {},
  jsx: {
    importSource: 'react',
    attributes: 'react',
    className: {
      merge: { from: '@videojs/utils/style', name: 'cn' },
      resolve: { from: '@videojs/utils/style', name: 'resolveClassName' },
      stateAware: ({ source, imported }) => source === '@videojs/react' && imported !== 'Container',
    },
  },
} satisfies ComponentTarget;

describe('lowerClassNames', () => {
  it('composes class arrays and preserves stateful className forwarding', async () => {
    const source = await lowerFixture(
      `
        import { Container, Poster } from '@videojs/react';
        export const View = ({ className }) => <>
          <Poster className={['poster', className]} />
          <Container className={[className, 'container']} />
        </>;
      `,
      { plugins: [targetFinalizePlugin({ targets: [reactTarget] })] }
    );

    expect(source).toContain(`import { cn, resolveClassName } from "@videojs/utils/style";`);
    expect(source).toContain(`className={state => cn('poster', resolveClassName(className, state))}`);
    expect(source).toContain(`className={cn('container', className)}`);
  });

  it('names the state parameter so it never shadows a binding the class list reads', async () => {
    const source = await lowerFixture(
      `
        import { Poster } from '@videojs/react';
        export const View = ({ className, state }) => <Poster className={[state.open && 'open', className]} />;
      `,
      { plugins: [targetFinalizePlugin({ targets: [reactTarget] })] }
    );

    expect(source).toContain(`className={state2 => cn(state.open && 'open', resolveClassName(className, state2))}`);
  });

  it('leaves class arrays alone for targets without a class-name runtime', async () => {
    const source = await lowerFixture(
      `export const View = ({ className }) => <div className={['view', className]} />;`,
      {
        plugins: [
          targetFinalizePlugin({
            targets: [{ ...reactTarget, jsx: { importSource: 'react', attributes: 'react' } }],
          }),
        ],
      }
    );

    expect(source).toContain(`className={['view', className]}`);
  });
});
