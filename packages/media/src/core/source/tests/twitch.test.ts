import { describe, expect, it } from 'vite-plus/test';

import { parseTwitchSource, parseTwitchVideoId } from '../twitch';

const VOD_SRC = 'https://www.twitch.tv/videos/123456789';
const CHANNEL_SRC = 'https://www.twitch.tv/twitchpresents';

describe('parseTwitchVideoId', () => {
  it('extracts id from a videos URL', () => {
    expect(parseTwitchVideoId(VOD_SRC)).toBe('123456789');
  });

  it('extracts id from a video query URL', () => {
    expect(parseTwitchVideoId('https://www.twitch.tv/?video=123456789')).toBe('123456789');
  });

  it('returns null for a channel URL', () => {
    expect(parseTwitchVideoId(CHANNEL_SRC)).toBe(null);
  });

  it('returns null for empty input', () => {
    expect(parseTwitchVideoId('')).toBe(null);
  });

  it('returns null for non-Twitch URLs', () => {
    expect(parseTwitchVideoId('https://example.com/videos/123456789')).toBe(null);
  });
});

describe('parseTwitchSource', () => {
  it('parses a VOD URL', () => {
    expect(parseTwitchSource(VOD_SRC)).toEqual({ kind: 'video', id: '123456789', channel: null });
  });

  it('parses the singular video path and the go. host', () => {
    expect(parseTwitchSource('https://go.twitch.tv/video/987')).toEqual({ kind: 'video', id: '987', channel: null });
  });

  it('parses a channel URL', () => {
    expect(parseTwitchSource(CHANNEL_SRC)).toEqual({ kind: 'channel', id: null, channel: 'twitchpresents' });
  });

  it('prefers the VOD reading of a URL that satisfies both patterns', () => {
    expect(parseTwitchSource('https://www.twitch.tv/videos/123456789?t=1h')?.kind).toBe('video');
  });

  it('parses a URL that was pasted with a trailing slash', () => {
    expect(parseTwitchSource(`${VOD_SRC}/`)).toEqual({ kind: 'video', id: '123456789', channel: null });
    expect(parseTwitchSource(`${CHANNEL_SRC}/`)).toEqual({ kind: 'channel', id: null, channel: 'twitchpresents' });
  });

  it('returns null for a clip URL rather than reading the slug as a channel', () => {
    expect(parseTwitchSource('https://clips.twitch.tv/AwkwardHelplessSalamanderSwiftRage')).toBe(null);
  });

  it('returns null for a non-Twitch URL', () => {
    expect(parseTwitchSource('https://example.com/twitchpresents')).toBe(null);
  });
});
