import type { Config } from '@netlify/edge-functions';

import { redirectOrigin } from '../../src/utils/redirect-origin.ts';

export default async (request: Request) => {
  const url = new URL(request.url);
  // Skip PostHog proxy paths — handled by Netlify redirects
  if (url.pathname.startsWith('/ph/')) return;

  // The Video.js 8 embed snippet links to this path with a trailing slash. Let the
  // request through so the redirect rule can serve the page in a single hop.
  if (url.pathname === '/html5-video-support/') return;

  const redirectUrl = new URL(url.pathname.replace(/\/$/, ''), redirectOrigin(url));

  redirectUrl.search = url.search;
  redirectUrl.hash = url.hash;

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
  pattern: '.+/$',
};
