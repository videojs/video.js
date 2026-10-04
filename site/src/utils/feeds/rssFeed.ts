import { SITE_TITLE } from '@/consts';

/** Every feed the site publishes, most important first: readers list discovered feeds in this order. */
export const FEEDS = {
  blog: {
    title: `${SITE_TITLE} Blog`,
    description: 'News and updates from the Video.js open-source video player project',
    path: '/rss.xml',
    pagePath: '/blog',
  },
  changelog: {
    title: `${SITE_TITLE} Changelog`,
    description: 'New features, fixes, and improvements in every Video.js release',
    path: '/changelog/rss.xml',
    pagePath: '/changelog',
  },
} as const;

/**
 * Newest entries only. Items carry their full content, so the cap keeps each feed well under the 1 MB some readers
 * refuse; older entries stay on the site.
 */
export const FEED_ITEM_LIMIT = 20;

/** Namespaces for the fields RSS 2.0 has no element for. */
export const RSS_NAMESPACES = {
  atom: 'http://www.w3.org/2005/Atom',
  dc: 'http://purl.org/dc/elements/1.1/',
  media: 'http://search.yahoo.com/mrss/',
};

const XML_ESCAPES = new Map([
  ['&', '&amp;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['"', '&quot;'],
  ["'", '&apos;'],
]);

/** `customData` is spliced into the feed as raw XML, so anything interpolated into it is escaped by hand. */
export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => XML_ESCAPES.get(character) ?? character);
}

interface ChannelMetadata {
  title: string;
  /** Absolute URL of the feed itself. */
  feedUrl: URL;
  /** Absolute URL of the page the feed covers. */
  pageUrl: URL;
  /** Newest item's date, rather than "now", so rebuilding unchanged content changes nothing. */
  lastBuildDate?: Date;
}

/** Channel elements `@astrojs/rss` has no option for. */
export function buildChannelCustomData({ title, feedUrl, pageUrl, lastBuildDate }: ChannelMetadata): string {
  return [
    '<language>en-us</language>',
    // Lets readers follow the feed if it moves, and canonicalizes the URL variants subscribers paste in.
    `<atom:link href="${escapeXml(feedUrl.href)}" rel="self" type="application/rss+xml"/>`,
    lastBuildDate ? `<lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>` : '',
    `<image><url>${escapeXml(new URL('/apple-touch-icon.png', pageUrl).href)}</url><title>${escapeXml(title)}</title><link>${escapeXml(pageUrl.href)}</link></image>`,
  ].join('');
}

interface ItemMetadata {
  /** Author names. RSS's own `<author>` must be an email address, which the site doesn't publish. */
  creators?: string[];
  /** Absolute URL of an image readers can show as the item's card. */
  imageUrl?: string;
}

/** Item elements `@astrojs/rss` has no option for. */
export function buildItemCustomData({ creators = [], imageUrl }: ItemMetadata): string {
  return [
    ...creators.map((name) => `<dc:creator>${escapeXml(name)}</dc:creator>`),
    // `<enclosure>` would need the image's byte length.
    imageUrl ? `<media:content url="${escapeXml(imageUrl)}" medium="image"/>` : '',
  ].join('');
}
