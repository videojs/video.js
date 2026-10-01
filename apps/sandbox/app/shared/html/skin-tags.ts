import type { Skin } from '@app/types';

/** The player preset a skin is built for, which is how the skins catalog and the framework packages name them. */
export type SkinPreset = 'video' | 'audio' | 'live-video' | 'live-audio';

export function skinPreset(player: 'video' | 'audio', live: boolean): SkinPreset {
  return live ? `live-${player}` : player;
}

/** The custom element the framework package registers for a skin, such as `video-neutral-skin`. */
export function packageSkinTag(preset: SkinPreset, skin: Skin): string {
  return skin === 'default' ? `${preset}-skin` : `${preset}-${skin}-skin`;
}

/**
 * The element the sandbox defines around a registry-installed template. Named the way the skins catalog records the
 * registry tag, so the two agree even though the html registry ships the CSS styling.
 */
export function registrySkinTag(preset: SkinPreset, skin: Skin): string {
  return `${packageSkinTag(preset, skin)}-tailwind`;
}

/** The element the sandbox defines around a compiled authored skin, one per styling since each is its own module. */
export function authoredSkinTag(preset: SkinPreset, skin: Skin, styling: 'css' | 'tailwind'): string {
  return `${packageSkinTag(preset, skin)}-authored-${styling}`;
}
