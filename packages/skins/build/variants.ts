import { collectModules, type Graph, type GraphModule } from 'vjsc/graph';
import { defineVariants, type SourceEntry } from 'vjsc/plugins';

import {
  isSkinName,
  type SkinMeta,
  type SkinModuleMeta,
  type SkinName,
  type SkinTheme,
  skinStyles,
  skinThemes,
} from '../src/meta.ts';
import { registryTargets } from './registry/targets.ts';
import { type SkinPreset, skinPreset } from './skin.ts';
import { skinSourceOf } from './source.ts';

export const skinFrameworks = ['html', 'react'] as const;
export const skinStylings = ['css', 'tailwind'] as const;

export type SkinFramework = (typeof skinFrameworks)[number];
export type SkinStyling = (typeof skinStylings)[number];

/**
 * One compilation of authored skin source. HTML output is always compiled for a skin because its CSS is scoped per
 * skin; React components also compile skin-free so the registry can publish them on their own.
 */
export interface SkinVariant {
  readonly target: SkinFramework;
  readonly style: SkinStyling;
  readonly theme: SkinTheme;
  readonly skin?: SkinName | undefined;
}

/** The graph the skins build compiles: validated skin metadata on each module, and the variant it compiled for. */
export type SkinGraph = Graph<SkinModuleMeta, SkinVariant>;

export type SkinGraphModule = GraphModule<SkinModuleMeta, SkinVariant>;

/** A finalized skin root module together with everything it composes. */
export interface SkinRoot {
  readonly root: SkinRootModule;
  readonly modules: readonly SkinGraphModule[];
  readonly preset: SkinPreset;
  readonly theme: SkinTheme;
}

export type SkinRootModule = SkinGraphModule & { readonly meta: SkinMeta };

const publishedSkins = Object.keys(skinStyles).filter(isSkinName);

/** One framework, styling, and theme the build compiles authored modules for. */
interface CompileTarget {
  readonly framework: SkinFramework;
  readonly styling: SkinStyling;
  readonly theme: SkinTheme;
}

/**
 * Everything the build compiles for: each registry catalog, then the CSS skins the framework packages ship for every
 * theme. Naming the packages' needs here keeps a catalog edit from silently dropping package output.
 */
const compileTargets: readonly CompileTarget[] = [
  ...new Map(
    [
      ...registryTargets,
      ...skinFrameworks.flatMap((framework) =>
        skinThemes.map((theme): CompileTarget => ({ framework, styling: 'css', theme }))
      ),
    ].map(({ framework, styling, theme }) => [`${framework}/${styling}/${theme}`, { framework, styling, theme }])
  ).values(),
];
const representativeSkins = {
  default: 'default-video',
  neutral: 'neutral-video',
} as const satisfies Record<Exclude<SkinTheme, 'compat' | 'scaffold'>, SkinName>;

/** The variants one authored module is compiled for. Skin-owned modules compile for their skin only. */
export function variantsFor(filename: string): readonly SkinVariant[] {
  const source = skinSourceOf(filename);
  const ownedSkin = source.kind === 'skin' ? source.skin : undefined;

  return compileTargets.flatMap(({ framework, styling, theme }): SkinVariant[] => {
    if (ownedSkin) {
      return skinStyles[ownedSkin].theme === theme
        ? [{ target: framework, style: styling, theme, skin: ownedSkin }]
        : [];
    }

    // Compat and Scaffold publish complete editable skins, without standalone UI registry items.
    if (theme === 'compat' || theme === 'scaffold') return [];

    return framework === 'html'
      ? [{ target: framework, style: styling, theme, skin: representativeSkins[theme] }]
      : [{ target: framework, style: styling, theme }];
  });
}

const VARIANT_PARAMS = ['target', 'style', 'theme', 'skin'] as const;

/**
 * Read a variant from a module's transform query. A query without any variant parameter belongs to another tool and
 * reads as `null`; a query that names a variant but is incomplete or inconsistent is an error, so the module is never
 * compiled as plain source by mistake.
 */
