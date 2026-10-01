import { PRERELEASE_URL, PRODUCTION_URL } from '@/consts';

/**
 * Where a link leads, as the PostHog `destination` autocapture property. `docs` and `blog` mark cross-section links on
 * this site; `getLinkDestination` only returns the off-site values.
 */
export type LinkDestination = 'mux' | 'github' | 'discord' | 'npm' | 'docs' | 'blog' | 'external';

const SITE_HOSTNAMES = new Set([PRODUCTION_URL.hostname, `www.${PRODUCTION_URL.hostname}`, PRERELEASE_URL.hostname]);

// Media and poster hosts, not pages on the Mux site.
const MUX_ASSET_HOSTNAMES = new Set(['stream.mux.com', 'image.mux.com']);

const OFF_SITE_DOMAINS: readonly [domain: string, destination: LinkDestination][] = [
  ['mux.com', 'mux'],
  ['github.com', 'github'],
  ['discord.gg', 'discord'],
  ['discord.com', 'discord'],
  ['npmjs.com', 'npm'],
];

function isOnDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

/**
 * Classify an off-site link for analytics. On-site links, fragments, and non-web schemes such as `mailto:` return
 * `undefined`.
 */
export function getLinkDestination(href: string | URL | null | undefined): LinkDestination | undefined {
  if (!href) return undefined;

  let url: URL;

  try {
    url = new URL(href, PRODUCTION_URL);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return undefined;

  const { hostname } = url;
  if (SITE_HOSTNAMES.has(hostname)) return undefined;

  if (MUX_ASSET_HOSTNAMES.has(hostname)) return 'external';

  return OFF_SITE_DOMAINS.find(([domain]) => isOnDomain(hostname, domain))?.[1] ?? 'external';
}
