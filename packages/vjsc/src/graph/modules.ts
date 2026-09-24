import { posix } from 'node:path';

import { replaceImportSpecifiers } from '../ast/module-specifiers';
import type { ModuleMeta } from '../components/meta';
import { isVirtualCssId } from '../styles/virtual-css';
import { stripScriptExtension } from '../utils/path';
import type { GraphImport, GraphModule, Graph } from './types';

export interface GraphImportContext<Node extends ModuleMeta = ModuleMeta, Variant = unknown> {
  readonly dependency?: GraphModule<Node, Variant> | undefined;
  readonly importer: GraphModule<Node, Variant>;
  readonly reference: GraphImport;
}

export interface TraverseModulesOptions<Module> {
  /** Whether to follow an import into a dependency. Every captured dependency is followed by default. */
  readonly follow?: ((dependency: Module, importer: Module) => boolean) | undefined;
  /**
   * `pre` lists each module before its dependencies; `post` lists dependencies first, so composed styles can follow the
   * modules they extend.
   */
  readonly order?: 'pre' | 'post' | undefined;
}

/** Visit the captured modules reachable from some roots, each once, through a module map. */
export function traverseModules<Module extends GraphModule<ModuleMeta, unknown>>(
  modules: ReadonlyMap<string, Module>,
  roots: Iterable<Module>,
  options: TraverseModulesOptions<Module> = {}
): Module[] {
  const visited = new Set<string>();
  const ordered: Module[] = [];

  const visit = (module: Module): void => {
    if (visited.has(module.id)) return;

    visited.add(module.id);

    if (options.order !== 'post') ordered.push(module);

    for (const reference of module.imports) {
      const dependency = reference.resolvedId ? modules.get(reference.resolvedId) : undefined;

      if (dependency && (options.follow?.(dependency, module) ?? true)) visit(dependency);
    }

    if (options.order === 'post') ordered.push(module);
  };

  for (const root of roots) visit(root);

  return ordered;
}

/** Collect one root module and every captured graph dependency reachable from it. */
export function collectModules<Node extends ModuleMeta, Variant>(
  graph: Graph<Node, Variant>,
  rootId: string
): GraphModule<Node, Variant>[] {
  const root = graph.modules.get(rootId);
  if (!root) throw new Error(`VJSC graph root module is missing: \`${rootId}\`.`);

  return traverseModules(graph.modules, [root]);
}

/** Rewrite imports from the references already captured in a finalized module graph. */
export function rewriteImports<Node extends ModuleMeta, Variant>(
  graph: Graph<Node, Variant>,
  module: GraphModule<Node, Variant>,
  resolveImport: (context: GraphImportContext<Node, Variant>) => string | undefined
): string {
  const replacements = module.imports.flatMap((reference) => {
    const dependency = reference.resolvedId ? graph.modules.get(reference.resolvedId) : undefined;
    const replacement = resolveImport({ dependency, importer: module, reference });

    return replacement && replacement !== reference.specifier ? [{ ...reference, replacement }] : [];
  });

  return replaceImportSpecifiers(module.source, replacements);
}

/** Build an extensionless relative module specifier between two generated module paths. */
export function relativeImport(importer: string, dependency: string): string {
  const path = stripScriptExtension(posix.relative(posix.dirname(importer), dependency));

  return path.startsWith('.') ? path : `./${path}`;
}

/** Remove generated stylesheet imports after their captured CSS has been emitted separately. */
export function stripStyleImports(source: string): string {
  return source
    .replace(/import\s+(["'])([^"']+)\1;?\s*/g, (statement, _quote, specifier: string) =>
      isVirtualCssId(specifier) ? '' : statement
    )
    .replace(/\n{3,}/g, '\n\n');
}
