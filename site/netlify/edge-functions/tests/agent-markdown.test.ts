// @vitest-environment node
import { escapeRegExp } from 'es-toolkit/string';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { llmsIndexPaths } from '../../../integrations/llms-sections';
import type { CounterContext } from '../../../src/utils/agent-analytics';
import agentMarkdownNegotiation, { config as negotiationCounterConfig } from '../agent-markdown-negotiation';
import agentMarkdownTwins, { config as twinsCounterConfig } from '../agent-markdown-twins';
import { config as negotiationConfig } from '../markdown-negotiation';

// A production context would otherwise send real events to PostHog.
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}'))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Netlify's `*` matches any run of characters, slashes included. Node 22 has no `URLPattern` to check it with.
function matchesPath(paths: string | string[] | undefined, pathname: string): boolean {
  return [paths ?? []]
    .flat()
    .some((path) => new RegExp(`^${path.split('*').map(escapeRegExp).join('.*')}$`).test(pathname));
}

function edgeContext(response: Response, deploy = 'production') {
  const pending: Promise<unknown>[] = [];
  const context: CounterContext = {
    next: vi.fn(async () => response),
    deploy: { context: deploy },
    geo: { country: { code: 'US' } },
    waitUntil: (promise) => pending.push(promise),
  };

  return { context, pending };
}

describe('agentMarkdownNegotiation', () => {
  it('matches exactly the requests markdown-negotiation handles', () => {
    expect(negotiationCounterConfig.path).toEqual(negotiationConfig.path);
    expect(negotiationCounterConfig.excludedPath).toEqual(negotiationConfig.excludedPath);
    expect(negotiationCounterConfig.header).toEqual(negotiationConfig.header);
    expect(negotiationCounterConfig.method).toEqual(negotiationConfig.method);
  });

  it('never caches, so it runs on requests the Markdown functions answer from cache', () => {
    expect(negotiationCounterConfig).not.toHaveProperty('cache');
    expect(twinsCounterConfig).not.toHaveProperty('cache');
  });

  it('passes the response through and counts a negotiated Markdown read', async () => {
    const response = new Response('# Page', { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
    const { context, pending } = edgeContext(response);

    const result = await agentMarkdownNegotiation(new Request('https://videojs.org/docs/guides/why-videojs'), context);

    expect(result).toBe(response);
    expect(pending).toHaveLength(1);

    await Promise.all(pending);

    expect(fetch).toHaveBeenCalledOnce();
  });

  it('does not count a request that fell back to HTML', async () => {
    const { context, pending } = edgeContext(new Response('<html>', { headers: { 'content-type': 'text/html' } }));

    await agentMarkdownNegotiation(new Request('https://videojs.org/docs/guides/why-videojs'), context);

    expect(pending).toHaveLength(0);
  });
});

describe('agentMarkdownTwins', () => {
  it('covers every Markdown twin and every llms index the build writes', () => {
    for (const path of [...llmsIndexPaths(), '/docs/framework/react/guides/why-videojs.md']) {
      expect(matchesPath(twinsCounterConfig.path, path), path).toBe(true);
    }

    expect(matchesPath(twinsCounterConfig.path, '/docs/framework/react/guides/why-videojs')).toBe(false);
    expect(twinsCounterConfig.onError).toBe('bypass');
  });

  it('labels a section index as llms, not as a twin', async () => {
    const { context, pending } = edgeContext(new Response('# Guides'));

    await agentMarkdownTwins(new Request('https://videojs.org/docs/framework/html/guides/llms-full.txt'), context);
    await Promise.all(pending);

    const [, init] = vi.mocked(fetch).mock.calls[0] ?? [];

    expect(JSON.parse(String(init?.body))).toMatchObject({ properties: { markdown_via: 'llms' } });
  });

  it('passes the response through and counts the read, missing twins included', async () => {
    const response = new Response('Not found', { status: 404 });
    const { context, pending } = edgeContext(response);

    const result = await agentMarkdownTwins(new Request('https://videojs.org/docs/guessed-page.md'), context);

    expect(result).toBe(response);
    expect(pending).toHaveLength(1);
  });

  it('counts nothing outside production', async () => {
    const { context, pending } = edgeContext(new Response('# llms'), 'deploy-preview');

    await agentMarkdownTwins(new Request('https://videojs.org/llms.txt'), context);

    expect(pending).toHaveLength(0);
  });
});
