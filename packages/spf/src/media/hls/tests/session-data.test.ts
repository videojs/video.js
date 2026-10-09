import { describe, expect, it } from 'vite-plus/test';

import { findSessionDataUri } from '../session-data';

const CHAPTERS = 'com.apple.hls.chapters';
const BASE_URL = 'https://cdn.example.com/a/main.m3u8';

describe('findSessionDataUri', () => {
  it('returns the URI of the tag carrying the data id, resolved against the base URL', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-SESSION-DATA:DATA-ID="com.example.title",VALUE="Big Buck Bunny, Remastered"',
      `#EXT-X-SESSION-DATA:DATA-ID="${CHAPTERS}",FORMAT=JSON,URI="chapters.json?token=a,b"`,
      '#EXT-X-STREAM-INF:BANDWIDTH=2000000',
      'media.m3u8',
    ].join('\n');

    expect(findSessionDataUri(playlist, CHAPTERS, BASE_URL)).toBe('https://cdn.example.com/a/chapters.json?token=a,b');
  });

  it('skips an entry carrying its datum inline and reads the first one with a URI', () => {
    const playlist = [
      '#EXTM3U',
      `#EXT-X-SESSION-DATA:DATA-ID="${CHAPTERS}",VALUE="[]"`,
      `#EXT-X-SESSION-DATA:DATA-ID="${CHAPTERS}",URI="https://cdn.example.com/en.json",LANGUAGE="en"`,
      `#EXT-X-SESSION-DATA:DATA-ID="${CHAPTERS}",URI="https://cdn.example.com/es.json",LANGUAGE="es"`,
    ].join('\r\n');

    expect(findSessionDataUri(playlist, CHAPTERS, BASE_URL)).toBe('https://cdn.example.com/en.json');
  });

  it('returns `undefined` when no tag carries the data id by reference', () => {
    const playlist = [
      '#EXTM3U',
      '#EXT-X-SESSION-DATA:DATA-ID="com.example.blob",URI="blob.bin"',
      '#EXT-X-STREAM-INF:BANDWIDTH=2000000',
      'media.m3u8',
    ].join('\n');

    expect(findSessionDataUri(playlist, CHAPTERS, BASE_URL)).toBeUndefined();
  });
});
