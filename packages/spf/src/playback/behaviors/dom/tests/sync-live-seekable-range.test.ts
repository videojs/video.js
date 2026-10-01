import { describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../../../core/signals/primitives';
import {
  type AudioTrack,
  type MaybeResolvedPresentation,
  MEDIA_PLAYLIST_METADATA_KEY,
  type Presentation,
  type VideoTrack,
} from '../../../../media/types';
import { syncLiveSeekableRange } from '../sync-live-seekable-range';

function makePresentation(): Presentation {
  // 5-segment, 2s window: [100, 110].
  const video: VideoTrack = {
    type: 'video',
    id: 'v-1',
    url: 'https://example.com/video.m3u8',
    mimeType: 'video/mp4',
    codecs: ['avc1.640020'],
    bandwidth: 1_000_000,
    initialization: { url: 'https://example.com/init.mp4' },
    duration: Number.POSITIVE_INFINITY,
    startTime: 0,
    startDate: 1000,
    segments: [100, 102, 104, 106, 108].map((startTime, i) => ({
      id: `segment-${50 + i}`,
      url: `${50 + i}.m4s`,
      duration: 2,
      startTime,
    })),
    metadata: { [MEDIA_PLAYLIST_METADATA_KEY]: { mediaSequence: 50, targetDuration: 2, endList: false } },
  };

  return {
    id: 'pres-1',
    url: 'https://example.com/master.m3u8',
    startTime: 0,
    selectionSets: [{ id: 'video-set', type: 'video', switchingSets: [{ id: 'vs', type: 'video', tracks: [video] }] }],
  };
}

function fakeMediaSource(readyState: MediaSource['readyState'] = 'open') {
  return {
    readyState,
    duration: Number.NaN,
    setLiveSeekableRange: vi.fn(),
  } as unknown as MediaSource & { setLiveSeekableRange: ReturnType<typeof vi.fn> };
}

function run(opts: {
  presentation?: MaybeResolvedPresentation;
  trackId?: string;
  audioTrackId?: string;
  mediaSource?: MediaSource;
}) {
  const state = {
    presentation: signal<MaybeResolvedPresentation | undefined>(opts.presentation),
    selectedVideoTrackId: signal<string | undefined>(opts.trackId),
    selectedAudioTrackId: signal<string | undefined>(opts.audioTrackId),
  };
  const context = { mediaSource: signal<MediaSource | undefined>(opts.mediaSource) };

  return syncLiveSeekableRange.setup({ state, context, config: {} }) as () => void;
}

describe('syncLiveSeekableRange', () => {
  it('clamps earlier audio windows to zero and skips empty ranges', () => {
    // Audio may precede presentation-0 and become the only selected type when
    // capability probing deselects video. Windows ending at/before 0 are empty.
    for (const [start, expectedRanges] of [
      [-2, [[0, 8]]],
      [-10, []],
      [-12, []],
    ] as const) {
      const presentation = makePresentation();
      // SAFETY: makePresentation contains one resolved video track.
      const video = presentation.selectionSets[0]!.switchingSets[0]!.tracks[0] as VideoTrack;
      const audio: AudioTrack = {
        ...video,
        type: 'audio',
        id: 'a-1',
        url: 'https://example.com/audio.m3u8',
        mimeType: 'audio/mp4',
        codecs: ['mp4a.40.2'],
        groupId: 'audio',
        name: 'Default',
        sampleRate: 48_000,
        channels: 2,
        segments: video.segments.map((segment, i) => ({ ...segment, startTime: start + i * 2 })),
      };

      presentation.selectionSets.push({
        id: 'audio-set',
        type: 'audio',
        switchingSets: [{ id: 'as', type: 'audio', tracks: [audio] }],
      });

      const ms = fakeMediaSource();
      const cleanup = run({ presentation, audioTrackId: 'a-1', mediaSource: ms });

      try {
        expect(ms.setLiveSeekableRange.mock.calls).toEqual(expectedRanges);
      } finally {
        cleanup();
      }
    }
  });

  it('declares only once the MediaSource is published (open)', async () => {
    // `setupMediaSource` publishes `context.mediaSource` only once open, so an
    // unpublished (absent) MediaSource is the "not ready" gate — no `readyState`
    // check needed (presence + a live window ⟹ open).
    const ms = fakeMediaSource();
    const state = {
      presentation: signal<MaybeResolvedPresentation | undefined>(makePresentation()),
      selectedVideoTrackId: signal<string | undefined>('v-1'),
    };
    const context = { mediaSource: signal<MediaSource | undefined>(undefined) };
    const cleanup = syncLiveSeekableRange.setup({ state, context, config: {} }) as () => void;

    expect(ms.setLiveSeekableRange).not.toHaveBeenCalled(); // unpublished → no declaration

    context.mediaSource.set(ms); // published (open)
    await Promise.resolve(); // effect re-runs on a microtask
    expect(ms.setLiveSeekableRange).toHaveBeenCalledWith(100, 110);

    cleanup();
  });

  it('no-ops for a complete (finite-duration) playlist — VoD / ended live', () => {
    const ms = fakeMediaSource();
    const presentation = makePresentation();

    (presentation.selectionSets[0]!.switchingSets[0]!.tracks[0] as VideoTrack).duration = 110;

    const cleanup = run({ presentation, trackId: 'v-1', mediaSource: ms });

    expect(ms.setLiveSeekableRange).not.toHaveBeenCalled();

    cleanup();
  });

  it('no-ops without a resolved presentation or selected track', () => {
    const ms = fakeMediaSource();
    const cleanup = run({ presentation: undefined, trackId: undefined, mediaSource: ms });

    expect(ms.setLiveSeekableRange).not.toHaveBeenCalled();

    cleanup();
  });

  it('leaves duration alone — owned by updateMediaSourceDuration', () => {
    const ms = fakeMediaSource();
    const cleanup = run({ presentation: makePresentation(), trackId: 'v-1', mediaSource: ms });

    // Declares the range without touching duration (still NaN from the fake).
    expect(ms.setLiveSeekableRange).toHaveBeenCalledWith(100, 110);
    expect(ms.duration).toBeNaN();

    cleanup();
  });
});
