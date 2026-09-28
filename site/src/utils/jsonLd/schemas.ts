/**
 * JSON-LD Schema Helpers
 *
 * Centralized functions for generating Schema.org JSON-LD structured data. Uses schema-dts for type safety.
 */

import type { CollectionEntry } from 'astro:content';
import type { BlogPosting, CollectionPage, Person, ProfilePage, TechArticle, WithContext } from 'schema-dts';

/** Create a TechArticle schema for documentation pages. */
export function createTechArticleSchema(params: {
  title: string;
  description: string;
  url: string;
  updatedDate?: Date;
  wordCount?: number;
  readingTime?: number;
  articleSection?: string;
}): WithContext<TechArticle> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: params.title,
    description: params.description,
    url: params.url,
    ...(params.updatedDate && { dateModified: params.updatedDate.toISOString() }),
    ...(params.wordCount && { wordCount: params.wordCount }),
    ...(params.readingTime && { timeRequired: `PT${params.readingTime}M` }),
    ...(params.articleSection && { articleSection: params.articleSection }),
    about: {
      '@type': 'SoftwareApplication',
      name: 'Video.js',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
    },
    author: {
      '@type': 'Organization',
      name: 'Video.js',
      url: 'https://videojs.org',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Video.js',
      url: 'https://videojs.org',
    },
    inLanguage: 'en-US',
  };
}

/** Create a BlogPosting schema for individual blog posts. */
export function createBlogPostingSchema(params: {
  title: string;
  description: string;
  url: string;
  pubDate: Date;
  updatedDate?: Date;
  wordCount?: number;
  readingTime?: number;
  authors: CollectionEntry<'authors'>[];
  siteUrl: string;
  image?: string;
}): WithContext<BlogPosting> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: params.title,
    description: params.description,
    url: params.url,
    ...(params.image && { image: params.image }),
    datePublished: params.pubDate.toISOString(),
    ...(params.updatedDate && { dateModified: params.updatedDate.toISOString() }),
    ...(params.wordCount && { wordCount: params.wordCount }),
    ...(params.readingTime && { timeRequired: `PT${params.readingTime}M` }),
    author: params.authors.map((author): Person => ({
      '@type': 'Person',
      name: author.data.name,
      url: author.data.socialLinks?.website || `${params.siteUrl}blog/authors/${author.id}`,
      ...(author.data.bio && { description: author.data.bio }),
      ...(author.data.avatar && { image: author.data.avatar }),
      ...(author.data.socialLinks && {
        sameAs: [
          author.data.socialLinks.x,
          author.data.socialLinks.bluesky,
          author.data.socialLinks.mastodon,
          author.data.socialLinks.github,
          author.data.socialLinks.linkedin,
          author.data.socialLinks.website,
        ].filter(Boolean) as string[],
      }),
    })),
    publisher: {
      '@type': 'Organization',
      name: 'Video.js',
      url: 'https://videojs.org',
    },
    inLanguage: 'en-US',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': params.url,
    },
  };
}

/** Create a CollectionPage schema for the blog index page. */
export function createBlogCollectionSchema(params: {
  url: string;
  posts: CollectionEntry<'blog'>[];
  siteUrl: string;
}): WithContext<CollectionPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Video.js Blog',
    description: 'News and updates from the Video.js open-source video player project',
    url: params.url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: params.posts.length,
      itemListElement: params.posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${params.siteUrl}blog/${post.id}`,
      })),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Video.js',
      url: 'https://videojs.org',
    },
    inLanguage: 'en-US',
  };
}

/** Create a CollectionPage schema for the blog author index page. */
export function createAuthorCollectionSchema(params: {
  url: string;
  authors: CollectionEntry<'authors'>[];
  siteUrl: string;
}): WithContext<CollectionPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Authors',
    description: 'Folks who write sick content for the Video.js blog',
    url: params.url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: params.authors.length,
      itemListElement: params.authors.map((author, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Person',
          name: author.data.name,
          url: `${params.siteUrl}blog/authors/${author.id}`,
          ...(author.data.bio && { description: author.data.bio }),
          ...(author.data.avatar && { image: author.data.avatar }),
          ...(author.data.socialLinks && {
            sameAs: [
              author.data.socialLinks.x,
              author.data.socialLinks.bluesky,
              author.data.socialLinks.mastodon,
              author.data.socialLinks.github,
              author.data.socialLinks.linkedin,
              author.data.socialLinks.website,
            ].filter(Boolean) as string[],
          }),
        } as Person,
      })),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Video.js',
      url: 'https://videojs.org',
    },
    inLanguage: 'en-US',
  };
}

/** Create a ProfilePage schema for individual author pages. */
export function createProfilePageSchema(params: {
  url: string;
  author: CollectionEntry<'authors'>;
  posts: CollectionEntry<'blog'>[];
  siteUrl: string;
}): WithContext<ProfilePage> {
  const personSchema: Person = {
    '@type': 'Person',
    name: params.author.data.name,
    url: params.url,
    ...(params.author.data.bio && { description: params.author.data.bio }),
    ...(params.author.data.avatar && { image: params.author.data.avatar }),
    ...(params.author.data.socialLinks && {
      sameAs: [
        params.author.data.socialLinks.x,
        params.author.data.socialLinks.bluesky,
        params.author.data.socialLinks.mastodon,
        params.author.data.socialLinks.github,
        params.author.data.socialLinks.linkedin,
        params.author.data.socialLinks.website,
      ].filter(Boolean) as string[],
    }),
    // Include authored articles
    ...(params.posts.length > 0 && {
      publishedWorks: params.posts.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.data.title,
        url: `${params.siteUrl}blog/${post.id}`,
        datePublished: post.data.pubDate.toISOString(),
      })),
    }),
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${params.author.data.name} - Author Profile`,
    description: `Posts by ${params.author.data.name} on the Video.js blog`,
    url: params.url,
    mainEntity: personSchema,
    publisher: {
      '@type': 'Organization',
      name: 'Video.js',
      url: 'https://videojs.org',
    },
    inLanguage: 'en-US',
  };
}