export function parseVariant(parameters: URLSearchParams): SkinVariant | null {
  if (!VARIANT_PARAMS.some((name) => parameters.has(name))) return null;

  const fail = (problem: string): never => {
    throw new Error(`Skin variant query \`?${parameters}\` ${problem}.`);
  };
  const target = parameters.get('target');
  const style = parameters.get('style');
  const theme = parameters.get('theme');
  const requested = parameters.get('skin');

  if (!isOneOf(skinFrameworks, target)) return fail('needs `target=react` or `target=html`');

  if (!isOneOf(skinStylings, style)) return fail('needs `style=css` or `style=tailwind`');

  if (!isOneOf(skinThemes, theme)) return fail(`needs a \`theme\` of ${skinThemes.join(', ')}`);

  if (requested !== null && !isSkinName(requested)) return fail(`names an unknown skin \`${requested}\``);

  const skin = requested ?? undefined;
  if (skin && skinStyles[skin].theme !== theme) return fail(`pairs skin \`${skin}\` with the wrong theme`);

  if (!skin && target !== 'react') return fail('needs a `skin`, because HTML output is scoped per skin');

  return skin ? { target, skin, style, theme } : { target, style, theme };
}

/** The query parameters that select a variant. */
export function variantParams(variant: SkinVariant): Readonly<Record<string, string>> {
  const parameters: Record<string, string> = {
    target: variant.target,
    style: variant.style,
    theme: variant.theme,
  };

  if (variant.skin) parameters.skin = variant.skin;

  return parameters;
}

/**
 * The variant a skin module's relative dependency compiles for. Reusable React components render the same for every
 * skin of a theme, so they compile once, skin-free, instead of once per skin that imports them.
 */
export function inheritVariant(variant: SkinVariant, dependency: SourceEntry): SkinVariant {
  if (variant.target !== 'react' || !variant.skin || skinSourceOf(dependency.filename).kind !== 'component') {
    return variant;
  }

  const { skin: _skin, ...skinFree } = variant;

  return skinFree;
}

/** How skin variants are written to and read from module queries. */
export const skinVariants = defineVariants<SkinVariant>({
  encode: variantParams,
  decode: parseVariant,
  inherit: inheritVariant,
});

/** Collect every skin root compiled for one framework and styling, with its module closure, sorted by skin name. */
export function skinRoots(
  graph: SkinGraph,
  variant: Pick<SkinVariant, 'target' | 'style'> & Partial<Pick<SkinVariant, 'theme'>>
): SkinRoot[] {
  const roots = [...graph.modules.values()].filter((module): module is SkinRootModule => {
    const compiled = module.variant;

    return (
      module.meta?.type === 'skin' &&
      compiled?.target === variant.target &&
      compiled.style === variant.style &&
      (variant.theme === undefined || compiled.theme === variant.theme) &&
      compiled.skin === module.meta.name
    );
  });
  const expected = publishedSkins.filter(
    (name) => variant.theme === undefined || skinStyles[name].theme === variant.theme
  );
  const missing = expected.filter((name) => !roots.some((root) => root.meta.name === name));

  if (missing.length > 0 || roots.length !== expected.length) {
    throw new Error(
      `Expected one ${variant.target} ${variant.style} Skin root for each of ${expected.join(', ')}; ` +
        `found ${roots.map((root) => root.meta.name).join(', ') || 'none'}.`
    );
  }

  return roots
    .map((root) => ({
      root,
      modules: collectModules(graph, root.id),
      preset: skinPreset(root.meta.name),
      theme: skinStyles[root.meta.name].theme,
    }))
    .sort((left, right) => left.root.meta.name.localeCompare(right.root.meta.name));
}

function isOneOf<const Value extends string>(values: readonly Value[], value: string | null): value is Value {
  return values.some((candidate) => candidate === value);
}
