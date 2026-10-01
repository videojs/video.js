import type { Config } from '@netlify/edge-functions';

import { type CounterContext, isMarkdownResponse, recordMarkdownFetch } from '../../src/utils/agent-analytics.ts';

/**
 * Counts page requests that negotiate Markdown through `Accept`. It matches the same requests as
 * `markdown-negotiation.ts` but sets no `cache`, so it also runs when Netlify's cache answers for that function. A
 * request that falls back to HTML isn't counted.
 */
export default async function agentMarkdownNegotiation(request: Request, context: CounterContext) {
  const response = await context.next();

  if (isMarkdownResponse(response)) recordMarkdownFetch(request, response, context, 'accept');

  return response;
}

// Netlify requires inline static config values, so this repeats `markdown-negotiation.ts`; a test keeps them equal.
export const config: Config = {
  excludedPath: ['/blog/*.md', '/changelog/*.md', '/docs/*.md', '/html5-video-support.md', '/about-this-player.md'],
  header: {
    accept: '[Tt][Ee][Xx][Tt]/[Mm][Aa][Rr][Kk][Dd][Oo][Ww][Nn]',
  },
  method: 'GET',
  onError: 'bypass',
  path: ['/blog/*', '/changelog/*', '/docs/*', '/html5-video-support', '/about-this-player'],
};
