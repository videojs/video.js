import type { Plugin } from 'rolldown';

import type { ComponentMeta, ModuleMeta } from '../components/meta';
import type { Graph } from '../graph/types';
import type { CandidateManifestOptions } from '../styles/candidates';
import type { StyleTransformOptions } from '../styles/options';
import type { ComponentTarget } from '../target/definition';
import type { TransformModule } from '../utils/module-id';
import { componentMetaPlugin } from './component-meta';
import { componentModulesPlugin } from './component-modules';
import type { ComponentTargetSelection } from './component-target';
import { createGraphCapability, graphPlugin } from './graph';
import { htmlRuntimePlugin } from './html-runtime';
import { stylePlugin, type StylePluginDiagnostics, type StylePluginLifecycle } from './style';
import { targetFinalizePlugin } from './target-finalize';
import { targetLowerPlugin } from './target-lower';
import { targetSourcePlugin } from './target-source';
import { createVariantReader, type SourceEntry, type VariantCodec, type VariantModule } from './variants';

export interface EntriesOptions<Variant = never> {
  readonly root: string;
  readonly include: string | readonly string[];
  readonly exclude?: string | readonly string[] | undefined;
  /**
   * The variants each discovered entry compiles for, written to its query with the plugin's `variants` codec. `null`
   * compiles the entry once as plain source. Every entry compiles once as plain source when this is omitted.
   */
  variants?(entry: SourceEntry): readonly (Variant | null)[];
}

export interface TransformOptions<Variant = never> {
  components(module: VariantModule<Variant>): readonly ComponentTarget[] | null;
  styles(module: VariantModule<Variant>): StyleTransformOptions | null | Promise<StyleTransformOptions | null>;
}

export interface MetaOptions<Variant = never, Meta extends ModuleMeta = ModuleMeta> {
  /**
   * Metadata every selected module starts from, typically derived from its path. An authored `meta` export overrides
   * these fields; a module with neither a default `name` nor a `meta` export carries no metadata.
   */
  defaults?(module: VariantModule<Variant>): Readonly<Record<string, unknown>>;
  /**
   * Check a module's merged metadata, throwing when it is incomplete, and return it in the project's metadata shape,
   * which the graph's modules then carry.
   */
  validate?(meta: Readonly<Record<string, unknown>>, module: VariantModule<Variant>): Meta & ComponentMeta;
}

export interface VjscPluginOptions<Variant = never, Meta extends ModuleMeta = ModuleMeta> {
  readonly entries?: EntriesOptions<Variant> | undefined;
  /** How compile variants are written to and read from module queries. Transforms receive the decoded variant. */
  readonly variants?: VariantCodec<Variant> | undefined;
  readonly transform: TransformOptions<Variant>;
  readonly meta?: MetaOptions<Variant, Meta> | undefined;
  /**
   * Write every resolved style utility as a Tailwind `@source inline()` entry so scanning sees computed candidates
   * instead of raw style modules. `true` writes the manifest to the Vite cache directory and aliases it as
   * `vjsc:candidates` for Tailwind entries to import; a string sets an explicit path instead.
   */
  readonly candidates?: string | boolean | CandidateManifestOptions | undefined;
  /**
   * The build exists only to capture the graph for plugins that emit assets from it, such as registries: every
   * JavaScript chunk, including a bundler's required placeholder entry, is dropped from the output.
   */
  readonly assetsOnly?: boolean | undefined;
}

/**
 * Create the ordered compiler passes for query-selected component modules. Use this as the default VJSC integration for
 * Rolldown-compatible builds.
 *
 * @param options - Resolves targets and styles once for each module identity.
 */
export function vjscPlugin<Node extends ModuleMeta = ModuleMeta, Variant = never>(
  options: VjscPluginOptions<Variant, Node>
): Plugin[] {
  return createPluginPipeline<Node, Variant>(options);
}

export function createPluginPipeline<Node extends ModuleMeta = ModuleMeta, Variant = never>(
  options: VjscPluginOptions<Variant, Node>,
  styleLifecycle?: StylePluginLifecycle,
  diagnostics: StylePluginDiagnostics = false
): Plugin[] {
  const graph = createGraphCapability<Node, Variant>();
  const codec = options.variants;
  let readVariant = createVariantReader(options.variants);
  const componentTransforms = new Map<string, readonly ComponentTarget[] | null>();
  const styleTransforms = new Map<string, Promise<StyleTransformOptions | null>>();
  const components = (module: TransformModule): readonly ComponentTarget[] | null => {
    if (componentTransforms.has(module.id)) return componentTransforms.get(module.id) ?? null;

    const transform = options.transform.components(readVariant(module));

    componentTransforms.set(module.id, transform);
    return transform;
  };
  const styles = (module: TransformModule): Promise<StyleTransformOptions | null> => {
    const cached = styleTransforms.get(module.id);
    if (cached) return cached;

    const transform = Promise.resolve(options.transform.styles(readVariant(module)));

    styleTransforms.set(module.id, transform);
    return transform;
  };
  const targets: ComponentTargetSelection = components;
  const style = stylePlugin({
    transform: styles,
    diagnostics,
    lifecycle: styleLifecycle,
    candidates: options.candidates,
    external: options.assetsOnly,
  });

  return [
    {
      name: 'vjsc',
      api: graph.api as Graph,
      buildStart() {
        readVariant = createVariantReader(options.variants);
        componentTransforms.clear();
        styleTransforms.clear();
      },
    },
    componentModulesPlugin({
      select: async (module) => components(module) !== null || (await styles(module)) !== null,
      inherit: codec?.inherit && ((importer, filename) => inheritedParams(codec, readVariant(importer), filename)),
    }),
    htmlRuntimePlugin(),
    componentMetaPlugin({
      defaults: options.meta?.defaults && ((module) => options.meta!.defaults!(readVariant(module))),
      validate: options.meta?.validate && ((meta, module) => options.meta!.validate!(meta, readVariant(module))),
    }),
    style,
    targetSourcePlugin({ targets }),
    targetLowerPlugin({ targets, root: options.entries?.root }),
    targetFinalizePlugin({ targets, root: options.entries?.root }),
    graphPlugin({
      capability: graph,
      entries: options.entries,
      codec,
      variantOf: (module) => readVariant(module).variant,
      assetsOnly: options.assetsOnly,
      cssSource: style.cssSource,
    }),
  ];
}

/**
 * The query a dependency inherits: the importer's, with its variant narrowed by the codec. Parameters the codec does
 * not encode belong to other tools and pass through unchanged.
 */
function inheritedParams<Variant>(
  codec: VariantCodec<Variant>,
  importer: VariantModule<Variant>,
  filename: string
): URLSearchParams | Readonly<Record<string, string>> {
  if (importer.variant === null || !codec.inherit) return importer.params;

  const params = new URLSearchParams(importer.params);

  for (const key of Object.keys(codec.encode(importer.variant))) params.delete(key);

  for (const [key, value] of Object.entries(codec.encode(codec.inherit(importer.variant, { filename })))) {
    params.set(key, value);
  }

  return params;
}
