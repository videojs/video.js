import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { StateSignals } from '../../../core/composition/define-behavior';
import { signal } from '../../../core/signals/primitives';
import type { TaskLike } from '../../../core/tasks/task';
import { SVTA_UNSUPPORTED_DRM_SYSTEM, SVTA_UNSUPPORTED_ENCRYPTION_METHOD, type SvtaError } from '../../../media/errors';
import type {
  MaybeResolvedPresentation,
  PartiallyResolvedAudioTrack,
  PartiallyResolvedTextTrack,
  PartiallyResolvedVideoTrack,
  Presentation,
  ResolvedTrack,
} from '../../../media/types';
import { isResolvedTrack } from '../../../media/types';
import { reportUnsupportedTrackConditions } from '../../primitives/report-track-conditions';
import { type ResolveTrackState, resolveAudioTrack, resolveTextTrack, resolveVideoTrack } from '../resolve-track';

afterEach(() => {
  vi.restoreAllMocks();
});

function makeState(initial: ResolveTrackState = {}): StateSignals<ResolveTrackState> {
  return {
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    selectedVideoTrackId: signal<string | undefined>(initial.selectedVideoTrackId),
    selectedAudioTrackId: signal<string | undefined>(initial.selectedAudioTrackId),
    selectedTextTrackId: signal<string | undefined>(initial.selectedTextTrackId),
    failedCdns: signal<string[] | undefined>(initial.failedCdns),
  };
}

describe('resolveVideoTrack', () => {
  it('resolves unresolved video track', async () => {
    const unresolved: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'track-1',
      url: 'http://example.com/variant1.m3u8',
      bandwidth: 1000000,
      mimeType: 'video/mp4',
      codecs: [],
    };

    const presentation: Presentation = {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [
            {
              id: 'switching-1',
              type: 'video',
              tracks: [unresolved],
            },
          ],
        },
      ],
      startTime: 0,
    };

    const state = makeState({ presentation, selectedVideoTrackId: 'track-1' });

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
http://example.com/segment1.m4s
#EXTINF:10.0,
http://example.com/segment2.m4s
#EXT-X-ENDLIST`)
    );

    const reactor = resolveVideoTrack.setup({ state });

    await vi.waitFor(() => {
      const currentPres = state.presentation.get();
      const track = findTrackById(currentPres!, 'track-1');

      expect(isResolvedTrack(track!)).toBe(true);
    });

    const resolvedPres = state.presentation.get()!;
    const resolvedTrack = findTrackById(resolvedPres, 'track-1');

    expect(isResolvedTrack(resolvedTrack!)).toBe(true);

    if (isResolvedTrack(resolvedTrack!)) {
      expect(resolvedTrack.segments).toBeDefined();
      expect(resolvedTrack.segments.length).toBeGreaterThan(0);
    }

    reactor.destroy();
  });

  it('does not resolve when track is already resolved', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const presentation: Presentation = {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [
            {
              id: 'switching-1',
              type: 'video',
              tracks: [
                {
                  type: 'video',
                  id: 'track-1',
                  url: 'http://example.com/variant1.m3u8',
                  bandwidth: 1000000,
                  mimeType: 'video/mp4',
                  codecs: ['avc1.4d401f'],
                  width: 1920,
                  height: 1080,
                  frameRate: { frameRateNumerator: 30 },
                  startTime: 0,
                  duration: 0,
                  initialization: { url: 'http://example.com/init.mp4' },
                  segments: [],
                },
              ],
            },
          ],
        },
      ],
      startTime: 0,
    };

    const state = makeState({ presentation, selectedVideoTrackId: 'track-1' });

    const reactor = resolveVideoTrack.setup({ state });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(fetchSpy).not.toHaveBeenCalled();

    reactor.destroy();
  });

  it('does not resolve when no track is selected', async () => {
    const track: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'track-1',
      url: 'http://example.com/variant1.m3u8',
      bandwidth: 1_000_000,
      mimeType: 'video/mp4',
      codecs: [],
    };
    const presentation: Presentation = {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [{ id: 'switching-1', type: 'video', tracks: [track] }],
        },
      ],
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(`#EXTM3U
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
segment1.m4s
#EXT-X-ENDLIST`)
    );
    const state = makeState({ presentation });
    const reactor = resolveVideoTrack.setup({ state });

    try {
      await Promise.resolve();
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'track-1'))).toBe(false);

      state.selectedVideoTrackId.set('track-1');
      await vi.waitFor(() => expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'track-1'))).toBe(true));
      expect(fetchSpy).toHaveBeenCalledOnce();
    } finally {
      reactor.destroy();
    }
  });
});

