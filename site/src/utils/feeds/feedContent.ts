import mdxRenderer from '@astrojs/mdx/server.js';
import reactRenderer from '@astrojs/react/server.js';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { CollectionEntry } from 'astro:content';
import { render } from 'astro:content';

import FeedCodeFrame from '@/components/feed/CodeFrame.astro';
import defaultMarkdownComponents from '@/components/typography/defaultMarkdownComponents';

import { cleanFeedHtml } from './feedHtml';

/**
 * The site's capitalized MDX components, which bodies use without importing them, so rendering fails without them. The
 * lowercase entries only restyle plain elements (`p`, `a`, `h2`), and a feed wants those plain.
 */
const mdxComponents = Object.fromEntries(
  Object.entries(defaultMarkdownComponents).filter(([name]) => /^[A-Z]/.test(name))
);

const feedMarkdownComponents = { ...mdxComponents, CodeFrame: FeedCodeFrame };

/**
 * Renders entry bodies to feed HTML through the same MDX pipeline as the page, so anything an entry can show on the
 * site (code blocks, asides, images) reaches the feed too.
 */
export async function createFeedContentRenderer() {
  const container = await AstroContainer.create();

  container.addServerRenderer({ name: '@astrojs/mdx', renderer: mdxRenderer });
  // Entries embed React islands; their markup is rendered here and then sorted out by `cleanFeedHtml`.
  container.addServerRenderer({ name: '@astrojs/react', renderer: reactRenderer });
  container.addClientRenderer({ name: '@astrojs/react', entrypoint: '@astrojs/react/client.js' });

  return async function renderFeedContent(
    entry: CollectionEntry<'blog'> | CollectionEntry<'changelog'>,
    entryUrl: URL
  ): Promise<string> {
    const { Content } = await render(entry);
    const html = await container.renderToString(Content, {
      partial: true,
      props: { components: feedMarkdownComponents },
    });

    return cleanFeedHtml(html, entryUrl);
  };
}
