import { describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../../core/signals/primitives';
import type {
  AudioTrack,
  MaybeResolvedPresentation,
  MediaContainerData,
  PartiallyResolvedAudioTrack,
  PartiallyResolvedTextTrack,
  PartiallyResolvedTrack,
  PartiallyResolvedVideoTrack,
  Presentation,
  ResolvedTrack,
  VideoTrack,
} from '../../../media/types';
import { findTrackById } from '../../../media/utils/tracks';
import {
  derivePerTypeStartMediaTime,
  deriveSharedMinStartMediaTime,
  establishStartMediaTime,
  gateFirstParseOnAnchor,
} from '../establish-start-media-time';

// ============================================================================
// Fixtures — a presentation with a video ladder (v1 selected, v2 an unselected
// rung), one audio rendition, one text rendition.
// ============================================================================

const videoShell = (id: string): PartiallyResolvedVideoTrack => ({
  type: 'video',
  id,
  url: `http://example.com/${id}.m3u8`,
  bandwidth: 2_000_000,
  mimeType: 'video/mp4',
  codecs: [],
});

const audioShell: PartiallyResolvedAudioTrack = {
  type: 'audio',
  id: 'a1',
  url: 'http://example.com/a1.m3u8',
  groupId: 'audio-group',
  name: 'English',
  bandwidth: 128000,
  mimeType: 'audio/mp4',
  sampleRate: 48000,
  channels: 2,
  codecs: ['mp4a.40.2'],
};

const textShell: PartiallyResolvedTextTrack = {
  type: 'text',
  id: 't1',
  url: 'http://example.com/t1.m3u8',
  groupId: 'subs',
  label: 'English',
  kind: 'subtitles',
  bandwidth: 1000,
  mimeType: 'text/vtt',
};

/** Resolve a video shell with segments (and optionally a wall-clock `startDate`). */
const resolveVideo = (shell: PartiallyResolvedVideoTrack, startDate?: number): VideoTrack =>
  ({
    ...shell,
    startTime: 0,
    ...(startDate !== undefined ? { startDate } : {}),
    duration: 10,
    segments: [{ id: 'seg-0', url: 'http://example.com/v-seg0.m4s', startTime: 0, duration: 10 }],
    initialization: { url: 'http://example.com/v-init.mp4' },
  }) as VideoTrack;

function makePresentation(tracks: {
  video?: (PartiallyResolvedVideoTrack | VideoTrack)[];
  audio?: (PartiallyResolvedAudioTrack | AudioTrack)[];
  text?: PartiallyResolvedTextTrack[];
}): Presentation {
  return {
    id: 'pres-1',
    url: 'http://example.com/playlist.m3u8',
    selectionSets: [
      {
        id: 'video-set',
        type: 'video',
        switchingSets: [{ id: 'sw-v', type: 'video', tracks: tracks.video ?? [] }],
      },
      {
        id: 'audio-set',
        type: 'audio',
        switchingSets: [{ id: 'sw-a', type: 'audio', tracks: tracks.audio ?? [] }],
      },
      {
        id: 'text-set',
        type: 'text',
        switchingSets: [{ id: 'sw-t', type: 'text', tracks: tracks.text ?? [] }],
      },
    ],
    startTime: 0,
  } as Presentation;
}

const ANCHOR = Date.parse('2026-07-29T00:00:00.000Z') / 1000;

function makeEstablishState(initial: {
  presentation?: MaybeResolvedPresentation;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
}) {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    mediaContainerData: signal<Record<string, MediaContainerData> | undefined>(undefined),
    selectedVideoTrackId: signal<string | undefined>(initial.selectedVideoTrackId),
    selectedAudioTrackId: signal<string | undefined>(initial.selectedAudioTrackId),
  };
}

const trackStartDate = (presentation: MaybeResolvedPresentation | undefined, id: string): number | undefined =>
  (findTrackById(presentation as Presentation, id) as PartiallyResolvedTrack | ResolvedTrack | undefined)?.startDate;

// establishStartMediaTime uses a manual Behavior<> literal, so the public
// setup signature requires `context`/`config` even though this behavior takes
// no context, and its cleanup widens to BehaviorCleanup; cast for ergonomics.
const setupEstablish = (state: ReturnType<typeof makeEstablishState>) =>
  establishStartMediaTime.setup({ state, context: {}, config: {} }) as {
    destroy(): void;
    snapshot: { get(): { value: string } };
  };

