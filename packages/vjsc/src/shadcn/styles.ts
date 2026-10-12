import { basename, posix, relative, resolve as resolvePath } from 'node:path';

import { isString } from '@videojs/utils/predicate';
import type { RegistryItem } from 'shadcn/schema';

import type { ModuleMeta } from '../components/meta';
import {
  bundleStyles,
  collectModules,
  type Graph,
  type GraphModule,
  readLocalCssImports,
  styleFileOrder,
} from '../graph';
import { toPosixPath } from '../utils/path';
import type { RegistryAnalysis } from './analysis';
import { buildManifest, type BuiltItem, registryFile, type RegistryFile } from './manifest';
import type { SourceItem } from './registry';
import type { RegistryCatalogOptions, RegistryStylesOptions, RegistryThemeOptions } from './types';
import { addUnique, normalizeGroup, normalizePath, validateRelativePath } from './validate';

export interface PreservedStyleFile {
  readonly source: string;
  readonly target: string;
}

interface StyleBuild<Meta extends ModuleMeta> {
  readonly kind: 'style';
  readonly group: string;
  readonly modules: readonly GraphModule<Meta>[];
  readonly target: string;
  readonly include?: readonly string[] | undefined;
  readonly files?: readonly PreservedStyleFile[] | undefined;
  readonly asset?: string | undefined;
}

export type StyleItem<Meta extends ModuleMeta> = RegistryItem & { readonly build: StyleBuild<Meta> };

/** One configured theme item with the files it installs, resolved once per catalog. */
export interface CatalogTheme {
  readonly options: RegistryThemeOptions;
  readonly name: string;
  /** Preserved editable files, or none when the theme bundles one stylesheet. */
  readonly files: readonly PreservedStyleFile[];
  /** Registry dependencies on the themes whose entries this theme's entry imports. */
  readonly dependencies: readonly string[];
}

/** Resolve every configured theme's name, files, and entry-derived dependencies. */
export async function resolveCatalogThemes<Meta extends ModuleMeta>(
  graph: Graph<Meta>,
  options: RegistryCatalogOptions<Meta>
): Promise<CatalogTheme[]> {
  const themes = registryThemes(options.styles);
  const entries = new Map(
    themes.flatMap((theme) => (theme.entry ? [[resolvePath(graph.root, theme.entry), theme] as const] : []))
  );

  return Promise.all(
    themes.map(async (theme): Promise<CatalogTheme> => {
      const name = themeItemName(theme);

      if ([theme.entry, theme.include, theme.files].filter(Boolean).length > 1) {
        throw new Error(
          `Shadcn registry theme \`${name}\` must use only one of \`entry\`, \`include\`, and \`files\`.`
        );
      }

      const derived = theme.entry
        ? await entryFiles(graph.root, theme.entry, theme.target, entries, options.namespace)
        : { files: preservedStyleFiles(theme.files), dependencies: [] };

      if (derived.files.length > 0 && !derived.files.some((file) => file.target === theme.target)) {
        throw new Error(`Shadcn registry theme files do not include their target: \`${theme.target}\`.`);
      }

      return { options: theme, name, ...derived };
    })
  );
}

/** Theme items and the shared items for compiled style files used by source items. */
export async function describeStyleItems<Meta extends ModuleMeta>(
  graph: Graph<Meta>,
  sourceItems: readonly SourceItem<Meta>[],
  options: RegistryCatalogOptions<Meta>,
  themes: readonly CatalogTheme[],
  analysis: RegistryAnalysis<Meta>
): Promise<StyleItem<Meta>[]> {
  const styles = options.styles;
  if (!styles) return [];

  const items: StyleItem<Meta>[] = [];
  const relevantModules = new Map<string, GraphModule<Meta>>();

  for (const item of sourceItems) {
    if (item.build.stylesheet) continue;

    for (const module of collectModules(graph, item.build.module.id)) relevantModules.set(module.id, module);
  }

  for (const theme of themes) {
    const { target, entry: _entry, include, files: _files, name: _name, tailwind, ...manifest } = theme.options;

    if (tailwind) validateRelativePath(tailwind, 'Shadcn registry Tailwind source');

    const tailwindTheme = tailwind ? await analysis.tailwindTheme(tailwind) : undefined;
    const cssVars = tailwindTheme
      ? { ...manifest.cssVars, theme: { ...tailwindTheme.cssVars, ...manifest.cssVars?.theme } }
      : manifest.cssVars;
    const css = tailwindTheme ? { ...tailwindTheme.css, ...manifest.css } : manifest.css;
    const registryDependencies = [...new Set([...(manifest.registryDependencies ?? []), ...theme.dependencies])];

    items.push({
      name: theme.name,
      type: 'registry:style',
      ...manifest,
      ...(registryDependencies.length > 0 ? { registryDependencies } : {}),
      cssVars,
      css,
      build: { kind: 'style', group: 'support', modules: [], target, include, files: theme.files },
    });
  }

  for (const [asset, target] of styleFileEntries(relevantModules.values(), styles.files)) {
    const modules = [...relevantModules.values()].filter((module) => module.styles.files.includes(asset));
    if (modules.length === 0) continue;

    const label = basename(target, '.css');

    items.push({
      name: styleAssetItemName(asset),
      type: 'registry:style',
      title: `${options.name} ${label} styles`,
      description: `Shared ${label} styles installed with the source modules that use them.`,
      docs: 'Installed automatically with source modules that use these styles.',
      ...(styles.meta ? { meta: styles.meta } : {}),
      build: { kind: 'style', group: 'support', modules, target, asset },
    });
  }

  return items;
}

