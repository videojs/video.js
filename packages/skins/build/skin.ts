import { type SkinName, type SkinStyle, skinStyles } from '../src/meta.ts';

export const skinPresets = ['audio', 'live-audio', 'live-video', 'video'] as const;

export type SkinPreset = (typeof skinPresets)[number];
export type SkinTheme = SkinStyle['theme'];

/** Resolve the public preset shared by a default or Neutral Skin. */
export function skinPreset(name: SkinName): SkinPreset {
  const preset = name.replace(/^(?:compat|default|neutral|scaffold)-/, '');
  if (!isSkinPreset(preset)) throw new Error(`Unsupported Skin preset: \`${name}\`.`);

  return preset;
}

/** Directory of an authored skin relative to `src/skins`. */
export function skinSourceDirectory(name: SkinName): string {
  const { theme, preset } = skinStyles[name];

  return `${theme}/${preset}`;
}

/** Resolve the stable registry directory for a Skin preset. The selected catalog owns the theme. */
export function skinDirectory(name: SkinName): string {
  return skinPreset(name);
}

/** Runtime stylesheet entry carrying the shared, preset, and catalog theme tokens relative to `src/styles`. */
export function skinBaseStylesheet(preset: SkinPreset, theme: SkinTheme = 'default'): string {
  const media = skinMedia(preset);

  return `${media}/${theme === 'default' ? 'base' : theme}.css`;
}

/** Registry style item that owns one skin's exact stylesheet dependency closure. */
export function skinStyleItemName(preset: SkinPreset, theme: SkinTheme): string {
  const media = skinMedia(preset);

  return `_style-${media}${theme === 'default' ? '' : `-${theme}`}`;
}

export function isSkinPreset(value: string): value is SkinPreset {
  return skinPresets.some((preset) => preset === value);
}

function skinMedia(preset: SkinPreset): 'audio' | 'video' {
  return preset === 'audio' || preset === 'live-audio' ? 'audio' : 'video';
}