describe('establishStartMediaTime', () => {
  it('freezes the reference track startDate as the anchor and stamps it onto every track lacking one', async () => {
    const state = makeEstablishState({
      presentation: makePresentation({
        video: [resolveVideo(videoShell('v1'), ANCHOR), videoShell('v2')],
        audio: [audioShell],
        text: [textShell],
      }),
      selectedVideoTrackId: 'v1',
      selectedAudioTrackId: 'a1',
    });

    const reactor = setupEstablish(state);

    await vi.waitFor(() => {
      const presentation = state.presentation.get();

      expect(trackStartDate(presentation, 'a1')).toBe(ANCHOR);
      expect(trackStartDate(presentation, 't1')).toBe(ANCHOR);
      // Unselected ABR rungs too — a track selected later resolves already anchored.
      expect(trackStartDate(presentation, 'v2')).toBe(ANCHOR);
    });

    reactor.destroy();
  });

  it('stamps nothing when the reference track resolves without a startDate (no PDT — ordinary VOD)', async () => {
    const state = makeEstablishState({
      presentation: makePresentation({
        video: [resolveVideo(videoShell('v1'))],
        audio: [audioShell],
      }),
      selectedVideoTrackId: 'v1',
      selectedAudioTrackId: 'a1',
    });

    const reactor = setupEstablish(state);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(trackStartDate(state.presentation.get(), 'a1')).toBeUndefined();

    reactor.destroy();
  });

  it('stamps reactively when the reference track resolves after setup', async () => {
    const state = makeEstablishState({
      presentation: makePresentation({ video: [videoShell('v1')], audio: [audioShell] }),
      selectedVideoTrackId: 'v1',
      selectedAudioTrackId: 'a1',
    });

    const reactor = setupEstablish(state);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(trackStartDate(state.presentation.get(), 'a1')).toBeUndefined();

    state.presentation.set(makePresentation({ video: [resolveVideo(videoShell('v1'), ANCHOR)], audio: [audioShell] }));

    await vi.waitFor(() => {
      expect(trackStartDate(state.presentation.get(), 'a1')).toBe(ANCHOR);
    });

    reactor.destroy();
  });

  it('falls back to the selected audio track as the reference when no video is selected', async () => {
    const resolvedAudio = {
      ...audioShell,
      startTime: 0,
      startDate: ANCHOR,
      duration: 10,
      segments: [{ id: 'seg-0', url: 'http://example.com/a-seg0.m4s', startTime: 0, duration: 10 }],
      initialization: { url: 'http://example.com/a-init.mp4' },
    };
    const state = makeEstablishState({
      presentation: makePresentation({ audio: [resolvedAudio], text: [textShell] }),
      selectedAudioTrackId: 'a1',
    });

    const reactor = setupEstablish(state);

    await vi.waitFor(() => {
      expect(trackStartDate(state.presentation.get(), 't1')).toBe(ANCHOR);
    });

    reactor.destroy();
  });

  it('never overwrites an existing startDate (the anchor is frozen)', async () => {
    const earlier = ANCHOR - 30;
    const state = makeEstablishState({
      presentation: makePresentation({
        video: [resolveVideo(videoShell('v1'), ANCHOR)],
        audio: [{ ...audioShell, startDate: earlier }],
      }),
      selectedVideoTrackId: 'v1',
      selectedAudioTrackId: 'a1',
    });

    const reactor = setupEstablish(state);

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(trackStartDate(state.presentation.get(), 'a1')).toBe(earlier);

    reactor.destroy();
  });

  it('re-establishes per source: a new presentation gets its own anchor', async () => {
    const state = makeEstablishState({
      presentation: makePresentation({
        video: [resolveVideo(videoShell('v1'), ANCHOR)],
        audio: [audioShell],
      }),
      selectedVideoTrackId: 'v1',
      selectedAudioTrackId: 'a1',
    });

    const reactor = setupEstablish(state);

    await vi.waitFor(() => expect(trackStartDate(state.presentation.get(), 'a1')).toBe(ANCHOR));

    state.mediaContainerData.set({
      video: { timescale: 1000, baseMediaDecodeTime: 12_000, segmentStartTime: 2 },
      audio: { timescale: 1000, baseMediaDecodeTime: 11_000, segmentStartTime: 2 },
    });
    await vi.waitFor(() => expect(reactor.snapshot.get().value).toBe('established'));
    const established = state.presentation.get() as Presentation;

    expect(findTrackById(established, 'v1')?.startMediaTime).toBe(9);
    expect(findTrackById(established, 'a1')?.startMediaTime).toBe(9);

    state.mediaContainerData.set({
      video: { timescale: 1000, baseMediaDecodeTime: 42_000, segmentStartTime: 2 },
      audio: { timescale: 1000, baseMediaDecodeTime: 41_000, segmentStartTime: 2 },
    });
    await Promise.resolve();
    expect(state.presentation.get()).toBe(established);

    const newAnchor = ANCHOR + 3600;

    state.presentation.set(undefined);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(reactor.snapshot.get().value).toBe('inactive');
    expect(state.mediaContainerData.get()).toBeUndefined();

    state.presentation.set({
      ...makePresentation({ video: [resolveVideo(videoShell('v1'), newAnchor)], audio: [audioShell] }),
      id: 'pres-2',
    } as Presentation);

    await vi.waitFor(() => expect(trackStartDate(state.presentation.get(), 'a1')).toBe(newAnchor));
    const fresh = state.presentation.get() as Presentation;

    expect(findTrackById(fresh, 'v1')?.startMediaTime).toBeUndefined();
    expect(findTrackById(fresh, 'a1')?.startMediaTime).toBeUndefined();
    expect(reactor.snapshot.get().value).toBe('monitoring');

    reactor.destroy();
  });
});

