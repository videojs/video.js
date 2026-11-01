import { describe, expect, it } from 'vite-plus/test';

import { parseMedia } from '../hls.ts';

describe('parseMedia', () => {
  it('reads byte ranges, continuing from the previous range when the offset is omitted', () => {
    const playlist = parseMedia(
      [
        '#EXTM3U',
        '#EXT-X-MAP:URI="main.mp4",BYTERANGE="100@0"',
        '#EXTINF:4,',
        '#EXT-X-BYTERANGE:500@100',
        'main.mp4',
        '#EXTINF:4,',
        '#EXT-X-BYTERANGE:300',
        'main.mp4',
      ].join('\n'),
      'https://cdn.test/v/index.m3u8'
    );

    expect(playlist.init).toEqual({ url: 'https://cdn.test/v/main.mp4', byteRange: [0, 99] });
    expect(playlist.segments).toEqual([
      { url: 'https://cdn.test/v/main.mp4', byteRange: [100, 599] },
      { url: 'https://cdn.test/v/main.mp4', byteRange: [600, 899] },
    ]);
  });

  it('leaves whole-file segments without a range', () => {
    const playlist = parseMedia('#EXTINF:2,\nseg1.m4s\n#EXTINF:2,\nseg2.m4s', 'https://cdn.test/index.m3u8');

    expect(playlist.segments.map((s) => s.byteRange)).toEqual([undefined, undefined]);
    expect(playlist.segmentSeconds).toBe(2);
  });
});
