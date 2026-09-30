import { describe, expect, it } from 'vite-plus/test';

import { parseWistiaMediaId, parseWistiaStartTime } from '../wistia';

const HASHED_ID = 'abcde12345';
const MEDIA_URL = `https://videojs.wistia.com/medias/${HASHED_ID}`;

describe('parseWistiaMediaId', () => {
  it('extracts id from a raw hashed id', () => {
    expect(parseWistiaMediaId(HASHED_ID)).toBe(HASHED_ID);
  });

  it('extracts id from a media page URL', () => {
    expect(parseWistiaMediaId(MEDIA_URL)).toBe(HASHED_ID);
  });

  it('extracts id from embed URLs', () => {
    expect(parseWistiaMediaId(`https://fast.wistia.net/embed/iframe/${HASHED_ID}`)).toBe(HASHED_ID);
    expect(parseWistiaMediaId(`https://fast.wistia.com/embed/medias/${HASHED_ID}.jsonp`)).toBe(HASHED_ID);
    expect(parseWistiaMediaId(`https://fast.wistia.net/embed/playlists/${HASHED_ID}`)).toBe(HASHED_ID);
  });

  it('extracts id from the wi.st short host and the wvideo parameter', () => {
    expect(parseWistiaMediaId(`https://wi.st/medias/${HASHED_ID}`)).toBe(HASHED_ID);
    expect(parseWistiaMediaId(`https://example.com/watch?wvideo=${HASHED_ID}`)).toBe(HASHED_ID);
  });

  it('returns null for empty input and non-Wistia URLs', () => {
    expect(parseWistiaMediaId('')).toBe(null);
    expect(parseWistiaMediaId('https://example.com/video.mp4')).toBe(null);
  });
});

describe('parseWistiaStartTime', () => {
  it('reports no start time without a wtime parameter', () => {
    expect(parseWistiaStartTime(MEDIA_URL)).toBe(null);
  });

  it('parses wtime into seconds', () => {
    expect(parseWistiaStartTime(`${MEDIA_URL}?wtime=90`)).toBe(90);
    expect(parseWistiaStartTime(`${MEDIA_URL}?wtime=1m30s`)).toBe(90);
    expect(parseWistiaStartTime(`${MEDIA_URL}?wtime=1h2m3s`)).toBe(3723);
  });
});
