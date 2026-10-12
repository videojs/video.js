import { basename, dirname, isAbsolute, posix, relative } from 'node:path';

import type { RegistryItem } from 'shadcn/schema';

import type { ModuleMeta } from '../components/meta';
import {
  type GraphModule,
  type Graph,
  relativeImport,
  rewriteImports,
  stripStyleImports,
  traverseModules,
} from '../graph';
import { escapesRoot, stripScriptExtension, toPosixPath } from '../utils/path';
import { analyzeGraph, type RegistryAnalysis } from './analysis';
import { assembleRegistry, buildManifest, type BuiltItem, registryFile, type ShadcnOutputFile } from './manifest';
import {
  buildStyleItem,
  type CatalogTheme,
  describeStyleItems,
  registryStyles,
  resolveCatalogThemes,
  sourceStyleOutputs,
} from './styles';
import type { RegistryCatalogOptions, RegistryModulePlacement, RegistryStylesheetOutput } from './types';
import {
  addUnique,
  assertNoCollision,
  normalizeGroup,
  normalizePath,
  validateItemName,
  validateRegistryPaths,
  validateRelativePath,
} from './validate';

export type { ShadcnOutputFile } from './manifest';

/** A leading `@jsxImportSource` pragma, which must stay the first comment of an emitted module. */
const JSX_IMPORT_SOURCE = /^(\/\*\*\s*@jsxImportSource\s+[^\s*]+\s*\*\/\s*)/;

/** The runtime a module's JSX pragma names, wherever the pragma appears; installs depend on it. */
const JSX_RUNTIME = /@jsxImportSource\s+([^\s*]+)/;

interface SourceBuild<Meta extends ModuleMeta> {
  readonly kind: 'source';
  readonly module: GraphModule<Meta>;
  readonly group: string;
  readonly directives: readonly string[];
  readonly target: string;
  readonly place?: RegistryModulePlacement<Meta> | undefined;
  readonly filename?: string | undefined;
  readonly imports?: Readonly<Record<string, string>> | undefined;
  readonly paths?: { readonly install?: string | undefined; readonly import?: string | undefined } | undefined;
  readonly stylesheet?: RegistryStylesheetOutput | undefined;
  readonly theme?: boolean | string | readonly string[] | undefined;
}

interface CreatedBuild {
  readonly kind: 'created';
  readonly group: string;
  readonly contents: ReadonlyMap<string, string>;
}

export type SourceItem<Meta extends ModuleMeta> = RegistryItem & { readonly build: SourceBuild<Meta> };
type CreatedItem = RegistryItem & { readonly build: CreatedBuild };

interface OwnedModule<Meta extends ModuleMeta> extends GraphModule<Meta> {
  readonly outputPath: string;
  readonly target: string;
}

interface PublishedModule<Meta extends ModuleMeta> {
  readonly module: GraphModule<Meta>;
  readonly item: SourceItem<Meta>;
}

/** Prepare one included Shadcn source registry from a finalized transformed-module graph. */
export async function createShadcnRegistryFiles<Meta extends ModuleMeta>(
  graph: Graph<Meta>,
  options: RegistryCatalogOptions<Meta>,
  analysis: RegistryAnalysis<Meta> = analyzeGraph(graph)
): Promise<ShadcnOutputFile[]> {
  validateRegistryPaths(options.paths, 'Shadcn registry');

  const sourceItems = await resolveSourceItems(graph, options);
  const createdItems = await createFileItems(graph, options);

  validateItems([...sourceItems, ...createdItems]);

  const published = describePublishedModules(graph.modules, sourceItems);
  const publications = canonicalPublishedModules(graph, published, analysis);
  const themes = await resolveCatalogThemes(graph, options);
  const styleItems = await describeStyleItems(graph, sourceItems, options, themes, analysis);
  const builtItems = await Promise.all([
    ...[...published.values()].map((publication) =>
      buildPublishedItem(publication, graph, publications, options, themes)
    ),
    ...styleItems.map((item) => buildStyleItem(item, graph, options, analysis)),
    ...createdItems.map((item) => buildCreatedItem(item, options)),
  ]);

  return assembleRegistry(builtItems, options);
}

