import { kebabCaseName } from '@videojs/utils/string';
import { moduleExportName } from 'vjsc/ast';
import type { ComponentSchema } from 'vjsc/components';
import {
  type ComponentTarget,
  defineComponentTarget,
  htmlJsx,
  type SourceProps,
  type TargetTransform,
} from 'vjsc/target';
import { jsx } from 'vjsc/target/jsx-runtime';

import { iconNames } from './icon-names.ts';

export interface IconTargetOptions {
  readonly family?: string | undefined;
}

/** Annotation key under which the HTML icon target records the icons a compiled module registers. */
export const ICON_REGISTRATION = 'videojs/icon-registration';

/** The icons one compiled HTML module registers with `registerIcons`. */
export interface IconRegistration {
  readonly family: string;
  /** Icon element name to the export of the family's icon module that holds it, such as `play` to `playIcon`. */
  readonly icons: Readonly<Record<string, string>>;
}

/** Read the icon registration a compiled module's annotations carry, if it registers any icons. */
export function readIconRegistration(annotations: Readonly<Record<string, unknown>>): IconRegistration | undefined {
  return annotations[ICON_REGISTRATION] as IconRegistration | undefined;
}

/** The HTML icon module that exports one family's icons. */
export function htmlIconSource(family: string): string {
  return family === 'default' ? '@videojs/html/icons' : `@videojs/html/icons/${family}`;
}

const htmlIconNames: Readonly<Record<string, string>> = {
  AirPlayEnterIcon: 'airplay-enter',
  AirPlayExitIcon: 'airplay-exit',
};

export function createHtmlIconTarget(options: IconTargetOptions = {}): ComponentTarget<ComponentSchema> {
  const family = options.family ?? 'default';

  return defineComponentTarget<ComponentSchema>()(({ element }) => {
    const Icon = element('media-icon');

    return {
      source: '@videojs/icons/vjsc',
      components: {
        resolve:
          ({ component }) =>
          ({ props }: { props: SourceProps<Record<string, unknown>> }) =>
            jsx(Icon, {
              ...props,
              ...(family === 'default' ? {} : { family }),
              name: htmlIconName(component),
            }),
      },
      transforms: [iconRegistration(family)],
      jsx: htmlJsx,
    };
  });
}

export function createReactIconTarget(options: IconTargetOptions = {}): ComponentTarget<ComponentSchema> {
  const family = options.family ?? 'default';

  return defineComponentTarget<ComponentSchema>()(({ imported }) => ({
    source: '@videojs/icons/vjsc',
    components: {
      resolve: ({ component }) => {
        const source = family === 'default' ? '@videojs/react/icons' : `@videojs/react/icons/${family}`;
        const Icon = imported({
          from: source,
          name: component,
          props: { from: source, name: 'IconProps' },
        });

        return ({ props }: { props: SourceProps<Record<string, unknown>> }) => jsx(Icon, { ...props });
      },
    },
    jsx: {
      importSource: 'react',
      attributes: 'react',
    },
  }));
}

function iconRegistration(family: string): TargetTransform {
  return {
    name: `videojs:html-icons:${family}`,
    transform(context) {
      const declaration = context.ast.body.find(
        (statement) => statement.type === 'ImportDeclaration' && statement.source.value === '@videojs/icons/vjsc'
      );
      if (!declaration || declaration.type !== 'ImportDeclaration') return;

      const components = declaration.specifiers.flatMap((specifier) => {
        if (specifier.type !== 'ImportSpecifier' || specifier.importKind === 'type') return [];

        return [moduleExportName(specifier.imported)];
      });
      if (components.length === 0) return;

      const { imports } = context;
      const registerIcons = imports.reference({ from: '@videojs/html/icons', name: 'registerIcons' });
      const source = htmlIconSource(family);
      const icons = Object.fromEntries(
        components.map((component) => {
          const name = htmlIconName(component);

          return [name, `${iconNames(name).camel}Icon`];
        })
      );
      const entries = Object.entries(icons).map(
        ([name, exportName]) => `${JSON.stringify(name)}: ${imports.reference({ from: source, name: exportName })}`
      );

      imports.statement(`${registerIcons}(${JSON.stringify(family)}, { ${entries.join(', ')} });`);
      context.annotate(ICON_REGISTRATION, { family, icons } satisfies IconRegistration);
    },
  };
}

function htmlIconName(component: string): string {
  return htmlIconNames[component] ?? kebabCaseName(component.replace(/Icon$/, ''));
}
