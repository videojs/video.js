import { slug } from 'github-slugger';

import {
  DOCSEARCH_API_KEY,
  DOCSEARCH_APP_ID,
  DOCSEARCH_BLOG_INDEX,
  DOCSEARCH_CHANGELOG_INDEX,
  DOCSEARCH_DOCS_INDEX,
} from '../search.config';
import { SUPPORTED_FRAMEWORKS, type SupportedFramework } from '../types/docs';

export const SEARCH_SCOPES = ['docs', 'changelog', 'blog'] as const;
export type SearchScope = (typeof SEARCH_SCOPES)[number];

export const SEARCH_MATCHES = ['fuzzy', 'exact'] as const;
export type SearchMatch = (typeof SEARCH_MATCHES)[number];

export const SEARCH_LIMIT_DEFAULT = 8;
export const SEARCH_LIMIT_MAX = 20;

const SCOPE_INDEXES = {
  docs: DOCSEARCH_DOCS_INDEX,
  changelog: DOCSEARCH_CHANGELOG_INDEX,
  blog: DOCSEARCH_BLOG_INDEX,
} satisfies Record<SearchScope, string>;

// The exact-match corpus changes only on deploy, so a warm function instance reuses it for a while.
const CORPUS_TTL_MS = 10 * 60 * 1000;
const SNIPPET_LENGTH = 200;

export interface SearchDocsInput {
  query: string;
  framework?: SupportedFramework;
  match?: SearchMatch;
  scope?: SearchScope;
  limit?: number;
}

export interface SearchDocsContext {
  fetch: typeof fetch;
  /** Origin that serves the site's `llms-full.txt` corpora. */
  origin: string;
}

export interface SearchHit {
  title: string;
  /** Page URL to pass to `read_docs`. */
  url: string;
  /** Heading anchor to pass to `read_docs` as `section`. */
  section?: string;
  snippet: string;
  framework?: string;
}

export type SearchDocsResult = { hits: SearchHit[] } | { error: string };

interface AlgoliaHit {
  /** `lvl1` for a page title record, `lvl2`… for a heading, `content` for text under one. */
  type?: string;
  url?: string;
  url_without_anchor?: string;
  anchor?: string | null;
  content?: string | null;
  framework?: string[];
  hierarchy?: Record<string, string | null>;
  _snippetResult?: { content?: { value?: string } };
}

function clip(text: string, length = SNIPPET_LENGTH): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();

  return collapsed.length > length ? `${collapsed.slice(0, length - 1)}…` : collapsed;
}

function hitTitle(hierarchy: AlgoliaHit['hierarchy']): string {
  const levels = ['lvl1', 'lvl2', 'lvl3', 'lvl4', 'lvl5', 'lvl6']
    .map((level) => hierarchy?.[level])
    .filter((value): value is string => !!value);

  return levels.join(' › ') || hierarchy?.lvl0 || 'Untitled';
}

async function searchAlgolia(input: SearchDocsInput, limit: number, context: SearchDocsContext) {
  const index = SCOPE_INDEXES[input.scope ?? 'docs'];
  const response = await context.fetch(`https://${DOCSEARCH_APP_ID}-dsn.algolia.net/1/indexes/${index}/query`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-algolia-application-id': DOCSEARCH_APP_ID,
      'x-algolia-api-key': DOCSEARCH_API_KEY,
    },
    body: JSON.stringify({
      query: input.query,
      hitsPerPage: limit,
      facetFilters: input.framework && (input.scope ?? 'docs') === 'docs' ? [`framework:${input.framework}`] : [],
      attributesToRetrieve: ['type', 'url', 'url_without_anchor', 'anchor', 'hierarchy', 'content', 'framework'],
      attributesToSnippet: ['content:40'],
      highlightPreTag: '',
      highlightPostTag: '',
      snippetEllipsisText: '…',
    }),
  });
  if (!response.ok) return { error: `Search is unavailable right now (${response.status}). Try again.` };

  // SAFETY: Algolia's query API returns `hits`; only the fields read below are used, each checked before use.
  const { hits = [] } = (await response.json()) as { hits?: AlgoliaHit[] };
  const seen = new Set<string>();
  const results: SearchHit[] = [];

  for (const hit of hits) {
    const url = hit.url_without_anchor ?? hit.url?.split('#')[0];
    if (!url) continue;

    const key = `${url}#${hit.type === 'lvl1' ? '' : (hit.anchor ?? '')}`;
    if (seen.has(key)) continue;

    const result: SearchHit = {
      title: hitTitle(hit.hierarchy),
      url,
      snippet: clip(hit._snippetResult?.content?.value ?? hit.content ?? ''),
    };

    // A page title record anchors to the page's main landmark, not a heading `read_docs` can select.
    if (hit.anchor && hit.type !== 'lvl1') result.section = hit.anchor;

    if (hit.framework?.length) result.framework = hit.framework.join(', ');

    seen.add(key);
    results.push(result);
  }

  return { hits: results };
}