describe('resolveAudioTrack', () => {
  it('resolves unresolved audio track', async () => {
    const unresolved: PartiallyResolvedAudioTrack = {
      type: 'audio',
      id: 'audio-1',
      url: 'http://example.com/audio.m3u8',
      groupId: 'audio-group',
      name: 'English',
      bandwidth: 128000,
      mimeType: 'audio/mp4',
      sampleRate: 48000,
      channels: 2,
      codecs: ['mp4a.40.2'],
    };

    const presentation: Presentation = {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      selectionSets: [
        {
          id: 'audio-set',
          type: 'audio',
          switchingSets: [
            {
              id: 'switching-1',
              type: 'audio',
              tracks: [unresolved],
            },
          ],
        },
      ],
      startTime: 0,
    };

    const state = makeState({ presentation, selectedAudioTrackId: 'audio-1' });

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(`#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
http://example.com/segment1.m4s
#EXT-X-ENDLIST`)
    );

    const reactor = resolveAudioTrack.setup({ state });

    await vi.waitFor(() => {
      const currentPres = state.presentation.get();
      const track = findTrackById(currentPres!, 'audio-1');

      expect(isResolvedTrack(track!)).toBe(true);
    });

    const resolvedPres = state.presentation.get()!;
    const resolvedTrack = findTrackById(resolvedPres, 'audio-1');

    expect(isResolvedTrack(resolvedTrack!)).toBe(true);

    if (isResolvedTrack(resolvedTrack!)) {
      expect(resolvedTrack.segments).toBeDefined();
      expect(resolvedTrack.segments.length).toBeGreaterThan(0);
      expect(resolvedTrack.type).toBe('audio');
    }

    reactor.destroy();
  });
});

describe('resolveTextTrack', () => {
  it('resolves unresolved text track', async () => {
    const unresolved: PartiallyResolvedTextTrack = {
      type: 'text',
      id: 'text-1',
      url: 'http://example.com/subtitles.m3u8',
      groupId: 'subs',
      label: 'English',
      kind: 'subtitles',
      bandwidth: 1000,
      mimeType: 'text/vtt',
    };

    const presentation: Presentation = {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      selectionSets: [
        {
          id: 'text-set',
          type: 'text',
          switchingSets: [
            {
              id: 'switching-1',
              type: 'text',
              tracks: [unresolved],
            },
          ],
        },
      ],
      startTime: 0,
    };

    const state = makeState({ presentation, selectedTextTrackId: 'text-1' });

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response(`#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:6
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:6.0,
http://example.com/subtitle0.webvtt
#EXTINF:6.0,
http://example.com/subtitle1.webvtt
#EXT-X-ENDLIST`)
    );

    const reactor = resolveTextTrack.setup({ state });

    await vi.waitFor(() => {
      const currentPres = state.presentation.get();
      const track = findTrackById(currentPres!, 'text-1');

      expect(isResolvedTrack(track!)).toBe(true);
    });

    const resolvedPres = state.presentation.get()!;
    const resolvedTrack = findTrackById(resolvedPres, 'text-1');

    expect(isResolvedTrack(resolvedTrack!)).toBe(true);

    if (isResolvedTrack(resolvedTrack!)) {
      expect(resolvedTrack.type).toBe('text');
    }

    reactor.destroy();
  });
});

