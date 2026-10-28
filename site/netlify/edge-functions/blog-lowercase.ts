import type { Config } from '@netlify/edge-functions';

import { redirectOrigin } from '../../src/utils/redirect-origin.ts';

// Old blog links often capitalized post slugs, and Netlify matches redirect paths case-sensitively, so lowercase them
// for the legacy rules in netlify.toml. Every v10 blog slug is lowercase. Percent-escapes keep their case, so a path
// whose only capitals are escapes passes through.
export default async (request: Request) => {
  const url = new URL(request.url);
  const pathname = url.pathname
    .replace(/%[0-9A-F]{2}|[A-Z]+/g, (match) => (match.startsWith('%') ? match : match.toLowerCase()))
    .replace(/\/$/, '');
  if (pathname === url.pathname.replace(/\/$/, '')) return;

  const redirectUrl = new URL(pathname, redirectOrigin(url));

  redirectUrl.search = url.search;

  return new Response(null, {
    status: 301,
    headers: {
      location: redirectUrl.toString(),
      'cache-control': 'public, max-age=86400',
    },
  });
};

export const config: Config = {
  cache: 'manual',
  pattern: '^/blog/.*[A-Z]',
};
