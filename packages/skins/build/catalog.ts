import { pascalCase } from '@videojs/utils/string';

import { type SkinName, type SkinStyle, skinStyles } from '../src/meta.ts';
import { skinDirectory, type SkinPreset, skinPreset } from './skin.ts';

/** Everything a consumer needs to address one published skin without re-deriving names from conventions. */
export interface SkinCatalogEntry {
  readonly name: SkinName;
  readonly theme: SkinStyle['theme'];
  readonly preset: SkinPreset;
  readonly media: 'audio' | 'video';
  readonly live: boolean;
  /** Human-readable label such as `Default Live Video`. */
  readonly label: string;
  /** Theme-independent component exported by the authored skin module, such as `VideoSkin`. */
  readonly exportName: string;
  /** Public React component name in `@videojs/react`, such as `NeutralVideoSkin`. */
  readonly component: string;
  /** Custom element tag names for the packaged CSS skin and the registry-installed Tailwind skin. */
  readonly tags: { readonly css: string; readonly tailwind: string };
  /** Shadcn registry item name. Theme selection belongs to the registry catalog URL. */
  readonly registryItem: string;
  /** Registry installation directory relative to the components path, such as `video`. */
  readonly directory: string;
}

function describe(name: SkinName): SkinCatalogEntry {
  const style = skinStyles[name];
  const preset = skinPreset(name);
  const neutral = style.theme === 'neutral';
  const cssTag = neutral ? `${preset}-neutral-skin` : `${preset}-skin`;

  return {
    name,
    theme: style.theme,
    preset,
    media: preset.endsWith('audio') ? 'audio' : 'video',
    live: preset.startsWith('live-'),
    label: `${pascalCase(style.theme)} ${preset.split('-').map(pascalCase).join(' ')}`,
    exportName: `${pascalCase(preset)}Skin`,
    component: `${neutral ? 'Neutral' : ''}${pascalCase(preset)}Skin`,
    tags: { css: cssTag, tailwind: `${cssTag}-tailwind` },
    registryItem: preset,
    directory: skinDirectory(name),
  };
}

/** Every published skin, in `skinStyles` order. */
export const skinCatalog: readonly SkinCatalogEntry[] = (Object.keys(skinStyles) as SkinName[]).map(describe);

export function skinCatalogEntry(name: SkinName): SkinCatalogEntry {
  const entry = skinCatalog.find((candidate) => candidate.name === name);
  if (!entry) throw new Error(`Unknown skin: \`${name}\`.`);

  return entry;
}
