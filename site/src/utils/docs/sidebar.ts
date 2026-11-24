import type { Guide, Sidebar, SidebarItem, SupportedFramework } from '@/types/docs';
import { FRAMEWORK_STYLES, isLink, isListedForFramework, isSection } from '@/types/docs';

import { sidebar } from '../../docs.config';

/**
 * Check if an item (Guide or Section) should be shown based on framework. A section with no frameworks specified is
 * visible to all frameworks and is dropped later if nothing in it is. A guide or link with none is visible to every
 * stable framework; an opt-in framework such as React Native only gets the ones that list it.
 *
 * @param item - The guide or section to check
 * @param framework - The currently selected framework
 * @param isDev - Whether in development mode (defaults to import.meta.env.DEV)
 * @returns True if the item should be visible
 */
export function isItemVisible(
  item: SidebarItem,
  framework: SupportedFramework,
  isDev: boolean = import.meta.env.DEV
): boolean {
  // Filter out dev-only items in production
  if (item.devOnly && !isDev) {
    return false;
  }

  if (isSection(item)) return !item.frameworks || item.frameworks.includes(framework);

  return isListedForFramework(item.frameworks, framework);
}

/**
 * Filter sidebar items based on selected framework. Recursively filters sections and guides to only include those that
 * are visible for the given framework. Removes empty sections after filtering.
 *
 * @param framework - The framework to filter for
 * @param sidebarToFilter - Optional sidebar to filter (defaults to main sidebar config)
 * @param isDev - Whether in development mode (defaults to import.meta.env.DEV)
 * @returns A new filtered sidebar with only visible content
 */
export function filterSidebar(
  framework: SupportedFramework,
  sidebarToFilter: Sidebar = sidebar,
  isDev: boolean = import.meta.env.DEV
): Sidebar {
  return sidebarToFilter
    .filter((item) => isItemVisible(item, framework, isDev))
    .map((item) => {
      if (isSection(item)) {
        const filteredContents = filterSidebar(framework, item.contents, isDev);

        return {
          ...item,
          contents: filteredContents,
        };
      }

      // It's a Guide, return as-is
      return item;
    })
    .filter((item) => {
      // Remove sections with no contents after filtering
      if (isSection(item)) {
        return item.contents.length > 0;
      }

      // Keep all guides
      return true;
    });
}

/**
 * Find the first guide in the sidebar that matches the framework. Recursively searches through sections and guides in
 * order, returning the slug of the first visible guide found. A test validates that this function always returns a
 * guide for any valid framework, since the sidebar always includes at least one guide that has no framework
 * restrictions.
 *
 * @param framework - The framework to match
 * @param sidebarToSearch - Optional sidebar to search (defaults to main sidebar config)
 * @param isDev - Whether in development mode (defaults to import.meta.env.DEV)
 * @returns The slug of the first visible guide, or throws if none found
 */
export function findFirstGuide(
  framework: SupportedFramework,
  sidebarToSearch: Sidebar = sidebar,
  isDev: boolean = import.meta.env.DEV
): string {
  for (const item of sidebarToSearch) {
    if (!isItemVisible(item, framework, isDev)) {
      continue;
    }

    if (isSection(item)) {
      // Recursively search section contents
      try {
        const guide = findFirstGuide(framework, item.contents, isDev);
        if (guide) return guide;
      } catch {
        // Continue searching other sections
      }
    } else if (!isLink(item)) {
      // It's a Guide, return its slug
      return item.slug;
    }
  }

  throw new Error(`No guide found for valid combination framework "${framework}". This should never happen.`);
}

/**
 * Get all guide slugs from a sidebar (recursively). This function extracts ALL slugs from the provided sidebar
 * structure, including those in nested sections. It does not perform any filtering. Typically used with an
 * already-filtered sidebar to get allowed slugs.
 *
 * @param sidebarToExtract - Optional sidebar to extract from (defaults to main sidebar config)
 * @returns An array of all guide slugs found in the sidebar
 */
export function getAllGuideSlugs(sidebarToExtract: Sidebar = sidebar): string[] {
  const slugs: string[] = [];

  for (const item of sidebarToExtract) {
    if (isSection(item)) {
      // Recursively get slugs from section contents
      slugs.push(...getAllGuideSlugs(item.contents));
    } else if (!isLink(item)) {
      // It's a Guide, add its slug
      slugs.push(item.slug);
    }
  }

  return slugs;
}

