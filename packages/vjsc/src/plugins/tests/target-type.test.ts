import { describe, expect, it } from 'vite-plus/test';

import { defineComponent, defineSchema } from '../../components/definition';
import { defineComponentTarget } from '../../target/definition';
import { targetFinalizePlugin } from '../target-finalize';
import { targetLowerPlugin } from '../target-lower';
import { targetSourcePlugin } from '../target-source';
import { lowerFixture } from './helpers/lower';

const schema = defineSchema('@fixture/components', {
  PlayButton: defineComponent({ name: 'PlayButton' }),
  Tooltip: defineComponent({
    name: 'Tooltip',
    parts: {
      Root: defineComponent(),
    },
  }),
  Menu: defineComponent({
    name: 'Menu',
    parts: {
      Trigger: defineComponent(),
    },
  }),
  Poster: defineComponent({
    name: 'Poster',
    root: 'Root',
    parts: {
      Root: defineComponent(),
      Image: defineComponent<{ src?: string | undefined }>(),
    },
  }),
});

const target = defineComponentTarget<typeof schema>()(({ element, imported }) => ({
  source: '@fixture/components',
  components: {
    resolve: ({ component, parts: [part] }) =>
      imported({
        from: '@fixture/react',
        name: component,
        path: part ? [part] : undefined,
        props: {
          from: '@fixture/react',
          name: component,
          path: [part ? `${part}Props` : 'Props'],
          children: component === 'Poster' && part === 'Image' ? 'render' : undefined,
        },
      }),
    rules: {
      Menu: {
        Trigger: () => undefined,
      },
    },
  },
  primitives: {
    Box: element('div', {
      props: { from: 'react', name: 'ComponentProps', intrinsic: 'div' },
    }),
  },
  types: {
    ClassNameValue: { from: 'clsx', name: 'ClassValue' },
    PropsOf: { from: 'react', name: 'ComponentProps' },
    VjscNode: { from: 'react', name: 'ReactNode' },
    VjscElement: { from: 'react', name: 'ReactElement' },
  },
  jsx: { importSource: 'react', attributes: 'react' },
}));

