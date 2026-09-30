import { describe, expect, it } from 'vite-plus/test';

import { parseTikTokSource, parseTikTokVideoId } from '../tiktok';

const VIDEO_ID = '7273420104193772846';

describe('parseTikTokVideoId', () => {
  it('extracts id from a raw numeric id', () => {
    expect(parseTikTokVideoId(VIDEO_ID)).toBe(VIDEO_ID);
  });

  it('extracts id from an embed player URL', () => {
    expect(parseTikTokVideoId(`https://www.tiktok.com/player/v1/${VIDEO_ID}?controls=0`)).toBe(VIDEO_ID);
  });

  it('extracts id from a share link', () => {
    expect(parseTikTokVideoId(`https://www.tiktok.com/share/video/${VIDEO_ID}`)).toBe(VIDEO_ID);
  });

  it('extracts id from an author URL', () => {
    expect(parseTikTokVideoId(`https://www.tiktok.com/@videojs/video/${VIDEO_ID}`)).toBe(VIDEO_ID);
  });

  it('returns null for empty input', () => {
    expect(parseTikTokVideoId('')).toBe(null);
  });

  it('returns null for non-TikTok URLs', () => {
    expect(parseTikTokVideoId('https://example.com/video/123')).toBe(null);
  });

  it('returns null for a TikTok URL that names no video', () => {
    expect(parseTikTokVideoId('https://www.tiktok.com/@videojs')).toBe(null);
  });
});

describe('parseTikTokSource', () => {
  it('parses the video id out of every recognized form', () => {
    expect(parseTikTokSource(VIDEO_ID)).toEqual({ id: VIDEO_ID });
    expect(parseTikTokSource(`https://www.tiktok.com/player/v1/${VIDEO_ID}`)).toEqual({ id: VIDEO_ID });
    expect(parseTikTokSource(`https://www.tiktok.com/share/video/${VIDEO_ID}/`)).toEqual({ id: VIDEO_ID });
    expect(parseTikTokSource(`https://www.tiktok.com/@user.name/video/${VIDEO_ID}?is_from_webapp=1`)).toEqual({
      id: VIDEO_ID,
    });
  });

  it('returns null for an id that is not numeric', () => {
    expect(parseTikTokSource('aqz-KE-bpKQ')).toBe(null);
  });
});