describe('resolveVideoTrack', () => {
  it('supersedes an in-flight resolution when the selection changes', async () => {
    const trackA: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'track-a',
      url: 'http://example.com/track-a.m3u8',
      bandwidth: 4_000_000,
      mimeType: 'video/mp4',
      codecs: [],
    };
    const trackB: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'track-b',
      url: 'http://example.com/track-b.m3u8',
      bandwidth: 600_000,
      mimeType: 'video/mp4',
      codecs: [],
    };

    const presentation: Presentation = {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [{ id: 'sw-1', type: 'video', tracks: [trackA, trackB] }],
        },
      ],
      startTime: 0,
    };

    const state = makeState({ presentation, selectedVideoTrackId: 'track-a' });

    const makePlaylist = (segUrl: string) => `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
${segUrl}
#EXT-X-ENDLIST`;

    let requestA: Request | undefined;
    let settleA!: () => void;
    const onAbort = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const request = input as Request;

      if (!request.url.includes('track-a')) {
        return Promise.resolve(new Response(makePlaylist('http://example.com/b-seg1.m4s')));
      }

      requestA = request;
      return new Promise<Response>((resolve, reject) => {
        const abort = () => {
          onAbort();
          reject(new DOMException('aborted', 'AbortError'));
        };

        request.signal.addEventListener('abort', abort, { once: true });
        settleA = () => {
          request.signal.removeEventListener('abort', abort);
          resolve(new Response(makePlaylist('http://example.com/a-seg1.m4s')));
        };
      });
    });
    const reactor = resolveVideoTrack.setup({ state });

    try {
      await vi.waitFor(() => expect(requestA).toBeDefined());
      state.selectedVideoTrackId.set('track-b');
      await vi.waitFor(() => expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'track-b'))).toBe(true));

      expect(requestA!.signal.aborted).toBe(true);
      expect(onAbort).toHaveBeenCalledOnce();
      expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'track-a'))).toBe(false);
      expect(state.failedCdns.get()).toBeUndefined();
      expect(fetchSpy.mock.calls.map(([input]) => (input as Request).url)).toEqual([trackA.url, trackB.url]);
    } finally {
      reactor.destroy();
      settleA();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });

  it('does not fetch the same track twice when state changes rapidly', async () => {
    const trackA: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'track-a',
      url: 'http://example.com/track-a.m3u8',
      bandwidth: 2_000_000,
      mimeType: 'video/mp4',
      codecs: [],
    };

    const presentation: Presentation = {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [{ id: 'sw-1', type: 'video', tracks: [trackA] }],
        },
      ],
      startTime: 0,
    };

    const state = makeState({ presentation, selectedVideoTrackId: 'track-a' });

    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      await pending;
      return new Response(`#EXTM3U
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
http://example.com/a-seg1.m4s
#EXT-X-ENDLIST`);
    });
    const reactor = resolveVideoTrack.setup({ state });

    try {
      expect(fetchSpy).toHaveBeenCalledOnce();
      state.selectedVideoTrackId.set(undefined);
      await Promise.resolve();
      state.selectedVideoTrackId.set('track-a');
      await Promise.resolve();
      expect(fetchSpy).toHaveBeenCalledOnce();

      release();
      await vi.waitFor(() => expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'track-a'))).toBe(true));
      expect(fetchSpy).toHaveBeenCalledOnce();
    } finally {
      reactor.destroy();
      release();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });
});

describe('resolveVideoTrack — live reload', () => {
  const LIVE_PLAYLIST = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-MAP:URI="http://example.com/init.mp4"
#EXTINF:4.0,
http://example.com/seg0.m4s`;

  function liveVideoPresentation(): Presentation {
    const unresolved: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'track-1',
      url: 'http://example.com/variant1.m3u8',
      bandwidth: 1_000_000,
      mimeType: 'video/mp4',
      codecs: [],
    };

    return {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      selectionSets: [
        { id: 'video-set', type: 'video', switchingSets: [{ id: 'sw-1', type: 'video', tracks: [unresolved] }] },
      ],
      startTime: 0,
    };
  }

  // Flush pending macrotasks so "did NOT happen" assertions are meaningful.
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('re-resolves while the window is incomplete (reschedule resolves)', async () => {
    const state = makeState({ presentation: liveVideoPresentation(), selectedVideoTrackId: 'track-1' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(LIVE_PLAYLIST));

    // Re-run twice, then stop — bounds the loop without timers.
    let cycles = 0;
    const reschedule = async () => cycles++ < 2;
    const reactor = resolveVideoTrack.setup({ state, config: { reschedule } });

    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(3)); // initial + 2 reloads
    expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'track-1')!)).toBe(true);

    await flush();
    expect(fetchSpy).toHaveBeenCalledTimes(3);

    reactor.destroy();
  });

  it('resolves once and never reloads when no reschedule is configured (VoD/non-live)', async () => {
    const state = makeState({ presentation: liveVideoPresentation(), selectedVideoTrackId: 'track-1' });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(LIVE_PLAYLIST));

    const reactor = resolveVideoTrack.setup({ state });

    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    await flush();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    reactor.destroy();
  });

  it('stops reloading once the playlist completes (reschedule observes the run)', async () => {
    const state = makeState({ presentation: liveVideoPresentation(), selectedVideoTrackId: 'track-1' });
    // Complete (ENDLIST) → finite duration → reschedule stops after the first resolve.
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async () => new Response(`${LIVE_PLAYLIST}\n#EXT-X-ENDLIST`));

    // Observe the resolved track; stop (false) once it's complete.
    const reschedule = async (task: TaskLike<ResolvedTrack>) => {
      const current = await task.run().catch(() => undefined);

      return !(current && Number.isFinite(current.duration));
    };
    const reactor = resolveVideoTrack.setup({ state, config: { reschedule } });

    await vi.waitFor(() => expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'track-1')!)).toBe(true));
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await flush();
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    reactor.destroy();
  });

  it('stops resolving on a fetch failure (an errored run is terminal — no retry)', async () => {
    const state = makeState({ presentation: liveVideoPresentation(), selectedVideoTrackId: 'track-1' });
    let calls = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      calls += 1;
      throw new TypeError('Failed to fetch');
    });

    // Even a reschedule that would keep going can't revive an errored run — the
    // rejected run ends the recurrence (retry, if wanted, belongs in the fetch layer).
    const reschedule = async () => true;
    const reactor = resolveVideoTrack.setup({ state, config: { reschedule } });

    await vi.waitFor(() => expect(calls).toBe(1));
    await flush();
    expect(calls).toBe(1); // no retry
    expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'track-1')!)).toBe(false);

    reactor.destroy();
  });

  it('sets presentation.streamType from the parsed playlist', async () => {
    const state = makeState({ presentation: liveVideoPresentation(), selectedVideoTrackId: 'track-1' });

    // No EXT-X-PLAYLIST-TYPE:VOD → live.
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(LIVE_PLAYLIST));

    const reactor = resolveVideoTrack.setup({ state });

    await vi.waitFor(() => expect(state.presentation.get()?.streamType).toBe('live'));

    reactor.destroy();
  });
});