/**
 * An entry stylesheet and the local files it imports, preserved as editable files. Imports of another theme's entry
 * stop the walk and become registry dependencies, so each file installs with exactly one item.
 */
async function entryFiles(
  root: string,
  entry: string,
  target: string,
  entries: ReadonlyMap<string, RegistryThemeOptions>,
  namespace: string
): Promise<{ readonly files: PreservedStyleFile[]; readonly dependencies: string[] }> {
  validateRelativePath(entry, 'Shadcn registry theme entry');
  validateRelativePath(target, 'Shadcn registry theme target');

  const start = resolvePath(root, entry);
  const files = new Map<string, PreservedStyleFile>();
  const dependencies = new Set<string>();
  const visit = async (filename: string): Promise<void> => {
    const source = `./${toPosixPath(relative(root, filename))}`;
    if (files.has(source)) return;

    const installed = posix.join(
      posix.dirname(normalizePath(target)),
      toPosixPath(relative(resolvePath(start, '..'), filename))
    );

    validateRelativePath(installed, `Shadcn registry theme file \`${source}\` target`);
    files.set(source, { source, target: installed });

    for (const imported of await readLocalCssImports(filename, root)) {
      const owner = entries.get(imported);

      if (owner && imported !== start) dependencies.add(`${namespace}/${themeItemName(owner)}`);
      else await visit(imported);
    }
  };

  await visit(start);

  return {
    files: [...files.values()].sort((left, right) => left.target.localeCompare(right.target)),
    dependencies: [...dependencies].sort(),
  };
}

export async function buildStyleItem<Meta extends ModuleMeta>(
  item: StyleItem<Meta>,
  graph: Graph<Meta>,
  options: RegistryCatalogOptions<Meta>,
  analysis: RegistryAnalysis<Meta>
): Promise<BuiltItem> {
  if (item.build.files && item.build.files.length > 0) {
    const sourceFiles = new Map<string, string>();
    const files = await Promise.all(
      item.build.files.map(async (file): Promise<RegistryFile> => {
        const path = posix.join('files', item.name, normalizePath(file.target));
        const target = posix.join(normalizePath(options.paths.install), normalizePath(file.target));
        const content = await analysis.readFile(resolvePath(graph.root, file.source));

        addUnique(sourceFiles, path, content, 'source');
        return registryFile(path, target, 'registry:style');
      })
    );

    return {
      group: normalizeGroup(item.build.group),
      sourceFiles,
      manifest: buildManifest(item, options, files),
    };
  }

  const css = await registryStyles(
    item.name,
    item.build.modules,
    graph,
    item.build.include ?? [],
    item.build.asset,
    item.build.asset !== undefined
  );
  const target = posix.join(normalizePath(options.paths.install), normalizePath(item.build.target));
  const path = posix.join('files', item.name, basename(item.build.target));

  return {
    group: normalizeGroup(item.build.group),
    sourceFiles: new Map([[path, css]]),
    manifest: buildManifest(item, options, [registryFile(path, target, 'registry:style')]),
  };
}

