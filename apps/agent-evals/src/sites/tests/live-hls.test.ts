import { describe, expect, it } from 'vitest';

import { livePlaylist } from '../live-hls.ts';

describe('livePlaylist', () => {
  it('slides a six-segment window forward every two seconds', () => {
    const start = livePlaylist(20, 0, 0);
    const later = livePlaylist(20, 0, 4_000);

    expect(start).toContain('#EXT-X-MEDIA-SEQUENCE:0');
    expect(start.match(/#EXTINF/g)).toHaveLength(6);
    expect(start).not.toContain('#EXT-X-ENDLIST');
    expect(later).toContain('#EXT-X-MEDIA-SEQUENCE:2');
    expect(later.trim().split('\n').at(-1)).toBe('seg/7.ts');
  });

  it('marks a discontinuity where the loop starts over', () => {
    const wrapped = livePlaylist(20, 0, 32_000);

    expect(wrapped).toContain('#EXT-X-MEDIA-SEQUENCE:16');
    expect(wrapped).toContain('#EXT-X-DISCONTINUITY-SEQUENCE:0');
    expect(wrapped).toContain('#EXT-X-DISCONTINUITY\n#EXTINF:2.000,\nseg/20.ts');
  });
});
