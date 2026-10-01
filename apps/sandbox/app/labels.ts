import type { CompareLayout, CompareMode } from '@app/compare';
import type { Platform, Skin, SkinSource, Styling } from '@app/types';

export const PLATFORM_LABELS: Record<Platform, string> = {
  html: 'HTML',
  react: 'React',
  cdn: 'CDN',
};

export const STYLING_LABELS: Record<Styling, string> = {
  css: 'CSS',
  tailwind: 'Tailwind',
};

export const SKIN_LABELS: Record<Skin, string> = {
  default: 'Default',
  neutral: 'Neutral',
};

export const SKIN_SOURCE_LABELS: Record<SkinSource, string> = {
  package: 'Framework package',
  registry: 'Shadcn registry',
  authored: 'Authored source',
};

/** The source as a phrase inside a sentence, such as `Neutral · Tailwind · from the registry`. */
export const SKIN_SOURCE_PHRASES: Record<SkinSource, string> = {
  package: 'from the package',
  registry: 'from the registry',
  authored: 'authored',
};

export const COMPARE_LABELS: Record<CompareMode, string> = {
  off: 'Off',
  styling: 'CSS vs Tailwind',
  skins: 'Skin sources',
  skin: 'Default vs Neutral',
  platform: 'HTML vs React',
};

export const LAYOUT_LABELS: Record<CompareLayout, string> = {
  auto: 'Auto',
  row: 'Side by side',
  column: 'Stacked',
};
