import type { ComponentMeta } from 'vjsc/components';

export interface SkinComponentMeta extends ComponentMeta {
  readonly type: 'component';
  readonly title: string;
  readonly description: string;
}

export interface SkinMeta extends ComponentMeta {
  readonly type: 'skin';
  readonly title: string;
  readonly description: string;
}

/** Build-time styling identity of one skin: its CSS scope, theme, and preset. Keyed by skin name in `skinStyles`. */
export interface SkinStyle {
  readonly scope: string;
  readonly theme: 'compat' | 'default' | 'neutral';
  readonly preset: 'video' | 'audio' | 'live-video' | 'live-audio';
}

export type SkinModuleMeta = SkinComponentMeta | SkinMeta;

/** What a component module authors: `name` and `type` come from its path at build time. */
export type SkinComponentDescription = Pick<SkinComponentMeta, 'title' | 'description'>;

/** What a skin module authors: `name` and `type` come from its path at build time. */
export type SkinDescription = Pick<SkinMeta, 'title' | 'description'>;

export const skinStyles = {
  'default-video': {
    scope: '.media-skin[data-theme="default"][data-preset="video"]',
    theme: 'default',
    preset: 'video',
  },
  'neutral-video': {
    scope: '.media-skin[data-theme="neutral"][data-preset="video"]',
    theme: 'neutral',
    preset: 'video',
  },
  'default-live-video': {
    scope: '.media-skin[data-theme="default"][data-preset="live-video"]',
    theme: 'default',
    preset: 'live-video',
  },
  'neutral-live-video': {
    scope: '.media-skin[data-theme="neutral"][data-preset="live-video"]',
    theme: 'neutral',
    preset: 'live-video',
  },
  'default-live-audio': {
    scope: '.media-skin[data-theme="default"][data-preset="live-audio"]',
    theme: 'default',
    preset: 'live-audio',
  },
  'neutral-live-audio': {
    scope: '.media-skin[data-theme="neutral"][data-preset="live-audio"]',
    theme: 'neutral',
    preset: 'live-audio',
  },
  'default-audio': {
    scope: '.media-skin[data-theme="default"][data-preset="audio"]',
    theme: 'default',
    preset: 'audio',
  },
  'neutral-audio': {
    scope: '.media-skin[data-theme="neutral"][data-preset="audio"]',
    theme: 'neutral',
    preset: 'audio',
  },
  'compat-video': {
    scope: '.media-skin[data-theme="compat"][data-preset="video"]',
    theme: 'compat',
    preset: 'video',
  },
  'compat-live-video': {
    scope: '.media-skin[data-theme="compat"][data-preset="live-video"]',
    theme: 'compat',
    preset: 'live-video',
  },
  'compat-audio': {
    scope: '.media-skin[data-theme="compat"][data-preset="audio"]',
    theme: 'compat',
    preset: 'audio',
  },
  'compat-live-audio': {
    scope: '.media-skin[data-theme="compat"][data-preset="live-audio"]',
    theme: 'compat',
    preset: 'live-audio',
  },
} as const satisfies Record<string, SkinStyle>;

export type SkinName = keyof typeof skinStyles;

export function isSkinName(value: string): value is SkinName {
  return value in skinStyles;
}
