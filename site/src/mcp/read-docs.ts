import { slug } from 'github-slugger';

import type { SupportedFramework } from '../types/docs';

/** Pages one call may read. More than this usually means the agent should search first. */
export const READ_DOCS_PAGE_LIMIT = 5;

/** Characters returned across one call, about 25k tokens. Larger pages should be read a `section` at a time. */
const READ_DOCS_CHARACTER_BUDGET = 100_000;

/** Rough token count for a size hint; four characters per token is close enough for English prose and code. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// A release version only, so a `version` argument can't reach outside the package's docs directory.
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/;
const DOCS_ROOTS = ['/docs/', '/blog/', '/changelog/'];
const FRAMEWORK_PATH = /^\/docs\/framework\/(html|react)\/(.+)$/;

export interface ReadDocsInput {
  pages: readonly string[];
  framework?: SupportedFramework;
  /** Heading text or anchor; returns only that heading and its subsections. */
  section?: string;
  /** A published version. Reads the docs shipped inside `@videojs/react` or `@videojs/html` at that version. */
  version?: string;
}

export interface ReadDocsContext {
  fetch: typeof fetch;
  /** Origin that serves the site's Markdown twins. */
  origin: string;
}

export type ReadDocsPage =
  | { url: string; status: number; tokens: number; markdown: string; truncated?: boolean }
  | { url: string; status: number; error: string };

export interface DocsPath {
  /** Site path without `.md`, such as `/docs/framework/react/guides/captions`. */
  path: string;
  anchor?: string;
}

/**
 * Normalize what agents pass as a page: a site URL, a path with or without `.md`, or a framework-relative slug such as
 * `guides/captions` or `reference/components/time-slider`. Returns `undefined` for anything outside the docs.
 */
export function resolveDocsPath(page: string, framework: SupportedFramework | undefined): DocsPath | undefined {
  let value = page.trim();
  let anchor: string | undefined;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);

      value = url.pathname;
      anchor = url.hash.slice(1) || undefined;
    } catch {
      return undefined;
    }
  } else {
    const hash = value.indexOf('#');

    if (hash >= 0) {
      anchor = value.slice(hash + 1) || undefined;
      value = value.slice(0, hash);
    }
  }

  value = value.replace(/\.md$/, '').replace(/\/+$/, '');

  if (!value.startsWith('/')) {
    if (value.startsWith('docs/') || value.startsWith('blog/') || value.startsWith('changelog/')) value = `/${value}`;
    else if (framework) value = `/docs/framework/${framework}/${value}`;
    else return undefined;
  }

  if (value.includes('..') || !DOCS_ROOTS.some((root) => value.startsWith(root))) return undefined;

  return anchor ? { path: value, anchor } : { path: value };
}

/** The URL of a page's Markdown: the site's twin, or the copy shipped in the framework package at `version`. */
export function docsMarkdownUrl(path: string, origin: string, version?: string): string | undefined {
  if (!version) return `${origin}${path}.md`;

  const match = FRAMEWORK_PATH.exec(path);
  if (!match || !VERSION_PATTERN.test(version)) return undefined;

  return `https://cdn.jsdelivr.net/npm/@videojs/${match[1]}@${version}/docs/${match[2]}.md`;
}

interface Heading {
  level: number;
  text: string;
  line: number;
}

function headingsOf(lines: readonly string[]): Heading[] {
  const headings: Heading[] = [];
  let fence: string | undefined;

  for (const [index, line] of lines.entries()) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);

    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1]![0];
      else if (fenceMatch[1]![0] === fence) fence = undefined;

      continue;
    }

    if (fence) continue;

    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);

    if (heading) headings.push({ level: heading[1]!.length, text: heading[2]!, line: index });
  }

  return headings;
}

/**
 * Every heading matching `section` (by anchor or text, case-insensitively), each through the line before the next
 * heading at the same or a higher level. A heading that repeats, such as "Data attributes" under each part of a
 * compound component, returns every match, each under a comment naming its parent headings. Headings inside code fences
 * don't count.
 */
