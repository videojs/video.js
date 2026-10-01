import { sidebar as defaultSidebar } from '@/docs.config';
import type { Sidebar, SupportedFramework } from '@/types/docs';
import { DEFAULT_FRAMEWORK, isValidFramework, resolveDocsFramework } from '@/types/docs';
import {
  getInstallationRouteForSlug,
  getInstallationRoutePath,
  getInstallationRouteSegment,
  INSTALLATION_ROUTE_PREFIX,
  isShadcnInstallationUrl,
} from '@/utils/installation/routes';

import { findFirstGuide, findGuideBySlug, getValidFrameworksForGuide } from './sidebar';

export { CANONICAL_INSTALLATION_SLUGS } from '@/utils/installation/routes';

/** Build the public URL for a guide, including the canonical installation routes. */
export function buildDocsUrl(framework: SupportedFramework, guideSlug: string): string {
  const installationRoute = getInstallationRouteForSlug(guideSlug, framework);
  if (installationRoute === 'shadcn') return `${getInstallationRoutePath('shadcn')}?framework=${framework}`;

  if (installationRoute) return getInstallationRoutePath(installationRoute);

  return `/docs/framework/${framework}/${guideSlug}`;
}

/** Match a sidebar guide against the current URL, keeping installation selected across all installation methods. */
export function isDocsGuideActive(framework: SupportedFramework, guideSlug: string, currentPath: string): boolean {
  if (guideSlug === 'guides/installation') return currentPath.startsWith(INSTALLATION_ROUTE_PREFIX);

  return buildDocsUrl(framework, guideSlug) === currentPath;
}

/**
 * Build a framework-agnostic docs URL. `/docs` and `/docs/<slug>` are server routes that redirect to the reader's
 * preferred framework, and `resolveDocsHref` upgrades them on the client when the preference is known.
 */
export function buildAgnosticDocsUrl(guideSlug?: string | null): string {
  if (guideSlug === 'guides/installation') return INSTALLATION_ROUTE_PREFIX;

  const installationRoute = getInstallationRouteForSlug(guideSlug, DEFAULT_FRAMEWORK);
  if (installationRoute) return getInstallationRoutePath(installationRoute);

  return guideSlug ? `/docs/${guideSlug}` : '/docs';
}

/** Read the framework selected by an explicit docs route. Framework-agnostic and invalid paths return null. */
export function getFrameworkFromDocsPath(pathname: string): SupportedFramework | null {
  const framework = pathname.match(/^\/docs\/framework\/([^/]+)(?:\/|$)/)?.[1];
  if (isValidFramework(framework)) return framework;

  const installationRoute = getInstallationRouteSegment(pathname);
  if (installationRoute === 'shadcn') return null;

  return resolveDocsFramework(installationRoute);
}

/** Read the selected framework from a docs URL, including Shadcn's query-controlled source framework. */
export function getFrameworkFromDocsUrl(url: URL): SupportedFramework | null {
  if (isShadcnInstallationUrl(url)) {
    const framework = url.searchParams.get('framework');

    return isValidFramework(framework) ? framework : null;
  }

  return getFrameworkFromDocsPath(url.pathname);
}

/** Input for resolveDocsHref */
export interface DocsHrefInput {
  /** Guide to link to. `null` means the docs landing page (first guide for the framework). */
  slug: string | null;
  /** Framework in context. `null` when unknown, which yields the agnostic URL. */
  framework: SupportedFramework | null;
}

/**
 * Resolve the href for any docs link from whatever context is available. This is the one entry point shared by the
 * static link components, the server redirect routes, and the client-side enhancer, so all of them agree on where a
 * link goes.
 *
 * - No framework → agnostic `/docs` or `/docs/<slug>` (resolved later by the server or the client)
 * - Framework, no slug → that framework's first guide
 * - Framework and slug → the slug, falling back to another framework if the guide is not available in this one
 */
export function resolveDocsHref(input: DocsHrefInput, sidebar: Sidebar = defaultSidebar): string {
  const { slug, framework } = input;
  if (!framework) return buildAgnosticDocsUrl(slug);

  if (!slug) return buildDocsUrl(framework, findFirstGuide(framework, sidebar));

  return resolveDocsLinkUrl({ targetSlug: slug, contextFramework: framework }, sidebar).url;
}

/** Input for resolveIndexRedirect */
export interface IndexRedirectInput {
  preferences: {
    framework: string | null;
  };
  params: {
    framework?: string;
  };
}

/** Output from resolveIndexRedirect */
export interface IndexRedirectResult {
  url: string;
}

