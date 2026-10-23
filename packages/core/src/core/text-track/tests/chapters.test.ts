import { describe, expect, it } from 'vite-plus/test';

import { appleHlsChapters, chaptersTrack, jsonLdChapters, podcastChapters } from '../chapters';

describe('chaptersTrack', () => {
  it('matches every chapters track', () => {
    expect(chaptersTrack).toEqual({ kind: 'chapters' });
  });
});

describe('podcastChapters', () => {
  it('reads chapters with their images and links, leaving out hidden ones', () => {
    const json = {
      version: '1.2.0',
      chapters: [
        { startTime: 0, title: 'Intro', img: 'https://example.com/intro.jpg' },
        { startTime: 60, endTime: 120, title: 'Sponsor', url: 'https://example.com', toc: true },
        { startTime: 90, title: 'Silent image swap', img: 'https://example.com/b.jpg', toc: false },
        { title: 'No start' },
      ],
    };

    expect(podcastChapters(json)).toEqual([
      {
        startTime: 0,
        endTime: undefined,
        text: 'Intro',
        value: { images: [{ url: 'https://example.com/intro.jpg' }] },
      },
      { startTime: 60, endTime: 120, text: 'Sponsor', value: { url: 'https://example.com' } },
    ]);
  });

  it('reads nothing from other JSON', () => {
    expect(podcastChapters([])).toEqual([]);
    expect(podcastChapters(null)).toEqual([]);
  });
});

describe('appleHlsChapters', () => {
  it('reads chapters with their titles by language and images', () => {
    const json = [
      {
        chapter: 1,
        'start-time': 0,
        duration: 30,
        titles: [
          { language: 'en', title: 'Opening' },
          { language: 'fr', title: 'Ouverture' },
        ],
        images: [{ 'image-category': 'chapter', 'pixel-width': 640, 'pixel-height': 360, url: 'one.jpg' }],
      },
      { chapter: 2, 'start-time': 30 },
    ];

    expect(appleHlsChapters(json)).toEqual([
      {
        startTime: 0,
        endTime: 30,
        text: 'Opening',
        value: {
          titles: { en: 'Opening', fr: 'Ouverture' },
          images: [{ url: 'one.jpg', width: 640, height: 360 }],
        },
      },
      { startTime: 30, endTime: undefined, text: '', value: {} },
    ]);
  });
});

describe('jsonLdChapters', () => {
  const clip = {
    '@type': 'Clip',
    name: 'Key moment',
    startOffset: 30,
    endOffset: '45',
    url: 'https://example.com/watch?t=30',
    thumbnailUrl: ['https://example.com/moment.jpg'],
  };

  const chapter = {
    startTime: 30,
    endTime: 45,
    text: 'Key moment',
    value: { url: 'https://example.com/watch?t=30', images: [{ url: 'https://example.com/moment.jpg' }] },
  };

  it('reads the clips of a VideoObject', () => {
    expect(jsonLdChapters({ '@type': 'VideoObject', hasPart: [clip] })).toEqual([chapter]);
  });

  it('reads a list of clips, or one clip', () => {
    expect(jsonLdChapters([clip])).toEqual([chapter]);
    expect(jsonLdChapters({ '@type': 'VideoObject', hasPart: clip })).toEqual([chapter]);
    expect(jsonLdChapters(clip)).toEqual([chapter]);
  });
});
