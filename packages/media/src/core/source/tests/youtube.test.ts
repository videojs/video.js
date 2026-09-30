import { describe, expect, it } from 'vite-plus/test';

import { parseYouTubeSource, parseYouTubeVideoId } from '../youtube';

describe('parseYouTubeVideoId', () => {
  it('extracts id from a raw 11-character id', () => {
    expect(parseYouTubeVideoId('aqz-KE-bpKQ')).toBe('aqz-KE-bpKQ');
  });

  it('extracts id from watch URL', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=aqz-KE-bpKQ')).toBe('aqz-KE-bpKQ');
  });

  it('extracts id from youtu.be short link', () => {
    expect(parseYouTubeVideoId('https://youtu.be/aqz-KE-bpKQ')).toBe('aqz-KE-bpKQ');
  });

  it('extracts id from embed, shorts, and live URLs', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/aqz-KE-bpKQ')).toBe('aqz-KE-bpKQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/shorts/aqz-KE-bpKQ')).toBe('aqz-KE-bpKQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/live/aqz-KE-bpKQ')).toBe('aqz-KE-bpKQ');
  });

  it('extracts id from nocookie host', () => {
    expect(parseYouTubeVideoId('https://www.youtube-nocookie.com/watch?v=aqz-KE-bpKQ')).toBe('aqz-KE-bpKQ');
  });

  it('returns null for empty input', () => {
    expect(parseYouTubeVideoId('')).toBe(null);
  });

  it('returns null for non-YouTube URLs', () => {
    expect(parseYouTubeVideoId('https://example.com/video.mp4')).toBe(null);
  });
});

describe('parseYouTubeSource', () => {
  it('detects playlists', () => {
    expect(parseYouTubeSource('https://www.youtube.com/playlist?list=PLv3TTBr1W_9tppikBxAE_G6qjWdBljBHJ')).toEqual({
      id: null,
      kind: 'playlist',
      listId: 'PLv3TTBr1W_9tppikBxAE_G6qjWdBljBHJ',
      startTime: null,
      noCookie: false,
    });
  });

  it('detects playlists in videoseries embed URLs', () => {
    expect(parseYouTubeSource('https://www.youtube.com/embed/videoseries?list=PLv3TTBr1W_9tppikBxAE')).toEqual({
      id: null,
      kind: 'playlist',
      listId: 'PLv3TTBr1W_9tppikBxAE',
      startTime: null,
      noCookie: false,
    });
  });

  it('returns null for a videoseries embed URL without a list param', () => {
    expect(parseYouTubeSource('https://www.youtube.com/embed/videoseries')).toBe(null);
  });

  it('keeps the video id when a watch URL also has a list param', () => {
    const parsed = parseYouTubeSource('https://www.youtube.com/watch?v=aqz-KE-bpKQ&list=PLv3TTBr1W_9tppikBxAE');

    expect(parsed?.kind).toBe('video');
    expect(parsed?.id).toBe('aqz-KE-bpKQ');
    expect(parsed?.listId).toBe('PLv3TTBr1W_9tppikBxAE');
  });

  it('parses start times in t param formats', () => {
    expect(parseYouTubeSource('https://youtu.be/aqz-KE-bpKQ?t=171')?.startTime).toBe(171);
    expect(parseYouTubeSource('https://youtu.be/aqz-KE-bpKQ?t=171s')?.startTime).toBe(171);
    expect(parseYouTubeSource('https://youtu.be/aqz-KE-bpKQ?t=2m51s')?.startTime).toBe(171);
    expect(parseYouTubeSource('https://youtu.be/aqz-KE-bpKQ?t=2m')?.startTime).toBe(120);
    expect(parseYouTubeSource('https://youtu.be/aqz-KE-bpKQ?t=1h30m15s')?.startTime).toBe(5415);
    expect(parseYouTubeSource('https://youtu.be/aqz-KE-bpKQ?t=1h')?.startTime).toBe(3600);
    expect(parseYouTubeSource('https://youtu.be/aqz-KE-bpKQ?t=1h5s')?.startTime).toBe(3605);
  });

  it('detects the nocookie host', () => {
    expect(parseYouTubeSource('https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ')?.noCookie).toBe(true);
  });

  it('plays youtube/<id> shorthands from the nocookie host', () => {
    const expected = { id: 'aqz-KE-bpKQ', kind: 'video', listId: null, startTime: null, noCookie: true };

    expect(parseYouTubeSource('youtube/aqz-KE-bpKQ')).toEqual(expected);
    expect(parseYouTubeSource('youtube/shorts/aqz-KE-bpKQ')).toEqual(expected);
  });

  it('returns null for a shorthand without a video id', () => {
    expect(parseYouTubeSource('youtube/not-an-id')).toBe(null);
  });
});
