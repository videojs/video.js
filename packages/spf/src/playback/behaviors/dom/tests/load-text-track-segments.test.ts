import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { ContextSignals, StateSignals } from '../../../../core/composition/create-composition';
import { signal } from '../../../../core/signals/primitives';
import type {
  Cue,
  MaybeResolvedPresentation,
  MediaElementWithTextTracks,
  Presentation,
  Segment,
  TextTrack,
} from '../../../../media/types';
import type { TextTrackSegmentLoaderActor } from '../../../actors/text-track-segment-loader';
import type { TextTracksActor } from '../../../actors/text-tracks';
import { loadTextTrackSegments } from '../load-segments';
import { setupTextTrackActors, type TextTrackActorsContext } from '../setup-text-track-actors';

// Local narrow type aliases — the text-specific slice of the
// `SegmentLoadingState` / `SegmentLoadingContext` shapes that
// `loadTextTrackSegments` (now defined in `load-segments.ts`) consumes.
interface TextTrackSegmentLoadingState {
  selectedTextTrackId?: string;
  presentation?: MaybeResolvedPresentation;
  currentTime?: number;
  preload?: string;
  loadActivated?: boolean;
  loadingSuspended?: boolean;
}

interface TextTrackSegmentLoadingContext {
  textTrackSegmentLoaderActor?: TextTrackSegmentLoaderActor | undefined;
}

// The composed behaviors (setup in dom + loader in media) intersect their
// context-shape contracts. The setup narrows `mediaElement` to
// `HTMLMediaElement`; the loader keeps the abstract actor types. The test
// signal map has to satisfy both.
type ComposedContext = TextTrackSegmentLoadingContext & TextTrackActorsContext;

const resolveVttSegment = vi.fn(async (url: string): Promise<VTTCue[]> => [new VTTCue(0, 5, `Subtitle from ${url}`)]);

function makeState(initial: TextTrackSegmentLoadingState = {}): StateSignals<TextTrackSegmentLoadingState> {
  return {
    selectedTextTrackId: signal<string | undefined>(initial.selectedTextTrackId),
    presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation),
    currentTime: signal<number | undefined>(initial.currentTime),
    preload: signal<string | undefined>(initial.preload),
    loadActivated: signal<boolean | undefined>(initial.loadActivated),
    loadingSuspended: signal<boolean | undefined>(initial.loadingSuspended),
  };
}

function makeContext(initial: ComposedContext = {}): ContextSignals<ComposedContext> {
  return {
    mediaElement: signal<(MediaElementWithTextTracks & HTMLMediaElement) | undefined>(
      initial.mediaElement as (MediaElementWithTextTracks & HTMLMediaElement) | undefined
    ) as ContextSignals<ComposedContext>['mediaElement'],
    textTracksActor: signal<TextTracksActor<VTTCue & Cue> | undefined>(
      initial.textTracksActor as TextTracksActor<VTTCue & Cue> | undefined
    ) as ContextSignals<ComposedContext>['textTracksActor'],
    textTrackSegmentLoaderActor: signal<TextTrackSegmentLoaderActor | undefined>(initial.textTrackSegmentLoaderActor),
  };
}

function createMockPresentation(tracks: Partial<TextTrack>[]): Presentation {
  return {
    url: 'https://example.com/playlist.m3u8',
    selectionSets: [
      {
        type: 'text',
        switchingSets: [
          {
            tracks: tracks.map((t) => ({
              id: t.id || 'text-1',
              type: 'text' as const,
              url: t.url || 'https://example.com/text.m3u8',
              mimeType: 'text/vtt',
              bandwidth: 0,
              groupId: 'subs',
              label: t.label || 'English',
              kind: (t.kind || 'subtitles') as 'subtitles' | 'captions',
              language: t.language || 'en',
              segments: t.segments || [],
              ...t,
            })),
          },
        ],
      },
    ],
  } as Presentation;
}

function createMockSegments(count: number): Segment[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `segment-${i}`,
    url: `https://example.com/segment-${i}.vtt`,
    duration: 10,
    startTime: i * 10,
  }));
}

function setupLoadTextTrackCues(initialState: TextTrackSegmentLoadingState, initialContext: ComposedContext) {
  // Default to `preload: 'auto'` so existing tests (which pre-date the
  // FSM and assume loading-is-on) still exercise the load path. Tests
  // targeting dormant / activation behavior override this explicitly.
  const state = makeState({ preload: 'auto', ...initialState });
  const context = makeContext(initialContext);
  const setupCleanup = setupTextTrackActors.setup({
    state,
    context,
    config: { resolveTextTrackSegment: resolveVttSegment },
  }) as () => void;
  const reactor = loadTextTrackSegments.setup({ state, context });
  const cleanup = () => {
    reactor.destroy();
    setupCleanup();
  };

  return { state, context, cleanup };
}

