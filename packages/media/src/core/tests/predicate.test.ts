import { describe, expect, it, vi } from 'vite-plus/test';

import { EMPTY_REMOTE, EMPTY_TEXT_TRACKS, EMPTY_TIME_RANGES } from '../constants';
import {
  getTimeRangeEnd,
  hasTimeRange,
  isMediaBufferCapable,
  isMediaContentDataCapable,
  isMediaPlaying,
  isMediaRemotePlaybackCapable,
  isMediaTextTrackCapable,
} from '../predicate';

// A page can carry a second copy of `@videojs/media` (CDN plus npm, duplicate installs). Load the constants again as a
// separate module instance to stand in for that copy's placeholders.
vi.resetModules();

const otherCopy = await import('../constants');

describe('getTimeRangeEnd', () => {
  it('prefers a finite duration', () => {
    expect(getTimeRangeEnd({ duration: 120, seekable: [[10, 100]] })).toBe(120);
  });

  it('falls back to the last seekable end', () => {
    expect(
      getTimeRangeEnd({
        duration: 0,
        seekable: [
          [10, 20],
          [30, 90],
        ],
      })
    ).toBe(90);
  });

  it('returns zero when the time range is unknown', () => {
    expect(getTimeRangeEnd({ duration: 0, seekable: [] })).toBe(0);
  });
});

describe('hasTimeRange', () => {
  it('accepts either a duration or seekable range', () => {
    expect(hasTimeRange({ duration: 120, seekable: [] })).toBe(true);
    expect(hasTimeRange({ duration: 0, seekable: [[10, 90]] })).toBe(true);
  });

  it('rejects an unknown time range', () => {
    expect(hasTimeRange({ duration: 0, seekable: [] })).toBe(false);
  });
});

describe('isMediaPlaying', () => {
  it('requires active playback with data available', () => {
    const media = { paused: false, ended: false, waiting: false };

    expect(isMediaPlaying(media)).toBe(true);
    expect(isMediaPlaying(null)).toBe(false);
    expect(isMediaPlaying(undefined)).toBe(false);

    for (const key of ['paused', 'ended', 'waiting'] as const) {
      expect(isMediaPlaying({ ...media, [key]: true })).toBe(false);
    }
  });
});

describe('isMediaContentDataCapable', () => {
  it('uses undefined as the unsupported sentinel', () => {
    expect(isMediaContentDataCapable({})).toBe(false);
    expect(isMediaContentDataCapable({ contentData: undefined })).toBe(false);
    expect(isMediaContentDataCapable({ contentData: {} })).toBe(true);
    expect(isMediaContentDataCapable({ contentData: { poster: 'poster.jpg' } })).toBe(true);
    expect(isMediaContentDataCapable({ contentData: { title: undefined } })).toBe(true);
    expect(isMediaContentDataCapable({ contentData: { title: null } })).toBe(true);
    expect(isMediaContentDataCapable({ contentData: { title: '' } })).toBe(true);
  });
});

describe('isMediaBufferCapable', () => {
  it('rejects empty time range stubs', () => {
    expect(isMediaBufferCapable({ buffered: EMPTY_TIME_RANGES, seekable: EMPTY_TIME_RANGES })).toBe(false);
  });

  it('rejects empty time range stubs from another copy of the package', () => {
    expect(otherCopy.EMPTY_TIME_RANGES).not.toBe(EMPTY_TIME_RANGES);
    expect(isMediaBufferCapable({ buffered: otherCopy.EMPTY_TIME_RANGES, seekable: otherCopy.EMPTY_TIME_RANGES })).toBe(
      false
    );
  });

  it('accepts defined non-stub time ranges', () => {
    const range = { length: 1, start: () => 0, end: () => 10 };

    expect(isMediaBufferCapable({ buffered: range, seekable: range })).toBe(true);
  });
});

describe('isMediaTextTrackCapable', () => {
  it('rejects the empty text tracks stub', () => {
    expect(isMediaTextTrackCapable({ textTracks: EMPTY_TEXT_TRACKS })).toBe(false);
  });

  it('rejects the empty text tracks stub from another copy of the package', () => {
    expect(otherCopy.EMPTY_TEXT_TRACKS).not.toBe(EMPTY_TEXT_TRACKS);
    expect(isMediaTextTrackCapable({ textTracks: otherCopy.EMPTY_TEXT_TRACKS })).toBe(false);
  });

  it('accepts defined non-stub text tracks', () => {
    expect(isMediaTextTrackCapable({ textTracks: Object.assign(new EventTarget(), { length: 0 }) })).toBe(true);
  });
});

describe('isMediaRemotePlaybackCapable', () => {
  it('rejects the empty remote playback stub', () => {
    expect(isMediaRemotePlaybackCapable({ remote: EMPTY_REMOTE })).toBe(false);
  });

  it('rejects the empty remote playback stub from another copy of the package', () => {
    expect(otherCopy.EMPTY_REMOTE).not.toBe(EMPTY_REMOTE);
    expect(isMediaRemotePlaybackCapable({ remote: otherCopy.EMPTY_REMOTE })).toBe(false);
  });

  it('accepts defined non-stub remote playback', () => {
    expect(isMediaRemotePlaybackCapable({ remote: new EventTarget() })).toBe(true);
  });
});
