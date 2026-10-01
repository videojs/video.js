// @vitest-environment node
import { describe, expect, it, vi } from 'vite-plus/test';

import { type MarkdownContext, prefersMarkdown } from '../../../src/utils/markdown-handler';
import markdownNegotiation from '../markdown-negotiation';

const CHROME_NAVIGATION =
  'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8';

describe('prefersMarkdown', () => {
  it('prefers Markdown when the header names it', () => {
    expect(prefersMarkdown('text/markdown')).toBe(true);
    expect(prefersMarkdown('text/markdown;q=0.5')).toBe(true);
  });

  it('compares media ranges and parameters case-insensitively', () => {
    expect(prefersMarkdown('TEXT/MARKDOWN')).toBe(true);
    expect(prefersMarkdown('Text/Markdown;Q=0.9, text/html;q=0.5')).toBe(true);
    expect(prefersMarkdown('text/markdown;q=0.5, TEXT/HTML')).toBe(false);
  });

  it('refuses Markdown at a quality of zero', () => {
    expect(prefersMarkdown('text/html, text/markdown;q=0')).toBe(false);
    expect(prefersMarkdown('text/markdown;q=0.000')).toBe(false);
  });

  it('follows the higher quality', () => {
    expect(prefersMarkdown('text/markdown;q=0.9, text/html')).toBe(false);
    expect(prefersMarkdown('text/html;q=0.9, text/markdown')).toBe(true);
    expect(prefersMarkdown('text/markdown, */*;q=0.1')).toBe(true);
    expect(prefersMarkdown('text/markdown;q=0.5, text/html;q=0')).toBe(true);
  });

  it('breaks a tie in favour of Markdown', () => {
    expect(prefersMarkdown('text/markdown, text/html')).toBe(true);
    expect(prefersMarkdown('text/html, text/markdown')).toBe(true);
    expect(prefersMarkdown('text/markdown;q=0.8, text/html;q=0.8')).toBe(true);
  });

  it('gives HTML the quality of the most specific range that covers it', () => {
    expect(prefersMarkdown('text/markdown;q=0.5, text/*;q=0.8')).toBe(false);
    expect(prefersMarkdown('text/markdown;q=0.5, */*')).toBe(false);
    expect(prefersMarkdown('text/markdown;q=0.5, text/html;q=0.4, */*')).toBe(true);
  });

  it('keeps the HTML when only wildcards could select Markdown', () => {
    expect(prefersMarkdown('')).toBe(false);
    expect(prefersMarkdown('*/*')).toBe(false);
    expect(prefersMarkdown('text/*')).toBe(false);
    expect(prefersMarkdown(CHROME_NAVIGATION)).toBe(false);
  });

  it('ignores ranges with a malformed quality', () => {
    expect(prefersMarkdown('text/markdown;q=high')).toBe(false);
    expect(prefersMarkdown('text/markdown;q=1.5')).toBe(false);
    expect(prefersMarkdown('text/markdown, text/html;q=abc, */*;q=0.1')).toBe(true);
  });

  it('ignores media type parameters other than the quality', () => {
    expect(prefersMarkdown(' text/markdown ; charset=utf-8 ; q=0.9 , text/html;level=1;q=0.8')).toBe(true);
  });
});

describe('markdownNegotiation', () => {
  function negotiate(path: string, accept: string, twin: Response, next: Response) {
    const request = new Request(`https://videojs.org${path}`, { headers: { accept } });
    let activeRequest = request;
    const context = {
      next: vi.fn(async (request?: Request) => {
        if (request) activeRequest = request;

        return new URL(activeRequest.url).pathname.endsWith('.md') ? twin : next;
      }),
    } satisfies MarkdownContext;

    return { context, response: markdownNegotiation(request, context) };
  }

  function page(init?: ResponseInit) {
    return new Response('<html></html>', { headers: { vary: 'Accept-Encoding' }, ...init });
  }

  it('serves the Markdown twin to requests that prefer it', async () => {
    const { context, response } = negotiate('/docs/page', 'text/markdown', new Response('# Page'), page());
    const markdown = await response;

    expect(context.next).toHaveBeenCalledOnce();
    expect(context.next.mock.calls[0]![0]?.url).toBe('https://videojs.org/docs/page.md');

    expect(markdown?.status).toBe(200);
    expect(markdown?.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
    expect(markdown?.headers.get('vary')).toBe('Accept');
    expect(await markdown?.text()).toBe('# Page');
  });

  it('passes the HTML through, varying on Accept, when HTML is preferred', async () => {
    const html = page();
    const { context, response } = negotiate('/docs/page', 'text/html, text/markdown;q=0', new Response(), html);

    expect(await response).toBe(html);
    expect(html.headers.get('vary')).toBe('Accept-Encoding, Accept');
    expect(context.next).toHaveBeenCalledWith();
  });

  it("answers with the page's own redirect when the twin has moved", async () => {
    const twin = new Response(null, { status: 301, headers: { location: '/docs/new-page.md' } });
    const redirect = page({ status: 301, headers: { location: '/docs/new-page' } });
    const { response } = negotiate('/docs/old-page', 'text/markdown', twin, redirect);

    expect(await response).toBe(redirect);
    expect(redirect.headers.get('location')).toBe('/docs/new-page');
    expect(redirect.headers.get('vary')).toBe('Accept');
  });

  it('falls through to the page when the twin is missing', async () => {
    const html = page();
    const { context, response } = negotiate('/docs/page', 'text/markdown', new Response(null, { status: 404 }), html);

    expect(await response).toBe(html);
    expect(html.headers.get('vary')).toBe('Accept-Encoding, Accept');
    expect(context.next.mock.calls[1]![0]?.url).toBe('https://videojs.org/docs/page');
  });

  it('does not add Accept to Vary twice', async () => {
    const html = page({ headers: { vary: 'Accept, Accept-Encoding' } });
    const { response } = negotiate('/docs/page', 'text/html', new Response(), html);

    expect((await response)?.headers.get('vary')).toBe('Accept, Accept-Encoding');
  });

  it('leaves slash URLs to the trailing-slash redirect', async () => {
    const { context, response } = negotiate('/docs/page/', 'text/markdown', new Response(), page());

    expect(await response).toBeUndefined();
    expect(context.next).not.toHaveBeenCalled();
  });
});
