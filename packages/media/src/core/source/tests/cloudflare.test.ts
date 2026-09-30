import { describe, expect, it } from 'vite-plus/test';

import { parseCloudflareSource, parseCloudflareVideoId } from '../cloudflare';

const VIDEO_ID = 'ea95132c15732412d22c1476fa83f27a';
const SIGNED_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJlYTk1MTMyYyJ9.hOZ8Q9-signature';

describe('parseCloudflareVideoId', () => {
  it('extracts id from a raw video UID', () => {
    expect(parseCloudflareVideoId(VIDEO_ID)).toBe(VIDEO_ID);
  });

  it('extracts id from a videodelivery.net URL', () => {
    expect(parseCloudflareVideoId(`https://videodelivery.net/${VIDEO_ID}`)).toBe(VIDEO_ID);
  });

  it('extracts id from a customer subdomain URL', () => {
    expect(parseCloudflareVideoId(`https://customer-abc123.cloudflarestream.com/${VIDEO_ID}/iframe`)).toBe(VIDEO_ID);
  });

  it('extracts id from a manifest URL', () => {
    expect(parseCloudflareVideoId(`https://videodelivery.net/${VIDEO_ID}/manifest/video.m3u8`)).toBe(VIDEO_ID);
  });

  it('extracts a signed token standing in for the id', () => {
    expect(parseCloudflareVideoId(`https://videodelivery.net/${SIGNED_TOKEN}`)).toBe(SIGNED_TOKEN);
  });

  it('accepts a bare signed token', () => {
    expect(parseCloudflareVideoId(SIGNED_TOKEN)).toBe(SIGNED_TOKEN);
  });

  it('returns null for empty input', () => {
    expect(parseCloudflareVideoId('')).toBe(null);
  });

  it('returns null for non-Cloudflare sources', () => {
    expect(parseCloudflareVideoId('https://example.com/video.mp4')).toBe(null);
    expect(parseCloudflareVideoId('not-a-cloudflare-id')).toBe(null);
  });
});

describe('parseCloudflareSource', () => {
  it('reports a plain video UID as unsigned', () => {
    expect(parseCloudflareSource(VIDEO_ID)).toEqual({ id: VIDEO_ID, signed: false, origin: null });
  });

  it('reports a signed token as signed', () => {
    expect(parseCloudflareSource(`https://videodelivery.net/${SIGNED_TOKEN}`)).toEqual({
      id: SIGNED_TOKEN,
      signed: true,
      origin: null,
    });
  });

  it('keeps the per-customer origin', () => {
    expect(parseCloudflareSource(`https://customer-abc123.cloudflarestream.com/${VIDEO_ID}/iframe`)).toEqual({
      id: VIDEO_ID,
      signed: false,
      origin: 'https://customer-abc123.cloudflarestream.com',
    });
  });

  it('reports the shared hosts as having no customer origin', () => {
    expect(parseCloudflareSource(`https://watch.videodelivery.net/${VIDEO_ID}`)?.origin).toBe(null);
    expect(parseCloudflareSource(`https://watch.cloudflarestream.com/${VIDEO_ID}`)?.origin).toBe(null);
  });

  it('returns null for an unrecognized source', () => {
    expect(parseCloudflareSource('https://example.com/not-cloudflare')).toBe(null);
  });
});