export function extractSection(
  markdown: string,
  section: string
): { markdown: string } | { error: string; headings: string[] } {
  const lines = markdown.split('\n');
  const headings = headingsOf(lines);
  const wanted = slug(section.replace(/^#/, ''));
  const matches = headings.flatMap((heading, index) => (slug(heading.text) === wanted ? [index] : []));

  if (matches.length === 0) {
    return {
      error: `No heading matches "${section}".`,
      headings: headings.filter(({ level }) => level >= 2 && level <= 3).map(({ text }) => text),
    };
  }

  const parts = matches.map((index) => {
    const start = headings[index]!;
    const end = headings.slice(index + 1).find(({ level }) => level <= start.level);
    const body = lines.slice(start.line, end?.line).join('\n').trim();

    if (matches.length === 1) return body;

    const parents: Heading[] = [];

    for (const heading of headings.slice(0, index)) {
      while (parents.length > 0 && parents.at(-1)!.level >= heading.level) parents.pop();

      if (heading.level < start.level) parents.push(heading);
    }

    const path = parents.filter(({ level }) => level > 1).map(({ text }) => text);

    return path.length > 0 ? `<!-- Under: ${path.join(' › ')} -->\n\n${body}` : body;
  });

  return { markdown: parts.join('\n\n') };
}

/** Read up to five docs pages as Markdown, whole or one section each. */
export async function readDocs(input: ReadDocsInput, context: ReadDocsContext): Promise<ReadDocsPage[]> {
  const pages = input.pages.slice(0, READ_DOCS_PAGE_LIMIT);
  let budget = READ_DOCS_CHARACTER_BUDGET;

  const results = await Promise.all(
    pages.map(async (page): Promise<ReadDocsPage> => {
      const resolved = resolveDocsPath(page, input.framework);

      if (!resolved) {
        return {
          url: page,
          status: 400,
          error: input.framework
            ? 'Not a Video.js docs page. Pass a videojs.org docs URL, a path such as /docs/framework/react/guides/captions, or a slug such as guides/captions.'
            : 'Pass a full docs URL or path, or set `framework` to resolve a slug such as guides/captions.',
        };
      }

      const url = docsMarkdownUrl(resolved.path, context.origin, input.version);

      if (!url) {
        return {
          url: page,
          status: 400,
          error:
            'Versioned docs cover framework pages only (/docs/framework/html/… or /docs/framework/react/…), and `version` must be a release such as 10.2.0.',
        };
      }

      const response = await context.fetch(url, { headers: { accept: 'text/markdown' } }).catch(() => undefined);

      if (!response?.ok) {
        return {
          url,
          status: response?.status ?? 502,
          error:
            response?.status === 404
              ? 'Page not found. Use search_docs to find the right page.'
              : 'Could not load the page. Try again.',
        };
      }

      const markdown = await response.text();
      const section = input.section ?? resolved.anchor;
      if (!section) return { url, status: 200, tokens: estimateTokens(markdown), markdown };

      const extracted = extractSection(markdown, section);

      if ('error' in extracted) {
        return {
          url,
          status: 404,
          error: `${extracted.error} Headings on this page: ${extracted.headings.join('; ')}`,
        };
      }

      return { url, status: 200, tokens: estimateTokens(extracted.markdown), markdown: extracted.markdown };
    })
  );

  // Pages keep their order; once the budget runs out, later pages are cut rather than earlier ones.
  return results.map((result) => {
    if (!('markdown' in result)) return result;

    if (result.markdown.length <= budget) {
      budget -= result.markdown.length;
      return result;
    }

    const markdown = result.markdown.slice(0, Math.max(budget, 0));

    budget = 0;

    return { ...result, markdown, truncated: true };
  });
}

/** Render read results as one Markdown document, each page under a source comment. */
export function renderReadDocs(pages: readonly ReadDocsPage[], skipped: number): string {
  const parts = pages.map((page) => {
    if ('error' in page) return `<!-- Source: ${page.url} -->\n\nError (${page.status}): ${page.error}`;

    const note = page.truncated
      ? `\n\n[Truncated to fit the response. Read this page again with \`section\` set to one of its headings.]`
      : '';

    return `<!-- Source: ${page.url} (about ${page.tokens} tokens) -->\n\n${page.markdown}${note}`;
  });

  if (skipped > 0) parts.push(`[${skipped} more pages skipped: read at most ${READ_DOCS_PAGE_LIMIT} pages per call.]`);

  return parts.join('\n\n---\n\n');
}
