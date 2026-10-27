import { describe, expect, it } from 'vite-plus/test';

import { parseVimeoSource, parseVimeoVideoId } from '../vimeo';

describe('parseVimeoVideoId', () => {
  it('extracts numeric id from numeric string', () => {
    expect(parseVimeoVideoId('76979871')).toBe(76979871);
  });

  it('extracts id from vimeo.com URL', () => {
    expect(parseVimeoVideoId('https://vimeo.com/76979871')).toBe(76979871);
  });

  it('extracts id from player.vimeo.com URL', () => {
    expect(parseVimeoVideoId('https://player.vimeo.com/video/76979871')).toBe(76979871);
  });

  it('extracts id from vimeo.com/video URL', () => {
    expect(parseVimeoVideoId('https://vimeo.com/video/76979871')).toBe(76979871);
  });

  it('returns null for empty input', () => {
    expect(parseVimeoVideoId('')).toBe(null);
  });

  it('returns null for non-Vimeo URLs', () => {
    expect(parseVimeoVideoId('https://example.com/video.mp4')).toBe(null);
  });
});

describe('parseVimeoSource', () => {
  it('detects events', () => {
    expect(parseVimeoSource('https://vimeo.com/event/12345')).toEqual({ id: 12345, kind: 'event', hash: null });
  });

  it('extracts h param from query string', () => {
    expect(parseVimeoSource('https://vimeo.com/12345?h=abc')).toEqual({ id: 12345, kind: 'video', hash: 'abc' });
  });

  it('extracts hash from event path', () => {
    expect(parseVimeoSource('https://vimeo.com/event/12345/abc')).toEqual({ id: 12345, kind: 'event', hash: 'abc' });
  });

  it('parses vimeo/<id> shorthands with or without a hash', () => {
    expect(parseVimeoSource('vimeo/12345')).toEqual({ id: 12345, kind: 'video', hash: null });
    expect(parseVimeoSource('vimeo/video/12345')).toEqual({ id: 12345, kind: 'video', hash: null });

    for (const shorthand of ['vimeo/12345?hash=abc', 'vimeo/12345?h=abc', 'vimeo/12345/abc']) {
      expect(parseVimeoSource(shorthand)).toEqual({ id: 12345, kind: 'video', hash: 'abc' });
    }
  });
});
