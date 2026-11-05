import { INSTALLATION_MARKDOWN_PARAMS, renderInstallationMarkdownSelection } from './installation/markdown.ts';
import { getInstallationRouteSegment } from './installation/routes.ts';

const INSTALLATION_PATH = '/docs/guides/installation/';
// RFC 9110 qvalue: 0 to 1 with at most three decimals.
const QVALUE = /^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/;

/**
 * Whether an Accept header explicitly permits Markdown and gives it at least HTML's quality. Markdown wins an exact
 * tie; wildcards can supply HTML's quality but never opt a request into Markdown on their own.
 */
export function prefersMarkdown(accept: string): boolean {
  const qualities = new Map<string, number>();

  for (const entry of accept.split(',')) {
    const [range = '', ...params] = entry.split(';').map((part) => part.trim().toLowerCase());
    const weight = params.find((param) => param.startsWith('q='))?.slice(2) ?? '1';
    if (!QVALUE.test(weight)) continue;

    qualities.set(range, Math.max(Number(weight), qualities.get(range) ?? 0));
  }

  const markdown = qualities.get('text/markdown') ?? 0;
  const html = qualities.get('text/html') ?? qualities.get('text/*') ?? qualities.get('*/*') ?? 0;

  return markdown > 0 && markdown >= html;
}

const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8';
const MARKDOWN_TOKENS_HEADER = 'x-markdown-tokens';

// Netlify purges its CDN on every deploy, which is when the Markdown and its package version change, so only its cache
// keeps the long TTL. Browsers and other shared caches revalidate.
const PUBLIC_MARKDOWN_CACHE = {
  'cache-control': 'public, max-age=0, must-revalidate',
  'netlify-cdn-cache-control': 'public, s-maxage=31536000',
};

function setPublicMarkdownCache(headers: Headers): void {
  for (const [name, value] of Object.entries(PUBLIC_MARKDOWN_CACHE)) headers.set(name, value);
}

/** Rough token count for a size hint; four characters per token is close enough for English prose and code. */
export function estimateMarkdownTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/** A Markdown file the build writes, with the size its `x-markdown-tokens` header reports. */
export interface StaticMarkdownFile {
  path: string;
  tokens: number;
}

/**
 * Netlify `_headers` rules for the static Markdown twins, which Netlify serves without an edge function. Installation
 * twins are left out: their body depends on the query, so the edge function renders them and sets their headers.
 * `x-markdown-tokens` lets an agent judge whether a page fits its context window before reading the body.
 */
export function staticMarkdownHeaderRules(twins: readonly StaticMarkdownFile[]): string {
  const headers = Object.entries({ 'content-type': MARKDOWN_CONTENT_TYPE, ...PUBLIC_MARKDOWN_CACHE });

  return twins
    .filter(({ path }) => !getInstallationRouteSegment(path))
    .map(({ path, tokens }) => headerRule(path, [...headers, [MARKDOWN_TOKENS_HEADER, String(tokens)]]))
    .join('\n\n');
}

/** Netlify `_headers` rules that only add `x-markdown-tokens`, for the `llms.txt` indexes, which keep their type. */
export function markdownTokenHeaderRules(files: readonly StaticMarkdownFile[]): string {
  return files.map(({ path, tokens }) => headerRule(path, [[MARKDOWN_TOKENS_HEADER, String(tokens)]])).join('\n\n');
}

function headerRule(path: string, headers: readonly (readonly [name: string, value: string])[]): string {
  return [path, ...headers.map(([name, value]) => `  ${name}: ${value}`)].join('\n');
}

function markMarkdownResponse(response: Response): Response {
  // Copying keeps the `x-markdown-tokens` header that the twin's `_headers` rule adds to the static response.
  const headers = new Headers(response.headers);

  headers.set('content-type', MARKDOWN_CONTENT_TYPE);
  setPublicMarkdownCache(headers);
  headers.set('vary', 'Accept');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function installationMarkdownResponse(body: string, status: 200 | 400 | 500, privateResponse: boolean): Response {
  const response = new Response(body, { status });

  response.headers.set('content-type', MARKDOWN_CONTENT_TYPE);

  if (privateResponse) response.headers.set('cache-control', 'private, no-store');
  else setPublicMarkdownCache(response.headers);

  response.headers.set('netlify-vary', `query=${INSTALLATION_MARKDOWN_PARAMS.join('|')}`);
  response.headers.set('vary', 'Accept');
  response.headers.set(MARKDOWN_TOKENS_HEADER, String(estimateMarkdownTokens(body)));

  return response;
}

export interface MarkdownContext {
  next(request?: Request): Promise<Response>;
}

export async function handleMarkdown(request: Request, context: MarkdownContext): Promise<Response | undefined> {
  const url = new URL(request.url);
  const directMarkdown = url.pathname.endsWith('.md');
  const acceptsMarkdown = prefersMarkdown(request.headers.get('accept') ?? '');
  if (!directMarkdown && !acceptsMarkdown) return;

  const path = (directMarkdown ? url.pathname.slice(0, -3) : url.pathname).replace(/\/$/, '');
  const assetUrl = new URL(`${path}.md`, request.url);

  assetUrl.search = '';

  // Continue through Netlify's current request chain so the static asset is served without starting a new
  // same-origin request that would run this edge function again.
  const assetRequest = directMarkdown ? request : new Request(assetUrl, request);
  const mdResponse = await context.next(assetRequest);
  if (!mdResponse.ok) return directMarkdown ? mdResponse : undefined;

  // Only installation twins vary their generated body by query parameters. Return every other static twin as a
  // stream so the edge function does not buffer every documentation page or attach installation cache metadata.
  if (!path.startsWith(INSTALLATION_PATH)) return markMarkdownResponse(mdResponse);

  const body = await mdResponse.text();
  const installation = renderInstallationMarkdownSelection(body, path, url.searchParams);

  if (!installation) {
    return markMarkdownResponse(
      new Response(body, {
        status: mdResponse.status,
        statusText: mdResponse.statusText,
        headers: mdResponse.headers,
      })
    );
  }

  return installationMarkdownResponse(installation.body, installation.status, installation.privateResponse);
}
