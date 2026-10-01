import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

import { SITE_TITLE } from '@/consts';
import { compareChangelogEntries } from '@/utils/changelog';

export const GET: APIRoute = async (context) => {
  const entries = (await getCollection('changelog')).sort((a, b) => compareChangelogEntries(a.data, b.data));

  return rss({
    title: `${SITE_TITLE} Changelog`,
    description: 'New features, fixes, and improvements in every Video.js release',
    site: context.site!,
    trailingSlash: false,
    items: entries.map((entry) => ({
      title: `v${entry.data.version}`,
      pubDate: entry.data.date,
      description: entry.data.description || undefined,
      link: `/changelog/${entry.id}`,
    })),
  });
};
