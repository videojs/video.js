// `astro.config.ts` reads the sitemap paths while Vite+ discovers the task graph, so this module stays free of the
// installation renderer that `llms-markdown.ts` needs from a built `@videojs/installation`.
import { sidebar } from '../src/docs.config';
import type { Sidebar, SupportedFramework } from '../src/types/docs';
import { isLink, isListedForFramework, isSection, SUPPORTED_FRAMEWORKS } from '../src/types/docs';

/** Top-level sidebar sections whose pages share a directory; each section's llms files are written there. */
export function llmsSections(framework: SupportedFramework) {
  return filterSidebarForLlms(sidebar, framework)
    .filter(isSection)
    .flatMap((section) => {
      const slugs = sidebarSlugs(section.contents);
      const directory = commonDirectory(slugs);

      return directory ? [{ section, slugs, directory }] : [];
    });
}

/** Root-relative paths of every index and complete file the build writes, for the sitemap. */
export function llmsIndexPaths(): string[] {
  const docs = SUPPORTED_FRAMEWORKS.flatMap((framework) =>
    [
      `/docs/framework/${framework}`,
      ...llmsSections(framework).map(({ directory }) => `/docs/framework/${framework}/${directory}`),
    ].flatMap((base) => [`${base}/llms.txt`, `${base}/llms-full.txt`])
  );

  return ['/llms.txt', '/blog/llms.txt', '/changelog/llms.txt', ...docs];
}

/** The directory every slug shares, or `undefined` when the pages have no common parent. */
function commonDirectory(slugs: string[]): string | undefined {
  const directories = slugs.map((slug) => slug.split('/').slice(0, -1));
  const [first] = directories;
  if (!first) return undefined;

  let length = Math.min(...directories.map((directory) => directory.length));

  for (let index = 0; index < length; index += 1) {
    if (!directories.every((directory) => directory[index] === first[index])) {
      length = index;
      break;
    }
  }

  const shared = first.slice(0, length);

  return shared.length > 0 ? shared.join('/') : undefined;
}

export function sidebarSlugs(items: Sidebar): string[] {
  return items.flatMap((item) => {
    if (isSection(item)) return sidebarSlugs(item.contents);

    return isLink(item) ? [] : [item.slug];
  });
}

/**
 * Inline sidebar filter for the integration context where `@/` path aliases aren't available (can't import
 * `filterSidebar` from `src/utils/docs/sidebar`). Filters out `devOnly` items and sections restricted to other
 * frameworks, then removes empty sections.
 */
export function filterSidebarForLlms(items: Sidebar, framework: SupportedFramework): Sidebar {
  return items
    .filter((item) => {
      if (item.devOnly) return false;

      if (isSection(item)) return !item.frameworks || item.frameworks.includes(framework);

      return isListedForFramework(item.frameworks, framework);
    })
    .map((item) => {
      if (isSection(item)) {
        return { ...item, contents: filterSidebarForLlms(item.contents, framework) };
      }

      return item;
    })
    .filter((item) => !isSection(item) || item.contents.length > 0);
}