/**
 * Find a guide by its slug in the sidebar (recursively).
 *
 * @param slug - The slug to find
 * @param sidebarToSearch - Optional sidebar to search (defaults to main sidebar config)
 * @returns The guide object if found, null otherwise
 */
export function findGuideBySlug(slug: string, sidebarToSearch: Sidebar = sidebar): Guide | null {
  for (const item of sidebarToSearch) {
    if (isSection(item)) {
      // Recursively search section contents
      const guide = findGuideBySlug(slug, item.contents);
      if (guide) return guide;
    } else if (!isLink(item) && item.slug === slug) {
      // Found the guide
      return item;
    }
  }

  return null;
}

/**
 * Get the ancestor section labels for a guide by its slug. Returns an array of sidebarLabel strings for all ancestor
 * sections, in order from outermost to innermost. If the guide has no ancestors (i.e., it's at the top level) or if the
 * guide is not found, returns an empty array.
 *
 * @param slug - The slug of the guide to find
 * @param sidebarToSearch - Optional sidebar to search (defaults to main sidebar config)
 * @returns An array of ancestor section labels, or empty array if none or guide not found
 */
export function getSectionsForGuide(slug: string, sidebarToSearch: Sidebar = sidebar): string[] {
  function findInSidebar(items: Sidebar, path: string[]): string[] | null {
    for (const item of items) {
      if (isSection(item)) {
        // Recursively search section contents with updated path
        const result = findInSidebar(item.contents, [...path, item.sidebarLabel]);
        if (result !== null) return result;
      } else if (!isLink(item) && item.slug === slug) {
        // Found the guide, return the accumulated path
        return path;
      }
    }

    return null;
  }

  return findInSidebar(sidebarToSearch, []) ?? [];
}

/**
 * Get all valid frameworks for a guide, accounting for ancestor section restrictions. Walks the sidebar tree to find
 * the guide and intersects `frameworks` from every ancestor section along the path, then applies the guide's own
 * restriction on top.
 */
export function getValidFrameworksForGuide(guide: Guide, sidebarToSearch: Sidebar = sidebar): SupportedFramework[] {
  const allFrameworks = Object.keys(FRAMEWORK_STYLES) as SupportedFramework[];

  function findWithRestrictions(items: Sidebar, inherited: SupportedFramework[]): SupportedFramework[] | null {
    for (const item of items) {
      if (isSection(item)) {
        const sectionFrameworks = item.frameworks ? inherited.filter((f) => item.frameworks!.includes(f)) : inherited;
        const result = findWithRestrictions(item.contents, sectionFrameworks);
        if (result) return result;
      } else if (!isLink(item) && item.slug === guide.slug) {
        return inherited.filter((f) => isListedForFramework(item.frameworks, f));
      }
    }

    return null;
  }

  return findWithRestrictions(sidebarToSearch, allFrameworks) ?? allFrameworks;
}

/**
 * Get the previous and next guides for a given guide slug. Returns the adjacent guides in the filtered sidebar for the
 * given framework.
 *
 * @param currentSlug - The slug of the current guide
 * @param framework - The framework to filter for
 * @returns Object with prev and next guides (null if at start/end)
 */
export function getAdjacentGuides(
  currentSlug: string,
  framework: SupportedFramework
): { prev: Guide | null; next: Guide | null } {
  // Get the filtered sidebar for this framework
  const filteredSidebar = filterSidebar(framework);

  // Flatten the sidebar to get all guides in order, skipping pages the sidebar doesn't list
  const allGuides = getAllGuideSlugs(filteredSidebar).filter((guideSlug) => {
    const guide = findGuideBySlug(guideSlug, filteredSidebar);

    return guideSlug === currentSlug || !guide?.hidden;
  });

  // Find the current guide's index
  const currentIndex = allGuides.indexOf(currentSlug);

  if (currentIndex === -1) {
    // Current guide not found in filtered sidebar
    return { prev: null, next: null };
  }

  // Get prev and next slugs
  const prevSlug = currentIndex > 0 ? allGuides[currentIndex - 1] : null;
  const nextSlug = currentIndex < allGuides.length - 1 ? allGuides[currentIndex + 1] : null;

  // Look up the guide objects
  const prev = prevSlug ? findGuideBySlug(prevSlug, filteredSidebar) : null;
  const next = nextSlug ? findGuideBySlug(nextSlug, filteredSidebar) : null;

  return { prev, next };
}
