import { type Plugin, rolldown } from 'rolldown';
import { describe, expect, it } from 'vite-plus/test';

import { defineComponent, defineSchema } from '../../components/definition';
import { defineComponentTarget } from '../../target/definition';
import { Host, jsx } from '../../target/jsx-runtime';
import { type ComponentTargetSelection, componentTargetPlugin } from '../component-target';

const MODULE_ID = '\0fixture.tsx?target=react';

const schema = defineSchema('@fixture/components', {
  PlayButton: defineComponent({ name: 'PlayButton' }),
  Poster: defineComponent<{ src?: string | undefined }>({ name: 'Poster' }),
  Popover: defineComponent({
    name: 'Popover',
    root: 'Root',
    parts: {
      Root: defineComponent<{ open?: boolean | undefined }>(),
      Trigger: defineComponent(),
      Popup: defineComponent<{ placement?: string | undefined }>(),
    },
  }),
  Menu: defineComponent({
    name: 'Menu',
    root: 'Root',
    parts: {
      Root: defineComponent(),
      Trigger: defineComponent(),
      Content: defineComponent(),
    },
  }),
  OptionGroup: defineComponent({
    name: 'OptionGroup',
    root: 'Root',
    parts: {
      Root: defineComponent(),
      Value: defineComponent(),
      Options: defineComponent(),
    },
  }),
  Slider: defineComponent({
    name: 'Slider',
    root: 'Root',
    parts: {
      Root: defineComponent(),
      Thumbnail: defineComponent({
        parts: {
          Root: defineComponent(),
          Image: defineComponent(),
        },
      }),
    },
  }),
});

const reactTarget = defineComponentTarget<typeof schema>()(({ target, element, imported }) => ({
  source: '@fixture/components',
  components: {
    resolve: ({ component, part }) =>
      imported({
        from: '@fixture/react',
        name: component,
        ...(part ? { path: part.split('.') } : {}),
      }),
    rules: {
      Menu: {
        Trigger: ({ props, children }) => jsx(target.Menu.Trigger, { ...props, children }),
      },
      Poster: ({ props, children }) => jsx(target.Poster, { render: children, ...props }),
      Popover: ({ props, parts }) => [
        parts.Trigger.children,
        jsx(target.Popover.Popup, {
          ...props.merge(parts.Popup.props),
          children: parts.Popup.children,
        }),
      ],
      Slider: {
        Thumbnail: {
          Root: element('div'),
        },
      },
    },
  },
  jsx: { importSource: 'react', attributes: 'react' },
}));

const htmlTarget = defineComponentTarget<typeof schema>()(({ target, element, unwrap }) => {
  const Button = element('button');
  const Svg = element('svg');

  return {
    source: '@fixture/components',
    components: {
      resolve: ({ component }) =>
        element(`media-${component.toLowerCase()}`, {
          import: { from: '@fixture/elements', sideEffect: true },
        }),
      rules: {
        OptionGroup: { Root: unwrap() },
        Poster: ({ props, children }) => jsx(Host, { ...props, className: 'poster', children }),
        PlayButton: () =>
          jsx(Svg, {
            viewBox: '0 0 18 18',
            preserveAspectRatio: 'xMidYMid meet',
            strokeWidth: 2,
            xlinkHref: '#icon',
          }),
        Menu: ({ parts, id }) => {
          const contentId = id('content');
          const trigger = parts.Trigger.one();
          const content = parts.Content.one();

          return [
            trigger.replaceWith(jsx(Button, { commandfor: contentId, ...trigger.props, children: trigger.children })),
            content.replaceWith(
              jsx(target.Menu.Content, { id: contentId, ...content.props, children: content.children })
            ),
          ];
        },
      },
    },
    jsx: {
      importSource: 'vjsc/html-runtime',
      attributes: 'html',
      host: { from: 'vjsc/html-runtime/jsx-runtime', name: 'Host' },
      scope: { from: 'vjsc/html-runtime/jsx-runtime', name: 'Scope' },
    },
  };
});

