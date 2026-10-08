import { kebabCase } from 'es-toolkit/string';

/**
 * Reference entries whose PascalCase name doesn't match a simple kebab-to-pascal conversion. Keyed by
 * generated-reference file slug (a component's kebab directory name or a media component's tag name) → PascalCase
 * name.
 *
 * Consumed by the api-docs-builder for component generation, and inverted below so reference pages can resolve a file
 * slug from the public name.
 */
export const NAME_OVERRIDES: Record<string, string> = {
  'pip-button': 'PiPButton',
  'airplay-button': 'AirPlayButton',
  'hlsjs-video': 'HlsJsVideo',
  'youtube-video': 'YouTubeVideo',
  'tiktok-video': 'TikTokVideo',
  'playerjs-video': 'PlayerJsVideo',
};

const NAME_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(NAME_OVERRIDES).map(([slug, name]) => [name, slug])
);

/** Resolve a reference's generated file slug from its PascalCase name. */
export function resolveReferenceSlug(name: string): string {
  return NAME_TO_SLUG[name] ?? kebabCase(name);
}
