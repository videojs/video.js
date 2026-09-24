import { readFile } from 'node:fs/promises';

import type { Plugin } from 'rolldown';

import { withoutModuleBuildMeta } from '../graph/build-meta';
import {
  isScriptModule,
  moduleFilename,
  moduleId,
  parseModuleId,
  scriptModuleType,
  type TransformModule,
} from '../utils/module-id';

export interface ComponentModulesPluginOptions {
  readonly select?: ((module: TransformModule) => boolean | Promise<boolean>) | undefined;
  /**
   * The query a relative dependency compiles with when `importer` imports it. Defaults to the importer's whole query;
   * returning less lets a dependency that ignores part of it compile once for every importer.
   */
  readonly inherit?:
    | ((importer: TransformModule, filename: string) => URLSearchParams | Readonly<Record<string, string>>)
    | undefined;
}

/**
 * Carry a component transform query through relative runtime imports. Use before component transforms when one source
 * tree is built for multiple targets.
 *
 * @example
 *   An import from `entry.tsx?target=react` inherits its transform query:
 *   ```diff
 *   - icon.tsx
 *   + icon.tsx?target=react
 *   ```
 *
 * @param options - Controls which query-bearing modules participate.
 */
export function componentModulesPlugin(options: ComponentModulesPluginOptions = {}): Plugin {
  const selections = new Map<string, Promise<TransformModule | null>>();
  const selectedModule = (id: string): Promise<TransformModule | null> => {
    let selection = selections.get(id);

    if (!selection) {
      selection = selectModule(id, options.select);
      selections.set(id, selection);
    }

    return selection;
  };

  return {
    name: 'vjsc:component-modules',
    buildStart() {
      selections.clear();
    },
    resolveId: {
      order: 'pre',
      // A query-bearing id can be selected, and a relative one can inherit its importer's selection.
      filter: { id: /\?|^\./ },
      async handler(id, importer, resolveOptions) {
        // Only query-bearing ids can be selected, and only relative ids can inherit a selection.
        const relative = id.startsWith('.');
        if (!id.includes('?') && (!relative || !importer?.includes('?'))) return null;

        const selected = id.includes('?') ? await selectedModule(id) : null;
        const inherited = relative && importer?.includes('?') ? await selectedModule(importer) : null;
        if (!selected && (!inherited || !relative)) return null;

        const resolved = await this.resolve(selected?.filename ?? id, importer ? moduleFilename(importer) : undefined, {
          ...resolveOptions,
          skipSelf: true,
        });
        if (!resolved || resolved.external || !isScriptModule(resolved.id)) return resolved;

        const filename = moduleFilename(resolved.id);
        const params =
          selected?.params ?? (options.inherit ? options.inherit(inherited!, filename) : inherited!.params);

        // Each query is a module of its own. It keeps its file's resolver metadata, but as a copy without VJSC's facts:
        // sharing the file's object would let one variant's build facts leak into the others.
        return { ...resolved, id: moduleId(filename, params), meta: withoutModuleBuildMeta(resolved.meta) };
      },
    },
    async load(id) {
      const selected = id.includes('?') ? await selectedModule(id) : null;
      if (!selected) return null;

      this.addWatchFile(selected.filename);
      const code = await readFile(selected.filename, 'utf8');

      return {
        code,
        moduleType: scriptModuleType(selected.filename),
      };
    },
  };
}

async function selectModule(
  id: string,
  select: ComponentModulesPluginOptions['select']
): Promise<TransformModule | null> {
  const parsed = parseModuleId(id);

  return parsed.params.size > 0 && isScriptModule(id) && (select ? await select(parsed) : true) ? parsed : null;
}