describe('gateFirstParseOnAnchor', () => {
  const ctx = { selectedVideoTrackId: 'v1', selectedAudioTrackId: 'a1' };

  it('is open for the reference track itself (its local placement IS the presentation timeline)', () => {
    const presentation = makePresentation({ video: [videoShell('v1')], audio: [audioShell] });

    expect(gateFirstParseOnAnchor(presentation, ctx, 'v1')).toBe(true);
  });

  it('is open when nothing is selected (no reference to wait for)', () => {
    const presentation = makePresentation({ video: [videoShell('v1')] });

    expect(gateFirstParseOnAnchor(presentation, {}, 'v1')).toBe(true);
  });

  it('holds a non-reference track while the reference is unresolved', () => {
    const presentation = makePresentation({ video: [videoShell('v1')], audio: [audioShell] });

    expect(gateFirstParseOnAnchor(presentation, ctx, 'a1')).toBe(false);
  });

  it('opens for a non-reference track when the reference resolved without PDT', () => {
    const presentation = makePresentation({ video: [resolveVideo(videoShell('v1'))], audio: [audioShell] });

    expect(gateFirstParseOnAnchor(presentation, ctx, 'a1')).toBe(true);
  });

  it('holds an anchored non-reference track until its own stamp lands, then opens', () => {
    const unstamped = makePresentation({
      video: [resolveVideo(videoShell('v1'), ANCHOR)],
      audio: [audioShell],
    });

    expect(gateFirstParseOnAnchor(unstamped, ctx, 'a1')).toBe(false);

    const stamped = makePresentation({
      video: [resolveVideo(videoShell('v1'), ANCHOR)],
      audio: [{ ...audioShell, startDate: ANCHOR }],
    });

    expect(gateFirstParseOnAnchor(stamped, ctx, 'a1')).toBe(true);
  });

  it('never deadlocks on a dangling reference id', () => {
    const presentation = makePresentation({ audio: [audioShell] });

    expect(gateFirstParseOnAnchor(presentation, { selectedVideoTrackId: 'ghost' }, 'a1')).toBe(true);
  });

  it('holds while the presentation is unresolved', () => {
    expect(gateFirstParseOnAnchor({ url: 'http://example.com/playlist.m3u8' }, ctx, 'a1')).toBe(false);
  });
});

