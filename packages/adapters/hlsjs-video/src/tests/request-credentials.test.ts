import type { HlsConfig, LoaderContext } from 'hls.js';
import { describe, expect, it, vi } from 'vite-plus/test';

import { withRequestCredentials } from '../request-credentials';

const URL = 'https://cdn.example.com/index.m3u8';

const context = { url: URL } as LoaderContext;

/** Hls.js's own `getRequestParameters` shape — the init the default loader builds a `Request` from. */
function initParams(): RequestInit & { credentials: RequestCredentials } {
  return { method: 'GET', mode: 'cors', credentials: 'same-origin', headers: new Headers() };
}

function fakeXhr() {
  return { withCredentials: false } as XMLHttpRequest;
}

describe('withRequestCredentials', () => {
  describe('xhrSetup', () => {
    it('sends cookies for use-credentials', async () => {
      const { xhrSetup } = withRequestCredentials({}, () => 'use-credentials');
      const xhr = fakeXhr();

      await xhrSetup!(xhr, URL);

      expect(xhr.withCredentials).toBe(true);
    });

    it('leaves the default for anonymous, an empty value, or no attribute', async () => {
      for (const crossOrigin of ['anonymous', '', null, undefined]) {
        const { xhrSetup } = withRequestCredentials({}, () => crossOrigin);
        const xhr = fakeXhr();

        await xhrSetup!(xhr, URL);

        expect(xhr.withCredentials).toBe(false);
      }
    });

    it('reads the attribute per request', async () => {
      let crossOrigin: string | null = null;
      const { xhrSetup } = withRequestCredentials({}, () => crossOrigin);

      const before = fakeXhr();

      await xhrSetup!(before, URL);
      crossOrigin = 'use-credentials';

      const after = fakeXhr();

      await xhrSetup!(after, URL);

      expect(before.withCredentials).toBe(false);
      expect(after.withCredentials).toBe(true);
    });

    it('runs the configured hook after ours, on the same request', async () => {
      const own = vi.fn<NonNullable<HlsConfig['xhrSetup']>>((xhr) => {
        expect(xhr.withCredentials).toBe(true);
      });
      const { xhrSetup } = withRequestCredentials({ xhrSetup: own }, () => 'use-credentials');
      const xhr = fakeXhr();

      await xhrSetup!(xhr, URL);

      expect(own).toHaveBeenCalledWith(xhr, URL);
    });

    it('lets the configured hook override the mode', async () => {
      const { xhrSetup } = withRequestCredentials(
        {
          xhrSetup(xhr) {
            xhr.withCredentials = false;
          },
        },
        () => 'use-credentials'
      );
      const xhr = fakeXhr();

      await xhrSetup!(xhr, URL);

      expect(xhr.withCredentials).toBe(false);
    });

    it('propagates a rejection from the configured hook so hls.js can retry it after open', async () => {
      const { xhrSetup } = withRequestCredentials(
        {
          xhrSetup() {
            throw new Error('not yet open');
          },
        },
        () => null
      );

      await expect(xhrSetup!(fakeXhr(), URL)).rejects.toThrow('not yet open');
    });
  });

  describe('fetchSetup', () => {
    it('builds a credentialed request for use-credentials', async () => {
      const { fetchSetup } = withRequestCredentials({}, () => 'use-credentials');
      const request = await fetchSetup!(context, initParams());

      expect(request).toBeInstanceOf(Request);
      expect(request.url).toBe(URL);
      expect(request.credentials).toBe('include');
    });

    it('keeps hls.js default for anything else', async () => {
      const { fetchSetup } = withRequestCredentials({}, () => 'anonymous');
      const request = await fetchSetup!(context, initParams());

      expect(request.credentials).toBe('same-origin');
    });

    it('hands the adjusted init to the configured hook', async () => {
      const own = vi.fn<NonNullable<HlsConfig['fetchSetup']>>((ctx, init) => new Request(ctx.url, init));
      const { fetchSetup } = withRequestCredentials({ fetchSetup: own }, () => 'use-credentials');
      const request = await fetchSetup!(context, initParams());

      expect(own).toHaveBeenCalledWith(context, expect.objectContaining({ credentials: 'include' }));
      expect(request.credentials).toBe('include');
    });
  });
});
