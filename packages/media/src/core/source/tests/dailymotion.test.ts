import { describe, expect, it } from 'vite-plus/test';

import { parseDailymotionSource, parseDailymotionVideoId } from '../dailymotion';

const VIDEO_SRC = 'https://www.dailymotion.com/video/x84sh87';

describe('parseDailymotionVideoId', () => {
  it('extracts id from a video page URL', () => {
    expect(parseDailymotionVideoId(VIDEO_SRC)).toBe('x84sh87');
  });

  it('returns null for empty input', () => {
    expect(parseDailymotionVideoId('')).toBe(null);
  });

  it('returns null for non-Dailymotion URLs', () => {
    expect(parseDailymotionVideoId('https://example.com/video/x84sh87')).toBe(null);
  });
});

describe('parseDailymotionSource', () => {
  it('parses a video page URL with or without www', () => {
    expect(parseDailymotionSource(VIDEO_SRC)).toEqual({ id: 'x84sh87', player: null });
    expect(parseDailymotionSource('https://dailymotion.com/video/x84sh87')).toEqual({ id: 'x84sh87', player: null });
  });

  it('parses an embed URL', () => {
    expect(parseDailymotionSource('https://www.dailymotion.com/embed/video/x84sh87')).toEqual({
      id: 'x84sh87',
      player: null,
    });
  });

  it('parses a short link', () => {
    expect(parseDailymotionSource('https://dai.ly/x84sh87')).toEqual({ id: 'x84sh87', player: null });
  });

  it('parses a player embed URL with the player configuration it names', () => {
    expect(parseDailymotionSource('https://geo.dailymotion.com/player/x8lr5.html?video=x84sh87')).toEqual({
      id: 'x84sh87',
      player: 'x8lr5',
    });
    expect(parseDailymotionSource('https://geo.dailymotion.com/player/x8lr5.html?mute=true&video=x84sh87')).toEqual({
      id: 'x84sh87',
      player: 'x8lr5',
    });
  });

  it('parses the player embed URL legacy embeds redirect to, which names no player configuration', () => {
    expect(parseDailymotionSource('https://geo.dailymotion.com/player.html?video=x84sh87')).toEqual({
      id: 'x84sh87',
      player: null,
    });
  });

  it('returns null for a player embed URL without a video', () => {
    expect(parseDailymotionSource('https://geo.dailymotion.com/player/x8lr5.html?playlist=x6hynp')).toBe(null);
  });

  it('drops the title slug a page URL may carry', () => {
    expect(parseDailymotionSource('https://www.dailymotion.com/video/x7tgad0_some-title_news')).toEqual({
      id: 'x7tgad0',
      player: null,
    });
  });

  it('parses a URL with a query, hash, or trailing slash', () => {
    expect(parseDailymotionSource(`${VIDEO_SRC}?playlist=x6hynp`)).toEqual({ id: 'x84sh87', player: null });
    expect(parseDailymotionSource(`${VIDEO_SRC}#t=10`)).toEqual({ id: 'x84sh87', player: null });
    expect(parseDailymotionSource(`${VIDEO_SRC}/`)).toEqual({ id: 'x84sh87', player: null });
  });

  it('returns null for a playlist or user URL', () => {
    expect(parseDailymotionSource('https://www.dailymotion.com/playlist/x6hynp')).toBe(null);
    expect(parseDailymotionSource('https://www.dailymotion.com/dailymotion')).toBe(null);
  });

  it('returns null for a lookalike host', () => {
    expect(parseDailymotionSource('https://notdailymotion.com/video/x84sh87')).toBe(null);
  });
});