describe('lowerSourceTypes', () => {
  it('derives public props from the forwarded target and lowers source-only types', async () => {
    const source = await transform(`
      'use client';
      import * as $ from '@fixture/components';
      import * as TypeOnly from '@fixture/components';
      import { Box, type ClassNameValue, type Props, type PropsOf, type VjscNode } from 'vjsc/components';
      import { Local } from './local';
      import { setup } from './setup';
      import type { BuildOnly } from './build-only';

      export interface Alias extends PropsOf<typeof Local> {
        child?: VjscNode;
      }

      export type CanonicalType = typeof TypeOnly.Menu.Trigger;

      export interface NamedButtonProps extends BuildOnly {
        named?: boolean;
        className?: ClassNameValue;
      }

      export function NamedButton({ named, ...props }: Props<NamedButtonProps> = {}) {
        return <$.PlayButton {...props} />;
      }

      export function PlayButton(
        { custom, ...props }: Props<
          {
            custom?: boolean;
            VjscNode?: string;
            child?: VjscNode;
            popupClassName?: ClassNameValue;
            controlClassName?: PropsOf<typeof Local>['className'];
            tooltipClassName?: PropsOf<typeof $.Tooltip.Root>['className'];
            menuClassName?: PropsOf<typeof $.Menu.Trigger>['className'];
            label?: 'VjscNode';
          } & { nested?: { value: string } }
        > = {}
      ) {
        return <$.PlayButton {...props} />;
      }

      export function Panel({ className, ...props }: Props = {}) {
        return <Box className={className} {...props} />;
      }

      export function ButtonTooltip({ ...props }: Props = {}) {
        return <$.Tooltip.Root {...props} />;
      }
    `);

    expect(source).toContain('PlayButton as PlayButtonPrimitive');
    expect(source).toContain('Tooltip as TooltipPrimitive');
    expect(source).toContain('import type { ClassValue } from "clsx";');
    expect(source).toMatch(/import type \{ (?:ComponentProps, ReactNode|ReactNode, ComponentProps) \} from "react";/);
    expect(source).toContain('interface Alias extends NonNullable<ComponentProps<typeof Local>>');
    expect(source).toContain('child?: ReactNode;');
    expect(source).toContain('export interface NamedButtonProps extends Omit<PlayButtonPrimitive.Props, "children">');
    expect(source).toContain('named?: boolean;');
    expect(source).toContain('className?: ClassValue;');
    expect(source).toContain('{ named, ...props }: NamedButtonProps = {}');
    expect(source).toContain('export interface PlayButtonProps extends Omit<PlayButtonPrimitive.Props, "children">');
    expect(source).toContain('custom?: boolean');
    expect(source).toContain('VjscNode?: string');
    expect(source).toContain('child?: ReactNode');
    expect(source).toContain('popupClassName?: ClassValue');
    expect(source).toContain("controlClassName?: NonNullable<ComponentProps<typeof Local>>['className']");
    expect(source).toContain("tooltipClassName?: TooltipPrimitive.RootProps['className']");
    expect(source).toContain("menuClassName?: MenuPrimitive.TriggerProps['className']");
    expect(source).toContain(`label?: 'VjscNode'`);
    expect(source).toContain('nested?: { value: string }');
    expect(source).not.toContain('type VjscNode');
    expect(source).toContain('{ custom, ...props }: PlayButtonProps = {}');
    expect(source).toMatch(/}\n\nexport function PlayButton/);
    expect(source).toContain('export type PanelProps = Omit<ComponentProps<"div">, "children">');
    expect(source).toMatch(/export type PanelProps = [^\n]+;\n\nexport function Panel/);
    expect(source).toContain('export type ButtonTooltipProps = Omit<TooltipPrimitive.RootProps, "children">');
    expect(source).not.toContain('TooltipPrimitive.Root.RootProps');
    expect(source).not.toContain("from 'vjsc/components'");
    expect(source).not.toContain("from '@fixture/components'");
    expect(source).toContain('import type * as TypeOnly from "@fixture/components";');
    expect(source).toContain("import { setup } from './setup';");
    expect(source).not.toContain("from './build-only'");
    const directive = source.indexOf(`'use client'`);
    const typeImport = source.indexOf('import type');

    expect(directive).toBeGreaterThanOrEqual(0);
    expect(typeImport).toBeGreaterThanOrEqual(0);
    expect(directive).toBeLessThan(typeImport);
  });

  it('types children by the part that renders them', async () => {
    const source = await transform(`
      import * as $ from '@fixture/components';
      import { type PropsOf, type PropsWithChildren } from 'vjsc/components';

      export interface PosterProps {
        renderImage?: PropsOf<typeof $.Poster.Image>['children'];
      }

      export function Poster({ children, className, renderImage, ...props }: PropsWithChildren<PosterProps> = {}) {
        return (
          <$.Poster.Root className={className}>
            <$.Poster.Image {...props}>{renderImage}</$.Poster.Image>
            {children}
          </$.Poster.Root>
        );
      }
    `);

    expect(source).toContain(
      'export interface PosterProps extends Omit<PosterPrimitive.ImageProps, "children" | "render">'
    );
    expect(source).toContain('renderImage?: PosterPrimitive.ImageProps["render"];');
    expect(source).toContain('children?: PosterPrimitive.RootProps["children"];');
  });

  it('leaves children alone when the authored props declare them', async () => {
    const source = await transform(`
      import * as $ from '@fixture/components';
      import { type PropsWithChildren, type VjscElement } from 'vjsc/components';

      export interface FramedPosterProps {
        children: VjscElement;
      }

      export function FramedPoster({ children, ...props }: PropsWithChildren<FramedPosterProps>) {
        return (
          <$.Poster.Root {...props}>
            <$.Poster.Image>{children}</$.Poster.Image>
          </$.Poster.Root>
        );
      }
    `);

    expect(source).toContain('export interface FramedPosterProps extends Omit<Poster.RootProps, "children">');
    expect(source).toContain('children: ReactElement;');
    expect(source).not.toContain('children?:');
  });
});

describe('lowerSourceTypes props helpers', () => {
  it('matches Props by its imported name', async () => {
    const source = await transform(`
      import * as $ from '@fixture/components';
      import { type Props as ButtonHelper } from 'vjsc/components';
      interface Props { local: true }
      export function PlayButton({ ...props }: ButtonHelper = {}) {
        return <$.PlayButton {...props} />;
      }
      export function Local({ ...props }: Props) {
        return <$.PlayButton {...props} />;
      }
    `);

    expect(source).toContain('export type PlayButtonProps = Omit<PlayButtonPrimitive.Props, "children">;');
    expect(source).toContain('function PlayButton({ ...props }: PlayButtonProps = {})');
    expect(source).toContain('function Local({ ...props }: Props)');
    expect(source).not.toContain('LocalProps');
  });

  it('rejects a generated props name the module already declares', async () => {
    const input = `
      import * as $ from '@fixture/components';
      import type { Props } from 'vjsc/components';
      type PlayButtonProps = { legacy: true };
      export function PlayButton({ ...props }: Props = {}) {
        return <$.PlayButton {...props} />;
      }
    `;

    await expect(transform(input)).rejects.toMatchObject({
      errors: [
        {
          message: expect.stringContaining('VJSC needs to declare `PlayButtonProps`'),
          pos: input.indexOf('export function PlayButton'),
        },
      ],
    });
  });
});

function transform(source: string): Promise<string> {
  return lowerFixture(source, {
    plugins: [
      targetSourcePlugin({ targets: [target] }),
      targetLowerPlugin({ targets: [target] }),
      targetFinalizePlugin({ targets: [target] }),
    ],
  });
}