/** The theme and compiled stylesheets one source item's root imports, and the style items that provide them. */
export function sourceStyleOutputs<Meta extends ModuleMeta>(
  modules: readonly GraphModule<Meta>[],
  item: SourceItem<Meta>,
  options: RegistryCatalogOptions<Meta>,
  themes: readonly CatalogTheme[]
): { readonly dependencies: string[]; readonly imports: string[] } {
  const styles = options.styles;
  const hasStyles = modules.some((module) => module.styles.files.length > 0 || module.styles.assets.length > 0);
  const theme = item.build.theme;
  const selections: readonly (true | string)[] =
    theme === undefined
      ? hasStyles && styles?.theme
        ? [true]
        : []
      : theme === false
        ? []
        : Array.isArray(theme)
          ? theme
          : [theme as true | string];
  if (!hasStyles && selections.length === 0) return { dependencies: [], imports: [] };

  const dependencies = new Set<string>();
  const targets = new Set<string>();

  for (const selection of selections) {
    const resolved = resolveRegistryTheme(styles, themes, selection, item.name);
    const themeTarget = selection === true ? resolved.options.target : selection;

    targets.add(themeTarget);

    if (themeTarget !== item.build.stylesheet?.target) dependencies.add(resolved.name);
  }

  if (item.build.stylesheet) {
    targets.add(item.build.stylesheet.target);
  } else {
    // Import files in cascade order so an install never loads an overriding file before the one it overrides.
    for (const filename of styleFileOrder(modules)) {
      const target = styleFileTarget(styles?.files, filename);
      if (!target) continue;

      targets.add(target);
      dependencies.add(styleAssetItemName(filename));
    }
  }

  return { dependencies: [...dependencies].sort(), imports: [...targets] };
}

export function registryStyles<Meta extends ModuleMeta>(
  label: string,
  modules: readonly GraphModule<Meta>[],
  graph: Graph<Meta>,
  supplemental: readonly string[],
  asset?: string,
  includeAssets = true
): Promise<string> {
  for (const path of supplemental) validateRelativePath(path, `Shadcn item ${label} stylesheet file`);

  return bundleStyles(graph, modules, { label, files: supplemental, asset, includeAssets });
}

function styleFileEntries<Meta extends ModuleMeta>(
  modules: Iterable<GraphModule<Meta>>,
  files: RegistryStylesOptions['files']
): Array<readonly [string, string]> {
  if (!files) return [];

  if (!isString(files)) return Object.entries(files);

  const filenames = new Set<string>();

  for (const module of modules) {
    for (const filename of module.styles.files) filenames.add(filename);
  }

  return [...filenames].sort().map((filename) => [filename, styleFileTarget(files, filename)!]);
}

function styleFileTarget(files: RegistryStylesOptions['files'], filename: string): string | undefined {
  if (!files) return undefined;

  return isString(files) ? posix.join(files, filename) : files[filename];
}

function styleItemName(target: string): string {
  validateRelativePath(target, 'Shadcn registry style target');

  return `_style-${basename(target, '.css')}`;
}

function themeItemName(theme: RegistryThemeOptions): string {
  return theme.name ?? styleItemName(theme.target);
}

function registryThemes(styles: RegistryStylesOptions | undefined): readonly RegistryThemeOptions[] {
  return [...(styles?.theme ? [styles.theme] : []), ...(styles?.themes ?? [])];
}

function resolveRegistryTheme(
  styles: RegistryStylesOptions | undefined,
  themes: readonly CatalogTheme[],
  selection: true | string,
  itemName: string
): CatalogTheme {
  if (selection === true) {
    const primary = styles?.theme ? themes.find((theme) => theme.options === styles.theme) : undefined;

    if (!primary) {
      throw new Error(`Shadcn item \`${itemName}\` requests a primary registry theme, but none is configured.`);
    }

    return primary;
  }

  const matches = themes.filter(
    (theme) => theme.options.target === selection || theme.files.some((file) => file.target === selection)
  );

  if (matches.length === 0) {
    throw new Error(`Shadcn item \`${itemName}\` references an unknown registry theme target: \`${selection}\`.`);
  }

  if (matches.length > 1) {
    throw new Error(`Shadcn item \`${itemName}\` has an ambiguous registry theme target: \`${selection}\`.`);
  }

  return matches[0]!;
}

function preservedStyleFiles(files: RegistryThemeOptions['files']): PreservedStyleFile[] {
  if (!files) return [];

  return Object.entries(files)
    .map(([source, target]) => {
      validateRelativePath(source, 'Shadcn registry theme source');
      validateRelativePath(target, 'Shadcn registry theme target');

      return { source, target };
    })
    .sort((left, right) => left.target.localeCompare(right.target));
}

function styleAssetItemName(asset: string): string {
  validateRelativePath(asset, 'VJSC style asset');

  return `_style-${asset.slice(0, -'.css'.length).replaceAll('/', '-')}`;
}
