import { describe, expect, it } from 'vite-plus/test';

import { signal } from '../../../core/signals/primitives';
import {
  type AudioSelectionSet,
  type AudioTrack,
  type MaybeResolvedPresentation,
  MEDIA_PLAYLIST_METADATA_KEY,
  type PartiallyResolvedVideoTrack,
  type Presentation,
  type SelectionSet,
  type VideoSelectionSet,
  type VideoTrack,
} from '../../../media/types';
import { getLiveEdge, liveTrackId, liveWindowFromState } from '../live-window';

function videoTrack(start: number): VideoTrack {
  return {
    type: 'video',
    id: 'v-1',
    url: 'https://example.com/video.m3u8',
    mimeType: 'video/mp4',
    codecs: ['avc1.640020'],
    bandwidth: 1_000_000,
    initialization: { url: 'https://example.com/v-init.mp4' },
    duration: Number.POSITIVE_INFINITY,
    startTime: 0,
    startDate: 1000,
    segments: [0, 2, 4, 6, 8].map((o, i) => ({ id: `v-${i}`, url: `v${i}.m4s`, duration: 2, startTime: start + o })),
    metadata: { [MEDIA_PLAYLIST_METADATA_KEY]: { mediaSequence: 0, targetDuration: 2, endList: false } },
  };
}

function audioTrack(start: number): AudioTrack {
  return {
    type: 'audio',
    id: 'a-1',
    groupId: 'audio-hi',
    name: 'Default',
    sampleRate: 48_000,
    channels: 2,
    url: 'https://example.com/audio.m3u8',
    mimeType: 'audio/mp4',
    codecs: ['mp4a.40.2'],
    bandwidth: 128_000,
    initialization: { url: 'https://example.com/a-init.mp4' },
    duration: Number.POSITIVE_INFINITY,
    startTime: 0,
    startDate: 1000,
    segments: [0, 2, 4, 6, 8].map((o, i) => ({ id: `a-${i}`, url: `a${i}.m4s`, duration: 2, startTime: start + o })),
    metadata: { [MEDIA_PLAYLIST_METADATA_KEY]: { mediaSequence: 0, targetDuration: 2, endList: false } },
  };
}

function presentation(opts: { video?: VideoTrack; audio?: AudioTrack }): Presentation {
  const selectionSets: SelectionSet[] = [];

  if (opts.video) {
    const set: VideoSelectionSet = {
      id: 'v-set',
      type: 'video',
      switchingSets: [{ id: 'vss', type: 'video', tracks: [opts.video] }],
    };

    selectionSets.push(set);
  }

  if (opts.audio) {
    const set: AudioSelectionSet = {
      id: 'a-set',
      type: 'audio',
      switchingSets: [{ id: 'ass', type: 'audio', tracks: [opts.audio] }],
    };

    selectionSets.push(set);
  }

  return { id: 'pres-1', url: 'https://example.com/master.m3u8', startTime: 0, selectionSets };
}

function state(opts: { presentation?: MaybeResolvedPresentation; videoId?: string; audioId?: string }) {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(opts.presentation),
    selectedVideoTrackId: signal<string | undefined>(opts.videoId),
    selectedAudioTrackId: signal<string | undefined>(opts.audioId),
  };
}

