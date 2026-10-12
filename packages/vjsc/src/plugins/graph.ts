import { globSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

import type { OutputBundle, Plugin, PluginContext } from 'rolldown';

import { analyzeModule } from '../ast/module-specifiers';
import type { ModuleMeta } from '../components/meta';
import { readModuleBuildMeta } from '../graph/build-meta';
import { type GraphModuleInput, finalizeGraph } from '../graph/finalize';
import type { GraphImport, Graph } from '../graph/types';
import { parseVirtualCssId, VIRTUAL_CSS_ID } from '../styles/virtual-css';
import { toArray } from '../utils/array';
import {
  moduleFilename,
  moduleId,
  normalizeResolvedId,
  parseModuleId,
  SCRIPT_MODULE_ID,
  type TransformModule,
} from '../utils/module-id';
import { isInsideRoot, toPosixPath } from '../utils/path';
import type { VariantCodec } from './variants';
import type { EntriesOptions } from './vjsc';

export interface GraphCapability<Node extends ModuleMeta = ModuleMeta, Variant = unknown> {
  readonly api: Graph<Node, Variant>;
  clear(): void;
  finalize(graph: Graph<Node, Variant>): void;
}

/** Create the stable plugin API object whose properties become available after `buildEnd`. */
export function createGraphCapability<Node extends ModuleMeta, Variant = unknown>(): GraphCapability<Node, Variant> {
  let graph: Graph<Node, Variant> | undefined;
  const current = (): Graph<Node, Variant> => {
    if (!graph) throw new Error('The VJSC graph is not available before buildEnd.');

    return graph;
  };

  return {
    api: {
      get root() {
        return current().root;
      },
      get modules() {
        return current().modules;
      },
      get assets() {
        return current().assets;
      },
    },
    clear() {
      graph = undefined;
    },
    finalize(value) {
      graph = value;
    },
  };
}

export interface GraphCaptureOptions<Node extends ModuleMeta, Variant> {
  /** Receives the finalized graph at the end of the build. */
  readonly capability: GraphCapability<Node, Variant>;
  readonly entries?: EntriesOptions<Variant> | undefined;
  /** Writes entry variants to module queries. Required when entries declare variants. */
  readonly codec?: VariantCodec<Variant> | undefined;
  /** The decoded variant of a captured module. */
  readonly variantOf?: ((module: TransformModule) => Variant | null) | undefined;
  /** Drop every JavaScript chunk from the output, as the graph is the build's only product. */
  readonly assetsOnly?: boolean | undefined;
  /** Source of a generated stylesheet an assets-only build left unbundled. */
  readonly cssSource?: ((id: string) => string | undefined) | undefined;
}

/** Capture selected entries and their finalized transformed dependencies for the `vjscPlugin` API. */
export function graphPlugin<Node extends ModuleMeta, Variant = never>(
  options: GraphCaptureOptions<Node, Variant>
): Plugin {
  const {
    capability,
    entries: entriesOptions,
    codec,
    variantOf = () => null,
    assetsOnly = false,
    cssSource = () => undefined,
  } = options;
  let root = resolveModulePath(entriesOptions?.root ?? process.cwd());
  const entries = new Map<string, { readonly filename: string; readonly params: Readonly<Record<string, string>> }>();
  const references = new Set<string>();
  const assets = new Map<string, string>();

  return {
    name: 'vjsc:graph',
    apply: 'build',
    options(options) {
      root = resolveModulePath(resolve(options.cwd ?? process.cwd(), entriesOptions?.root ?? '.'));
      return null;
    },
    buildStart() {
      capability.clear();
      entries.clear();
      references.clear();
      assets.clear();

      const files = entriesOptions ? discoverFiles(root, entriesOptions.include, entriesOptions.exclude) : [];

      for (const filename of files) {
        this.addWatchFile(filename);

        const variants = entriesOptions?.variants?.({ filename }) ?? [null];

        for (const variant of variants) {
          if (variant !== null && !codec) this.error('VJSC entry variants require the `variants` codec option.');

          const selection = variant === null ? {} : codec!.encode(variant);
          const id = moduleId(filename, selection);

          if (entries.has(id)) this.error(`VJSC entry is declared twice: \`${id}\`.`);

          entries.set(id, { filename, params: { ...selection } });
          references.add(this.emitFile({ type: 'chunk', id }));
        }
      }
    },
    transform: {
      order: 'pre',
      filter: { id: VIRTUAL_CSS_ID },
      handler(code, id) {
        assets.set(normalizeGraphId(id), code);

        return null;
      },
    },
    async buildEnd(error) {
      if (error) return;

      const candidates: string[] = [];

      for (const hostId of this.getModuleIds()) {
        const id = normalizeResolvedId(hostId);

        if (VIRTUAL_CSS_ID.test(id)) {
          const source = this.getModuleInfo(hostId)?.code;

          if (source !== null && source !== undefined && !assets.has(normalizeGraphId(id))) {
            assets.set(normalizeGraphId(id), source);
          }

          continue;
        }

        if (!SCRIPT_MODULE_ID.test(id)) continue;

        const parsed = parseModuleId(id);
        if (!isAbsolute(parsed.filename) || !isInsideRoot(root, parsed.filename)) continue;

        if (!entriesOptions && parsed.params.size === 0) continue;

        candidates.push(hostId);
      }

      // Rolldown lists modules in an order that varies with the checkout path, and consumers such as registry style
      // items follow graph order, so the graph captures modules in the order of their root-relative identities.
      candidates.sort((left, right) => {
        const [a, b] = [graphOrderKey(root, left), graphOrderKey(root, right)];

        return a < b ? -1 : a > b ? 1 : 0;
      });

      const modules = await Promise.all(
        candidates.map(async (hostId): Promise<GraphModuleInput<Node, Variant>> => {
          const id = normalizeResolvedId(hostId);
          const parsed = parseModuleId(id);
          const variant = variantOf(parsed);
          const entry = entries.get(id) ?? {
            filename: parsed.filename,
            params: Object.fromEntries(parsed.params),
          };
          const info = this.getModuleInfo(hostId);
          const source = info?.code;

          if (source === null || source === undefined) {
            this.error(`VJSC graph has no transformed output for \`${id}\`.`);
          }

          const analysis = analyzeModule(source, entry.filename);
          const references = analysis.imports;
          const buildMeta = readModuleBuildMeta(info?.meta);
          const styles = importedModuleStyles(references, buildMeta?.styleOrder);
          const imports = await Promise.all(
            references.map(async (reference): Promise<GraphImport> => {
              const resolved = await this.resolve(reference.specifier, id);
              const resolvedId = resolved ? normalizeResolvedId(resolved.id) : undefined;

              if (reference.specifier.startsWith('.') && !resolvedId) {
                this.error(
                  `VJSC graph cannot resolve relative import \`${reference.specifier}\` from \`${entry.filename}\`.`
                );
              }

              if (
                reference.specifier.startsWith('.') &&
                resolvedId &&
                isAbsolute(moduleFilename(resolvedId)) &&
                !isInsideRoot(root, moduleFilename(resolvedId))
              ) {
                this.error(
                  `VJSC graph relative import \`${reference.specifier}\` from \`${entry.filename}\` resolves outside the graph root.`
                );
              }

              return { ...reference, ...(resolvedId ? { resolvedId } : {}) };
            })
          );

          return {
            id,
            ...entry,
            source,
            imports,
            exports: analysis.exports,
            styles,
            annotations: buildMeta?.annotations ?? {},
            ...(variant !== null ? { variant } : {}),
            ...(buildMeta?.moduleMeta ? { meta: buildMeta.moduleMeta as unknown as Node } : {}),
          };
        })
      );

      // Stylesheets an assets-only build never bundles come straight from the style plugin that generated them.
      for (const module of modules) {
        for (const id of module.styles.assets) {
          const source = assets.has(id) ? undefined : cssSource(id);

          if (source !== undefined) assets.set(id, source);
        }
      }

      capability.finalize(finalizeGraph(root, modules, assets));
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        if (!assetsOnly) {
          removeEntryChunks(this, bundle, references);
          return;
        }

        for (const [fileName, output] of Object.entries(bundle)) {
          if (output.type === 'chunk') delete bundle[fileName];
        }
      },
    },
  } as Plugin & { readonly apply: 'build' };
}

