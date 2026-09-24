import { posix, resolve } from 'node:path';

import type { Plugin } from 'rolldown';

import type { ModuleMeta } from '../components/meta';
import { defineGraphPlugin } from '../graph/plugin';
import { analyzeGraph } from '../shadcn/analysis';
import { createShadcnRegistryFiles } from '../shadcn/registry';
import type { RegistryCatalog, VjscRegistryOptions } from '../shadcn/types';

export type { VjscRegistryOptions } from '../shadcn/types';

/**
 * Emit Shadcn registries from the finalized graph exposed by `vjscPlugin`. Catalogs share one analysis of the graph and
 * one formatting pass per distinct source, so adding a catalog does not repeat work the others already did.
 */
export function vjscRegistryPlugin<Node extends ModuleMeta, Variant = unknown>(
  options: VjscRegistryOptions<Node, Variant>
): Plugin {
  const { catalogs, ...shared } = options;
  const outputs = catalogs.map((catalog) => (catalog.output ? normalizeOutput(catalog.output) : ''));
  if (new Set(outputs).size !== outputs.length) throw new Error('Shadcn registry catalogs must use distinct outputs.');

  return defineGraphPlugin<Node, Variant>({
    name: 'vjsc:registry',
    async generate(graph) {
      const analysis = analyzeGraph(graph);
      const formatted = new Map<string, Promise<string>>();
      const format = (file: { readonly path: string; readonly content: string }): Promise<string> => {
        const key = `${file.path}\0${file.content}`;
        let result = formatted.get(key);

        if (!result) {
          result = Promise.resolve(shared.format!(file));
          formatted.set(key, result);
        }

        return result;
      };

      for (const [index, catalog] of catalogs.entries()) {
        const output = outputs[index]!;
        const files = await createShadcnRegistryFiles(graph, { ...shared, ...catalog }, analysis);

        for (const tailwind of catalogTailwindSources(catalog)) this.addWatchFile(resolve(graph.root, tailwind));

        for (const file of files) {
          this.emitFile({
            type: 'asset',
            fileName: output ? posix.join(output, file.path) : file.path,
            source: file.editable && shared.format ? await format(file) : file.content,
          });
        }
      }
    },
  });
}

function catalogTailwindSources<Node extends ModuleMeta, Variant>(catalog: RegistryCatalog<Node, Variant>): string[] {
  const themes = [...(catalog.styles?.theme ? [catalog.styles.theme] : []), ...(catalog.styles?.themes ?? [])];

  return themes.flatMap((theme) => (theme.tailwind ? [theme.tailwind] : []));
}

function normalizeOutput(path: string): string {
  const output = posix.normalize(path.replaceAll('\\', '/')).replace(/^\.\//, '');

  if (!output || output === '.' || output === '..' || posix.isAbsolute(output) || output.startsWith('../')) {
    throw new Error(`Shadcn registry output must be a non-empty relative path: \`${path}\`.`);
  }

  return output;
}
