import { getCollection } from 'astro:content';

import { BLOG_PAGE_SIZE } from '@/consts';
import { SUPPORTED_FRAMEWORKS, type SupportedFramework } from '@/types/docs';
import { filterSidebar, getAllGuideSlugs } from '@/utils/docs/sidebar';
import { getDocTitle } from '@/utils/docs/title';
import {
  CANONICAL_INSTALLATION_SLUGS,
  getInstallationRoutePath,
  INSTALLATION_ROUTES,
  INSTALLATION_ROUTE_SEGMENTS,
} from '@/utils/installation/routes';
import { normalizeSitePath } from '@/utils/og/normalize-site-path';

const STATIC_PAGES: { path: string; title: string }[] = [
  { path: 'index', title: 'The open source player for the web' },
  { path: 'support', title: 'Support' },
  { path: 'html5-video-support', title: 'HTML5 video support' },
  { path: 'help', title: 'Video player help' },
  { path: 'privacy', title: 'Privacy' },
  { path: 'blog', title: 'Blog' },
];

export type OgTitleEntryKind = 'static' | 'blog' | 'blog-index' | 'author' | 'docs' | 'changelog' | 'changelog-index';
export type OgTitleSource = 'static' | 'title' | 'ogTitle' | 'frameworkTitle' | 'name';

export interface OgTitleEntry {
  kind: OgTitleEntryKind;
  path: string;
  title: string;
  source: OgTitleSource;
  collectionId?: string;
  framework?: SupportedFramework;
}

export async function listOgTitleEntries(): Promise<OgTitleEntry[]> {
  const entries: OgTitleEntry[] = [];

  for (const { path, title } of STATIC_PAGES) {
    entries.push({
      kind: path === 'blog' ? 'blog-index' : 'static',
      path,
      title,
      source: 'static',
    });
  }

  const blogPosts = (await getCollection('blog')).filter((post) => !post.data.devOnly || import.meta.env.DEV);

  for (const post of blogPosts) {
    entries.push({
      kind: 'blog',
      path: `blog/${post.id}`,
      title: post.data.ogTitle ?? post.data.title,
      source: post.data.ogTitle ? 'ogTitle' : 'title',
      collectionId: post.id,
    });
  }

  const totalBlogPages = Math.ceil(blogPosts.length / BLOG_PAGE_SIZE);

  for (let page = 2; page <= totalBlogPages; page += 1) {
    entries.push({
      kind: 'blog-index',
      path: `blog/${page}`,
      title: 'Blog',
      source: 'static',
    });
  }

  const changelogEntries = await getCollection('changelog');

  entries.push({
    kind: 'changelog-index',
    path: 'changelog',
    title: 'Changelog',
    source: 'static',
  });

  for (const entry of changelogEntries) {
    entries.push({
      kind: 'changelog',
      path: `changelog/${entry.id}`,
      title: `v${entry.data.version} Changelog`,
      source: 'title',
      collectionId: entry.id,
    });
  }

  const totalChangelogPages = Math.ceil(changelogEntries.length / BLOG_PAGE_SIZE);

  for (let page = 2; page <= totalChangelogPages; page += 1) {
    entries.push({
      kind: 'changelog-index',
      path: `changelog/${page}`,
      title: 'Changelog',
      source: 'static',
    });
  }

  const authors = await getCollection('authors');

  for (const author of authors) {
    entries.push({
      kind: 'author',
      path: `blog/authors/${author.id}`,
      title: author.data.name,
      source: 'name',
      collectionId: author.id,
    });
  }

  const docsCollection = await getCollection('docs');

  for (const framework of SUPPORTED_FRAMEWORKS) {
    const allowedSlugs = new Set(getAllGuideSlugs(filterSidebar(framework)));

    for (const doc of docsCollection) {
      if (!allowedSlugs.has(doc.id) || CANONICAL_INSTALLATION_SLUGS.has(doc.id)) {
        continue;
      }

      const frameworkTitle = doc.data.frameworkTitle?.[framework];

      entries.push({
        kind: 'docs',
        path: `docs/framework/${framework}/${doc.id}`,
        title: doc.data.ogTitle ?? getDocTitle(doc, framework),
        source: doc.data.ogTitle ? 'ogTitle' : frameworkTitle ? 'frameworkTitle' : 'title',
        collectionId: doc.id,
        framework,
      });
    }
  }

  for (const route of INSTALLATION_ROUTE_SEGMENTS) {
    const config = INSTALLATION_ROUTES[route];
    const doc = docsCollection.find((entry) => entry.id === config.slug);
    if (!doc) throw new Error(`Missing installation document: ${config.slug}`);

    const frameworkTitle = doc.data.frameworkTitle?.[config.framework];

    entries.push({
      kind: 'docs',
      path: getInstallationRoutePath(route).replace(/^\//, ''),
      title: doc.data.ogTitle ?? getDocTitle(doc, config.framework),
      source: doc.data.ogTitle ? 'ogTitle' : frameworkTitle ? 'frameworkTitle' : 'title',
      collectionId: doc.id,
      framework: config.framework,
    });
  }

  return entries;
}

export async function buildOgTitleMap(): Promise<Map<string, string>> {
  const titleMap = new Map<string, string>();

  for (const entry of await listOgTitleEntries()) {
    const normalizedPath = normalizeSitePath(entry.path);
    const existingTitle = titleMap.get(normalizedPath);

    if (existingTitle && existingTitle !== entry.title) {
      throw new Error(
        `Duplicate OG image path "${normalizedPath}" maps to multiple titles: ` +
          `"${existingTitle}" and "${entry.title}".`
      );
    }

    titleMap.set(normalizedPath, entry.title);
  }

  return titleMap;
}
