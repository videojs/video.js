/**
 * Parsed pieces of a Kaltura source URL.
 *
 * @internal
 */
export interface ParsedKalturaSource {
  /** The publisher account the entry belongs to. */
  partnerId: number;
  /** The entry to play, such as `1_sf5ovm7u`. */
  entryId: string;
  /** The player configuration an embed or preview URL names. */
  uiConfId?: number;
  /** A Kaltura Session the URL carries, from a `ks` path segment, a `ks` query parameter, or `flashvars[ks]`. */
  ks?: string;
  /** Origin of the Kaltura deployment the URL points at. Absent for Kaltura's own SaaS hosts. */
  serviceUrl?: string;
  /** The URL itself, when it is an HLS `playManifest` URL that plays as written. */
  manifestUrl?: string;
}

/**
 * Parse a Kaltura source. Recognizes the `kaltura/<partnerId>/<entryId>` shorthand and Kaltura URLs that name both a
 * partner and an entry: V2 embeds (`embedIframeJs`, `mwEmbedFrame.php`, `kwidget`), V7 embeds (`embedPlaykitJs`),
 * preview pages (`extwidget/preview`), and `playManifest` stream URLs. Any host is accepted, so URLs from a self-hosted
 * or regional Kaltura deployment parse too. A bare entry id names no partner, so it is not a source.
 *
 * @internal
 */
export function parseKalturaSource(src: string): ParsedKalturaSource | null {
  const value = src.trim();

  const shorthand = SHORTHAND.exec(value);
  if (shorthand) return toParsed(shorthand[1], shorthand[2], {});

  const url = parseUrl(value);
  if (!url) return null;

  const segments = url.pathname.split('/').filter(Boolean).map(decodeSegment);
  if (!segments.some((segment) => MARKERS.has(segment.toLowerCase()))) return null;

  const pairs = readPathPairs(segments);
  const query = url.searchParams;
  const isManifest = segments.some((segment) => segment.toLowerCase() === 'playmanifest');
  const partnerId =
    pairs.p ?? pairs.partner_id ?? pairs.partnerid ?? widgetPartner(pairs.wid) ?? query.get('partner_id') ?? undefined;
  const entryId = pairs.entry_id ?? pairs.entryid ?? query.get('entry_id') ?? query.get('entryId') ?? undefined;

  return toParsed(partnerId, entryId, {
    uiConfId: pairs.uiconf_id ?? pairs.uiconfid ?? query.get('uiconf_id') ?? undefined,
    ks: pairs.ks ?? query.get('ks') ?? query.get('flashvars[ks]') ?? undefined,
    serviceUrl: SAAS_HOSTS.has(url.hostname) ? undefined : url.origin,
    manifestUrl: isManifest && pairs.format?.toLowerCase() === 'applehttp' ? url.href : undefined,
  });
}

function toParsed(
  partnerId: string | undefined,
  entryId: string | undefined,
  options: {
    uiConfId?: string | undefined;
    ks?: string | undefined;
    serviceUrl?: string | undefined;
    manifestUrl?: string | undefined;
  }
): ParsedKalturaSource | null {
  if (!partnerId || !NUMERIC_ID.test(partnerId) || !entryId || !ENTRY_ID.test(entryId)) return null;

  const { uiConfId, ks, serviceUrl, manifestUrl } = options;

  return {
    partnerId: Number(partnerId),
    entryId,
    ...(uiConfId && NUMERIC_ID.test(uiConfId) && { uiConfId: Number(uiConfId) }),
    ...(ks && { ks }),
    ...(serviceUrl && { serviceUrl }),
    ...(manifestUrl && { manifestUrl }),
  };
}

/** Kaltura paths are `/key/value/` pairs broken up by verbs such as `playManifest`; read the keys this parser knows. */
function readPathPairs(segments: string[]): Partial<Record<PathKey, string>> {
  const pairs: Partial<Record<PathKey, string>> = {};

  for (let index = 0; index < segments.length - 1; index++) {
    const key = segments[index]!.toLowerCase();
    if (!isPathKey(key)) continue;

    pairs[key] ??= segments[index + 1]!;
    index++;
  }

  return pairs;
}

function isPathKey(key: string): key is PathKey {
  return PATH_KEY_SET.has(key);
}

/** Widget ids name a partner as `_<partnerId>`. */
function widgetPartner(wid: string | undefined): string | undefined {
  return wid?.startsWith('_') ? wid.slice(1) : undefined;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/** Parse an absolute `http(s)` URL, or a host-first one such as `cdnapisec.kaltura.com/p/...`. */
function parseUrl(src: string): URL | null {
  if (!src) return null;

  try {
    const url = new URL(HAS_SCHEME.test(src) ? src : `https://${src.replace(/^\/\//, '')}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    return url;
  } catch {
    return null;
  }
}

const SHORTHAND = /^kaltura\/([^/?#]+)\/([^/?#]+)\/?$/i;
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const NUMERIC_ID = /^\d+$/;
const ENTRY_ID = /^\d+_[a-z\d]+$/i;

// Path segments that make a URL a Kaltura player or stream URL rather than any other page on the host.
const MARKERS = new Set(['embediframejs', 'embedplaykitjs', 'mwembedframe.php', 'kwidget', 'preview', 'playmanifest']);

const PATH_KEYS = [
  'p',
  'sp',
  'partner_id',
  'partnerid',
  'wid',
  'entry_id',
  'entryid',
  'uiconf_id',
  'uiconfid',
  'ks',
  'format',
  'protocol',
  'flavorids',
  'deliveryprofileid',
] as const;

type PathKey = (typeof PATH_KEYS)[number];

const PATH_KEY_SET: ReadonlySet<string> = new Set(PATH_KEYS);

// Kaltura's SaaS API hosts, all served by the default service URL.
const SAAS_HOSTS = new Set([
  'kaltura.com',
  'www.kaltura.com',
  'cdnapi.kaltura.com',
  'cdnapisec.kaltura.com',
  'cdnsecakmi.kaltura.com',
  'cdnakmi.kaltura.com',
]);