async function resolveSourceItems<Meta extends ModuleMeta>(
  graph: Graph<Meta>,
  options: RegistryCatalogOptions<Meta>
): Promise<SourceItem<Meta>[]> {
  const resolve = options.items.resolve;
  if (!resolve) return [];

  const items: SourceItem<Meta>[] = [];

  for (const module of graph.modules.values()) {
    const resolved = await resolve({ graph, module });
    if (!resolved) continue;

    const { group, directives, target, place, filename, imports, paths, stylesheet, theme, ...item } = resolved;
    const build: SourceBuild<Meta> = {
      kind: 'source',
      module,
      group,
      directives: directives ?? [],
      target,
      ...(place ? { place } : {}),
      ...(filename ? { filename } : {}),
      ...(imports ? { imports } : {}),
      ...(paths ? { paths } : {}),
      ...(stylesheet ? { stylesheet } : {}),
      ...(theme !== undefined ? { theme } : {}),
    };

    items.push({ ...item, build } as SourceItem<Meta>);
  }

  return items;
}

async function createFileItems<Meta extends ModuleMeta>(
  graph: Graph<Meta>,
  options: RegistryCatalogOptions<Meta>
): Promise<CreatedItem[]> {
  const items = (await options.items.create?.({ graph })) ?? [];

  return items.map(({ group, ...item }) => {
    const contents = new Map<string, string>();
    const files = (item.files ?? []).map(({ content, ...file }) => {
      validateRelativePath(file.path, `Shadcn item ${item.name} file path`);

      const path = posix.join('files', item.name, normalizePath(file.path));

      addUnique(contents, path, content, 'source');
      return { ...file, path };
    });

    // Replacing `files` in place keeps the manifest's authored key order.
    return { ...item, ...(item.files ? { files } : {}), build: { kind: 'created', group, contents } } as CreatedItem;
  });
}

function describePublishedModules<Meta extends ModuleMeta>(
  modules: ReadonlyMap<string, GraphModule<Meta>>,
  items: readonly SourceItem<Meta>[]
): ReadonlyMap<string, PublishedModule<Meta>> {
  const published = new Map<string, PublishedModule<Meta>>();

  for (const item of items) {
    const module = modules.get(item.build.module.id);

    if (!module) {
      throw new Error(`Shadcn item \`${item.name}\` references an unknown module: \`${item.build.module.id}\`.`);
    }

    if (item.build.filename) validateRelativePath(item.build.filename, `Shadcn item ${item.name} filename`);

    published.set(module.id, { module, item });
  }

  return published;
}

/**
 * Map every unpublished module onto the published module it can stand in for. Two modules are interchangeable only when
 * their own source and styles match and every module they import is interchangeable too.
 */
function canonicalPublishedModules<Meta extends ModuleMeta>(
  graph: Graph<Meta>,
  published: ReadonlyMap<string, PublishedModule<Meta>>,
  analysis: RegistryAnalysis<Meta>
): ReadonlyMap<string, PublishedModule<Meta>> {
  const canonical = new Map(published);
  const byClosure = new Map<string, PublishedModule<Meta>[]>();

  // Catalogs that publish no source modules, such as rendered templates, need no closure keys at all.
  if (published.size === 0) return canonical;

  for (const publication of published.values()) {
    const key = analysis.closureKey(publication.module);

    byClosure.set(key, [...(byClosure.get(key) ?? []), publication]);
  }

  for (const module of graph.modules.values()) {
    if (canonical.has(module.id)) continue;

    const candidates = byClosure.get(analysis.closureKey(module));
    const publication = candidates?.length === 1 ? candidates[0] : undefined;

    if (publication) canonical.set(module.id, publication);
  }

  return canonical;
}

