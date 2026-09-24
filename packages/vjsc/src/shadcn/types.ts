import type { RegistryItem } from 'shadcn/schema';

import type { ModuleMeta } from '../components/meta';
import type { GraphModule, Graph } from '../graph';

type DistributiveOmit<Value, Key extends PropertyKey> = Value extends unknown ? Omit<Value, Key> : never;

type RegistryFile = NonNullable<RegistryItem['files']>[number];

/** Installed path of one module an item owns, relative to the installation directory. */
export type RegistryModulePlacement<Meta extends ModuleMeta = ModuleMeta, Variant = unknown> = (
  module: GraphModule<Meta, Variant>,
  root: GraphModule<Meta, Variant>
) => string;

export interface RegistryPaths {
  /** Registry installation directory, such as `@components/videojs`. */
  readonly install: string;
  /** Absolute module specifier for imports, such as `@/components/videojs`. */
  readonly import: string;
}

export interface RegistryStylesheetOutput {
  /** Installed path of the stylesheet bundled from this item's module closure. */
  readonly target: string;
  /** Additional authored CSS files relative to the VJSC graph root. */
  readonly include?: readonly string[] | undefined;
}

/** Public Shadcn fields and installation policy for one transformed graph module. */
export type RegistryModuleItem<Meta extends ModuleMeta = ModuleMeta, Variant = unknown> = DistributiveOmit<
  RegistryItem,
  'files'
> & {
  /** Included registry path, such as `components` or `blocks`. */
  readonly group: string;
  /** JavaScript directives prepended to the installed root module. */
  readonly directives?: readonly string[] | undefined;
  /** Root-module target relative to the configured installation directory. */
  readonly target: string;
  /**
   * Place every module the item owns. Without it, owned modules install beside the root at their source-relative paths,
   * and a module outside the root's directory is rejected so shared source cannot hide under compiler-shaped paths.
   * With it, the callback decides every path, including the root's, and owns that check.
   */
  place?(module: GraphModule<Meta, Variant>, root: GraphModule<Meta, Variant>): string;
  /** Installed filename for the root module. Defaults to its source filename. */
  readonly filename?: string | undefined;
  /** Import replacements applied while packaging this item. */
  readonly imports?: Readonly<Record<string, string>> | undefined;
  /** Item-specific installation and import roots. Defaults to the registry paths. */
  readonly paths?: Partial<RegistryPaths> | undefined;
  /** Bundle the module closure's generated CSS into one installed stylesheet. */
  readonly stylesheet?: RegistryStylesheetOutput | undefined;
  /**
   * Theme stylesheets the root imports. Omitted, it imports the primary theme when the item's modules carry styles;
   * `false` imports none, `true` always imports the primary theme, and a target or list names theme stylesheets.
   */
  readonly theme?: boolean | string | readonly string[] | undefined;
};

/** A file-backed Shadcn item which is not owned by one transformed graph module. */
export type RegistryCreatedItem = DistributiveOmit<RegistryItem, 'files'> & {
  /** Included registry path, such as `components` or `blocks`. */
  readonly group: string;
  /** Files installed with the item. Each carries its content, which is written beside the item's manifest. */
  readonly files?: readonly (RegistryFile & { readonly content: string })[] | undefined;
};

/** What an item callback receives. `Variant` is the one the graph's `vjscPlugin` decodes, so no callback casts it. */
export interface RegistryItemContext<Meta extends ModuleMeta = ModuleMeta, Variant = unknown> {
  readonly graph: Graph<Meta, Variant>;
  readonly module: GraphModule<Meta, Variant>;
}

export interface RegistryCreateContext<Meta extends ModuleMeta = ModuleMeta, Variant = unknown> {
  readonly graph: Graph<Meta, Variant>;
}

