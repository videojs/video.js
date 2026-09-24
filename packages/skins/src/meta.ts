import type { ComponentMeta } from 'vjsc/components';

export interface SkinComponentMeta extends ComponentMeta {
  readonly type: 'component';
  readonly title: string;
  readonly description: string;
  /** Registry category, taken from the component's directory at build time. */
  readonly category: string;
}

export interface SkinMeta extends ComponentMeta {
  /** Validated against the published skins when the module compiles. */
  readonly name: SkinName;
  readonly type: 'skin';
  readonly title: string;
  readonly description: string;
}

/** A shared helper module installed as a dependency, never on its own. */
export interface SkinSupportMeta extends ComponentMeta {
  readonly type: 'support';
  readonly title: string;
  readonly description: string;
}

export type SkinModuleMeta = SkinComponentMeta | SkinMeta | SkinSupportMeta;

/** What a component module authors: `name`, `type`, and `category` come from its path at build time. */
export type SkinComponentDescription = Pick<SkinComponentMeta, 'title' | 'description'>;

/** What a skin module authors: `name` and `type` come from its path at build time. */
export type SkinDescription = Pick<SkinMeta, 'title' | 'description'>;

/** What a support module authors: it overrides the `component` type its path would give it. */
export type SkinSupportDescription = Pick<SkinSupportMeta, 'type' | 'title' | 'description'>;

/** Visual themes every preset ships in. */
export const skinThemes = ['default', 'neutral', 'compat', 'scaffold'] as const;

/** Player layouts every theme ships, in the order skins are listed. */
export const skinPresets = ['video', 'live-video', 'live-audio', 'audio'] as const;

export type SkinTheme = (typeof skinThemes)[number];
export type SkinPreset = (typeof skinPresets)[number];
export type SkinName = `${SkinTheme}-${SkinPreset}`;

/** Build-time styling identity of one skin: its CSS scope, theme, and preset. Keyed by skin name in `skinStyles`. */
export interface SkinStyle {
  readonly scope: string;
  readonly theme: SkinTheme;
  readonly preset: SkinPreset;
}

/** The CSS scope of a theme, or of one of its presets. Every skin renders inside its `.media-skin` host. */
export function skinScope(theme: SkinTheme, preset?: SkinPreset): string {
  return `.media-skin[data-theme="${theme}"]${preset ? `[data-preset="${preset}"]` : ''}`;
}

/** Every published skin: each preset in each theme. */
export const skinStyles: Readonly<Record<SkinName, SkinStyle>> = Object.fromEntries(
  skinPresets.flatMap((preset) =>
    skinThemes.map((theme) => [`${theme}-${preset}`, { scope: skinScope(theme, preset), theme, preset }] as const)
  )
) as Record<SkinName, SkinStyle>;

export function isSkinName(value: unknown): value is SkinName {
  return typeof value === 'string' && Object.hasOwn(skinStyles, value);
}

export function isSkinTheme(value: unknown): value is SkinTheme {
  return skinThemes.some((theme) => theme === value);
}

export function isSkinPreset(value: unknown): value is SkinPreset {
  return skinPresets.some((preset) => preset === value);
}

/** The media a preset plays: live and on-demand presets share their media's styles. */
export function skinMedia(preset: SkinPreset): 'audio' | 'video' {
  return preset === 'audio' || preset === 'live-audio' ? 'audio' : 'video';
}
