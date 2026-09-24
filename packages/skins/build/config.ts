import { resolve } from 'node:path';

import type { EntriesOptions, VariantModule, VjscPluginOptions } from 'vjsc/plugins';

import { isSkinName, type SkinModuleMeta } from '../src/meta.ts';
import { skinSourceOf, skinSourcePath, sourceDir } from './source.ts';
import { resolveSkinComponents, resolveSkinStyles } from './transform.ts';
import { type SkinVariant, skinVariants, variantsFor } from './variants.ts';

export const packageDir = resolve(import.meta.dirname, '..');
export const skinUtils = resolve(sourceDir, 'utils.ts');

export const skinEntries: EntriesOptions<SkinVariant> = {
  root: sourceDir,
  include: ['./components/**/*.tsx', './skins/**/skin.tsx', './utils.ts'],
  variants: ({ filename }) => (filename === skinUtils ? [null] : variantsFor(filename)),
};

/**
 * Metadata every skin module gets from its path, read once so no later step parses paths again: skins are named by
 * directory, and components by file, with their directory as the registry category.
 */
export function skinMetaDefaults(module: VariantModule<SkinVariant>): Readonly<Record<string, unknown>> {
  const source = skinSourceOf(module.filename);
  if (source.kind === 'skin' && source.file === 'skin.tsx') return { name: source.skin, type: 'skin' };

  if (source.kind === 'component') {
    const name = /(?:^|\/)([^/]+)\.tsx$/.exec(source.file)?.[1];
    if (name) return { name, type: 'component', category: source.category };
  }

  return {};
}

/** Check a skin module's merged metadata so registry and package writers can rely on its shape. */
export function validateSkinMeta(
  meta: Readonly<Record<string, unknown>>,
  module: VariantModule<SkinVariant>
): SkinModuleMeta {
  const path = skinSourcePath(module.filename);
  const fail = (problem: string): never => {
    throw new Error(`Skin module metadata in \`${path}\` ${problem}.`);
  };

  if (typeof meta.title !== 'string' || !meta.title) fail('needs a `title`');

  if (typeof meta.description !== 'string' || !meta.description) fail('needs a `description`');

  if (meta.type === 'skin') {
    if (!isSkinName(meta.name)) fail(`names an unknown skin \`${String(meta.name)}\``);
  } else if (meta.type === 'component') {
    if (typeof meta.category !== 'string') fail('needs a `category`');
  } else if (meta.type !== 'support') {
    fail(`has an unknown \`type\` \`${String(meta.type)}\``);
  }

  return meta as unknown as SkinModuleMeta;
}

/**
 * How every skins build compiles authored modules: the variant query codec, each variant's targets and styles, and
 * module metadata. The generate build and the Vite preset add only what their host needs.
 */
export const skinCompilerOptions = {
  variants: skinVariants,
  transform: { components: resolveSkinComponents, styles: resolveSkinStyles },
  meta: { defaults: skinMetaDefaults, validate: validateSkinMeta },
} satisfies Pick<VjscPluginOptions<SkinVariant, SkinModuleMeta>, 'variants' | 'transform' | 'meta'>;
