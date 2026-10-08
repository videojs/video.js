import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { compareChangelogEntries, releaseCategories } from '@/utils/changelog';
import { createFeedContentRenderer } from '@/utils/feeds/feedContent';
import { buildChannelCustomData, escapeXml, FEED_ITEM_LIMIT, FEEDS, RSS_NAMESPACES } from '@/utils/feeds/rssFeed';

const FEED = FEEDS.changelog;

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const pageUrl = new URL(FEED.pagePath, site);
  const entries = (await getCollection('changelog'))
    .sort((a, b) => compareChangelogEntries(a.data, b.data))
    .slice(0, FEED_ITEM_LIMIT);

  const renderFeedContent = await createFeedContentRenderer();
  const items = [];

  for (const entry of entries) {
    const url = new URL(`/changelog/${entry.id}`, site);
    const content = await renderFeedContent(entry, url);

    items.push({
      title: `v${entry.data.version}`,
      link: url.href,
      pubDate: entry.data.date,
      // Empty until the changelog-prose workflow writes it; readers derive a summary from the content meanwhile.
      description: entry.data.description || undefined,
      categories: releaseCategories(entry.data),
      // The page shows the compare link in its header, outside the body.
      content: `${content}<p><a href="${escapeXml(entry.data.compareUrl)}">Compare changes on GitHub</a></p>`,
    });
  }

  return rss({
    title: FEED.title,
    description: FEED.description,
    // The channel `<link>` is the page the feed covers.
    site: pageUrl,
    trailingSlash: false,
    xmlns: RSS_NAMESPACES,
    customData: buildChannelCustomData({
      title: FEED.title,
      feedUrl: new URL(FEED.path, site),
      pageUrl,
      lastBuildDate: entries[0]?.data.date,
    }),
    items,
  });
};
