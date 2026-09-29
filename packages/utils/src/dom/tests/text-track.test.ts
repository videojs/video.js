import { describe, expect, it } from 'vite-plus/test';

import { findTrackElement, getCaptionOrSubtitleTracks, isCaptionOrSubtitleTrack } from '../text-track';

/**
 * Jsdom does not create unique TextTrack objects per <track> element, so we mock the `.track` property to simulate real
 * browser behavior.
 */
function mockTrackProperty(el: HTMLTrackElement): TextTrack {
  const track = {} as TextTrack;

  Object.defineProperty(el, 'track', { value: track, configurable: true });
  return track;
}

describe('isCaptionOrSubtitleTrack', () => {
  it('returns true for captions and subtitles tracks', () => {
    expect(isCaptionOrSubtitleTrack({ kind: 'captions' })).toBe(true);
    expect(isCaptionOrSubtitleTrack({ kind: 'subtitles' })).toBe(true);
  });

  it('returns false for other text track kinds', () => {
    expect(isCaptionOrSubtitleTrack({ kind: 'chapters' })).toBe(false);
    expect(isCaptionOrSubtitleTrack({ kind: 'metadata' })).toBe(false);
    expect(isCaptionOrSubtitleTrack({ kind: 'descriptions' })).toBe(false);
  });
});

describe('getCaptionOrSubtitleTracks', () => {
  it('keeps only captions and subtitles tracks', () => {
    const tracks = [{ kind: 'chapters' }, { kind: 'subtitles' }, { kind: 'metadata' }, { kind: 'captions' }];

    expect(getCaptionOrSubtitleTracks(tracks).map(({ kind }) => kind)).toEqual(['captions', 'subtitles']);
  });

  it('groups by kind and keeps source order within a kind', () => {
    const tracks = [
      { kind: 'subtitles', id: 's1' },
      { kind: 'captions', id: 'c1' },
      { kind: 'subtitles', id: 's2' },
      { kind: 'captions', id: 'c2' },
    ];

    expect(getCaptionOrSubtitleTracks(tracks).map(({ id }) => id)).toEqual(['c1', 'c2', 's1', 's2']);
  });

  it('accepts any iterable', () => {
    const tracks = new Set([{ kind: 'subtitles' }]);

    expect(getCaptionOrSubtitleTracks(tracks)).toEqual([{ kind: 'subtitles' }]);
  });
});

describe('findTrackElement', () => {
  it('returns the track element that owns the given TextTrack', () => {
    const video = document.createElement('video');
    const el = document.createElement('track');
    const track = mockTrackProperty(el);

    video.appendChild(el);

    expect(findTrackElement(video, track)).toBe(el);
  });

  it('returns null when no track element matches', () => {
    const video = document.createElement('video');
    const el = document.createElement('track');

    mockTrackProperty(el);
    video.appendChild(el);

    const unmatchedTrack = {} as TextTrack;

    expect(findTrackElement(video, unmatchedTrack)).toBeNull();
  });

  it('returns null when there are no track elements', () => {
    const video = document.createElement('video');
    const unmatchedTrack = {} as TextTrack;

    expect(findTrackElement(video, unmatchedTrack)).toBeNull();
  });

  it('finds the correct track among multiple track elements', () => {
    const video = document.createElement('video');

    const captionsEl = document.createElement('track');
    const captionsTrack = mockTrackProperty(captionsEl);

    video.appendChild(captionsEl);

    const thumbnailsEl = document.createElement('track');
    const thumbnailsTrack = mockTrackProperty(thumbnailsEl);

    video.appendChild(thumbnailsEl);

    const chaptersEl = document.createElement('track');
    const chaptersTrack = mockTrackProperty(chaptersEl);

    video.appendChild(chaptersEl);

    expect(findTrackElement(video, thumbnailsTrack)).toBe(thumbnailsEl);
    expect(findTrackElement(video, captionsTrack)).toBe(captionsEl);
    expect(findTrackElement(video, chaptersTrack)).toBe(chaptersEl);
  });
});