async function buildPublishedItem<Meta extends ModuleMeta>(
  publication: PublishedModule<Meta>,
  graph: Graph<Meta>,
  published: ReadonlyMap<string, PublishedModule<Meta>>,
  options: RegistryCatalogOptions<Meta>,
  themes: readonly CatalogTheme[]
): Promise<BuiltItem> {
  const { item, module: root } = publication;
  const publishedDependencies = new Set<string>();
  const owned = traverseModules(graph.modules, [root], {
    // A dependency another item publishes installs with that item, so its closure is not copied into this one.
    follow(dependency) {
      const dependencyPublication = published.get(dependency.id);
      if (dependency.id === root.id || !dependencyPublication) return true;

      publishedDependencies.add(dependencyPublication.item.name);
      return false;
    },
  });
  const layout = createLayout(root, owned, item, options);
  const styleOutputs = sourceStyleOutputs(owned, item, options, themes);
  const registryDependencies = new Set<string>([
    ...(item.registryDependencies ?? []),
    ...[...publishedDependencies].map((dependency) => `${options.namespace}/${dependency}`),
    ...styleOutputs.dependencies.map((dependency) => `${options.namespace}/${dependency}`),
  ]);
  const dependencies = new Set<string>(item.dependencies ?? []);
  const jsxImportSource = packageDependency(JSX_RUNTIME.exec(root.source)?.[1] ?? '');

  if (jsxImportSource) dependencies.add(jsxImportSource);

  const sourceFiles = new Map<string, string>();
  const files = [...layout.values()]
    .sort((left, right) => left.outputPath.localeCompare(right.outputPath))
    .map((module) => {
      const rewritten = rewriteModuleImports(module, layout, graph, published, item, options);

      for (const dependency of rewritten.dependencies) dependencies.add(dependency);

      const path = posix.join('files', item.name, module.outputPath);
      let source = stripStyleImports(rewritten.source);

      if (module.id === root.id) {
        for (const styleTarget of [...styleOutputs.imports].reverse()) {
          const stylesheetTarget = posix.join(normalizePath(options.paths.install), normalizePath(styleTarget));

          source = addStyleImport(source, relativeImport(module.target, stylesheetTarget));
        }

        source = addDirectives(source, item.build.directives);
      }

      addUnique(sourceFiles, path, source, 'source');
      return registryFile(path, module.target, item.type === 'registry:lib' ? 'registry:lib' : 'registry:component');
    });

  if (item.build.stylesheet) {
    const css = await registryStyles(item.name, owned, graph, item.build.stylesheet.include ?? []);
    const path = posix.join('files', item.name, basename(item.build.stylesheet.target));
    const target = posix.join(normalizePath(options.paths.install), normalizePath(item.build.stylesheet.target));

    addUnique(sourceFiles, path, css, 'source');
    files.push(registryFile(path, target, 'registry:style'));
  }

  return {
    group: normalizeGroup(item.build.group),
    sourceFiles,
    manifest: buildManifest(item, options, files, dependencies, registryDependencies),
  };
}

function buildCreatedItem<Meta extends ModuleMeta>(
  item: CreatedItem,
  options: RegistryCatalogOptions<Meta>
): BuiltItem {
  return {
    group: normalizeGroup(item.build.group),
    sourceFiles: item.build.contents,
    manifest: buildManifest(item, options, item.files ?? []),
  };
}

function addStyleImport(source: string, specifier: string): string {
  const statement = `import '${specifier}';\n`;

  return JSX_IMPORT_SOURCE.test(source)
    ? source.replace(JSX_IMPORT_SOURCE, `$1\n${statement}`)
    : `${statement}\n${source}`;
}

function addDirectives(source: string, directives: readonly string[]): string {
  if (directives.length === 0) return source;

  const statements = [...new Set(directives)].map((directive) => `${JSON.stringify(directive)};`).join('\n');

  return JSX_IMPORT_SOURCE.test(source)
    ? source.replace(JSX_IMPORT_SOURCE, `$1\n${statements}\n\n`)
    : `${statements}\n\n${source}`;
}

/**
 * Install each owned module beside the root at its source-relative path, or where the item places it. Without explicit
 * placement, a module outside the root's directory would install under a compiler-shaped path, so it is rejected.
 */
