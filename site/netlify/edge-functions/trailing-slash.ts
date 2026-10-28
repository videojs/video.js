import type { Config } from '@netlify/edge-functions';

/**
 * Hosts that `netlify.toml` redirects wholesale to videojs.org. Edge functions run before those redirects, so a slash
 * URL on one of these hosts would otherwise take a hop to its own slashless form before the alias rule moves it.
 */
export const ALIAS_HOSTS: ReadonlySet<string> = new Set([
  'videojs.com',
  'www.videojs.com',
  'v10.videojs.org',
  'vjs10-site.netlify.app',
]);

const CANONICAL_ORIGIN = 'https://videojs.org';

export default async (request: Request) => {
  const url = new URL(request.url);
  // Skip PostHog proxy paths — handled by Netlify redirects
  if (url.pathname.startsWith('/ph/')) return;

  // The Video.js 8 embed snippet links to this path with a trailing slash. Let the
  // request through so the redirect rule can serve the page in a single hop.
  if (url.pathname === '/html5-video-support/') return;

  const origin = ALIAS_HOSTS.has(url.hostname) ? CANONICAL_ORIGIN : url.origin;
  const redirectUrl = new URL(url.pathname.replace(/\/$/, ''), origin);

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
