import { describe, expect, it, vi } from 'vite-plus/test';

import { credentialsFetch } from '../credentials-fetch';
import type { FetchOptions, FetchText, Resource } from '../fetch';

const playlist = { url: 'https://cdn.example.com/r.m3u8' };

function makeBase() {
  return vi.fn<(addressable: Resource, options?: FetchOptions) => Promise<string>>(async () => 'body');
}

describe('credentialsFetch', () => {
  it('forwards a fixed mode as the request credentials', async () => {
    const base = makeBase();
    const fetch = credentialsFetch(base as FetchText, 'include');

    await expect(fetch(playlist, { signal: new AbortController().signal })).resolves.toBe('body');
    expect(base).toHaveBeenCalledWith(playlist, expect.objectContaining({ credentials: 'include' }));
    expect(base.mock.calls[0]![1]!.signal).toBeInstanceOf(AbortSignal);
  });

  it('returns the fetch untouched when there is no policy', () => {
    const base = makeBase();

    expect(credentialsFetch(base as FetchText, undefined)).toBe(base);
  });

  it('leaves the request at the platform default when the policy yields nothing', async () => {
    const base = makeBase();
    const fetch = credentialsFetch(base as FetchText, () => undefined);

    await fetch(playlist);

    // `Request` reads an `undefined` init member as absent, so this is the default.
    const [, options] = base.mock.calls[0]!;

    expect(options?.credentials).toBeUndefined();
    expect(new Request(playlist.url, options).credentials).toBe('same-origin');
  });

  it('consults the policy per request so a later change applies to the next fetch', async () => {
    const base = makeBase();
    let mode: RequestCredentials | undefined;
    const fetch = credentialsFetch(base as FetchText, () => mode);

    await fetch(playlist);
    mode = 'include';
    await fetch(playlist);

    expect(base.mock.calls[0]![1]?.credentials).toBeUndefined();
    expect(base.mock.calls[1]![1]?.credentials).toBe('include');
  });

  it('hands the policy the resource so it can decide per host', async () => {
    const base = makeBase();
    const gated = { url: 'https://gated.example.com/0.m4s' };
    const fetch = credentialsFetch(base as FetchText, (resource) =>
      new URL(resource.url).host === 'gated.example.com' ? 'include' : undefined
    );

    await fetch(playlist);
    await fetch(gated);

    expect(base.mock.calls[0]![1]?.credentials).toBeUndefined();
    expect(base.mock.calls[1]![1]?.credentials).toBe('include');
  });

  it('lets an explicit per-call credentials mode win over the policy', async () => {
    const base = makeBase();
    const fetch = credentialsFetch(base as FetchText, 'include');

    await fetch(playlist, { credentials: 'omit' });
    expect(base).toHaveBeenCalledWith(playlist, { credentials: 'omit' });
  });
});
