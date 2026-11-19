import type { Config } from '@netlify/edge-functions';

import { LEGACY_URL } from '../../src/consts.ts';
import { redirectOrigin } from '../../src/utils/redirect-origin.ts';

// Prefixes netlify.toml sends wholesale to the same path, with its trailing slash, on the legacy site.
const LEGACY_PREFIXES = /^\/(guides|tags)\/.+\/$/;

export default async (request: Request) => {
  const url = new URL(request.url);
  // Skip PostHog proxy paths — handled by Netlify redirects
  if (url.pathname.startsWith('/ph/')) return;

  // The Video.js 8 embed snippet links to this path with a trailing slash. Let the
  // request through so the redirect rule can serve the page in a single hop.
  if (url.pathname === '/html5-video-support/') return;

  // Send legacy pages straight to the legacy site rather than through the slashless path's redirect rule.
  const redirectUrl = LEGACY_PREFIXES.test(url.pathname)
    ? new URL(url.pathname, LEGACY_URL)
    : new URL(url.pathname.replace(/\/$/, ''), redirectOrigin(url));

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
