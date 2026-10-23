import { describe, expect, it } from 'vite-plus/test';

import {
  estimateMarkdownTokens,
  handleMarkdown,
  markdownTokenHeaderRules,
  staticMarkdownHeaderRules,
} from '../markdown-handler';

/** Read `_headers` rules the way Netlify does: a path line, then indented `name: value` lines. */
function parseHeaderRules(rules: string): Map<string, Record<string, string>> {
  const parsed = new Map<string, Record<string, string>>();
  let current: Record<string, string> | undefined;

  for (const line of rules.split('\n')) {
    if (!line.trim()) continue;

    if (!line.startsWith(' ')) {
      current = {};
      parsed.set(line, current);
      continue;
    }

    const separator = line.indexOf(':');

    current![line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  return parsed;
}

describe('estimateMarkdownTokens', () => {
  it('counts four characters per token, rounding up', () => {
    expect(estimateMarkdownTokens('')).toBe(0);
    expect(estimateMarkdownTokens('# Page')).toBe(2);
    expect(estimateMarkdownTokens('a'.repeat(4000))).toBe(1000);
  });
});

describe('staticMarkdownHeaderRules', () => {
  it('gives each static twin the headers the edge handler sets on negotiated Markdown, plus its size', async () => {
    const rules = parseHeaderRules(
      staticMarkdownHeaderRules([
        { path: '/docs/framework/react/guides/build-with-ai.md', tokens: 1200 },
        { path: '/docs/guides/installation.md', tokens: 800 },
      ])
    );
    const negotiated = await handleMarkdown(
      new Request('https://videojs.org/docs/framework/react/guides/build-with-ai', {
        headers: { accept: 'text/markdown' },
      }),
      { next: async () => new Response('# Build with AI') }
    );
    const negotiatedHeaders = {
      'content-type': negotiated!.headers.get('content-type'),
      'cache-control': negotiated!.headers.get('cache-control'),
      'netlify-cdn-cache-control': negotiated!.headers.get('netlify-cdn-cache-control'),
    };

    expect(rules).toEqual(
      new Map([
        ['/docs/framework/react/guides/build-with-ai.md', { ...negotiatedHeaders, 'x-markdown-tokens': '1200' }],
        ['/docs/guides/installation.md', { ...negotiatedHeaders, 'x-markdown-tokens': '800' }],
      ])
    );
  });

  it('leaves installation twins to the edge function', () => {
    expect(
      staticMarkdownHeaderRules([
        { path: '/docs/guides/installation/react.md', tokens: 1200 },
        { path: '/docs/guides/installation/shadcn.md', tokens: 1200 },
      ])
    ).toBe('');
  });
});

describe('markdownTokenHeaderRules', () => {
  it('adds only the size, so the indexes keep their content type and caching', () => {
    const rules = parseHeaderRules(
      markdownTokenHeaderRules([
        { path: '/llms.txt', tokens: 900 },
        { path: '/docs/framework/html/llms-full.txt', tokens: 250000 },
      ])
    );

    expect(rules).toEqual(
      new Map([
        ['/llms.txt', { 'x-markdown-tokens': '900' }],
        ['/docs/framework/html/llms-full.txt', { 'x-markdown-tokens': '250000' }],
      ])
    );
  });
});
