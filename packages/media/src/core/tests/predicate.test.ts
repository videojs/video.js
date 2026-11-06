import { describe, expect, it } from 'vite-plus/test';

import { NO_TIME_RANGES_YET } from '../constants';
import {
  getTimeRangeEnd,
  hasTimeRange,
  isMediaBufferCapable,
  isMediaContentDataCapable,
  isMediaPlaying,
  isMediaRemotePlaybackCapable,
  isMediaTextTrackCapable,
} from '../predicate';

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
  it('rejects media that opts out with undefined ranges', () => {
    expect(isMediaBufferCapable({ buffered: undefined, seekable: undefined })).toBe(false);
    expect(isMediaBufferCapable({ buffered: NO_TIME_RANGES_YET, seekable: undefined })).toBe(false);
  });

  it('accepts time ranges that are empty for now', () => {
    expect(isMediaBufferCapable({ buffered: NO_TIME_RANGES_YET, seekable: NO_TIME_RANGES_YET })).toBe(true);
  });

  it('accepts defined time ranges', () => {
    const range = { length: 1, start: () => 0, end: () => 10 };

    expect(isMediaBufferCapable({ buffered: range, seekable: range })).toBe(true);
  });
});

describe('isMediaTextTrackCapable', () => {
  it('rejects media that opts out with undefined text tracks', () => {
    expect(isMediaTextTrackCapable({ textTracks: undefined })).toBe(false);
  });

  it('accepts defined text tracks', () => {
    expect(isMediaTextTrackCapable({ textTracks: Object.assign(new EventTarget(), { length: 0 }) })).toBe(true);
  });
});

describe('isMediaRemotePlaybackCapable', () => {
  it('rejects media that opts out with undefined remote playback', () => {
    expect(isMediaRemotePlaybackCapable({ remote: undefined })).toBe(false);
  });

  it('rejects a getter that opts out on a subclass', () => {
    class Base {
      get remote(): EventTarget | undefined {
        return new EventTarget();
      }
    }

    class OptOut extends Base {
      override get remote() {
        return undefined;
      }
    }

    expect(isMediaRemotePlaybackCapable(new Base())).toBe(true);
    expect(isMediaRemotePlaybackCapable(new OptOut())).toBe(false);
  });
});
