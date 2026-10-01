import { describe, expect, it } from 'vite-plus/test';

import { type MaybeResolvedPresentation, MEDIA_PLAYLIST_METADATA_KEY, type ResolvedTrack } from '../../types';
import { liveLatencyFor, mediaPlaylistReloadDelay, resolveLiveLatency } from '../reload-policy';

/** Minimal resolved-track stand-in carrying only what the policy reads. */
function track(opts: {
  duration?: number;
  targetDuration?: number;
  mediaSequence?: number;
  segments?: number;
  holdBack?: number;
}): ResolvedTrack {
  return {
    duration: opts.duration ?? Number.POSITIVE_INFINITY,
    segments: Array.from({ length: opts.segments ?? 1 }),
    metadata: {
      [MEDIA_PLAYLIST_METADATA_KEY]: {
        targetDuration: opts.targetDuration ?? 4,
        mediaSequence: opts.mediaSequence ?? 0,
        endList: Number.isFinite(opts.duration ?? Number.POSITIVE_INFINITY),
        holdBack: opts.holdBack,
      },
    },
  } as unknown as ResolvedTrack;
}

describe('mediaPlaylistReloadDelay', () => {
  it('stops (null) once the playlist is complete (finite duration)', () => {
    expect(mediaPlaylistReloadDelay(track({ duration: 30 }), undefined)).toBeNull();
  });

  it('polls at full target duration on the first reload of a live window', () => {
    expect(mediaPlaylistReloadDelay(track({ targetDuration: 4 }), undefined)).toBe(4000);
  });

  it('polls at half target duration when the window is unchanged', () => {
    const prev = track({ targetDuration: 4, mediaSequence: 10, segments: 3 });
    const same = track({ targetDuration: 4, mediaSequence: 10, segments: 3 });

    expect(mediaPlaylistReloadDelay(same, prev)).toBe(2000);
  });

  it('polls at full target duration when the window slid or grew', () => {
    const prev = track({ targetDuration: 4, mediaSequence: 10, segments: 3 });
    const slid = track({ targetDuration: 4, mediaSequence: 11, segments: 3 });

    expect(mediaPlaylistReloadDelay(slid, prev)).toBe(4000);

    const grew = track({ targetDuration: 4, mediaSequence: 10, segments: 4 });

    expect(mediaPlaylistReloadDelay(grew, prev)).toBe(4000);
  });

  it('falls back to 6s when the playlist carries no usable target duration', () => {
    expect(mediaPlaylistReloadDelay(track({ targetDuration: 0 }), undefined)).toBe(6000);
  });
});

describe('liveLatencyFor', () => {
  it('is 3× the target duration (default HOLD-BACK)', () => {
    expect(liveLatencyFor(track({ targetDuration: 2 }))).toBe(6);
    expect(liveLatencyFor(track({ targetDuration: 4 }))).toBe(12);
  });

  it('falls back to 3× the 6s default when no usable target duration is declared', () => {
    expect(liveLatencyFor(track({ targetDuration: 0 }))).toBe(18);
  });

  it('prefers a declared HOLD-BACK over the target-duration default', () => {
    expect(liveLatencyFor(track({ targetDuration: 2, holdBack: 9 }))).toBe(9);
  });

  it('uses a declared HOLD-BACK even when it undercuts 3× target duration', () => {
    // The spec floors HOLD-BACK at 3× target duration, so this is non-conformant
    // input. We honor the server rather than second-guessing it — consistent with
    // the parser's spec-valid-input stance.
    expect(liveLatencyFor(track({ targetDuration: 4, holdBack: 5 }))).toBe(5);
  });
});

describe('resolveLiveLatency', () => {
  /** Minimal presentation wrapping one video track, enough for findTrackById + liveLatencyFor. */
  function presentation(targetDuration: number): MaybeResolvedPresentation {
    const video = {
      id: 'v-1',
      segments: [{ id: 's0', url: 's0.m4s', duration: 2, startTime: 0 }],
      metadata: { [MEDIA_PLAYLIST_METADATA_KEY]: { targetDuration, mediaSequence: 0, endList: false } },
    };

    return {
      id: 'p-1',
      url: 'master.m3u8',
      selectionSets: [{ switchingSets: [{ tracks: [video] }] }],
    } as unknown as MaybeResolvedPresentation;
  }

  it('returns the timeline-bearing track latency (3× target duration)', () => {
    expect(resolveLiveLatency(presentation(2), 'v-1')).toBe(6);
  });

  it('returns 0 when the presentation is unresolved, or the track id is absent / unknown', () => {
    expect(resolveLiveLatency(undefined, 'v-1')).toBe(0);
    expect(resolveLiveLatency(presentation(2), undefined)).toBe(0);
    expect(resolveLiveLatency(presentation(2), 'missing')).toBe(0);
  });
});
