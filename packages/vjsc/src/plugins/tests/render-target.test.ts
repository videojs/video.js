import type { Plugin } from 'rolldown';
import { rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { defineComponent, defineSchema } from '../../components/definition';
import { defineComponentTarget } from '../../target/definition';
import { renderTargetPlugin } from '../render-target';

const MODULE_ID = '\0fixture.tsx?target=react';

const schema = defineSchema('@fixture/components', {
  PlayButton: defineComponent({ name: 'PlayButton' }),
  CaptionsButton: defineComponent({ name: 'CaptionsButton' }),
});

const reactTarget = defineComponentTarget<typeof schema>()(({ element, imported }) => {
  const Button = element('button', { props: { from: 'react', name: 'ComponentProps', intrinsic: 'button' } });

  return {
    source: '@fixture/components',
    components: { resolve: ({ component }) => imported({ from: '@fixture/react', name: component }) },
    renderTargets: { Button: { element: Button } },
    jsx: { importSource: 'react', attributes: 'react' },
  };
});

const htmlTarget = defineComponentTarget<typeof schema>()(({ element }) => ({
  source: '@fixture/components',
  components: { resolve: ({ component }) => element(`media-${component.toLowerCase()}`) },
  renderTargets: {
    Button: { element: element('button') },
    CaptionsButton: { component: true },
  },
  jsx: { importSource: 'vjsc/html-runtime', attributes: 'html' },
}));

const definitionSource = `
  import { defineRenderTarget } from 'vjsc/components';
  import * as $ from '@fixture/components';
  export const Button = defineRenderTarget(['media-button', 'grid p-0']);
  export const PlayButton = ({ className }) => <$.PlayButton $render={Button} className={[className]} />;
`;

describe('renderTargetPlugin', () => {
  it('lowers definitions and directives to React render props', async () => {
    const source = await transform(definitionSource, reactTarget);

    expect(source).toContain('import type { ComponentProps } from "react";');
    expect(source).toContain('export type ButtonProps = ComponentProps<"button">;');
    expect(source).toContain('export function Button({ className, ...props }: ButtonProps)');
    expect(source).toContain('<button className={["media-button", "grid p-0", className]} {...props} />');
    expect(source).toContain('render={<Button />}');
    expect(source).not.toContain('$render');
  });

  it('lowers style render targets to HTML class names', async () => {
    const source = await transform(definitionSource, htmlTarget);

    expect(source).toContain('export const Button = "media-button grid p-0";');
    expect(source).toContain('className={[Button, [className]]}');
  });

  it('marks and wraps component render targets for HTML rules', async () => {
    const source = await transform(
      `
        import * as $ from '@fixture/components';
        import { CaptionsButton } from './captions-button';
        export const Menu = () => <$.PlayButton $render={CaptionsButton} />;
      `,
      htmlTarget
    );

    expect(source).toContain('<$.PlayButton data-vjsc-render-captions-button ><CaptionsButton /></$.PlayButton>');
  });

  it('rejects $render on elements that are not canonical components', async () => {
    await expect(
      transform(
        `
          import { defineRenderTarget } from 'vjsc/components';
          export const Button = defineRenderTarget(['media-button']);
          export const View = () => <div $render={Button} />;
        `,
        reactTarget
      )
    ).rejects.toThrow('`$render` can only be used on a canonical component or part.');
  });

  it('rejects render targets the selected target does not define', async () => {
    await expect(
      transform(
        `
          import { defineRenderTarget } from 'vjsc/components';
          export const Thumb = defineRenderTarget(['media-thumb']);
        `,
        reactTarget
      )
    ).rejects.toThrow('does not define render target `Thumb`');
  });
});

async function transform(source: string, target: typeof reactTarget | typeof htmlTarget): Promise<string> {
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
    external: (id) => !id.startsWith('.') && !id.startsWith('\0'),
    transform: { jsx: 'preserve' },
    plugins: [
      {
        name: 'fixture:module',
        resolveId(id) {
          if (id === 'fixture') return MODULE_ID;

          return id.startsWith('./') ? `\0${id}` : null;
        },
        load(id) {
          if (id === MODULE_ID) return { code: source, moduleType: 'tsx' };

          return id.startsWith('\0./')
            ? { code: 'export const CaptionsButton = () => null;', moduleType: 'tsx' }
            : null;
        },
      },
      renderTargetPlugin({ targets: [target] }),
      inspect,
    ],
  });

  await bundle.generate({ format: 'es' });

  if (!output) throw new Error('Fixture did not capture transformed source.');

  return output;
}
