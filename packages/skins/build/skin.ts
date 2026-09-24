import { type SkinName, type SkinPreset, type SkinTheme, skinMedia, skinStyles } from '../src/meta.ts';

export { isSkinPreset, skinMedia, type SkinPreset, skinPresets, type SkinTheme } from '../src/meta.ts';

/** The preset of a skin, which also names its registry item and installation directory. */
export function skinPreset(name: SkinName): SkinPreset {
  return skinStyles[name].preset;
}

/** Directory of an authored skin relative to `src/skins`. */
export function skinSourceDirectory(name: SkinName): string {
  const { theme, preset } = skinStyles[name];

  return `${theme}/${preset}`;
}

/** Runtime stylesheet entry carrying the shared, preset, and catalog theme tokens relative to `src/styles`. */
export function skinBaseStylesheet(preset: SkinPreset, theme: SkinTheme = 'default'): string {
  return `${skinMedia(preset)}/${theme === 'default' ? 'base' : theme}.css`;
}

/** Registry style item that owns one skin's exact stylesheet dependency closure. */
export function skinStyleItemName(preset: SkinPreset, theme: SkinTheme): string {
  return `_style-${skinMedia(preset)}${theme === 'default' ? '' : `-${theme}`}`;
}
