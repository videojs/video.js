import type { ImportReference } from '../ast/module-specifiers';
import type { ModuleMeta } from '../components/meta';

export interface GraphImport extends ImportReference {
  readonly resolvedId?: string | undefined;
}

export interface GraphModuleStyles {
  /** Style output files referenced by this module, in cascade order. */
  readonly files: readonly string[];
  /** Captured generated style assets referenced by this module, in cascade order. */
  readonly assets: readonly string[];
  /** The complete cascade order the module was compiled with, when its stylesheet options declare one. */
  readonly order?: readonly string[] | undefined;
}

export interface GraphModule<Node extends ModuleMeta = ModuleMeta, Variant = unknown> {
  /** Full host module ID, including its VJSC transform query. */
  readonly id: string;
  /** Absolute physical source filename. */
  readonly filename: string;
  /** Physical source path relative to the graph root. */
  readonly sourcePath: string;
  /** VJSC entry parameters used to produce this module. */
  readonly params: Readonly<Record<string, string>>;
  /** The compile variant the module's query selects, decoded with the plugin's `variants` codec. */
  readonly variant?: Variant | undefined;
  /** Final transformed source captured after the VJSC pipeline. */
  readonly source: string;
  readonly imports: readonly GraphImport[];
  /** Runtime names the final source exports, including `default`. */
  readonly exports: readonly string[];
  readonly styles: GraphModuleStyles;
  readonly meta?: Node | undefined;
  /** Facts target transforms recorded while compiling this module, keyed by the transform that owns them. */
  readonly annotations: Readonly<Record<string, unknown>>;
}

/**
 * Finalized transformed-module graph exposed by `vjscPlugin`. Each build finalizes a new graph; within one build its
 * maps are the same objects every time they are read, so consumers may key per-build caches on them.
 */
export interface Graph<Node extends ModuleMeta = ModuleMeta, Variant = unknown> {
  readonly root: string;
  readonly modules: ReadonlyMap<string, GraphModule<Node, Variant>>;
  readonly assets: ReadonlyMap<string, string>;
}
