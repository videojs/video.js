import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection, getEntries } from 'astro:content';

import { createFeedContentRenderer } from '@/utils/feeds/feedContent';
import {
  buildChannelCustomData,
  buildItemCustomData,
  FEED_ITEM_LIMIT,
  FEEDS,
  RSS_NAMESPACES,
} from '@/utils/feeds/rssFeed';

const FEED = FEEDS.blog;

export const GET: APIRoute = async (context) => {
  const site = context.site!;
  const pageUrl = new URL(FEED.pagePath, site);
  const posts = (await getCollection('blog'))
    .filter((post) => !post.data.devOnly || import.meta.env.DEV)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .slice(0, FEED_ITEM_LIMIT);

  const renderFeedContent = await createFeedContentRenderer();
  const items = [];

  for (const post of posts) {
    const url = new URL(`/blog/${post.id}`, site);
    const authors = await getEntries(post.data.authors);
    const { ogImage } = post.data;

    items.push({
      title: post.data.title,
      link: url.href,
      // Publication only. `updatedDate` comes from git history, which moves on every typo fix, and readers resurface
      // updated items as new.
      pubDate: post.data.pubDate,
      description: post.data.description,
      content: await renderFeedContent(post, url),
      customData: buildItemCustomData({
        creators: authors.map((author) => author.data.name),
        imageUrl: ogImage ? new URL(typeof ogImage === 'string' ? ogImage : ogImage.src, site).href : undefined,
      }),
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
      lastBuildDate: posts[0]?.data.pubDate,
    }),
    items,
  });
};
