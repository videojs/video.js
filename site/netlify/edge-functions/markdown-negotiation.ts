import type { Config } from '@netlify/edge-functions';

import { handleMarkdown, type MarkdownContext, prefersMarkdown } from '../../src/utils/markdown-handler.ts';

export default async function markdownNegotiation(request: Request, context: MarkdownContext) {
  // trailing-slash.ts redirects slash URLs to the canonical page URL, which is where negotiation happens.
  if (new URL(request.url).pathname.endsWith('/')) return;

  if (!prefersMarkdown(request.headers.get('accept') ?? '')) return varyOnAccept(await context.next());

  return (await handleMarkdown(request, context)) ?? varyOnAccept(await context.next(request));
}

// Whichever representation wins, this function chose it from Accept, so caches must key on it.
function varyOnAccept(response: Response): Response {
  const vary = response.headers.get('vary') ?? '';
  const fields = vary.split(',').map((field) => field.trim().toLowerCase());

  if (!fields.includes('accept') && !fields.includes('*')) response.headers.append('vary', 'Accept');

  return response;
}

export const config: Config = {
  cache: 'manual',
  // Plain HTML requests never reach this function, so their responses carry no `Vary: Accept`. Adding it site-wide
  // would make browsers miss prefetched pages, whose `Accept` differs from the navigation's; Netlify's cache already
  // keeps the two representations apart because it routes on this header match before its cache lookup.
  // Direct `.md` requests never negotiate. Netlify requires inline static config values.
  excludedPath: ['/blog/*.md', '/changelog/*.md', '/docs/*.md', '/html5-video-support.md', '/about-this-player.md'],
  // Netlify tests this regex against the header value without flags, so it spells out both cases. It only narrows
  // which requests reach the function; prefersMarkdown weighs the q-values.
  header: {
    accept: '[Tt][Ee][Xx][Tt]/[Mm][Aa][Rr][Kk][Dd][Oo][Ww][Nn]',
  },
  method: 'GET',
  path: ['/blog/*', '/changelog/*', '/docs/*', '/html5-video-support', '/about-this-player'],
};
