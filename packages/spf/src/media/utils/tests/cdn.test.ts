import { describe, expect, it } from 'vite-plus/test';

import type { MaybeResolvedPresentation } from '../../types';
import { addFailedCdn, getCdnId, getOrderedCdnIds } from '../cdn';

const presentationWith = (urlsByType: {
  video?: string[];
  audio?: string[];
  text?: string[];
}): MaybeResolvedPresentation => ({
  url: 'https://cdn-a.example.com/master.m3u8',
  selectionSets: (['video', 'audio', 'text'] as const)
    .filter((type) => urlsByType[type]?.length)
    .map((type) => ({
      id: `${type}-set`,
      type,
      switchingSets: [
        {
          id: `${type}-switching`,
          type,
          tracks: urlsByType[type]!.map((url, i) => ({ id: `${type}-${i}`, type, url, bandwidth: 0 })),
        },
      ],
    })) as MaybeResolvedPresentation['selectionSets'],
});

describe('getCdnId', () => {
  it('returns the origin of an absolute URL', () => {
    expect(getCdnId('https://cdn-a.example.com/path/720p.m3u8')).toBe('https://cdn-a.example.com');
  });

  it('treats different paths on the same host as the same CDN', () => {
    const a = getCdnId('https://cdn-a.example.com/720p.m3u8');
    const b = getCdnId('https://cdn-a.example.com/1080p/index.m3u8');

    expect(a).toBe(b);
  });

  it('treats different hosts as different CDNs', () => {
    const a = getCdnId('https://cdn-a.example.com/720p.m3u8');
    const b = getCdnId('https://cdn-b.example.com/720p.m3u8');

    expect(a).not.toBe(b);
  });

  it('distinguishes scheme and port via the origin', () => {
    expect(getCdnId('https://cdn.example.com/x.m3u8')).not.toBe(getCdnId('http://cdn.example.com/x.m3u8'));
    expect(getCdnId('https://cdn.example.com:8443/x.m3u8')).not.toBe(getCdnId('https://cdn.example.com/x.m3u8'));
  });

  it('falls back to the raw string when the URL cannot be parsed', () => {
    expect(getCdnId('not a url')).toBe('not a url');
  });
});

describe('getOrderedCdnIds', () => {
  it('lists distinct CDNs across all track types in manifest order', () => {
    const presentation = presentationWith({
      video: ['https://cdn-a.example.com/720p.m3u8', 'https://cdn-b.example.com/720p.m3u8'],
      audio: [
        'https://cdn-a.example.com/audio.m3u8',
        'https://cdn-b.example.com/audio.m3u8',
        'https://cdn-c.example.com/audio.m3u8',
      ],
      text: ['https://cdn-a.example.com/text.m3u8', 'https://cdn-d.example.com/text.m3u8'],
    });

    expect(getOrderedCdnIds(presentation)).toEqual([
      'https://cdn-a.example.com',
      'https://cdn-b.example.com',
      'https://cdn-c.example.com',
      'https://cdn-d.example.com',
    ]);
  });

  it('dedupes repeated hosts, keeping first occurrence', () => {
    const presentation = presentationWith({
      video: [
        'https://cdn-a.example.com/720p.m3u8',
        'https://cdn-a.example.com/1080p.m3u8',
        'https://cdn-b.example.com/720p.m3u8',
      ],
    });

    expect(getOrderedCdnIds(presentation)).toEqual(['https://cdn-a.example.com', 'https://cdn-b.example.com']);
  });

  it('returns a single CDN for a non-redundant source', () => {
    const presentation = presentationWith({ video: ['https://cdn-a.example.com/720p.m3u8'] });

    expect(getOrderedCdnIds(presentation)).toEqual(['https://cdn-a.example.com']);
  });

  it('returns [] for an unresolved presentation', () => {
    expect(getOrderedCdnIds({ url: 'https://cdn-a.example.com/master.m3u8' })).toEqual([]);
  });

  it('orders video CDNs ahead of audio regardless of selection-set order', () => {
    // Audio selection set listed first, cdn-b ahead of cdn-a within it; video
    // listed second with cdn-a first. Raw manifest order would make cdn-b primary,
    // but the head must be video-derived (cdn-a).
    const presentation: MaybeResolvedPresentation = {
      url: 'https://cdn-a.example.com/master.m3u8',
      selectionSets: [
        {
          id: 'audio-set',
          type: 'audio',
          switchingSets: [
            {
              id: 'audio-switching',
              type: 'audio',
              tracks: [
                { id: 'aud-b', type: 'audio', url: 'https://cdn-b.example.com/audio.m3u8', bandwidth: 0 },
                { id: 'aud-a', type: 'audio', url: 'https://cdn-a.example.com/audio.m3u8', bandwidth: 0 },
              ],
            },
          ],
        },
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [
            {
              id: 'video-switching',
              type: 'video',
              tracks: [
                { id: 'vid-a', type: 'video', url: 'https://cdn-a.example.com/720p.m3u8', bandwidth: 0 },
                { id: 'vid-b', type: 'video', url: 'https://cdn-b.example.com/720p.m3u8', bandwidth: 0 },
              ],
            },
          ],
        },
      ] as MaybeResolvedPresentation['selectionSets'],
    };

    expect(getOrderedCdnIds(presentation)).toEqual(['https://cdn-a.example.com', 'https://cdn-b.example.com']);
  });
});

describe('addFailedCdn', () => {
  it('appends to an undefined or empty list', () => {
    expect(addFailedCdn(undefined, 'https://cdn-a.example.com')).toEqual(['https://cdn-a.example.com']);
    expect(addFailedCdn([], 'https://cdn-a.example.com')).toEqual(['https://cdn-a.example.com']);
  });

  it('appends in order', () => {
    expect(addFailedCdn(['https://cdn-a.example.com'], 'https://cdn-b.example.com')).toEqual([
      'https://cdn-a.example.com',
      'https://cdn-b.example.com',
    ]);
  });

  it('is idempotent — re-adding a present CDN returns the same array reference', () => {
    const failed = ['https://cdn-a.example.com'];

    expect(addFailedCdn(failed, 'https://cdn-a.example.com')).toBe(failed);
  });
});
