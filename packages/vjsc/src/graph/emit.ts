import type { ModuleMeta } from '../components/meta';
import { createClosureKeys } from './closure';
import { collectModules, type GraphImportContext, relativeImport, rewriteImports } from './modules';
import type { Graph, GraphModule } from './types';

export interface EmitPlacement<Node extends ModuleMeta = ModuleMeta, Variant = unknown> {
  readonly module: GraphModule<Node, Variant>;
  /** The root whose closure reached the module. */
  readonly root: GraphModule<Node, Variant>;
  /**
   * Whether one output can serve every root: each root compiles this source identically, and everything it imports is
   * shared as well, so a shared output never imports a module placed for one particular root.
   */
  readonly shared: boolean;
}

export interface EmitImportContext<Node extends ModuleMeta = ModuleMeta, Variant = unknown> extends GraphImportContext<
  Node,
  Variant
> {
  /** Output path of the importing module. */
  readonly destination: string;
}

export interface EmitModulesOptions<Node extends ModuleMeta = ModuleMeta, Variant = unknown> {
  /** Modules whose import closures are emitted. */
  readonly roots: readonly GraphModule<Node, Variant>[];
  /** Output path of one module reached from one root. */
  place(placement: EmitPlacement<Node, Variant>): string;
  /**
   * Specifier for one import, or `undefined` to keep an external specifier and point a captured dependency at its
   * output path.
   */
  resolveImport?(context: EmitImportContext<Node, Variant>): string | undefined;
  /** Final rewrite of each emitted source, after its imports are resolved. */
  transform?(source: string, module: GraphModule<Node, Variant>): string;
  /** Whether compiled CSS assets count toward module equivalence. @default false */
  readonly styles?: boolean | undefined;
}

/**
 * Emit the module closures of several roots as files, writing each output once. Modules placed at one path must be
 * interchangeable; two different modules at one path are an error rather than a silent overwrite.
 */
export function emitModules<Node extends ModuleMeta, Variant>(
  graph: Graph<Node, Variant>,
  options: EmitModulesOptions<Node, Variant>
): ReadonlyMap<string, string> {
  const key = createClosureKeys(graph, { styles: options.styles });
  const closures = options.roots.map((root) => ({ root, modules: collectModules(graph, root.id) }));
  const shared = sharedSourcePaths(graph, closures, key);
  const placed = new Map<string, string>();
  const outputs = new Map<
    string,
    { readonly root: GraphModule<Node, Variant>; readonly module: GraphModule<Node, Variant> }
  >();

  for (const { root, modules } of closures) {
    for (const module of modules) {
      const destination = options.place({ module, root, shared: shared.has(module.sourcePath) });
      const existing = outputs.get(destination);

      if (existing && key(existing.module) !== key(module)) {
        throw new Error(
          `VJSC would emit two different modules to \`${destination}\`: \`${existing.module.id}\` and \`${module.id}\`.`
        );
      }

      placed.set(placementKey(root, module), destination);

      if (!existing) outputs.set(destination, { root, module });
    }
  }

  const emitted = new Map<string, string>();

  for (const [destination, { root, module }] of [...outputs].sort(([left], [right]) => left.localeCompare(right))) {
    const source = rewriteImports(graph, module, (context) => {
      const resolved = options.resolveImport?.({ ...context, destination });
      if (resolved !== undefined || !context.dependency) return resolved;

      const target = placed.get(placementKey(root, context.dependency));
      if (!target) throw new Error(`VJSC module \`${context.dependency.id}\` was not placed for \`${root.id}\`.`);

      return relativeImport(destination, target);
    });

    emitted.set(destination, options.transform ? options.transform(source, module) : source);
  }

  return emitted;
}

function placementKey(root: GraphModule<ModuleMeta, unknown>, module: GraphModule<ModuleMeta, unknown>): string {
  return `${root.id}\0${module.id}`;
}

/** Source paths every root compiles identically and whose imports are all shared too. */
function sharedSourcePaths<Node extends ModuleMeta, Variant>(
  graph: Graph<Node, Variant>,
  closures: readonly { readonly modules: readonly GraphModule<Node, Variant>[] }[],
  key: (module: GraphModule<Node, Variant>) => string
): ReadonlySet<string> {
  const keys = new Map<string, Set<string>>();
  const imports = new Map<string, Set<string>>();

  for (const { modules } of closures) {
    for (const module of modules) {
      const moduleKeys = keys.get(module.sourcePath) ?? new Set<string>();
      const imported = imports.get(module.sourcePath) ?? new Set<string>();

      moduleKeys.add(key(module));

      for (const reference of module.imports) {
        const dependency = reference.resolvedId ? graph.modules.get(reference.resolvedId) : undefined;

        if (dependency) imported.add(dependency.sourcePath);
      }

      keys.set(module.sourcePath, moduleKeys);
      imports.set(module.sourcePath, imported);
    }
  }

  const shared = new Set([...keys].filter(([, moduleKeys]) => moduleKeys.size === 1).map(([sourcePath]) => sourcePath));

  for (let changed = true; changed;) {
    changed = false;

    for (const sourcePath of [...shared]) {
      if ([...(imports.get(sourcePath) ?? [])].every((dependency) => shared.has(dependency))) continue;

      shared.delete(sourcePath);
      changed = true;
    }
  }

  return shared;
}
