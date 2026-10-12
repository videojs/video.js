import type { Graph, GraphModule } from '../../types';

export interface FixtureOptions {
  readonly iconSource?: (root: string) => string;
}

/**
 * Two skin roots, `a` and `b`, that each import a button, which imports an icon and a compiled stylesheet, and a label
 * whose source differs per root.
 */
export function fixtureGraph(options: FixtureOptions = {}): Graph {
  const modules = new Map<string, GraphModule>();
  const assets = new Map<string, string>();

  for (const root of ['a', 'b']) {
    const id = (path: string) => `/src/${path}?root=${root}`;
    const style = `virtual:vjsc/css/asset/${root}00000000000/button.css`;

    assets.set(style, `.button { color: ${root === 'a' ? 'red' : 'blue'}; }`);
    add(
      modules,
      id(`skin-${root}/root.tsx`),
      `skin-${root}/root.tsx`,
      `import { Button } from '../button';\nimport { Label } from '../label';\nexport const Root = [Button, Label];`,
      {
        '../button': id('button.tsx'),
        '../label': id('label.tsx'),
      }
    );
    add(
      modules,
      id('button.tsx'),
      'button.tsx',
      `import ${JSON.stringify(style).replaceAll('"', "'")};\nimport { Icon } from './icon';\nimport { h } from 'react';\nexport const Button = [Icon, h];`,
      {
        [style]: undefined,
        './icon': id('icon.tsx'),
        react: undefined,
      },
      [style]
    );
    add(modules, id('icon.tsx'), 'icon.tsx', options.iconSource?.(root) ?? `export const Icon = 'icon';`, {});
    add(modules, id('label.tsx'), 'label.tsx', `export const Label = '${root}';`, {});
  }

  return { root: '/src', modules, assets };
}

export function rootName(root: GraphModule): string {
  return root.id.slice(root.id.indexOf('root=') + 'root='.length);
}

export function roots(graph: Graph): GraphModule[] {
  return [...graph.modules.values()].filter((module) => module.sourcePath.endsWith('/root.tsx'));
}

function add(
  modules: Map<string, GraphModule>,
  id: string,
  sourcePath: string,
  source: string,
  imports: Readonly<Record<string, string | undefined>>,
  assets: readonly string[] = []
): void {
  modules.set(id, {
    id,
    filename: `/src/${sourcePath}`,
    sourcePath,
    params: {},
    source,
    imports: Object.entries(imports).map(([specifier, resolvedId]) => {
      const start = source.indexOf(`'${specifier}'`);

      return {
        specifier,
        kind: 'static' as const,
        start,
        end: start + specifier.length + 2,
        quote: "'",
        bindings: [],
        ...(resolvedId ? { resolvedId } : {}),
      };
    }),
    exports: [],
    styles: { files: assets.length ? ['button.css'] : [], assets },
    annotations: {},
  });
}
