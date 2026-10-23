import type { MediaTextTrack } from '@videojs/media';
import { describe, expect, it } from 'vite-plus/test';

import { matchTextTrack } from '../filter';

const track: MediaTextTrack = {
  id: 'quiz',
  kind: 'metadata',
  label: 'quiz',
  language: 'en',
  mode: 'hidden',
  source: 'app',
};

describe('matchTextTrack', () => {
  it('matches every track with an empty filter', () => {
    expect(matchTextTrack(track, {})).toBe(true);
  });

  it('matches each given field', () => {
    expect(matchTextTrack(track, { kind: 'metadata', label: 'quiz', language: 'en' })).toBe(true);
    expect(matchTextTrack(track, { kind: 'chapters' })).toBe(false);
    expect(matchTextTrack(track, { kind: 'metadata', label: 'ads' })).toBe(false);
    expect(matchTextTrack(track, { language: 'fr' })).toBe(false);
  });

  it('matches any kind in a list', () => {
    expect(matchTextTrack(track, { kind: ['chapters', 'metadata'] })).toBe(true);
    expect(matchTextTrack(track, { kind: ['captions', 'subtitles'] })).toBe(false);
  });

  it('calls a function filter', () => {
    expect(matchTextTrack(track, (candidate) => candidate.source === 'app')).toBe(true);
    expect(matchTextTrack(track, (candidate) => candidate.source === 'media')).toBe(false);
  });
});
