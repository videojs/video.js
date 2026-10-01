import type { CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vite-plus/test';

import { getDocTitle, isCodeIdentifier } from '../title';

describe('getDocTitle', () => {
  // Mock fixtures
  const mockDocWithFrameworkTitle: CollectionEntry<'docs'> = {
    id: 'components/play-button',
    collection: 'docs',
    data: {
      title: 'Playback control',
      description: 'A button component for playing and pausing media playback',
      type: 'reference',
      frameworkTitle: {
        react: 'PlayButton',
        html: 'play-button',
      },
    },
    // Mock required Astro fields
    body: '',
    slug: 'components/play-button',
  } as CollectionEntry<'docs'>;

  const mockDocWithoutFrameworkTitle: CollectionEntry<'docs'> = {
    id: 'concepts/basic',
    collection: 'docs',
    data: {
      title: 'Basic Concepts',
      description: 'Introduction to basic concepts',
      type: 'guide',
    },
    body: '',
    slug: 'concepts/basic',
  } as CollectionEntry<'docs'>;

  const mockDocWithPartialFrameworkTitle: CollectionEntry<'docs'> = {
    id: 'components/mute-button',
    collection: 'docs',
    data: {
      title: 'Mute control',
      description: 'A button for muting audio',
      type: 'reference',
      frameworkTitle: {
        react: 'MuteButton',
        // html framework title not defined
      },
    },
    body: '',
    slug: 'components/mute-button',
  } as CollectionEntry<'docs'>;

  describe('with frameworkTitle defined', () => {
    it('should return framework-specific title when available', () => {
      const reactTitle = getDocTitle(mockDocWithFrameworkTitle, 'react');
      const htmlTitle = getDocTitle(mockDocWithFrameworkTitle, 'html');

      expect(reactTitle).toBe('PlayButton');
      expect(htmlTitle).toBe('play-button');
    });
  });

  describe('without frameworkTitle', () => {
    it('should fall back to default title when frameworkTitle is undefined', () => {
      const reactTitle = getDocTitle(mockDocWithoutFrameworkTitle, 'react');
      const htmlTitle = getDocTitle(mockDocWithoutFrameworkTitle, 'html');

      expect(reactTitle).toBe('Basic Concepts');
      expect(htmlTitle).toBe('Basic Concepts');
    });
  });

  describe('partial frameworkTitle', () => {
    it('should return frameworkTitle for defined framework', () => {
      const reactTitle = getDocTitle(mockDocWithPartialFrameworkTitle, 'react');

      expect(reactTitle).toBe('MuteButton');
    });

    it('should fall back to default title when framework not in frameworkTitle', () => {
      const htmlTitle = getDocTitle(mockDocWithPartialFrameworkTitle, 'html');

      expect(htmlTitle).toBe('Mute control');
    });
  });

  describe('edge cases', () => {
    it('should handle empty frameworkTitle object', () => {
      const docWithEmptyFrameworkTitle: CollectionEntry<'docs'> = {
        id: 'edge-case/empty',
        collection: 'docs',
        data: {
          title: 'Default Title',
          description: 'Test',
          type: 'guide',
          frameworkTitle: {},
        },
        body: '',
        slug: 'edge-case/empty',
      } as CollectionEntry<'docs'>;

      const result = getDocTitle(docWithEmptyFrameworkTitle, 'react');

      expect(result).toBe('Default Title');
    });
  });
});

describe('isCodeIdentifier', () => {
  it('should detect PascalCase', () => {
    expect(isCodeIdentifier('PlaybackRateButton')).toBe(true);
    expect(isCodeIdentifier('MuteButton')).toBe(true);
    expect(isCodeIdentifier('TimeDisplay')).toBe(true);
  });

  it('should detect camelCase', () => {
    expect(isCodeIdentifier('usePlayerContext')).toBe(true);
    expect(isCodeIdentifier('createPlayer')).toBe(true);
    expect(isCodeIdentifier('playbackRate')).toBe(true);
  });

  it('should detect kebab-case', () => {
    expect(isCodeIdentifier('playback-rate-button')).toBe(true);
    expect(isCodeIdentifier('mute-button')).toBe(true);
    expect(isCodeIdentifier('video-player')).toBe(true);
  });

  it('should not match natural-language titles', () => {
    expect(isCodeIdentifier('Getting Started')).toBe(false);
    expect(isCodeIdentifier('Installation')).toBe(false);
    expect(isCodeIdentifier('Basic Concepts')).toBe(false);
    expect(isCodeIdentifier('How to Use')).toBe(false);
  });

  it('should not match single lowercase words', () => {
    expect(isCodeIdentifier('player')).toBe(false);
    expect(isCodeIdentifier('installation')).toBe(false);
  });

  it('should not match single PascalCase words', () => {
    expect(isCodeIdentifier('Player')).toBe(false);
    expect(isCodeIdentifier('Slider')).toBe(false);
  });
});
