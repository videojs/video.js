/**
 * Track geometry for the video selection rules: one filter, one comparator.
 *
 * The candidate-list policies alongside them (`pickAudioTrackFromTracks`, `pickTextTrackFromTracks`) are covered
 * through the behaviors that compose them — `selectAudioTrack` in `playback/behaviors/tests/select-tracks.test.ts`, and
 * `switchTextTrack` in `playback/behaviors/tests/track-switching.test.ts` — since the policy and its lifecycle are only
 * meaningful together.
 */
import { describe, expect, it } from 'vite-plus/test';

import { byDescendingResolution, smallestCoveringPixelArea, tracksUnderPixelArea } from '../select-tracks';

describe('smallestCoveringPixelArea', () => {
  const tracks = [
    { id: '360p', width: 640, height: 360, bandwidth: 500_000 },
    { id: '720p', width: 1280, height: 720, bandwidth: 2_000_000 },
    { id: '1080p', width: 1920, height: 1080, bandwidth: 4_000_000 },
  ];

  it('takes the tier matching the surface exactly', () => {
    expect(smallestCoveringPixelArea(tracks, 1280 * 720)).toBe(1280 * 720);
  });

  // The rounding this exists for: a surface between two tiers is covered by the
  // upper one, never by the lower one it would have to upscale from.
  it('rounds up to the covering tier for a surface between two', () => {
    expect(smallestCoveringPixelArea(tracks, 800 * 450)).toBe(1280 * 720);
  });

  it('takes the smallest tier for a surface below the whole ladder', () => {
    expect(smallestCoveringPixelArea(tracks, 160 * 90)).toBe(640 * 360);
  });

  it('reports nothing when no track covers the surface', () => {
    expect(smallestCoveringPixelArea(tracks, 3840 * 2160)).toBeUndefined();
  });

  it('reports nothing for an empty list', () => {
    expect(smallestCoveringPixelArea([], 1280 * 720)).toBeUndefined();
  });

  // Area `0` covers nothing, so a dimensionless track can't pin the cap to zero.
  it('ignores tracks that declare no dimensions', () => {
    const withUnsized = [{ id: 'no-resolution', bandwidth: 900_000 }, ...tracks];

    expect(smallestCoveringPixelArea(withUnsized, 160 * 90)).toBe(640 * 360);
  });
});

describe('tracksUnderPixelArea', () => {
  const tracks = [
    { id: '360p', width: 640, height: 360, bandwidth: 500_000 },
    { id: '720p', width: 1280, height: 720, bandwidth: 2_000_000 },
    { id: '1080p', width: 1920, height: 1080, bandwidth: 4_000_000 },
    { id: '1440p', width: 2560, height: 1440, bandwidth: 8_000_000 },
  ];

  it('returns nothing for an empty list', () => {
    expect(tracksUnderPixelArea([], 1920 * 1080)).toEqual([]);
  });

  it('keeps every track at or below the cap', () => {
    expect(tracksUnderPixelArea(tracks, 1920 * 1080).map((track) => track.id)).toEqual(['360p', '720p', '1080p']);
  });

  it('keeps the whole set when no cap is provided', () => {
    expect(tracksUnderPixelArea(tracks).map((track) => track.id)).toEqual(['360p', '720p', '1080p', '1440p']);
  });

  // Ordering is `byDescendingResolution`'s job, not the filter's — a cap only decides
  // which tracks are admissible. Given a shuffled ladder it filters and nothing else.
  it('preserves the incoming order rather than ranking', () => {
    const shuffled = [tracks[2], tracks[0], tracks[3], tracks[1]] as typeof tracks;

    expect(tracksUnderPixelArea(shuffled, 1920 * 1080).map((track) => track.id)).toEqual(['1080p', '360p', '720p']);
  });

  // No fallback of its own: an empty result is the honest answer, and `applyRules`
  // is what turns it into "the cap expressed no opinion" by skipping the rule.
  it('returns nothing when the cap excludes everything', () => {
    expect(tracksUnderPixelArea(tracks, 100)).toEqual([]);
  });

  it('admits a track whose area exactly equals the cap', () => {
    expect(tracksUnderPixelArea(tracks, 640 * 360).map((track) => track.id)).toEqual(['360p']);
  });

  // Anamorphic ladders are the reason the cap compares areas rather than heights:
  // 3840x1714 is 6.58 Mpx, so it fits a 7.72 Mpx screen even though 2160 > 1714.
  it('compares area, not height', () => {
    const anamorphic = [
      { id: 'wide-2160', width: 3840, height: 1714, bandwidth: 12_000_000 },
      { id: 'uhd', width: 3840, height: 2160, bandwidth: 15_000_000 },
    ];

    expect(tracksUnderPixelArea(anamorphic, 3456 * 2234).map((track) => track.id)).toEqual(['wide-2160']);
  });
});

describe('byDescendingResolution', () => {
  const sortedIds = (tracks: readonly { id: string; width?: number; height?: number; bandwidth?: number }[]) =>
    [...tracks].sort(byDescendingResolution).map((track) => track.id);

  it('orders by pixel area, largest first', () => {
    expect(
      sortedIds([
        { id: '720p', width: 1280, height: 720, bandwidth: 2_000_000 },
        { id: '1440p', width: 2560, height: 1440, bandwidth: 8_000_000 },
        { id: '360p', width: 640, height: 360, bandwidth: 500_000 },
        { id: '1080p', width: 1920, height: 1080, bandwidth: 4_000_000 },
      ])
    ).toEqual(['1440p', '1080p', '720p', '360p']);
  });

  it('tiebreaks on bandwidth for identical dimensions, highest first', () => {
    expect(
      sortedIds([
        { id: '1080p-low', width: 1920, height: 1080, bandwidth: 3_000_000 },
        { id: '1080p-high', width: 1920, height: 1080, bandwidth: 6_000_000 },
      ])
    ).toEqual(['1080p-high', '1080p-low']);
  });

  it('sorts a track with unknown dimensions last, since its area reads as 0', () => {
    expect(
      sortedIds([
        { id: 'unknown', bandwidth: 9_000_000 },
        { id: '360p', width: 640, height: 360, bandwidth: 500_000 },
      ])
    ).toEqual(['360p', 'unknown']);
  });

  // Anamorphic again, from the ranking side: fewer pixels loses despite more height.
  it('ranks by area rather than height', () => {
    const taller = { id: 'taller', width: 1920, height: 1440, bandwidth: 4_000_000 };
    const wider = { id: 'wider', width: 3840, height: 1000, bandwidth: 4_000_000 };

    for (const order of [
      [taller, wider],
      [wider, taller],
    ]) {
      expect(sortedIds(order)).toEqual(['wider', 'taller']);
    }
  });
});
