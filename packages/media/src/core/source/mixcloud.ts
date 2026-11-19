/**
 * Parsed pieces of a Mixcloud source URL.
 *
 * @internal
 */
export interface ParsedMixcloudSource {
  /** The show's key, `/<user>/<show>/`, as the widget's `feed` parameter and its `load()` method take it. */
  key: string;
  /** Widget parameters a widget embed URL carries, as written. `feed` is not one of them. */
  params: Record<string, string>;
}

/**
 * Parse a Mixcloud source URL. Recognizes show URLs (`mixcloud.com/<user>/<show>/`, also on the `www.` and `m.` hosts)
 * and widget embed URLs (`www.mixcloud.com/widget/iframe/?feed=...` and `player-widget.mixcloud.com/?feed=...`), whose
 * `feed` is a show URL or key and whose other parameters are kept. Profiles, playlists, and the other pages that list
 * shows are not shows.
 *
 * @internal
 */
export function parseMixcloudSource(src: string): ParsedMixcloudSource | null {
  const url = parseUrl(src);
  if (!url) return null;

  const isWidget =
    (url.hostname === WIDGET_HOST && WIDGET_HOST_PATH.test(url.pathname)) ||
    (SITE_HOSTS.has(url.hostname) && SITE_WIDGET_PATH.test(url.pathname));
  if (!isWidget) return SITE_HOSTS.has(url.hostname) ? showOf(url, {}) : null;

  const feed = parseUrl(url.searchParams.get('feed') ?? '', SITE_ORIGIN);
  if (!feed || !SITE_HOSTS.has(feed.hostname)) return null;

  return showOf(feed, Object.fromEntries([...url.searchParams].filter(([key]) => key !== 'feed')));
}

function showOf(url: URL, params: Record<string, string>): ParsedMixcloudSource | null {
  const segments = url.pathname.split('/').filter(Boolean);
  const [user, show] = segments;
  if (segments.length !== 2 || !user || !show) return null;

  if (RESERVED_ROOTS.has(user.toLowerCase()) || USER_PAGES.has(show.toLowerCase())) return null;

  return { key: `/${user}/${show}/`, params };
}

/** Parse an absolute `http(s)` URL, a host-first one such as `mixcloud.com/<user>/<show>/`, or a path against `base`. */
function parseUrl(src: string, base?: string): URL | null {
  const value = src.trim();
  if (!value) return null;

  try {
    const url = HAS_SCHEME.test(value)
      ? new URL(value)
      : base
        ? new URL(value, base)
        : new URL(`https://${value.replace(/^\/\//, '')}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    url.hostname = url.hostname.toLowerCase();
    return url;
  } catch {
    return null;
  }
}

const SITE_ORIGIN = 'https://www.mixcloud.com';
const SITE_HOSTS = new Set(['mixcloud.com', 'www.mixcloud.com', 'm.mixcloud.com']);
const SITE_WIDGET_PATH = /^\/widget\/iframe\/?$/;
const WIDGET_HOST = 'player-widget.mixcloud.com';
const WIDGET_HOST_PATH = /^\/(?:widget\/iframe\/?)?$/;

const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;

// Site pages that share the `/<user>/<show>/` shape of a show URL.
const RESERVED_ROOTS = new Set([
  'about',
  'assets',
  'blog',
  'categories',
  'community',
  'dashboard',
  'developers',
  'discover',
  'genres',
  'jobs',
  'live',
  'login',
  'messages',
  'notifications',
  'oembed',
  'plans',
  'premium',
  'privacy',
  'pro',
  'search',
  'select',
  'settings',
  'signup',
  'tag',
  'terms',
  'trending',
  'upload',
  'widget',
]);

// A user's own pages, which list shows rather than name one.
const USER_PAGES = new Set([
  'activity',
  'cloudcasts',
  'favorites',
  'feed',
  'followers',
  'following',
  'hosts',
  'listens',
  'playlists',
  'posts',
  'reposts',
  'stream',
  'uploads',
]);
