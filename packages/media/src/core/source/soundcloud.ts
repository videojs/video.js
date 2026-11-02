/**
 * What a SoundCloud source plays.
 *
 * @internal
 */
export type SoundCloudSourceKind = 'track' | 'playlist';

/**
 * Parsed pieces of a SoundCloud source URL.
 *
 * @internal
 */
export interface ParsedSoundCloudSource {
  kind: SoundCloudSourceKind;
  /**
   * The URL the widget's `url` parameter takes: a `soundcloud.com` permalink or an `api.soundcloud.com` resource,
   * without the fragment and the query parameters SoundCloud adds for tracking. A secret token stays in it.
   */
  url: string;
  /** Start position in seconds parsed from a `#t=` fragment. */
  startTime: number | null;
  /** Widget parameters a `w.soundcloud.com/player/` embed URL carries, as written. `url` is not one of them. */
  params: Record<string, string>;
}

/**
 * Parse a SoundCloud source URL. Recognizes track and set permalinks (`soundcloud.com/<user>/<track>`,
 * `soundcloud.com/<user>/sets/<set>`, each with an optional `/s-<token>` secret segment), `m.soundcloud.com` links,
 * `api.soundcloud.com/tracks/<id>` and `api.soundcloud.com/playlists/<id>` resources (the id may be a
 * `soundcloud:tracks:<id>` URN, with an optional `secret_token`), and widget embed URLs
 * (`w.soundcloud.com/player/?url=...`), whose other parameters are kept. A `#t=` fragment sets the start position, in
 * seconds (`90`), clock time (`1:30`), or units (`1m30s`).
 *
 * @internal
 */
export function parseSoundCloudSource(src: string): ParsedSoundCloudSource | null {
  const url = parseUrl(src);
  if (!url) return null;

  if (url.hostname === WIDGET_HOST) return parseWidgetUrl(url);

  return parseResourceUrl(url, {});
}

function parseWidgetUrl(url: URL): ParsedSoundCloudSource | null {
  if (!WIDGET_PATH.test(url.pathname)) return null;

  const inner = parseUrl(url.searchParams.get('url') ?? '');
  // An embed URL nested in another plays nothing the outer one doesn't.
  if (!inner || inner.hostname === WIDGET_HOST) return null;

  const params = Object.fromEntries([...url.searchParams].filter(([key]) => key !== 'url'));
  const parsed = parseResourceUrl(inner, params);

  // The inner URL arrives encoded, so its fragment is still its own; one on the embed URL means the same.
  return parsed && { ...parsed, startTime: parsed.startTime ?? parseStartTime(url.hash) };
}

function parseResourceUrl(url: URL, params: Record<string, string>): ParsedSoundCloudSource | null {
  const host = url.hostname;
  const segments = url.pathname.split('/').filter(Boolean);
  const startTime = parseStartTime(url.hash);

  if (host === API_HOST) {
    const [collection, resource] = segments;
    const kind = collection === 'tracks' ? 'track' : collection === 'playlists' ? 'playlist' : null;
    const id = apiIdOf(collection, resource);
    if (!kind || !id || segments.length !== 2) return null;

    const token = url.searchParams.get('secret_token');
    const query = token && SECRET_TOKEN.test(token) ? `?secret_token=${token}` : '';

    return { kind, url: `https://${API_HOST}/${collection}/${id}${query}`, startTime, params };
  }

  if (!PERMALINK_HOSTS.has(host)) return null;

  const kind = permalinkKind(segments);
  if (!kind) return null;

  return { kind, url: `https://soundcloud.com/${segments.join('/')}`, startTime, params };
}

// A numeric id, or the URN SoundCloud's embed codes use (`soundcloud:tracks:<id>`) for the same collection.
function apiIdOf(collection: string | undefined, resource: string | undefined): string | null {
  if (!resource) return null;

  let decoded: string;

  try {
    decoded = decodeURIComponent(resource);
  } catch {
    return null;
  }

  if (NUMERIC_ID.test(decoded)) return decoded;

  const [scheme, urnCollection, id] = decoded.split(':');

  return scheme === 'soundcloud' && urnCollection === collection && id && NUMERIC_ID.test(id) ? id : null;
}

// `<user>/<track>` and `<user>/sets/<set>`, each optionally followed by a secret token segment.
function permalinkKind(segments: string[]): 'track' | 'playlist' | null {
  const [user, second, third, fourth] = segments;
  if (!user || !second || !SLUG.test(user) || RESERVED_ROOTS.has(user.toLowerCase())) return null;

  if (second === 'sets') {
    if (!third || !SLUG.test(third)) return null;

    return isOptionalSecret(fourth, segments.length, 3) ? 'playlist' : null;
  }

  if (!SLUG.test(second) || USER_PAGES.has(second.toLowerCase())) return null;

  return isOptionalSecret(third, segments.length, 2) ? 'track' : null;
}

function isOptionalSecret(segment: string | undefined, length: number, required: number): boolean {
  if (length === required) return true;

  return length === required + 1 && !!segment && SECRET_TOKEN.test(segment);
}

/** Read a `t=` value from a URL hash: `90`, `90s`, `1:30`, `1:02:03`, `1m30s`, or `1h2m3s`, raw or percent-encoded. */
function parseStartTime(hash: string): number | null {
  const raw = /(?:^#|&)t=([^&]+)/.exec(hash)?.[1];
  if (!raw) return null;

  let value: string;

  try {
    value = decodeURIComponent(raw).toLowerCase();
  } catch {
    return null;
  }

  if (CLOCK_TIME.test(value)) {
    return value.split(':').reduce((total, part) => total * 60 + Number.parseInt(part, 10), 0);
  }

  const units = UNIT_TIME.exec(value);
  if (!units || !units.slice(1).some(Boolean)) return null;

  const [, hours = '0', minutes = '0', seconds = '0'] = units;

  return Number.parseInt(hours, 10) * 3600 + Number.parseInt(minutes, 10) * 60 + Number.parseInt(seconds, 10);
}

/** Parse an absolute `http(s)` URL, or a host-first one such as `soundcloud.com/<user>/<track>`. */
function parseUrl(src: string): URL | null {
  const value = src.trim();
  if (!value) return null;

  try {
    const url = new URL(HAS_SCHEME.test(value) ? value : `https://${value.replace(/^\/\//, '')}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    url.hostname = url.hostname.toLowerCase();
    return url;
  } catch {
    return null;
  }
}

const WIDGET_HOST = 'w.soundcloud.com';
const WIDGET_PATH = /^\/player\/?$/;
const API_HOST = 'api.soundcloud.com';
const PERMALINK_HOSTS = new Set(['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com']);

const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const SLUG = /^[\w-]+$/;
const NUMERIC_ID = /^\d+$/;
const SECRET_TOKEN = /^s-\w+$/;
const CLOCK_TIME = /^\d+(?::\d{1,2}){1,2}$/;
const UNIT_TIME = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/;

// Site pages that share the `/<user>/<slug>` shape of a track permalink.
const RESERVED_ROOTS = new Set([
  'charts',
  'discover',
  'feed',
  'jobs',
  'messages',
  'mobile',
  'notifications',
  'pages',
  'people',
  'search',
  'settings',
  'stations',
  'stream',
  'tags',
  'upload',
  'you',
]);

// A user's own pages, which list sounds rather than name one.
const USER_PAGES = new Set([
  'albums',
  'comments',
  'followers',
  'following',
  'likes',
  'popular-tracks',
  'reposts',
  'spotlight',
  'toptracks',
  'tracks',
]);