function createLayout<Meta extends ModuleMeta>(
  root: GraphModule<Meta>,
  modules: readonly GraphModule<Meta>[],
  item: SourceItem<Meta>,
  options: RegistryCatalogOptions<Meta>
): ReadonlyMap<string, OwnedModule<Meta>> {
  const layout = new Map<string, OwnedModule<Meta>>();
  const outputPaths = new Map<string, string>();
  const targets = new Map<string, string>();
  const place = item.build.place;
  const installRoot = normalizePath(item.build.paths?.install ?? options.paths.install);
  const rootTarget = installedTarget(item, item.build.target, installRoot);
  const rootFilename = normalizePath(item.build.filename ?? basename(root.sourcePath));

  for (const module of modules) {
    const relativeToEntry = toPosixPath(relative(dirname(root.filename), module.filename));
    const isRoot = module.id === root.id;

    if (!place && !isRoot && escapesRoot(relativeToEntry)) {
      throw new Error(
        `Shadcn item \`${item.name}\` reaches unowned module \`${module.sourcePath}\`. ` +
          `Reason: registry output cannot hide shared modules under compiler-shaped internal paths. ` +
          `Recommendation: publish reusable source as a private registry dependency, move source-owned dependencies beside their root, or place them explicitly.`
      );
    }

    const target = isRoot
      ? rootTarget
      : place
        ? installedTarget(item, place(module, root), installRoot)
        : posix.join(posix.dirname(rootTarget), relativeToEntry);
    const outputPath = place ? posix.relative(installRoot, target) : isRoot ? rootFilename : relativeToEntry;

    assertNoCollision(outputPaths, outputPath, module.id, 'output');
    assertNoCollision(targets, target, module.id, 'installation target');
    layout.set(module.id, { ...module, outputPath, target });
  }

  return layout;
}

function rewriteModuleImports<Meta extends ModuleMeta>(
  module: OwnedModule<Meta>,
  layout: ReadonlyMap<string, OwnedModule<Meta>>,
  graph: Graph<Meta>,
  published: ReadonlyMap<string, PublishedModule<Meta>>,
  item: SourceItem<Meta>,
  options: RegistryCatalogOptions<Meta>
): { source: string; dependencies: string[] } {
  const dependencies = new Set<string>();
  const source = rewriteImports(graph, module, ({ dependency, reference }) => {
    const configured = item.build.imports?.[reference.specifier] ?? options.imports?.[reference.specifier];
    if (configured) return configured;

    if (!dependency) {
      const packageName = reference.specifier.startsWith('virtual:')
        ? undefined
        : (packageDependency(reference.resolvedId ?? reference.specifier) ?? packageDependency(reference.specifier));

      if (packageName) dependencies.add(packageName);

      return undefined;
    }

    const ownedDependency = layout.get(dependency.id);
    if (ownedDependency) return relativeImport(module.target, ownedDependency.target);

    const publishedDependency = published.get(dependency.id);

    return publishedDependency ? publishedImport(publishedDependency, options) : undefined;
  });

  return { source, dependencies: [...dependencies].sort() };
}

function publishedImport<Meta extends ModuleMeta>(
  publication: PublishedModule<Meta>,
  options: RegistryCatalogOptions<Meta>
): string {
  validateRelativePath(publication.item.build.target, `Shadcn item ${publication.item.name} target`);

  return posix.join(
    publication.item.build.paths?.import ?? options.paths.import,
    stripScriptExtension(normalizePath(publication.item.build.target))
  );
}

function installedTarget<Meta extends ModuleMeta>(item: SourceItem<Meta>, target: string, installRoot: string): string {
  validateRelativePath(target, `Shadcn item ${item.name} target`);

  return posix.join(installRoot, normalizePath(target));
}

function validateItems<Meta extends ModuleMeta>(items: readonly (SourceItem<Meta> | CreatedItem)[]): void {
  const names = new Map<string, string>();
  const modules = new Map<string, string>();

  for (const item of items) {
    validateItemName(item.name);

    const owner = item.build.kind === 'source' ? item.build.module.id : item.build.kind;

    assertNoCollision(names, item.name, owner, 'item name');

    if (item.build.kind === 'source') {
      if (item.build.paths) validateRegistryPaths(item.build.paths, `Shadcn item ${item.name}`);

      assertNoCollision(modules, item.build.module.id, item.name, 'module publication');
    }
  }
}

function packageDependency(id: string): string | undefined {
  if (
    !id ||
    isAbsolute(id) ||
    id.startsWith('.') ||
    id.startsWith('/') ||
    id.startsWith('#') ||
    id.startsWith('@/') ||
    id.includes('://') ||
    id.startsWith('node:')
  ) {
    return undefined;
  }

  const segments = id.split('/');

  if (id.startsWith('@')) {
    return segments.length >= 2 && segments[0]!.length > 1 ? `${segments[0]}/${segments[1]}` : undefined;
  }

  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(segments[0]!) ? segments[0] : undefined;
}