describe('deriveSharedMinStartMediaTime', () => {
  const sel = { selectedVideoTrackId: 'v', selectedAudioTrackId: 'a' };

  it('relocates every type by the shared min across selected A/V origins', () => {
    // Apple bipbop: video origin 10.000 (ts 6000, tfdt 60000), audio origin 9.956
    // (ts 48000, tfdt 477888). Audio leads by 44ms → shared min = 9.956 for BOTH,
    // so relocating preserves the skew (video lands at +0.044, audio at 0).
    expect(
      deriveSharedMinStartMediaTime(
        {
          video: { timescale: 6000, baseMediaDecodeTime: 60000, segmentStartTime: 0 },
          audio: { timescale: 48000, baseMediaDecodeTime: 477888, segmentStartTime: 0 },
        },
        sel
      )
    ).toEqual({ video: 9.956, audio: 9.956 });
  });

  it('matches per-type when A/V is aligned (min equals each equal origin)', () => {
    expect(
      deriveSharedMinStartMediaTime(
        {
          video: { timescale: 90000, baseMediaDecodeTime: 90000 * 60, segmentStartTime: 0 },
          audio: { timescale: 48000, baseMediaDecodeTime: 48000 * 60, segmentStartTime: 0 },
        },
        sel
      )
    ).toEqual({ video: 60, audio: 60 });
  });

  it('barriers: returns nothing until every selected type has a complete origin', () => {
    // Audio is selected but not yet discovered → hold back both (no partial relocation).
    expect(
      deriveSharedMinStartMediaTime(
        { video: { timescale: 6000, baseMediaDecodeTime: 60000, segmentStartTime: 0 } },
        sel
      )
    ).toEqual({});
  });

  it('subtracts a non-zero segmentStartTime so the origin is the stream origin, not the loaded segment', () => {
    expect(
      deriveSharedMinStartMediaTime(
        {
          video: { timescale: 90000, baseMediaDecodeTime: 90000 * 160, segmentStartTime: 100 },
          audio: { timescale: 48000, baseMediaDecodeTime: 48000 * 160, segmentStartTime: 100 },
        },
        sel
      )
    ).toEqual({ video: 60, audio: 60 });
  });

  it('degenerates to the single type when only one is selected', () => {
    expect(
      deriveSharedMinStartMediaTime(
        { video: { timescale: 6000, baseMediaDecodeTime: 60000, segmentStartTime: 0 } },
        { selectedVideoTrackId: 'v' }
      )
    ).toEqual({ video: 10 });
  });

  it('coordinates across whatever types have data when there is no selection context', () => {
    expect(
      deriveSharedMinStartMediaTime(
        {
          video: { timescale: 6000, baseMediaDecodeTime: 60000, segmentStartTime: 0 },
          audio: { timescale: 48000, baseMediaDecodeTime: 477888, segmentStartTime: 0 },
        },
        {}
      )
    ).toEqual({ video: 9.956, audio: 9.956 });
  });

  it('leaves ordinary ~0-PTS VOD native: a shared origin below the threshold returns 0', () => {
    // Both types carry a sub-second (0.5s) encode offset → not relocated.
    expect(
      deriveSharedMinStartMediaTime(
        {
          video: { timescale: 90000, baseMediaDecodeTime: 45000, segmentStartTime: 0 },
          audio: { timescale: 48000, baseMediaDecodeTime: 24000, segmentStartTime: 0 },
        },
        sel
      )
    ).toEqual({ video: 0, audio: 0 });
  });

  it.each([
    [0.999, 0],
    [1, 1],
    [1.001, 1.001],
  ])('relocates at/above one second: %s → %s', (origin, expected) => {
    const data = {
      video: { timescale: 1000, baseMediaDecodeTime: 1000 * origin, segmentStartTime: 0 },
      audio: { timescale: 1000, baseMediaDecodeTime: 1000 * origin, segmentStartTime: 0 },
    };

    expect(deriveSharedMinStartMediaTime(data, sel)).toEqual({ video: expected, audio: expected });
  });

  it('snaps a negative shared origin to 0 (never relocates forward)', () => {
    // segmentStartTime > bmdt/ts → negative own origin.
    expect(
      deriveSharedMinStartMediaTime(
        {
          video: { timescale: 90000, baseMediaDecodeTime: 0, segmentStartTime: 5 },
          audio: { timescale: 48000, baseMediaDecodeTime: 0, segmentStartTime: 5 },
        },
        sel
      )
    ).toEqual({ video: 0, audio: 0 });
  });
});

describe('derivePerTypeStartMediaTime', () => {
  it('resolves each track type by its own origin (bmdt/ts − segmentStartTime)', () => {
    expect(
      derivePerTypeStartMediaTime(
        {
          video: { timescale: 90000, baseMediaDecodeTime: 90000 * 60, segmentStartTime: 0 },
          audio: { timescale: 48000, baseMediaDecodeTime: 48000 * 59.956, segmentStartTime: 0 },
        },
        {}
      )
    ).toEqual({ video: 60, audio: 59.956 });
  });

  it('subtracts a non-zero segmentStartTime so it yields the stream origin, not the loaded segment', () => {
    expect(
      derivePerTypeStartMediaTime(
        { video: { timescale: 90000, baseMediaDecodeTime: 90000 * 160, segmentStartTime: 100 } },
        {}
      )
    ).toEqual({ video: 60 });
  });

  it.each(['timescale', 'baseMediaDecodeTime', 'segmentStartTime'] as const)(
    'is undefined for a type missing %s',
    (field) => {
      const complete: MediaContainerData = { timescale: 1000, baseMediaDecodeTime: 12_000, segmentStartTime: 2 };
      const incomplete = { ...complete, [field]: undefined };

      expect(derivePerTypeStartMediaTime({ video: complete, audio: complete }, {})).toEqual({ video: 10, audio: 10 });
      expect(derivePerTypeStartMediaTime({ video: incomplete, audio: complete }, {})).toEqual({
        video: undefined,
        audio: 10,
      });
      expect(derivePerTypeStartMediaTime({ video: complete, audio: incomplete }, {})).toEqual({
        video: 10,
        audio: undefined,
      });
    }
  );

  it('snaps a below-threshold origin to 0 independently per type', () => {
    expect(
      derivePerTypeStartMediaTime(
        {
          video: { timescale: 90000, baseMediaDecodeTime: 45000, segmentStartTime: 0 }, // 0.5s → 0
          audio: { timescale: 48000, baseMediaDecodeTime: 48000 * 60, segmentStartTime: 0 }, // 60s → 60
        },
        {}
      )
    ).toEqual({ video: 0, audio: 60 });
  });
});