interface CorpusPage {
  url: string;
  lines: string[];
}

const corpusCache = new Map<string, { expires: number; pages: Promise<CorpusPage[] | undefined> }>();

/** Split an `llms-full.txt` corpus back into pages at the `<!-- Source: … -->` markers it writes between them. */
export function splitCorpus(corpus: string): CorpusPage[] {
  const pages: CorpusPage[] = [];
  const marker = /^<!-- Source: (\S+) -->$/;
  let current: CorpusPage | undefined;

  for (const line of corpus.split('\n')) {
    const source = marker.exec(line);

    if (source) {
      current = { url: source[1]!, lines: [] };
      pages.push(current);
      continue;
    }

    current?.lines.push(line);
  }

  return pages;
}

function loadCorpus(framework: SupportedFramework, context: SearchDocsContext): Promise<CorpusPage[] | undefined> {
  const url = `${context.origin}/docs/framework/${framework}/llms-full.txt`;
  const cached = corpusCache.get(url);
  if (cached && cached.expires > Date.now()) return cached.pages;

  const pages = context
    .fetch(url)
    .then(async (response) => (response.ok ? splitCorpus(await response.text()) : undefined))
    .catch(() => undefined);

  corpusCache.set(url, { expires: Date.now() + CORPUS_TTL_MS, pages });

  return pages;
}

/** Case-sensitive substring search over every page of one framework's docs, for identifiers fuzzy search splits up. */
export function searchCorpus(
  pages: readonly CorpusPage[],
  query: string,
  limit: number,
  framework?: string
): SearchHit[] {
  const hits: SearchHit[] = [];

  for (const page of pages) {
    let title = 'Untitled';
    let heading: string | undefined;
    let matchesOnPage = 0;

    for (const line of page.lines) {
      const headingMatch = /^(#{1,6})\s+(.+?)\s*$/.exec(line);

      if (headingMatch) {
        if (headingMatch[1] === '#') title = headingMatch[2]!;
        else heading = headingMatch[2]!;
      }

      // Two matches per page keep one page from crowding out the rest.
      if (!line.includes(query) || matchesOnPage >= 2) continue;

      const hit: SearchHit = { title: heading ? `${title} › ${heading}` : title, url: page.url, snippet: clip(line) };

      if (heading) hit.section = slug(heading);

      if (framework) hit.framework = framework;

      matchesOnPage += 1;
      hits.push(hit);

      if (hits.length >= limit) return hits;
    }
  }

  return hits;
}

/** Search the docs with Algolia, or grep the `llms-full.txt` corpora for an exact string. */
export async function searchDocs(input: SearchDocsInput, context: SearchDocsContext): Promise<SearchDocsResult> {
  const limit = Math.min(Math.max(Math.trunc(input.limit ?? SEARCH_LIMIT_DEFAULT), 1), SEARCH_LIMIT_MAX);
  const query = input.query.trim();
  if (!query) return { error: 'Pass a non-empty `query`.' };

  if ((input.match ?? 'fuzzy') === 'fuzzy') return searchAlgolia({ ...input, query }, limit, context);

  if ((input.scope ?? 'docs') !== 'docs') return { error: 'Exact matching covers the docs only; use `scope: "docs"`.' };

  const frameworks = input.framework ? [input.framework] : SUPPORTED_FRAMEWORKS;
  const corpora = await Promise.all(frameworks.map((framework) => loadCorpus(framework, context)));

  if (corpora.every((pages) => !pages)) {
    return { error: 'Exact search is unavailable right now. Use `match: "fuzzy"` instead.' };
  }

  const hits = frameworks.flatMap((framework, index) => searchCorpus(corpora[index] ?? [], query, limit, framework));

  return { hits: hits.slice(0, limit) };
}

/** Render hits as a compact Markdown list, with a next step when nothing matched. */
export function renderSearchHits(result: SearchDocsResult, input: SearchDocsInput): string {
  if ('error' in result) return result.error;

  if (result.hits.length === 0) {
    const retry =
      (input.match ?? 'fuzzy') === 'fuzzy'
        ? 'Try other words, or `match: "exact"` for an identifier such as a CSS variable or attribute.'
        : 'Try `match: "fuzzy"` or a shorter string.';

    return `No results for "${input.query}". ${retry} If the docs should cover this, call send_feedback with kind "missing".`;
  }

  return result.hits
    .map((hit) => {
      const section = hit.section ? ` (section: \`${hit.section}\`)` : '';
      const framework = hit.framework ? ` [${hit.framework}]` : '';

      const snippet = hit.snippet ? `\n  ${hit.snippet}` : '';

      return `- **${hit.title}**${framework}\n  ${hit.url}${section}${snippet}`;
    })
    .join('\n');
}
