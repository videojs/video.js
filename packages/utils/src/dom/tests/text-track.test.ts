import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  addRemovableTextTrack,
  findTrackElement,
  getCaptionOrSubtitleTracks,
  isCaptionOrSubtitleTrack,
} from '../text-track';

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

describe('addRemovableTextTrack', () => {
  const trackDescriptor = Object.getOwnPropertyDescriptor(HTMLTrackElement.prototype, 'track');

  /** Jsdom has no `HTMLTrackElement.track`; give each element a track object. */
  function stubTrackElements() {
    const tracks = new WeakMap<HTMLTrackElement, TextTrack>();

    Object.defineProperty(HTMLTrackElement.prototype, 'track', {
      configurable: true,
      get(this: HTMLTrackElement) {
        if (!tracks.has(this)) tracks.set(this, { mode: 'disabled' } as TextTrack);

        return tracks.get(this);
      },
    });
  }

  afterEach(() => {
    if (trackDescriptor) Object.defineProperty(HTMLTrackElement.prototype, 'track', trackDescriptor);
    else Reflect.deleteProperty(HTMLTrackElement.prototype, 'track');
  });

  it('adds a hidden track through a track element', () => {
    stubTrackElements();

    const video = document.createElement('video');
    const track = addRemovableTextTrack(video, 'subtitles', 'Deutsch', 'de');
    const element = video.querySelector('track')!;

    expect(element).toMatchObject({ kind: 'subtitles', label: 'Deutsch', srclang: 'de' });
    expect(track).toBe(element.track);
    expect(track.mode).toBe('hidden');
  });

  it('leaves out a label and language it is not given', () => {
    stubTrackElements();

    const video = document.createElement('video');

    addRemovableTextTrack(video, 'metadata');

    expect(video.querySelector('track')!.getAttributeNames()).toEqual(['kind']);
  });

  it('falls back to addTextTrack() where the element yields no track', () => {
    const video = document.createElement('video');
    const track = {} as TextTrack;
    const addTextTrack = vi.spyOn(video, 'addTextTrack').mockReturnValue(track);

    expect(addRemovableTextTrack(video, 'chapters', 'Chapters')).toBe(track);
    expect(addTextTrack).toHaveBeenCalledExactlyOnceWith('chapters', 'Chapters', undefined);
    expect(video.querySelector('track')).toBeNull();
  });
});
