import { describe, expect, it } from 'vite-plus/test';

import { readModuleBuildMeta } from '../../graph/build-meta';
import type { ComponentTarget, TargetTransform } from '../../target/definition';
import { targetSourcePlugin } from '../target-source';
import { buildFixture, FIXTURE_ID, lowerFixture } from './helpers/lower';

const banner: TargetTransform = {
  name: 'fixture:banner',
  transform({ magicString, annotate }) {
    magicString.prepend('// transformed\n');
    annotate('fixture/banner', { lines: 1 });
  },
};

const target = {
  source: '@fixture/components',
  components: { resolve: () => undefined, rules: {} },
  primitives: {},
  types: {},
  renderTargets: {},
  jsx: { importSource: 'react', attributes: 'react' },
  transforms: [
    banner,
    {
      name: 'fixture:count',
      transform({ ast, annotate }) {
        annotate('fixture/statements', ast.body.length);
      },
    },
  ],
} satisfies ComponentTarget;

describe('targetSourcePlugin', () => {
  it('runs each target transform once and records its annotations on the module', async () => {
    const shared = { ...target, source: '@fixture/other', transforms: [banner] } satisfies ComponentTarget;

    const { source, meta } = await buildFixture(`export const a = 1;\nexport const b = 2;`, {
      plugins: [targetSourcePlugin({ targets: [target, shared] })],
    });

    expect(source.match(/\/\/ transformed/g)).toHaveLength(1);
    expect(readModuleBuildMeta(meta)?.annotations).toEqual({
      'fixture/banner': { lines: 1 },
      'fixture/statements': 2,
    });
  });

  it('gives transforms the owning target and the stage imports', async () => {
    const owners: ComponentTarget[] = [];
    const registering = {
      ...target,
      transforms: [
        {
          name: 'fixture:register',
          transform({ target: owner, imports, id }) {
            if (id !== FIXTURE_ID) return;

            owners.push(owner);
            imports.statement(`${imports.reference({ from: '@fixture/runtime', name: 'register' })}();`);
          },
        },
      ],
    } satisfies ComponentTarget;

    const source = await lowerFixture(`const register = 1;\nexport { register };`, {
      plugins: [targetSourcePlugin({ targets: [registering] })],
    });

    expect(owners).toEqual([registering]);
    expect(source).toContain('import { register as registerPrimitive } from "@fixture/runtime";');
    expect(source).toContain('registerPrimitive();');
  });

  it("declares the targets' JSX runtime on modules with JSX", async () => {
    const plugins = [targetSourcePlugin({ targets: [{ ...target, transforms: [] }] })];

    expect(await lowerFixture(`export const view = <div />;`, { plugins })).toMatch(
      /^\/\*\* @jsxImportSource react \*\//
    );
    expect(await lowerFixture(`export const value = 1;`, { plugins })).not.toContain('@jsxImportSource');
  });

  it('keeps a matching JSX runtime declaration and rejects a conflicting one', async () => {
    const plugins = [targetSourcePlugin({ targets: [{ ...target, transforms: [] }] })];
    const matching = `/** @jsxImportSource react */\nexport const view = <div />;`;
    const conflicting = `/** @jsxImportSource preact */\nexport const view = <div />;`;

    expect((await lowerFixture(matching, { plugins })).match(/@jsxImportSource/g)).toHaveLength(1);
    await expect(lowerFixture(conflicting, { plugins })).rejects.toMatchObject({
      errors: [{ message: expect.stringContaining('expected `react`'), pos: conflicting.indexOf('@jsxImportSource') }],
    });
  });
});
