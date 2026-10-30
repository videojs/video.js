import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { getRuntimeBaseUrl, resolveSourceUrl } from '../resolve-source-url';

// These run under Node, where neither `document` nor `location` exists: the
// no-base path is the real one, and the browser paths are stubbed in.
describe('resolveSourceUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // `typeof document` would not even compile here: this directory types against
  // the WebWorker lib, which declares no `document`.
  it('runs without a document or location global', () => {
    expect('document' in globalThis).toBe(false);
    expect('location' in globalThis).toBe(false);
    expect(getRuntimeBaseUrl()).toBeUndefined();
  });

  it('leaves a relative URL as written when the runtime has no base URL', () => {
    expect(resolveSourceUrl('/media/stream.m3u8')).toBe('/media/stream.m3u8');
    expect(resolveSourceUrl('stream.m3u8')).toBe('stream.m3u8');
  });

  it('leaves an absolute URL as written when the runtime has no base URL', () => {
    expect(resolveSourceUrl('https://cdn.example.com/stream.m3u8')).toBe('https://cdn.example.com/stream.m3u8');
  });

  it('leaves an empty URL empty', () => {
    expect(resolveSourceUrl('')).toBe('');
  });

  it("resolves a relative URL against a document's base URL", () => {
    vi.stubGlobal('document', { baseURI: 'https://app.example.com/pages/watch.html' });

    expect(resolveSourceUrl('/media/stream.m3u8')).toBe('https://app.example.com/media/stream.m3u8');
    expect(resolveSourceUrl('stream.m3u8')).toBe('https://app.example.com/pages/stream.m3u8');
    expect(resolveSourceUrl('../stream.m3u8')).toBe('https://app.example.com/stream.m3u8');
  });

  it("falls back to a worker's location when there is no document", () => {
    vi.stubGlobal('location', { href: 'https://app.example.com/workers/player.js' });

    expect(resolveSourceUrl('/media/stream.m3u8')).toBe('https://app.example.com/media/stream.m3u8');
  });

  it('prefers the document base URL over location', () => {
    vi.stubGlobal('document', { baseURI: 'https://base.example.com/' });
    vi.stubGlobal('location', { href: 'https://app.example.com/pages/watch.html' });

    expect(resolveSourceUrl('stream.m3u8')).toBe('https://base.example.com/stream.m3u8');
  });

  it('keeps an absolute URL on its own origin', () => {
    vi.stubGlobal('document', { baseURI: 'https://app.example.com/' });

    expect(resolveSourceUrl('https://cdn.example.com/stream.m3u8')).toBe('https://cdn.example.com/stream.m3u8');
  });

  it('returns a value the URL parser rejects unchanged', () => {
    vi.stubGlobal('document', { baseURI: 'not a url' });

    expect(resolveSourceUrl('/media/stream.m3u8')).toBe('/media/stream.m3u8');
  });
});