describe('loadTextTrackSegments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing when track not selected', async () => {
    const video = document.createElement('video');
    const slot = document.createElement('track');

    slot.id = 'text-1';
    slot.kind = 'subtitles';
    video.appendChild(slot);
    slot.track.mode = 'hidden';

    const { state, context, cleanup } = setupLoadTextTrackCues(
      { presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(1) }]) },
      { mediaElement: video }
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(context.textTrackSegmentLoaderActor.get()).toBeDefined();
      expect(resolveVttSegment).not.toHaveBeenCalled();

      state.selectedTextTrackId.set('text-1');

      await vi.waitFor(() =>
        expect(resolveVttSegment).toHaveBeenCalledExactlyOnceWith('https://example.com/segment-0.vtt')
      );
    } finally {
      cleanup();
    }
  });

  describe.each([undefined, 0])('initial currentTime=%s', (currentTime) => {
    it.each([
      { count: 1, urls: ['https://example.com/segment-0.vtt'] },
      { count: 2, urls: ['https://example.com/segment-0.vtt', 'https://example.com/segment-1.vtt'] },
      {
        count: 3,
        urls: [
          'https://example.com/segment-0.vtt',
          'https://example.com/segment-1.vtt',
          'https://example.com/segment-2.vtt',
        ],
      },
    ])('triggers loading for $count segments in order with auto preload', async ({ count, urls }) => {
      const trackElement = document.createElement('track');

      trackElement.id = 'text-1';
      const video = document.createElement('video');

      video.appendChild(trackElement);
      trackElement.track.mode = 'hidden';

      const { cleanup } = setupLoadTextTrackCues(
        {
          selectedTextTrackId: 'text-1',
          currentTime,
          preload: 'auto',
          presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(count) }]),
        },
        { mediaElement: video }
      );

      try {
        await vi.waitFor(() => expect(resolveVttSegment).toHaveBeenCalledTimes(count));
        expect(resolveVttSegment.mock.calls).toEqual(urls.map((url) => [url]));
      } finally {
        cleanup();
      }
    });
  });

  it('does nothing when track not in presentation', async () => {
    const trackElement = document.createElement('track');

    trackElement.id = 'text-999';
    const video = document.createElement('video');

    video.appendChild(trackElement);

    const { cleanup } = setupLoadTextTrackCues(
      {
        selectedTextTrackId: 'text-999',
        presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(1) }]),
      },
      { mediaElement: video }
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(resolveVttSegment).not.toHaveBeenCalled();

    cleanup();
  });

  describe('forward buffer windowing', () => {
    function makeWindowingSetup(currentTime = 0) {
      const trackElement = document.createElement('track');

      trackElement.id = 'text-1';
      const video = document.createElement('video');

      video.appendChild(trackElement);
      trackElement.track.mode = 'hidden';

      const { state, context, cleanup } = setupLoadTextTrackCues(
        {
          selectedTextTrackId: 'text-1',
          currentTime,
          presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(5) }]),
        },
        { mediaElement: video }
      );

      return { state, context, cleanup, trackElement };
    }

    it('only fetches segments within the forward buffer window at the initial position', async () => {
      const { cleanup } = makeWindowingSetup(0);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(resolveVttSegment).toHaveBeenCalledTimes(3);
      expect(resolveVttSegment).toHaveBeenCalledWith('https://example.com/segment-0.vtt');
      expect(resolveVttSegment).toHaveBeenCalledWith('https://example.com/segment-1.vtt');
      expect(resolveVttSegment).toHaveBeenCalledWith('https://example.com/segment-2.vtt');
      expect(resolveVttSegment).not.toHaveBeenCalledWith('https://example.com/segment-3.vtt');
      expect(resolveVttSegment).not.toHaveBeenCalledWith('https://example.com/segment-4.vtt');

      cleanup();
    });

    it('fetches new in-window segments when currentTime advances', async () => {
      const { state, cleanup } = makeWindowingSetup(0);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(resolveVttSegment).toHaveBeenCalledTimes(3);

      state.currentTime.set(15);

      await vi.waitFor(() => {
        expect(resolveVttSegment).toHaveBeenCalledTimes(5);
      });

      expect(resolveVttSegment).toHaveBeenCalledWith('https://example.com/segment-3.vtt');
      expect(resolveVttSegment).toHaveBeenCalledWith('https://example.com/segment-4.vtt');

      for (const url of [
        'https://example.com/segment-0.vtt',
        'https://example.com/segment-1.vtt',
        'https://example.com/segment-2.vtt',
      ]) {
        expect(resolveVttSegment.mock.calls.filter(([calledUrl]) => calledUrl === url)).toHaveLength(1);
      }

      cleanup();
    });
  });

  // --------------------------------------------------------------------------
  // Load-mode FSM: preconditions-unmet | dormant | full-range
  // --------------------------------------------------------------------------

  describe('load-mode FSM', () => {
    function makeMountedTrack(id = 'text-1') {
      const trackElement = document.createElement('track');

      trackElement.id = id;
      const video = document.createElement('video');

      video.appendChild(trackElement);
      trackElement.track.mode = 'hidden';
      return video;
    }

    it("dormant — preload='metadata' && !loadActivated: no fetches (text has no init segment)", async () => {
      const video = makeMountedTrack();

      const { cleanup } = setupLoadTextTrackCues(
        {
          selectedTextTrackId: 'text-1',
          presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(2) }]),
          preload: 'metadata',
        },
        { mediaElement: video }
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(resolveVttSegment).not.toHaveBeenCalled();

      cleanup();
    });

    it("full-range — loadActivated overrides preload='none'", async () => {
      const video = makeMountedTrack();

      const { cleanup } = setupLoadTextTrackCues(
        {
          selectedTextTrackId: 'text-1',
          presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(2) }]),
          preload: 'none',
          loadActivated: true,
        },
        { mediaElement: video }
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(resolveVttSegment).toHaveBeenCalledTimes(2);

      cleanup();
    });

    it('transitions dormant → full-range when loadActivated flips true', async () => {
      const video = makeMountedTrack();

      const { state, cleanup } = setupLoadTextTrackCues(
        {
          selectedTextTrackId: 'text-1',
          presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(2) }]),
          preload: 'none',
        },
        { mediaElement: video }
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(resolveVttSegment).not.toHaveBeenCalled();

      state.loadActivated.set(true);

      await vi.waitFor(() => {
        expect(resolveVttSegment).toHaveBeenCalledTimes(2);
      });

      cleanup();
    });

    it('does not re-dispatch on currentTime ticks within the same segment', async () => {
      const video = makeMountedTrack();

      const { state, context, cleanup } = setupLoadTextTrackCues(
        {
          selectedTextTrackId: 'text-1',
          currentTime: 0,
          presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(5) }]),
        },
        { mediaElement: video }
      );
      const loader = context.textTrackSegmentLoaderActor.get()!;
      const send = vi.spyOn(loader, 'send');

      try {
        await vi.waitFor(() => {
          expect(context.textTracksActor.get()!.snapshot.get().context.segments['text-1']).toHaveLength(3);
          expect(loader.snapshot.get().value).toBe('idle');
        });
        send.mockClear();

        for (const time of [2, 5, 8]) {
          state.currentTime.set(time);
          await new Promise((resolve) => setTimeout(resolve, 0));

          expect(send).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'load' }));
        }

        state.currentTime.set(10);

        await vi.waitFor(() =>
          expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'load', range: { start: 10, end: 40 } }))
        );
      } finally {
        send.mockRestore();
        cleanup();
      }
    });
  });

  // Text loading has no structural tie to the MediaSource — the observed
  // 'dormant' policy gate is the only thing that stops it (v/a loaders die
  // with the closed MediaSource besides).
  describe('loadingSuspended (observed dormant gate)', () => {
    it('does not dispatch while suspended, even with preload="auto"', async () => {
      const send = vi.fn();
      const fakeLoader = { send } as unknown as TextTrackSegmentLoaderActor;
      const state = makeState({
        preload: 'auto',
        loadingSuspended: true,
        selectedTextTrackId: 'text-1',
        currentTime: 0,
        presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(5) }]),
      });
      const context = makeContext({ textTrackSegmentLoaderActor: fakeLoader });
      const reactor = loadTextTrackSegments.setup({ state, context });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(send).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'load' }));

      reactor.destroy();
    });

    it('parks while suspended and re-dispatches when the policy lifts', async () => {
      // Fake loader captures the messages the dispatcher sends. Suspension
      // is a policy 'dormant' — no stop message; queued work drains
      // (text fetches are small and bounded), and the derive re-dispatches
      // when the writer clears the slot.
      const send = vi.fn();
      const fakeLoader = { send } as unknown as TextTrackSegmentLoaderActor;
      const state = makeState({
        preload: 'auto',
        selectedTextTrackId: 'text-1',
        currentTime: 0,
        presentation: createMockPresentation([{ id: 'text-1', segments: createMockSegments(5) }]),
      });
      const context = makeContext({ textTrackSegmentLoaderActor: fakeLoader });
      const reactor = loadTextTrackSegments.setup({ state, context });

      // preload:'auto' → 'full-range' → an initial load dispatch.
      await vi.waitFor(() => expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'load' })));
      send.mockClear();

      state.loadingSuspended.set(true);
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(send).not.toHaveBeenCalled();

      state.loadingSuspended.set(false);
      await vi.waitFor(() => expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'load' })));

      reactor.destroy();
    });
  });
});