/**
 * Resolve redirect for index pages (/docs, /docs/framework/X). Nothing is pinned - we must select framework AND slug.
 *
 * Logic: 1. If params.framework → validate → find first guide 2. If no param → get from preferences or defaults → find
 * first guide
 *
 * @param input - The input containing preferences and params
 * @param sidebar - Optional sidebar to search (defaults to main sidebar config)
 */
export function resolveIndexRedirect(
  input: IndexRedirectInput,
  sidebar: Sidebar = defaultSidebar
): IndexRedirectResult {
  const { preferences, params } = input;

  let selectedFramework: SupportedFramework;

  if (params.framework) {
    // Framework in params - validate it
    if (!isValidFramework(params.framework)) {
      throw new Error(`Invalid framework param: ${params.framework}`);
    }

    selectedFramework = params.framework;
  } else {
    // No params - use preferences or defaults
    if (preferences.framework && isValidFramework(preferences.framework)) {
      selectedFramework = preferences.framework;
    } else {
      // Use all defaults
      selectedFramework = DEFAULT_FRAMEWORK;
    }
  }

  // Find the first guide for the selected framework
  const selectedSlug = findFirstGuide(selectedFramework, sidebar);
  const url = buildDocsUrl(selectedFramework, selectedSlug);

  return {
    url,
  };
}

/** Input for resolveFrameworkChange */
export interface FrameworkChangeInput {
  currentFramework: SupportedFramework;
  currentSlug: string;
  newFramework: SupportedFramework;
}

/** Output from resolveFrameworkChange */
export interface FrameworkChangeResult {
  url: string;
  shouldReplace: boolean;
}

/**
 * Resolve URL when user changes framework selector. newFramework is PINNED (must keep), slug MAY change if not visible.
 *
 * Logic: 1. framework = newFramework (PINNED) 2. If currentSlug visible in newFramework → slug = currentSlug,
 * shouldReplace = true Else → slug = first guide in newFramework, shouldReplace = false
 *
 * @param input - The input containing current state and new framework
 * @param sidebar - Optional sidebar to search (defaults to main sidebar config)
 */
export function resolveFrameworkChange(
  input: FrameworkChangeInput,
  sidebar: Sidebar = defaultSidebar
): FrameworkChangeResult {
  const { currentSlug, newFramework } = input;
  if (!isValidFramework(newFramework)) throw new Error(`Invalid framework: ${newFramework}`);

  const selectedFramework = newFramework; // PINNED

  // Determine the slug to use
  let selectedSlug: string;
  let shouldReplace: boolean;

  const guide = findGuideBySlug(currentSlug, sidebar);
  const validFrameworks = guide ? getValidFrameworksForGuide(guide, sidebar) : [];

  if (guide && validFrameworks.includes(selectedFramework)) {
    // Current slug is visible in the new framework
    selectedSlug = currentSlug;
    shouldReplace = true;
  } else {
    // Current slug is not visible, find first guide
    selectedSlug = findFirstGuide(selectedFramework, sidebar);
    shouldReplace = false;
  }

  const url = buildDocsUrl(selectedFramework, selectedSlug);

  return {
    url,
    shouldReplace,
  };
}

/** Input for resolveDocsLinkUrl */
export interface DocsLinkInput {
  targetSlug: string;
  contextFramework: SupportedFramework;
}

/** Output from resolveDocsLinkUrl */
export interface DocsLinkResult {
  url: string;
}

/**
 * Resolve the best URL for a guide slug link given current context. targetSlug is PINNED (must keep), framework MAY
 * change.
 *
 * Logic (2-level priority cascade): 1. slug = targetSlug (PINNED) 2. Try to find best framework that supports
 * targetSlug: - Priority 1: If targetSlug visible in contextFramework → use it (best UX) - Priority 2: Use guide's
 * first valid framework
 *
 * @param input - The input containing target slug and context
 * @param sidebar - Optional sidebar to search (defaults to main sidebar config)
 */
export function resolveDocsLinkUrl(input: DocsLinkInput, sidebar: Sidebar = defaultSidebar): DocsLinkResult {
  const { targetSlug, contextFramework } = input;

  const guide = findGuideBySlug(targetSlug, sidebar);
  if (!guide) throw new Error(`No guide found with slug "${targetSlug}"`);

  if (!isValidFramework(contextFramework)) {
    throw new Error(`Invalid context framework: ${contextFramework}`);
  }

  const selectedSlug = targetSlug; // PINNED
  let selectedFramework: SupportedFramework;

  // Priority 1: Try current framework
  const validFrameworks = getValidFrameworksForGuide(guide, sidebar);

  if (validFrameworks.includes(contextFramework)) {
    selectedFramework = contextFramework;
  } else {
    // Priority 2: Fallback to guide's first valid framework
    selectedFramework = validFrameworks[0];
  }

  const url = buildDocsUrl(selectedFramework, selectedSlug);

  return {
    url,
  };
}