describe('resolveVideoTrack — concurrent anchor stamp during fetch', () => {
  // Regression: the establishment reactor stamps the wall-clock anchor onto a
  // track's shell while that track's playlist fetch is in flight. Even without
  // a first-parse gate configured, the resolution must parse against the track
  // as stamped — not the pre-fetch snapshot — or it clobbers the stamp and
  // strands the track off the anchor permanently (establishment is sticky-once).
  // Observed live as video never buffering: its model timeline sat ~hundreds of
  // seconds off currentTime.
  it('honors a startDate stamped onto the shell mid-fetch (parses against the live snapshot)', async () => {
    const unresolved: PartiallyResolvedVideoTrack = {
      type: 'video',
      id: 'track-1',
      url: 'http://example.com/variant1.m3u8',
      bandwidth: 1_000_000,
      mimeType: 'video/mp4',
      codecs: [],
    };
    const presentation: Presentation = {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      selectionSets: [
        { id: 'video-set', type: 'video', switchingSets: [{ id: 'sw-1', type: 'video', tracks: [unresolved] }] },
      ],
      startTime: 0,
    };
    const state = makeState({ presentation, selectedVideoTrackId: 'track-1' });

    // Wall clock at media-time 0, 20s before the first segment's PDT — so an
    // anchored first segment lands at startTime 20 and the track's startDate
    // reads back as the anchor. Without the stamp, the track would resolve at
    // local base 0 with startDate = the raw first-segment PDT instead.
    const ANCHOR = 1_672_531_200;
    const PLAYLIST = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-MAP:URI="http://example.com/init.mp4"
#EXT-X-PROGRAM-DATE-TIME:2023-01-01T00:00:20.000Z
#EXTINF:4.0,
http://example.com/seg0.m4s`;

    // Gate the fetch so the stamp lands while the request is in flight.
    let releaseFetch!: () => void;
    const inFlight = new Promise<void>((resolve) => {
      releaseFetch = resolve;
    });
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      markStarted();
      await inFlight;
      return new Response(PLAYLIST);
    });

    const reactor = resolveVideoTrack.setup({ state });

    await started;
    // Establish + stamp the anchor mid-fetch, exactly as the establishment
    // reactor's stampStartDates does.
    const current = state.presentation.get() as Presentation;

    state.presentation.set({
      ...current,
      selectionSets: current.selectionSets.map((selectionSet) => ({
        ...selectionSet,
        switchingSets: selectionSet.switchingSets.map((switchingSet) => ({
          ...switchingSet,
          tracks: switchingSet.tracks.map((track) => ({ ...track, startDate: ANCHOR })),
        })),
      })),
    } as Presentation);
    releaseFetch();

    await vi.waitFor(() => {
      expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'track-1')!)).toBe(true);
    });

    const resolved = findTrackById(state.presentation.get()!, 'track-1');

    expect(resolved.startDate).toBe(ANCHOR);
    expect(resolved.segments[0].startTime).toBe(20);

    reactor.destroy();
  });
});

