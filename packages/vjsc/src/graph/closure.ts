import { createHash } from 'node:crypto';

import type { ModuleMeta } from '../components/meta';
import { isVirtualCssId } from '../styles/virtual-css';
import { stripStyleImports } from './modules';
import type { Graph, GraphModule } from './types';

export interface ClosureKeyOptions {
  /**
   * Whether a module's compiled CSS assets count toward its identity. Outputs that ship each module's styles with it
   * need them; outputs that bundle styles separately do not.
   */
  readonly styles?: boolean | undefined;
}

/**
 * Key each module by its own source together with the keys of every module it imports. Two modules with one key are
 * interchangeable: a component whose source never changes between variants still differs once it renders a dependency
 * that does. Keys are hashed, so their size does not grow with the number of import paths.
 */
export function createClosureKeys<Node extends ModuleMeta, Variant>(
  graph: Graph<Node, Variant>,
  options: ClosureKeyOptions = {}
): (module: GraphModule<Node, Variant>) => string {
  const keys = new Map<string, string>();
  const visiting = new Set<string>();

  const closureKey = (module: GraphModule<Node, Variant>): string => {
    const known = keys.get(module.id);
    if (known !== undefined) return known;

    // A cycle contributes its entry point's identity; the modules on the cycle still key on their own sources.
    if (visiting.has(module.id)) return `cycle:${module.sourcePath}`;

    visiting.add(module.id);

    const hash = createHash('sha256').update(module.sourcePath).update('\0').update(stripStyleImports(module.source));

    if (options.styles) {
      for (const asset of module.styles.assets.map((id) => graph.assets.get(id) ?? id).sort()) {
        hash.update('\0').update(asset);
      }
    }

    for (const reference of module.imports) {
      // Stylesheet imports count through the compiled assets above, and only when styles are requested.
      if (isVirtualCssId(reference.specifier)) continue;

      const dependency = reference.resolvedId ? graph.modules.get(reference.resolvedId) : undefined;

      hash.update('\0').update(dependency ? closureKey(dependency) : `external:${reference.specifier}`);
    }

    const key = hash.digest('base64url');

    visiting.delete(module.id);
    keys.set(module.id, key);

    return key;
  };

  return closureKey;
}
