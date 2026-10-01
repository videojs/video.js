import type { Plugin } from 'rolldown';
import { rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import type { ComponentTarget } from '../../target/definition';
import { reactTargetPropsPlugin } from '../react-target-props';

const MODULE_ID = '\0fixture.tsx?target=react';
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

describe('reactTargetPropsPlugin', () => {
  it('composes class arrays and preserves stateful className forwarding', async () => {
    let source: string | undefined;
    const inspect: Plugin = {
      name: 'fixture:inspect',
      buildEnd() {
        source = this.getModuleInfo(MODULE_ID)?.code ?? undefined;
      },
    };
    const bundle = await rolldown({
      input: 'fixture',
      experimental: { nativeMagicString: true },
      external: (id) => !id.startsWith('.') && !id.startsWith('\0'),
      transform: { jsx: 'preserve' },
      plugins: [
        fixturePlugin(`
          import { Container, Poster } from '@videojs/react';
          export const View = ({ className }) => <>
            <Poster className={['poster', className]} />
            <Container className={[className, 'container']} />
          </>;
        `),
        reactTargetPropsPlugin({ targets: [reactTarget] }),
        inspect,
      ],
    });

    await bundle.generate({ format: 'es' });

    expect(source).toContain(`import { cn, resolveClassName } from "@videojs/utils/style";`);
    expect(source).toContain(`className={state => cn('poster', resolveClassName(className, state))}`);
    expect(source).toContain(`className={cn('container', className)}`);
  });

  it('leaves class arrays alone for targets without a class-name runtime', async () => {
    let source: string | undefined;
    const inspect: Plugin = {
      name: 'fixture:inspect',
      buildEnd() {
        source = this.getModuleInfo(MODULE_ID)?.code ?? undefined;
      },
    };
    const bundle = await rolldown({
      input: 'fixture',
      experimental: { nativeMagicString: true },
      external: (id) => !id.startsWith('.') && !id.startsWith('\0'),
      transform: { jsx: 'preserve' },
      plugins: [
        fixturePlugin(`export const View = ({ className }) => <div className={['view', className]} />;`),
        reactTargetPropsPlugin({ targets: [{ ...reactTarget, jsx: { importSource: 'react', attributes: 'react' } }] }),
        inspect,
      ],
    });

    await bundle.generate({ format: 'es' });

    expect(source).toContain(`className={['view', className]}`);
  });
});

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
