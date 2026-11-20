import type { SupportedFramework } from '@/types/docs';

import { resolveDocsHref } from './routing';
import { findGuideBySlug } from './sidebar';

/**
 * Where a section that left a page went, keyed by its old heading id. The value is a docs slug with an optional
 * `#anchor`, such as `guides/mux#play-signed-assets`, so one entry serves every framework.
 */
export type MovedAnchors = Record<string, string>;

/**
 * Resolve each moved section to a concrete URL for the page's framework. Throws on a slug no page has, so a broken
 * entry fails the build like a broken `<DocsLink>` does.
 */
export function resolveMovedAnchors(movedAnchors: MovedAnchors, framework: SupportedFramework): Record<string, string> {
  const resolved: Record<string, string> = {};

  for (const [id, target] of Object.entries(movedAnchors)) {
    const [slug = '', anchor] = target.split('#');

    if (!findGuideBySlug(slug))
      throw new Error(`movedAnchors "${id}" points to "${target}", but no page has that slug`);

    resolved[id] = resolveDocsHref({ slug, framework }) + (anchor ? `#${anchor}` : '');
  }

  return resolved;
}
