/**
 * Hosts that `netlify.toml` redirects wholesale to videojs.org. Edge functions run before those redirects, so an edge
 * redirect on one of these hosts would otherwise take a hop on the alias host before the alias rule moves it.
 */
export const ALIAS_HOSTS: ReadonlySet<string> = new Set([
  'videojs.com',
  'www.videojs.com',
  'v10.videojs.org',
  'vjs10-site.netlify.app',
]);

const CANONICAL_ORIGIN = 'https://videojs.org';

/** The origin an edge redirect should send a request to: videojs.org for alias hosts, the request's own otherwise. */
export function redirectOrigin(url: URL): string {
  return ALIAS_HOSTS.has(url.hostname) ? CANONICAL_ORIGIN : url.origin;
}
