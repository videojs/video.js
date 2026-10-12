export const SKINS = ['default', 'neutral', 'compat', 'scaffold'] as const;
export const PLATFORMS = ['html', 'react', 'cdn'] as const;
export const STYLINGS = ['css', 'tailwind'] as const;
/** Where a skin's code and styles come from: the framework packages, a Shadcn registry install, or the authored sources. */
export const SKIN_SOURCES = ['package', 'registry', 'authored'] as const;

export const PRELOAD_VALUES = ['none', 'metadata', 'auto'] as const;
export type PreloadValue = (typeof PRELOAD_VALUES)[number];
export const DEFAULT_PRELOAD: PreloadValue = 'metadata';

/** `auto` follows the operating system. */
export const COLOR_SCHEMES = ['auto', 'light', 'dark'] as const;
export type ColorScheme = (typeof COLOR_SCHEMES)[number];

/** `auto` follows the locale. */
export const TEXT_DIRECTIONS = ['auto', 'ltr', 'rtl'] as const;
export type TextDirection = (typeof TEXT_DIRECTIONS)[number];

// Any `{height}p`, not just the rungs `MediaResolution` names.
export const RESOLUTION_PATTERN = /^\d+p$/;

export const PREFER_PLAYBACK_VALUES = ['mse', 'native'] as const;
export type PreferPlaybackValue = (typeof PREFER_PLAYBACK_VALUES)[number];