describe('componentTargetPlugin', () => {
  it('lowers defaults, structural rules, and source-backed rewrites through Rolldown', async () => {
    const source = await transform(`
      import * as $ from '@fixture/components';

      export function Poster({ src, children }: { src?: string; children?: unknown }) {
        return <$.Poster src={src}>{children}</$.Poster>;
      }

      export const play = <$.PlayButton className="play" />;
      export const thumbnail = <$.Slider.Thumbnail.Root className="thumb" />;
      export const popover = (
        <$.Popover.Root open>
          <$.Popover.Trigger><button>Open</button></$.Popover.Trigger>
          <$.Popover.Popup placement="top"><span>Popup</span></$.Popover.Popup>
        </$.Popover.Root>
      );
    `);

    expect(source).toContain(`Poster as PosterPrimitive, PlayButton, Popover`);
    expect(source).toContain(`from "@fixture/react";`);
    expect(source).toContain('<PosterPrimitive render={children} src={src} />');
    expect(source).toContain('<PlayButton className="play" />');
    expect(source).toContain('<div className="thumb" />');
    expect(source).toContain(
      '<button>Open</button><Popover.Popup open placement="top"><span>Popup</span></Popover.Popup>'
    );
  });

  it('selects targets using the full query-bearing module identity', async () => {
    let selectedId: string | undefined;
    const source = await transform(
      `import { PlayButton } from '@fixture/components'; export const play = <PlayButton />;`,
      {
        targets: (module) => {
          selectedId = module.id;
          return module.params.get('target') === 'react' ? [reactTarget] : [];
        },
      }
    );

    expect(selectedId).toBe(MODULE_ID);
    expect(source).toContain('<PlayButtonPrimitive />');
  });

  it('shares runtime-scoped identifiers across parts of one component root', async () => {
    const source = await transform(
      `
        import * as $ from '@fixture/components';
        import type { MenuElement } from '@fixture/elements';
        export const menu = (
          <$.Menu.Root>
            <$.Menu.Trigger>Open</$.Menu.Trigger>
            <$.Menu.Content>Options</$.Menu.Content>
          </$.Menu.Root>
        );
      `,
      { targets: [htmlTarget] }
    );
    const commandFor = /commandfor="([^"]+)"/.exec(source)?.[1];
    const contentId = / id="([^"]+)"/.exec(source)?.[1];

    expect(commandFor).toBeDefined();
    expect(commandFor).toBe(contentId);
    expect(commandFor).toMatch(/^__vjsc-id-/);
    expect(source).toContain('import { Scope } from "vjsc/html-runtime/jsx-runtime";');
    expect(source).toContain('import "@fixture/elements";');
    expect(source).toContain('<Scope prefix=');
  });

  it('preserves wrappers around parts replaced by a component rewrite', async () => {
    const source = await transform(
      `
        import * as $ from '@fixture/components';
        const Decorator = ({ children }) => children;
        export const menu = (
          <$.Menu.Root>
            <Decorator><$.Menu.Trigger>Open</$.Menu.Trigger></Decorator>
            <$.Menu.Content>Options</$.Menu.Content>
          </$.Menu.Root>
        );
      `,
      { targets: [htmlTarget] }
    );

    expect(source).toContain('<Decorator><button commandfor="__vjsc-id-');
    expect(source).toContain('>Open</button></Decorator>');
    expect(source).toContain('<media-menu id="__vjsc-id-');
    expect(source).not.toContain('<$.');
  });

  it('collects compound parts through roots erased by the target', async () => {
    const source = await transform(
      `
        import * as $ from '@fixture/components';
        export const menu = (
          <$.Menu.Root>
            <$.OptionGroup.Root>
              <$.Menu.Trigger>Open</$.Menu.Trigger>
              <$.Menu.Content><$.OptionGroup.Options /></$.Menu.Content>
            </$.OptionGroup.Root>
          </$.Menu.Root>
        );
      `,
      { targets: [htmlTarget] }
    );
    const commandFor = /commandfor="([^"]+)"/.exec(source)?.[1];
    const contentId = / id="([^"]+)"/.exec(source)?.[1];

    expect(commandFor).toMatch(/^__vjsc-id-/);
    expect(commandFor).toBe(contentId);
    expect(source).toContain('>Open</button>');
    expect(source).toContain('<media-optiongroup />');
    expect(source).not.toContain('OptionGroup.Root');
    expect(source).not.toContain('<$.');
  });

  it('rejects replacements that would duplicate one source branch', async () => {
    await expect(
      transform(
        `
          import * as $ from '@fixture/components';
          const Decorator = ({ children }) => children;
          export const menu = (
            <$.Menu.Root>
              <Decorator>
                <$.Menu.Trigger>Open</$.Menu.Trigger>
                <$.Menu.Content>Options</$.Menu.Content>
              </Decorator>
            </$.Menu.Root>
          );
        `,
        { targets: [htmlTarget] }
      )
    ).rejects.toThrow('replacing both parts would duplicate their shared wrapper');
  });

  it('preserves SVG attribute spelling in HTML target output', async () => {
    const source = await transform(`import * as $ from '@fixture/components'; export const icon = <$.PlayButton />;`, {
      targets: [htmlTarget],
    });

    expect(source).toContain(
      '<svg viewBox="0 0 18 18" preserveAspectRatio="xMidYMid meet" stroke-width={2} xlink:href="#icon" />'
    );
  });

  it('preserves component prop names when forwarding HTML host props', async () => {
    const source = await transform(
      `
        import * as $ from '@fixture/components';
        const CustomPoster = (props) => <img {...props} />;
        export const poster = <$.Poster src="poster.jpg"><CustomPoster /></$.Poster>;
      `,
      { targets: [htmlTarget] }
    );

    expect(source).toMatch(/<CustomPoster\s+className="poster"\s+src="poster\.jpg"\s*\/>/);
    expect(source).not.toContain('class="poster"');
  });

  it('lowers canonical components retained by an outer rewrite', async () => {
    const source = await transform(`
      import * as $ from '@fixture/components';
      export const poster = <$.Poster><$.PlayButton /></$.Poster>;
    `);

    expect(source).toContain('<Poster render={<PlayButton />} />');
    expect(source).not.toContain('<$.');
  });

  it('keeps fragments when a render prop contains multiple children', async () => {
    const source = await transform(`
      import * as $ from '@fixture/components';
      export const poster = (
        <$.Poster>
          <$.PlayButton />
          <span>Caption</span>
        </$.Poster>
      );
    `);

    expect(source).toContain('<Poster render={<>');
    expect(source).toContain('<PlayButton />');
    expect(source).toContain('<span>Caption</span>');
  });

  it('does not infer host delegation from trigger children', async () => {
    const source = await transform(`
      import * as $ from '@fixture/components';
      export const elementTrigger = <$.Menu.Root><$.Menu.Trigger><$.PlayButton /></$.Menu.Trigger></$.Menu.Root>;
      export const textTrigger = <$.Menu.Root><$.Menu.Trigger>Open</$.Menu.Trigger></$.Menu.Root>;
    `);

    expect(source).toContain('<Menu.Trigger><PlayButton /></Menu.Trigger>');
    expect(source).toContain('<Menu.Trigger>Open</Menu.Trigger>');
  });

  it('keeps nested component roots out of the parent part collection', async () => {
    const source = await transform(`
      import * as $ from '@fixture/components';
      export const popover = (
        <$.Popover.Root>
          <$.Popover.Trigger>Outer trigger</$.Popover.Trigger>
          <$.Popover.Popup>
            <$.Popover.Root>
              <$.Popover.Trigger>Inner trigger</$.Popover.Trigger>
              <$.Popover.Popup>Inner popup</$.Popover.Popup>
            </$.Popover.Root>
          </$.Popover.Popup>
        </$.Popover.Root>
      );
    `);

    expect(source.match(/<Popover\.Popup/g)).toHaveLength(2);
    expect(source).toContain('Outer trigger');
    expect(source).toContain('Inner trigger');
    expect(source).not.toContain('<$.');
  });

  it('places generated imports after module directives', async () => {
    const source = await transform(`
      'use client';
      import * as $ from '@fixture/components';
      export const play = <$.PlayButton />;
    `);

    const directive = source.indexOf(`'use client'`);
    const generatedImport = source.indexOf('from "@fixture/react"');

    expect(directive).toBeGreaterThanOrEqual(0);
    expect(generatedImport).toBeGreaterThanOrEqual(0);
    expect(directive).toBeLessThan(generatedImport);
  });
});

async function transform(
  source: string,
  options: { readonly targets?: ComponentTargetSelection } = {}
): Promise<string> {
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
    external: /^(?:@fixture\/|vjsc\/html-runtime\/)/,
    transform: { jsx: 'preserve' },
    plugins: [fixturePlugin(source), componentTargetPlugin({ targets: options.targets ?? [reactTarget] }), inspect],
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