describe('resolveAudioTrack — first-parse gate', () => {
  const videoShell: PartiallyResolvedVideoTrack = {
    type: 'video',
    id: 'video-1',
    url: 'http://example.com/video.m3u8',
    bandwidth: 2_000_000,
    mimeType: 'video/mp4',
    codecs: [],
  };
  const audioShell: PartiallyResolvedAudioTrack = {
    type: 'audio',
    id: 'audio-1',
    url: 'http://example.com/audio.m3u8',
    groupId: 'audio-group',
    name: 'English',
    bandwidth: 128000,
    mimeType: 'audio/mp4',
    sampleRate: 48000,
    channels: 2,
    codecs: ['mp4a.40.2'],
  };

  function makePresentation(): Presentation {
    return {
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [{ id: 'sw-v', type: 'video', tracks: [{ ...videoShell }] }],
        },
        {
          id: 'audio-set',
          type: 'audio',
          switchingSets: [{ id: 'sw-a', type: 'audio', tracks: [{ ...audioShell }] }],
        },
      ],
      startTime: 0,
    };
  }

  // 00:00:10Z in epoch seconds — the audio playlist's PDT.
  const SEGMENT_PDT = Date.parse('2026-07-29T00:00:10.000Z') / 1000;

  const PDT_PLAYLIST = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:10