function discoverFiles(
  root: string,
  include: string | readonly string[],
  exclude?: string | readonly string[]
): string[] {
  const patterns = toArray(include);
  const excluded = exclude ? toArray(exclude) : undefined;

  return [
    ...new Set(
      patterns.flatMap((pattern) =>
        globSync(pattern, { cwd: root, ...(excluded ? { exclude: excluded } : {}) }).map((filename) =>
          resolveModulePath(resolve(root, filename))
        )
      )
    ),
  ].sort();
}

/** A module's identity relative to the graph root, which is the same in every checkout. */
function graphOrderKey(root: string, hostId: string): string {
  const parsed = parseModuleId(normalizeResolvedId(hostId));

  return moduleId(toPosixPath(relative(root, parsed.filename)), parsed.params);
}

function normalizeGraphId(id: string): string {
  const normalized = normalizeResolvedId(id);

  return normalized.startsWith('\0') ? normalized.slice(1) : normalized;
}

/** Read exact generated stylesheet ownership from the final transformed imports. */
function importedModuleStyles(
  references: readonly GraphImport[],
  order: readonly string[] | undefined
): GraphModuleInput['styles'] {
  const assets = references
    .map(({ specifier }) => normalizeGraphId(specifier))
    .filter((specifier) => parseVirtualCssId(specifier)?.kind === 'asset');
  const files = assets.map((asset) => parseVirtualCssId(asset)!.fileName);

  // Keep import order: the style transform imports files in their declared cascade order.
  return { files: [...new Set(files)], assets: [...new Set(assets)], ...(order ? { order } : {}) };
}

function removeEntryChunks(context: PluginContext, bundle: OutputBundle, references: ReadonlySet<string>): void {
  const entryChunks = new Set([...references].map((reference) => context.getFileName(reference)));
  const owned = collectChunkDependencies(bundle, entryChunks);
  const retainedRoots = Object.values(bundle).flatMap((output) =>
    output.type === 'chunk' && !owned.has(output.fileName) ? [output.fileName] : []
  );
  const retained = collectChunkDependencies(bundle, retainedRoots);

  for (const fileName of owned) {
    if (!retained.has(fileName)) delete bundle[fileName];
  }
}

function collectChunkDependencies(bundle: OutputBundle, roots: Iterable<string>): Set<string> {
  const collected = new Set<string>();
  const visit = (fileName: string): void => {
    if (collected.has(fileName)) return;

    const output = bundle[fileName];
    if (output?.type !== 'chunk') return;

    collected.add(fileName);

    for (const dependency of [...output.imports, ...output.dynamicImports]) visit(dependency);
  };

  for (const root of roots) visit(root);

  return collected;
}

function resolveModulePath(path: string): string {
  try {
    return realpathSync(resolve(path));
  } catch {
    return resolve(path);
  }
}