describe('liveWindowFromState', () => {
  it('intersects the selected A/V windows — max of starts, min of ends', () => {
    // Publication skew: audio published one segment ahead, and its window
    // starts 2s earlier. seekable = what both types can serve.
    const pres = presentation({ video: videoTrack(100), audio: audioTrack(98) });

    expect(liveWindowFromState(state({ presentation: pres, videoId: 'v-1', audioId: 'a-1' }))).toEqual({
      start: 100,
      end: 108,
    });
  });

  it('the intersection max-clamps a non-reference track whose window precedes presentation-0 (negative startTime)', () => {
    // The audio window legitimately starts before the reference join point.
    const pres = presentation({ video: videoTrack(0), audio: audioTrack(-4) });

    expect(liveWindowFromState(state({ presentation: pres, videoId: 'v-1', audioId: 'a-1' }))).toEqual({
      start: 0,
      end: 6,
    });
  });

  // Opposite A/V placement still takes the intersection's later start.
  it('intersects a negative video window with an audio window starting at zero', () => {
    const pres = presentation({ video: videoTrack(-2), audio: audioTrack(0) });

    expect(liveWindowFromState(state({ presentation: pres, videoId: 'v-1', audioId: 'a-1' }))).toEqual({
      start: 0,
      end: 8,
    });
  });

  it('yields a negative start when every selected window is negative (no floor at 0)', () => {
    const pres = presentation({ video: videoTrack(-2), audio: audioTrack(-2) });

    expect(liveWindowFromState(state({ presentation: pres, videoId: 'v-1', audioId: 'a-1' }))).toEqual({
      start: -2,
      end: 8,
    });
  });

  it('yields a negative start for a single mis-anchored track (audio-only / video-only)', () => {
    const pres = presentation({ video: videoTrack(-2) });

    expect(liveWindowFromState(state({ presentation: pres, videoId: 'v-1', audioId: undefined }))).toEqual({
      start: -2,
      end: 8,
    });
  });

  it('returns null on a degenerate intersection (disjoint windows — no position both types can serve)', () => {
    const pres = presentation({ video: videoTrack(100), audio: audioTrack(200) });

    expect(liveWindowFromState(state({ presentation: pres, videoId: 'v-1', audioId: 'a-1' }))).toBeNull();
  });

  it('uses the single selected window for audio-only sources', () => {
    const pres = presentation({ audio: audioTrack(200) });

    expect(liveWindowFromState(state({ presentation: pres, videoId: undefined, audioId: 'a-1' }))).toEqual({
      start: 200,
      end: 210,
    });
  });

  it('falls back to a resolved track when the selected track is not yet resolved (mid-switch)', () => {
    // ABR/user switch in flight: the selected rendition (v-2) is still a shell.
    // The window is presentation-level, so it must come from the resolved sibling
    // (v-1) rather than blinking to null.
    const shell: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'v-2',
      url: 'https://example.com/v2.m3u8',
      mimeType: 'video/mp4',
      codecs: ['avc1.640028'],
      bandwidth: 2_000_000,
    };
    const pres: Presentation = {
      id: 'pres-1',
      url: 'https://example.com/master.m3u8',
      startTime: 0,
      selectionSets: [
        { id: 'v-set', type: 'video', switchingSets: [{ id: 'vss', type: 'video', tracks: [videoTrack(100), shell] }] },
      ],
    };

    expect(liveWindowFromState(state({ presentation: pres, videoId: 'v-2' }))).toEqual({ start: 100, end: 110 });
  });

  it('returns null when no track is selected', () => {
    const pres = presentation({ video: videoTrack(100) });

    expect(liveWindowFromState(state({ presentation: pres, videoId: undefined, audioId: undefined }))).toBeNull();
  });

  it('returns null without a resolved presentation', () => {
    expect(liveWindowFromState(state({ presentation: undefined, videoId: 'v-1' }))).toBeNull();
  });
});

describe('liveTrackId', () => {
  it('prefers the selected video track', () => {
    expect(liveTrackId(state({ videoId: 'v-1', audioId: 'a-1' }))).toBe('v-1');
  });

  it('falls back to the selected audio track when no video is selected', () => {
    expect(liveTrackId(state({ videoId: undefined, audioId: 'a-1' }))).toBe('a-1');
  });

  it('is undefined when neither is selected', () => {
    expect(liveTrackId(state({ videoId: undefined, audioId: undefined }))).toBeUndefined();
  });
});

describe('getLiveEdge', () => {
  // window [100, 110] for the selected video track.
  const live = () => state({ presentation: presentation({ video: videoTrack(100) }), videoId: 'v-1' });

  it('places liveEdgeStart the resolved latency behind the edge', () => {
    const edge = getLiveEdge({ state: live(), config: { resolveLiveLatency: () => 6 } });

    expect(edge).toEqual({ start: 100, end: 110, liveEdgeStart: 104 });
  });

  it('clamps liveEdgeStart to the window start when the latency exceeds the window', () => {
    const edge = getLiveEdge({ state: live(), config: { resolveLiveLatency: () => 20 } });

    expect(edge?.liveEdgeStart).toBe(100);
  });

  it('sits at the edge when no latency policy is supplied', () => {
    expect(getLiveEdge({ state: live() })?.liveEdgeStart).toBe(110);
  });

  it('is null when there is no live window', () => {
    expect(getLiveEdge({ state: state({ presentation: undefined, videoId: 'v-1' }) })).toBeNull();
  });
});
