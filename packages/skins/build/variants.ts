import { collectModules, type Graph, type GraphModule } from 'vjsc/graph';

import {
  isSkinName,
  type SkinMeta,
  type SkinModuleMeta,
  type SkinName,
  type SkinStyle,
  skinStyles,
} from '../src/meta.ts';
import { registryTargets } from './registry/targets.ts';
import { type SkinPreset, skinPreset, skinSourceDirectory } from './skin.ts';

export type SkinFramework = 'html' | 'react';
export type SkinStyling = 'css' | 'tailwind';

/**
 * One compilation of authored skin source. HTML output is always compiled for a skin because its CSS is scoped per
 * skin; React components also compile skin-free so the registry can publish them on their own.
 */
export interface SkinVariant {
  readonly target: SkinFramework;
  readonly style: SkinStyling;
  readonly theme: SkinStyle['theme'];
  readonly skin?: SkinName | undefined;
}

/** A finalized skin root module together with everything it composes. */
export interface SkinRoot {
  readonly root: SkinRootModule;
  readonly modules: readonly GraphModule<SkinModuleMeta>[];
  readonly preset: SkinPreset;
  readonly theme: SkinStyle['theme'];
}

export type SkinRootModule = GraphModule<SkinMeta & { readonly name: SkinName }> & {
  readonly meta: SkinMeta & { readonly name: SkinName };
};

const publishedSkins = Object.keys(skinStyles).filter(isSkinName);
const representativeSkins = {
  default: 'default-video',
  neutral: 'neutral-video',
} as const satisfies Record<Exclude<SkinStyle['theme'], 'compat'>, SkinName>;

/** The variants one authored module is compiled for. Skin-owned modules compile for their skin only. */
export function variantsFor(filename: string): readonly SkinVariant[] {
  const ownedSkin = publishedSkins.find((name) => filename.includes(`/skins/${skinSourceDirectory(name)}/`));

  return registryTargets.flatMap(({ framework, styling, theme }): SkinVariant[] => {
    if (ownedSkin) {
      return skinStyles[ownedSkin].theme === theme
        ? [{ target: framework, style: styling, theme, skin: ownedSkin }]
        : [];
    }

    // Compat publishes complete editable skins, without standalone UI registry items.
    if (theme === 'compat') return [];

    return framework === 'html'
      ? [{ target: framework, style: styling, theme, skin: representativeSkins[theme] }]
      : [{ target: framework, style: styling, theme }];
  });
}

/** Read a variant from a module's transform query, or `null` when the query does not describe one. */
export function parseVariant(parameters: URLSearchParams): SkinVariant | null {
  const target = parameters.get('target');
  const style = parameters.get('style');
  if ((target !== 'react' && target !== 'html') || (style !== 'tailwind' && style !== 'css')) return null;

  const theme = parameters.get('theme');
  if (theme !== 'compat' && theme !== 'default' && theme !== 'neutral') return null;

  const requested = parameters.get('skin');
  const skin = requested && isSkinName(requested) ? requested : undefined;
  if (requested && !skin) return null;

  if (skin && skinStyles[skin].theme !== theme) return null;

  if (!skin && target !== 'react') return null;

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

/** Collect every skin root compiled for one framework and styling, with its module closure, sorted by skin name. */
export function skinRoots(
  graph: Graph<SkinModuleMeta>,
  variant: Pick<SkinVariant, 'target' | 'style'> & Partial<Pick<SkinVariant, 'theme'>>
): SkinRoot[] {
  const roots = [...graph.modules.values()].filter(
    (module): module is SkinRootModule =>
      module.meta?.type === 'skin' &&
      isSkinName(module.meta.name) &&
      module.params.target === variant.target &&
      module.params.style === variant.style &&
      (variant.theme === undefined || module.params.theme === variant.theme) &&
      module.params.skin === module.meta.name
  );
  const expected = Object.values(skinStyles).filter(
    (skin) => variant.theme === undefined || skin.theme === variant.theme
  ).length;

  if (roots.length !== expected) {
    throw new Error(`Expected ${expected} ${variant.target} ${variant.style} Skin roots, received ${roots.length}.`);
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
