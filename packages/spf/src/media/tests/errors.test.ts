import { describe, expect, it } from 'vite-plus/test';

import {
  getSvtaErrorCategory,
  getSvtaErrorIndex,
  SVTA_NO_SUPPORTED_AUDIO_TRACK,
  SVTA_NO_SUPPORTED_VIDEO_TRACK,
  SVTA_UNSUPPORTED_ENCRYPTION_METHOD,
  SVTA_UNSUPPORTED_PLAYBACK_FEATURE,
} from '../errors';

describe('SVTA_UNSUPPORTED_PLAYBACK_FEATURE', () => {
  it('sits in the publisher-defined range of the custom category', () => {
    // The spec defines only 99000 (Unknown) in the custom category and leaves
    // 99001–99999 to publishers, so the one code SPF owns must stay above the
    // former and within the latter.
    expect(SVTA_UNSUPPORTED_PLAYBACK_FEATURE).toBeGreaterThan(99000);
    expect(SVTA_UNSUPPORTED_PLAYBACK_FEATURE).toBeLessThanOrEqual(99999);
    expect(getSvtaErrorCategory(SVTA_UNSUPPORTED_PLAYBACK_FEATURE)).toBe(99);
  });
});

describe('getSvtaErrorCategory', () => {
  it('reads the category from a four-digit native code', () => {
    expect(getSvtaErrorCategory(SVTA_NO_SUPPORTED_VIDEO_TRACK)).toBe(2);
    expect(getSvtaErrorCategory(SVTA_NO_SUPPORTED_AUDIO_TRACK)).toBe(2);
  });

  it('reads the category from a five-digit external code', () => {
    // "03404" — an HTTP 404 embedded under the network category, per the spec's
    // external-standard form. Numerically 3404, so the same arithmetic applies.
    expect(getSvtaErrorCategory(3404)).toBe(3);
  });

  it('reads the two-digit custom category without a digit-length special case', () => {
    // The custom category is `99`, which makes its codes five digits wide. No
    // branch is needed: every standard category is below 8000 and custom starts
    // at 99000, so the same division separates them.
    expect(getSvtaErrorCategory(SVTA_UNSUPPORTED_PLAYBACK_FEATURE)).toBe(99);
    expect(getSvtaErrorCategory(SVTA_UNSUPPORTED_ENCRYPTION_METHOD)).toBe(99);
    expect(getSvtaErrorCategory(99000)).toBe(99);
    expect(getSvtaErrorCategory(99999)).toBe(99);
  });

  it('reports category 0 for the fully-unknown code', () => {
    expect(getSvtaErrorCategory(999)).toBe(0);
  });

  it('answers undefined where the spec assigns no category', () => {
    // The spec assigns no category to a reserved value (8–98), a negative, or a
    // non-integer, so the answer is `undefined` rather than a number.
    expect(getSvtaErrorCategory(8000)).toBeUndefined();
    expect(getSvtaErrorCategory(-1)).toBeUndefined();
    expect(getSvtaErrorCategory(2011.5)).toBeUndefined();
  });
});

describe('getSvtaErrorIndex', () => {
  it('reads the index from a four-digit native code', () => {
    expect(getSvtaErrorIndex(SVTA_NO_SUPPORTED_VIDEO_TRACK)).toBe(11);
    expect(getSvtaErrorIndex(SVTA_NO_SUPPORTED_AUDIO_TRACK)).toBe(12);
  });

  it('reads the embedded external code from a five-digit code', () => {
    expect(getSvtaErrorIndex(3404)).toBe(404);
    // 99408 follows the 99CII convention: category 99, index 408 (the non-DRM sibling of 4008).
    expect(getSvtaErrorIndex(SVTA_UNSUPPORTED_ENCRYPTION_METHOD)).toBe(408);
  });

  it('reads the index from a five-digit custom code', () => {
    expect(getSvtaErrorIndex(SVTA_UNSUPPORTED_PLAYBACK_FEATURE)).toBe(1);
    expect(getSvtaErrorIndex(99999)).toBe(999);
  });

  it('reads 999 for the fully-unknown code', () => {
    expect(getSvtaErrorIndex(999)).toBe(999);
  });

  it('answers undefined for anything but a non-negative integer', () => {
    expect(getSvtaErrorIndex(-1)).toBeUndefined();
    expect(getSvtaErrorIndex(2011.5)).toBeUndefined();
  });
});
