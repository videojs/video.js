import { rolldown } from 'rolldown';

import type { ModuleMeta } from '../components/meta';
import { renderedElementTypes } from '../html-runtime/jsx-runtime';
import { resolveHtmlRuntime } from '../html-runtime/resolve';
import { isVirtualCssId } from '../styles/virtual-css';
import { COMPONENT_SOURCE } from '../target/bindings';
import { scriptModuleType } from '../utils/module-id';
import type { Graph } from './types';

const entryId = '\0vjsc:module-graph-html-entry';
const emptyId = '\0vjsc:module-graph-html-empty';

type HtmlRenderProps = Readonly<Record<never, never>>;

export interface StaticHtmlEntry {
  /** Stable key used for the rendered result. */
  readonly name: string;
  /** VJSC graph module containing the component export. */
  readonly moduleId: string;
  /** Named component export to render. */
  readonly exportName: string;
}

export interface StaticHtmlOptions {
  /** Redirect an external import to a concrete source module. */
  readonly aliases?: ReadonlyMap<string, string> | undefined;
  /**
   * Replace imports that have no effect while rendering static markup, such as element registrations. The authoring
   * runtime and generated stylesheets are always replaced.
   */
  readonly empty?: ((specifier: string) => boolean) | undefined;
  /** Provide source for external modules needed only while rendering. */
  readonly modules?: ReadonlyMap<string, string> | undefined;
}

export interface StaticHtml {
  /** Static markup, one element per line. */
  readonly html: string;
  /** Every element type the markup contains, such as the custom elements a page must register. */
  readonly elements: ReadonlySet<string>;
}

/** Generate static markup for named HTML component exports by evaluating them from one finalized module graph. */
export async function generateStaticHtml<Node extends ModuleMeta>(
  graph: Graph<Node>,
  entries: readonly StaticHtmlEntry[],
  options: StaticHtmlOptions = {}
): Promise<ReadonlyMap<string, StaticHtml>> {
  const modules = graph.modules;
  const importResolutions = new Map<string, string>();
  const virtualModules = new Map<string, string>();

  for (const module of modules.values()) {
    for (const reference of module.imports) {
      if (reference.resolvedId) importResolutions.set(importKey(module.id, reference.specifier), reference.resolvedId);
    }
  }

  for (const [specifier, source] of options.modules ?? []) {
    virtualModules.set(virtualId(specifier), source);
  }

  const entrySource = entries
    .map((entry, index) => {
      if (!modules.has(entry.moduleId)) {
        throw new Error(`HTML module graph entry is missing: \`${entry.moduleId}\`.`);
      }

      return `export { ${entry.exportName} as render${index} } from ${JSON.stringify(entry.moduleId)};`;
    })
    .join('\n');

  const build = await rolldown({
    input: entryId,
    treeshake: true,
    plugins: [
      {
        name: 'vjsc:render-module-graph-html',
        resolveId(id, importer) {
          if (id === entryId || id === emptyId || modules.has(id) || virtualModules.has(id)) return id;

          const runtime = resolveHtmlRuntime(id);
          if (runtime) return runtime;

          if (id === COMPONENT_SOURCE || isVirtualCssId(id) || options.empty?.(id)) return emptyId;

          const resolved = importer ? importResolutions.get(importKey(importer, id)) : undefined;
          if (resolved && modules.has(resolved)) return resolved;

          const alias = options.aliases?.get(id);
          if (alias) return alias;

          if (options.modules?.has(id)) return virtualId(id);

          return null;
        },
        load(id) {
          if (id === entryId) return { code: entrySource, moduleType: 'js' };

          if (id === emptyId) return { code: 'export {};', moduleType: 'js' };

          const virtual = virtualModules.get(id);
          if (virtual !== undefined) return { code: virtual, moduleType: 'js' };

          const module = modules.get(id);
          if (!module) return null;

          return { code: module.source, moduleType: scriptModuleType(module.filename) };
        },
      },
    ],
  });

  try {
    const output = await build.generate({ codeSplitting: false, format: 'esm' });
    const chunks = output.output.filter((value) => value.type === 'chunk');

    if (chunks.length !== 1 || chunks[0]!.imports.length > 0) {
      const imports = chunks.flatMap((chunk) => chunk.imports).map((specifier) => `\`${specifier}\``);

      throw new Error(
        `HTML module graph renderer did not produce one self-contained module.${imports.length ? ` Unresolved imports: ${imports.join(', ')}.` : ''}\n` +
          'Recommendation: resolve each import with `aliases` or `modules`, or mark it `empty` when rendering ignores it.'
      );
    }

    const url = `data:text/javascript;base64,${Buffer.from(chunks[0]!.code).toString('base64')}`;

    // SAFETY: The module is assembled from the finalized module graph and explicit render-only dependencies above.
    const rendered = (await import(url)) as Readonly<
      Record<string, (props?: HtmlRenderProps) => { toString(): string }>
    >;

    return new Map(
      entries.map((entry, index) => {
        const render = rendered[`render${index}`];
        if (!render) throw new Error(`HTML module graph entry \`${entry.name}\` has no renderer export.`);

        const output = render({});

        return [entry.name, { html: formatHtml(String(output)), elements: renderedElementTypes(output) }] as const;
      })
    );
  } finally {
    await build.close();
  }
}

function importKey(importer: string, specifier: string): string {
  return `${importer}\0${specifier}`;
}

function virtualId(specifier: string): string {
  return `\0vjsc:module-graph-html-module:${specifier}`;
}

function formatHtml(html: string): string {
  return html.replace(/></g, '>\n<');
}