export interface RegistryItemsOptions<Meta extends ModuleMeta = ModuleMeta, Variant = unknown> {
  /** Publish one graph module as an item, or return `null` to leave it to the items that import it. */
  resolve?(
    context: RegistryItemContext<Meta, Variant>
  ): RegistryModuleItem<Meta, Variant> | null | Promise<RegistryModuleItem<Meta, Variant> | null>;
  /** Items that no single graph module owns, such as rendered templates. */
  create?(
    context: RegistryCreateContext<Meta, Variant>
  ): readonly RegistryCreatedItem[] | Promise<readonly RegistryCreatedItem[]>;
}

export type RegistryThemeOptions = DistributiveOmit<RegistryItem, 'files' | 'name' | 'type'> & {
  /** Registry item name. Defaults to the target filename prefixed with `_style-`. */
  readonly name?: string | undefined;
  /** Installed path of the shared theme stylesheet. */
  readonly target: string;
  /**
   * Authored CSS entry, relative to the VJSC graph root, installed at `target`. The item preserves the entry and every
   * local file it imports as separate editable files, stopping at the entries of other theme items, which become its
   * registry dependencies instead.
   */
  readonly entry?: string | undefined;
  /** Authored CSS files relative to the VJSC graph root, bundled into `target`. */
  readonly include?: readonly string[] | undefined;
  /** Authored CSS sources and installed targets to preserve as separate editable files. */
  readonly files?: Readonly<Record<string, string>> | undefined;
  /** Tailwind CSS source whose `@theme inline`, `@utility`, and `@custom-variant` rules extend the registry item. */
  readonly tailwind?: string | undefined;
};

export interface RegistryStylesOptions {
  /** Primary shared theme item imported when a source item sets `theme: true` or carries styles. */
  readonly theme?: RegistryThemeOptions | undefined;
  /** Additional theme items selected when a source item's `theme` names one of their stylesheet targets. */
  readonly themes?: readonly RegistryThemeOptions[] | undefined;
  /** Directory that receives compiled VJSC style files, or explicit installed paths by filename. */
  readonly files?: string | Readonly<Record<string, string>> | undefined;
  /** Metadata for the items the registry generates for compiled style files. */
  readonly meta?: RegistryItem['meta'];
}

/** One registry emitted from the shared graph, such as the catalog for one framework and theme. */
export interface RegistryCatalog<Meta extends ModuleMeta = ModuleMeta, Variant = unknown> {
  /** Directory below the Rolldown output root where this catalog is emitted. */
  readonly output?: string | undefined;
  readonly items: RegistryItemsOptions<Meta, Variant>;
  readonly styles?: RegistryStylesOptions | undefined;
  /** Metadata merged into every item of this catalog. */
  readonly meta?: RegistryItem['meta'];
}

/** Options every catalog of one registry shares. */
export interface RegistrySharedOptions {
  readonly name: string;
  readonly homepage: string;
  readonly namespace: string;
  readonly paths: RegistryPaths;
  /** Format each editable source before it is emitted. */
  readonly format?:
    | ((source: { readonly path: string; readonly content: string }) => string | Promise<string>)
    | undefined;
  /** Editable-source import strings whose installation specifier is exceptional. */
  readonly imports?: Readonly<Record<string, string>> | undefined;
  /** Exact package requirements used instead of bare discovered dependency names. */
  readonly packages?: Readonly<Record<string, string>> | undefined;
  /**
   * Packages whose dependencies must be listed in `packages`, such as the project's own workspace packages. An item
   * that depends on one without a pinned requirement fails the build instead of publishing a floating dependency.
   */
  readonly pinned?: ((packageName: string) => boolean) | undefined;
}

/** Options for one catalog, as `createShadcnRegistryFiles` receives them. */
export type RegistryCatalogOptions<Meta extends ModuleMeta = ModuleMeta, Variant = unknown> = RegistrySharedOptions &
  RegistryCatalog<Meta, Variant>;

export interface VjscRegistryOptions<
  Meta extends ModuleMeta = ModuleMeta,
  Variant = unknown,
> extends RegistrySharedOptions {
  /** Registries emitted from the graph. They share one analysis of it, so each module is examined once. */
  readonly catalogs: readonly RegistryCatalog<Meta, Variant>[];
}