#EXT-X-PROGRAM-DATE-TIME:2026-07-29T00:00:10.000Z
#EXTINF:10.0,
http://example.com/audio-seg1.m4s
#EXT-X-ENDLIST`;

  // A stand-in for `gateFirstParseOnAnchor`'s anchored branch: open once the
  // track's shell carries a (stamped) `startDate`. Keeps the seam mechanics
  // under test decoupled from the establishment behavior's policy.
  const gateOnOwnStartDate = (pres: MaybeResolvedPresentation | undefined, _ctx: object, trackId: string) =>
    pres !== undefined && findTrackById(pres, trackId)?.startDate !== undefined;

  it('holds the parse (not the fetch) until the gate opens, then parses the re-read anchor-stamped shell', async () => {
    const state = makeState({
      presentation: makePresentation(),
      selectedVideoTrackId: 'video-1',
      selectedAudioTrackId: 'audio-1',
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(PDT_PLAYLIST));

    const reactor = resolveAudioTrack.setup({ state, config: { gateFirstParse: gateOnOwnStartDate } });

    // The fetch fires immediately; the parse is what waits on the gate.
    await vi.waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'audio-1')!)).toBe(false);

    // Stamp the wall-clock anchor onto the shell (what the establishment
    // reactor does): 5s before the segment's PDT, so `placeOnAnchor` should
    // land the segment at startTime 5.
    const anchor = SEGMENT_PDT - 5;
    const presentation = state.presentation.get()!;

    state.presentation.set({
      ...presentation,
      selectionSets: presentation.selectionSets!.map((selectionSet) =>
        selectionSet.type === 'audio'
          ? {
              ...selectionSet,
              switchingSets: selectionSet.switchingSets.map((switchingSet) => ({
                ...switchingSet,
                tracks: switchingSet.tracks.map((track) => ({ ...track, startDate: anchor })),
              })),
            }
          : selectionSet
      ),
    } as Presentation);

    await vi.waitFor(() => {
      expect(isResolvedTrack(findTrackById(state.presentation.get()!, 'audio-1')!)).toBe(true);
    });

    // The parse consumed the re-read (stamped) shell, not the pre-fetch
    // snapshot: segments are placed on the anchor, and the recomputed track
    // startDate reads back as the anchor.
    const resolved = findTrackById(state.presentation.get()!, 'audio-1')!;

    expect(resolved.segments[0].startTime).toBe(5);
    expect(resolved.startDate).toBe(anchor);

    reactor.destroy();
  });

  it('aborts a gated parse with the runner when the presentation resets', async () => {
    const state = makeState({
      presentation: makePresentation(),
      selectedVideoTrackId: 'video-1',
      selectedAudioTrackId: 'audio-1',
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(PDT_PLAYLIST));

    const gate = vi.fn(() => false);
    const reactor = resolveAudioTrack.setup({ state, config: { gateFirstParse: gate } });

    try {
      await vi.waitFor(() => expect(gate).toHaveBeenCalled());
      expect(fetchSpy).toHaveBeenCalledOnce();

      state.presentation.set(undefined);
      await new Promise((resolve) => setTimeout(resolve, 0));
      gate.mockClear();
      state.presentation.set({ url: 'http://example.com/next.m3u8' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(gate).not.toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalledOnce();
    } finally {
      reactor.destroy();
    }
  });
});

// Helper to find track by ID in presentation
function findTrackById(
  presentation: MaybeResolvedPresentation,
  trackId: string
): PartiallyResolvedVideoTrack | any | undefined {
  for (const selectionSet of presentation.selectionSets ?? []) {
    for (const switchingSet of selectionSet.switchingSets) {
      const track = switchingSet.tracks.find((t) => t.id === trackId);
      if (track) return track;
    }
  }

  return undefined;
}

describe('resolveVideoTrack — playlist-derived condition reporting', () => {
  const unresolved: PartiallyResolvedVideoTrack = {
    type: 'video',
    id: 'track-1',
    url: 'http://example.com/variant1.m3u8',
    bandwidth: 1_000_000,
    mimeType: 'video/mp4',
    codecs: [],
  };

  const presentation = (): Presentation =>
    ({
      id: 'pres-1',
      url: 'http://example.com/playlist.m3u8',
      startTime: 0,
      selectionSets: [
        {
          id: 'video-set',
          type: 'video',
          switchingSets: [{ id: 'switching-1', type: 'video', tracks: [unresolved] }],
        },
      ],
    }) as Presentation;

  const playlist = (keyLine = '') => `#EXTM3U
#EXT-X-TARGETDURATION:10
#EXT-X-MAP:URI="init.mp4"
${keyLine}
#EXTINF:10.0,
http://example.com/segment1.m4s
#EXT-X-ENDLIST
`;

  const setup = (keyLine?: string) => {
    const state = {
      ...makeState({ presentation: presentation(), selectedVideoTrackId: 'track-1' }),
      errors: signal<SvtaError[] | undefined>(undefined),
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(playlist(keyLine)));
    return state;
  };

  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('reports nothing for a playable rendition', async () => {
    const state = setup();
    const reactor = resolveVideoTrack.setup({ state, config: { reportUnsupportedTrackConditions } });

    await flush();

    expect(state.errors.get()).toBeUndefined();
    reactor.destroy();
  });

  it('reports unsupported DRM when the playlist is DRM-encrypted', async () => {
    const state = setup('#EXT-X-KEY:METHOD=SAMPLE-AES,URI="skd://k",KEYFORMAT="com.apple.streamingkeydelivery"');
    const reactor = resolveVideoTrack.setup({ state, config: { reportUnsupportedTrackConditions } });

    await flush();

    expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_UNSUPPORTED_DRM_SYSTEM]);
    reactor.destroy();
  });

  it('reports an unsupported encryption method for a clear-key (identity) playlist', async () => {
    // METHOD=AES-128 with no KEYFORMAT is clear-key over HTTP, not DRM.
    const state = setup('#EXT-X-KEY:METHOD=AES-128,URI="https://example.com/key.bin"');
    const reactor = resolveVideoTrack.setup({ state, config: { reportUnsupportedTrackConditions } });

    await flush();

    expect(state.errors.get()?.map((error) => error.code)).toEqual([SVTA_UNSUPPORTED_ENCRYPTION_METHOD]);
    reactor.destroy();
  });

  it('hands the seam the whole config alongside the resolved track', async () => {
    // An extended reporter reads its own props (e.g. `drm`) off the config rather
    // than closing over them, so the behavior must pass the config through.
    const state = setup();
    const reportUnsupportedTrackConditions = vi.fn(() => []);
    const drm = { 'com.example': { licenseUrl: 'https://license.example.com' } };
    // A variable, not a literal: the engine config carries props (`drm`) the
    // behavior's own config slice doesn't name, and that is the point.
    const config = { reportUnsupportedTrackConditions, drm };
    const reactor = resolveVideoTrack.setup({ state, config });

    await flush();

    expect(reportUnsupportedTrackConditions).toHaveBeenCalledTimes(1);
    expect(reportUnsupportedTrackConditions).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'track-1' }),
      expect.objectContaining({ reportUnsupportedTrackConditions, drm })
    );
    reactor.destroy();
  });

  it('reports nothing when no seam is wired', async () => {
    const state = setup('#EXT-X-KEY:METHOD=SAMPLE-AES,URI="skd://k"');
    const reactor = resolveVideoTrack.setup({ state });

    await flush();

    expect(state.errors.get()).toBeUndefined();
    reactor.destroy();
  });
});
