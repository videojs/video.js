// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';

import {
  classifyUserAgent,
  isMarkdownResponse,
  markdownFetchEvent,
  recordMarkdownFetch,
  type RecordContext,
} from '../agent-analytics';

const NOW = new Date('2026-09-30T12:00:00Z');
const CLAUDE_BOT =
  'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)';
const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

function markdownRequest(url: string, userAgent = CLAUDE_BOT): Request {
  return new Request(url, { headers: { 'user-agent': userAgent } });
}

function markdownResponse(status = 200): Response {
  return new Response('# Page', { status, headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}

describe('classifyUserAgent', () => {
  it.each([
    [CLAUDE_BOT, 'anthropic', 'ai'],
    ['Claude-User (claude-code/2.1.0; +https://support.anthropic.com/)', 'anthropic', 'ai'],
    [
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
      'openai',
      'ai',
    ],
    ['Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0)', 'perplexity', 'ai'],
    ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'google', 'search'],
    ['curl/8.7.1', 'curl', 'http-client'],
    ['python-httpx/0.27.0', 'python', 'http-client'],
    ['node', 'javascript', 'http-client'],
    ['axios/1.7.2', 'javascript', 'http-client'],
    [CHROME, 'browser', 'browser'],
    ['SomethingNew/1.0', 'other', 'unknown'],
    ['', 'none', 'unknown'],
  ])('classifies %s', (userAgent, agent, kind) => {
    expect(classifyUserAgent(userAgent)).toEqual({ agent, agent_kind: kind });
  });
});

describe('markdownFetchEvent', () => {
  it('describes the read without a person or the IP address', async () => {
    const body = await markdownFetchEvent({
      request: markdownRequest('https://videojs.org/docs/framework/react/guides/mux-data.md'),
      response: markdownResponse(),
      via: 'twin',
      country: 'DE',
      now: NOW,
    });

    expect(body).toMatchObject({
      event: 'markdown_fetched',
      timestamp: '2026-09-30T12:00:00.000Z',
      distinct_id: expect.stringMatching(/^[0-9a-f]{32}$/),
      properties: {
        $current_url: 'https://videojs.org/docs/framework/react/guides/mux-data.md',
        $pathname: '/docs/framework/react/guides/mux-data.md',
        $process_person_profile: false,
        $geoip_disable: true,
        markdown_via: 'twin',
        status: 200,
        agent: 'anthropic',
        agent_kind: 'ai',
        user_agent: CLAUDE_BOT,
        country: 'DE',
        docs_framework: 'react',
        has_private_input: false,
      },
    });
    expect(JSON.stringify(body)).not.toMatch(/"(\$ip|ip)"/);
  });

  it('records installation picks and drops private input', async () => {
    const body = await markdownFetchEvent({
      request: markdownRequest(
        'https://videojs.org/docs/guides/installation/html.md?package-manager=npm&skin=minimal&source-url=https%3A%2F%2Fsecret.example.com%2Fv.m3u8%3Ftoken%3Dx'
      ),
      response: markdownResponse(),
      via: 'twin',
      now: NOW,
    });

    expect(body.properties).toMatchObject({
      $current_url: 'https://videojs.org/docs/guides/installation/html.md?package-manager=npm&skin=minimal',
      installation_route: 'html',
      installation_framework: 'html',
      installation_method: 'npm',
      installation_skin: 'minimal-video',
      installation_custom_source: true,
      has_private_input: true,
    });
    expect(JSON.stringify(body)).not.toContain('secret.example.com');
    expect(body.properties).not.toHaveProperty('installation_source_url');
  });

  it('gives the same client the same ID within a day and a new one the next day', async () => {
    const event = (now: Date) =>
      markdownFetchEvent({
        request: markdownRequest('https://videojs.org/llms.txt'),
        response: markdownResponse(),
        via: 'llms',
        now,
      });

    const first = await event(NOW);
    const later = await event(new Date('2026-09-30T23:59:00Z'));
    const nextDay = await event(new Date('2026-10-01T00:01:00Z'));

    expect(later.distinct_id).toBe(first.distinct_id);
    expect(nextDay.distinct_id).not.toBe(first.distinct_id);
  });

  it('records a missing twin with its status', async () => {
    const body = await markdownFetchEvent({
      request: markdownRequest('https://videojs.org/docs/guessed-page.md'),
      response: new Response('Not found', { status: 404 }),
      via: 'twin',
      now: NOW,
    });

    expect(body.properties.status).toBe(404);
  });
});

describe('isMarkdownResponse', () => {
  it('accepts Markdown and rejects the HTML fallback', () => {
    expect(isMarkdownResponse(markdownResponse())).toBe(true);
    expect(isMarkdownResponse(new Response('<html>', { headers: { 'content-type': 'text/html' } }))).toBe(false);
  });
});

describe('recordMarkdownFetch', () => {
  function context(deploy: string) {
    const pending: Promise<unknown>[] = [];

    return {
      pending,
      context: {
        deploy: { context: deploy },
        geo: { country: { code: 'US' } },
        waitUntil: (promise) => pending.push(promise),
      } satisfies RecordContext,
    };
  }

  it('sends one event to PostHog in production', async () => {
    const send = vi.fn<typeof fetch>(async () => new Response('{}'));
    const { pending, context: production } = context('production');

    recordMarkdownFetch(markdownRequest('https://videojs.org/llms.txt'), markdownResponse(), production, 'llms', send);
    await Promise.all(pending);

    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith('https://us.i.posthog.com/i/v0/e/', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(String(send.mock.calls[0]?.[1]?.body))).toMatchObject({
      event: 'markdown_fetched',
      properties: { country: 'US' },
    });
  });

  it('sends nothing from deploy previews or branch deploys', async () => {
    const send = vi.fn<typeof fetch>(async () => new Response('{}'));
    const { pending, context: preview } = context('deploy-preview');

    recordMarkdownFetch(markdownRequest('https://videojs.org/llms.txt'), markdownResponse(), preview, 'llms', send);
    await Promise.all(pending);

    expect(pending).toHaveLength(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('swallows a failed delivery', async () => {
    const send = vi.fn<typeof fetch>(async () => {
      throw new Error('network down');
    });
    const { pending, context: production } = context('production');

    recordMarkdownFetch(markdownRequest('https://videojs.org/llms.txt'), markdownResponse(), production, 'llms', send);

    await expect(Promise.all(pending)).resolves.toBeDefined();
  });
});
