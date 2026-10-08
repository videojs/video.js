import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../../../core/signals/primitives';
import {
  addSubtitlesTracksToMedia,
  getShowingSubtitlesTrackFromMedia,
  removeAllSubtitlesTracksFromMedia,
} from '../../../../media/dom/text/text-track-slots';
import type { MaybeResolvedPresentation, SessionDataEntry, TextTrack } from '../../../../media/types';
import { MULTIVARIANT_PLAYLIST_METADATA_KEY } from '../../../../media/types';
import { type LoadChaptersConfig, loadChapters } from '../load-chapters';
import { syncTextTracks } from '../sync-text-tracks';

const CHAPTERS_URL = 'http://example.com/chapters.json';

// Apple's JSON chapters notation, as `parse-json-chapters` reads it.
const DOCUMENT = [
  {
    'start-time': 0,
    titles: [
      { language: 'und', title: 'Intro' },
      { language: 'es', title: 'Introducción' },
    ],
  },
  { 'start-time': 30, duration: 45, titles: [{ language: 'und', title: 'Middle' }] },
  { 'start-time': 90, titles: [{ language: 'und', title: 'End' }] },
];

const chaptersEntry: SessionDataEntry = { dataId: 'com.apple.hls.chapters', uri: CHAPTERS_URL, format: 'JSON' };

function makePresentation({
  sessionData = [chaptersEntry],
}: { sessionData?: SessionDataEntry[] } = {}): MaybeResolvedPresentation {
  return {
    id: 'pres-1',
    url: 'http://example.com/playlist.m3u8',
    selectionSets: [],
    ...(sessionData.length > 0 && { metadata: { [MULTIVARIANT_PLAYLIST_METADATA_KEY]: { sessionData } } }),
  };
}

function stubFetch(respond: (request: Request) => Promise<Response> | Response = () => jsonResponse(DOCUMENT)) {
  // SAFETY: `fetchResolvable` always calls `fetch` with a `Request`.
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => respond(input as Request));

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function requestedUrls(fetchMock: ReturnType<typeof stubFetch>) {
  // SAFETY: see `stubFetch` — every recorded call carries a `Request`.
  return fetchMock.mock.calls.map(([input]) => (input as Request).url);
}

function chaptersTracks(media: HTMLMediaElement): HTMLTrackElement[] {
  return Array.from(media.querySelectorAll<HTMLTrackElement>('track[kind="chapters"]'));
}

function cuesOf(el: HTMLTrackElement): VTTCue[] {
  // SAFETY: the behavior only ever adds `VTTCue`s to the tracks it creates.
  return Array.from(el.track.cues ?? []) as VTTCue[];
}

function setup(
  initial: { presentation?: MaybeResolvedPresentation; mediaElement?: HTMLMediaElement } = {},
  config: LoadChaptersConfig = {}
) {
  const state = { presentation: signal<MaybeResolvedPresentation | undefined>(initial.presentation) };
  const context = { mediaElement: signal<HTMLMediaElement | undefined>(initial.mediaElement) };
  const reactor = loadChapters.setup({ state, context, config });

  return { state, context, reactor };
}

const settle = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 50);
  });

describe('loadChapters', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('detaches cleanly after an earlier reactor is destroyed', async () => {
    stubFetch();
    const first = setup({ presentation: makePresentation(), mediaElement: document.createElement('video') });
    const mediaElement = document.createElement('video');
    const second = setup({ presentation: makePresentation(), mediaElement });
    const errors: unknown[] = [];
    const onError = (event: ErrorEvent) => {
      errors.push(event.error);
      event.preventDefault();
    };

    window.addEventListener('error', onError);

    try {
      await settle();
      expect(chaptersTracks(mediaElement).length).toBeGreaterThan(0);

      // Disposing earlier effects reorders the shared watcher's pending queue.
      first.reactor.destroy();
      second.context.mediaElement.set(undefined);
      await settle();

      expect(errors).toEqual([]);
      expect(chaptersTracks(mediaElement)).toEqual([]);
    } finally {
      window.removeEventListener('error', onError);
      second.reactor.destroy();
    }
  });

  it('does nothing without a media element', async () => {
    const fetchMock = stubFetch();
    const { reactor } = setup({ presentation: makePresentation() });

    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    reactor.destroy();
  });

  it('does nothing when the presentation carries no chapters session data', async () => {
    const fetchMock = stubFetch();
    const mediaElement = document.createElement('video');
    const { reactor } = setup({
      presentation: makePresentation({ sessionData: [{ dataId: 'com.example.title', value: 'x' }] }),
      mediaElement,
    });

    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(chaptersTracks(mediaElement)).toHaveLength(0);
    reactor.destroy();
  });

  it('ignores a chapters entry carried inline as VALUE', async () => {
    const fetchMock = stubFetch();
    const mediaElement = document.createElement('video');
    const { reactor } = setup({
      presentation: makePresentation({
        sessionData: [{ dataId: 'com.apple.hls.chapters', value: '[]' }],
      }),
      mediaElement,
    });

    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    reactor.destroy();
  });

  it('projects one hidden chapters track per language without waiting for a duration', async () => {
    stubFetch();
    const mediaElement = document.createElement('video');
    const { reactor } = setup({ presentation: makePresentation(), mediaElement });

    await vi.waitFor(() => expect(chaptersTracks(mediaElement)).toHaveLength(2));

    const [und, es] = chaptersTracks(mediaElement);

    expect(und!.srclang).toBe('und');
    expect(und!.track.mode).toBe('hidden');
    await vi.waitFor(() => expect(cuesOf(und!)).toHaveLength(3));
    expect(cuesOf(und!).map((cue) => [cue.startTime, cue.endTime, cue.text])).toEqual([
      [0, 30, 'Intro'],
      [30, 75, 'Middle'],
      [90, Number.MAX_SAFE_INTEGER, 'End'],
    ]);
    expect(es!.srclang).toBe('es');
    expect(cuesOf(es!)).toHaveLength(1);
    reactor.destroy();
  });

  it('puts the preferred subtitle language first', async () => {
    stubFetch();
    const mediaElement = document.createElement('video');
    const { reactor } = setup({ presentation: makePresentation(), mediaElement }, { preferredSubtitleLanguage: 'es' });

    await vi.waitFor(() => expect(chaptersTracks(mediaElement)).toHaveLength(2));
    expect(chaptersTracks(mediaElement).map((el) => el.srclang)).toEqual(['es', 'und']);
    reactor.destroy();
  });

  it('reads the first chapters entry that carries a URI', async () => {
    const fetchMock = stubFetch();
    const mediaElement = document.createElement('video');
    const { reactor } = setup({
      presentation: makePresentation({
        sessionData: [
          { dataId: 'com.apple.hls.chapters', value: '[]' },
          chaptersEntry,
          { ...chaptersEntry, uri: 'http://example.com/chapters-es.json', language: 'es' },
        ],
      }),
      mediaElement,
    });

    await vi.waitFor(() => expect(chaptersTracks(mediaElement)).toHaveLength(2));
    expect(requestedUrls(fetchMock)).toEqual([CHAPTERS_URL]);
    reactor.destroy();
  });

  it('requests the document with the credentials its policy resolves for that URL', async () => {
    const fetchMock = stubFetch();
    const policy = vi.fn((): RequestCredentials => 'include');
    const { reactor } = setup(
      { presentation: makePresentation(), mediaElement: document.createElement('video') },
      { requestCredentials: policy }
    );

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(policy).toHaveBeenCalledWith({ url: CHAPTERS_URL });
    expect((fetchMock.mock.calls[0]![0] as Request).credentials).toBe('include');
    reactor.destroy();
  });

  it('adds nothing when the document fails to load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    stubFetch(() => jsonResponse({}, 500));
    const mediaElement = document.createElement('video');
    const { reactor } = setup({ presentation: makePresentation(), mediaElement });

    await vi.waitFor(() => expect(warn).toHaveBeenCalledOnce());
    await settle();

    expect(chaptersTracks(mediaElement)).toHaveLength(0);
    reactor.destroy();
  });

  it('adds nothing when the document is not JSON', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    stubFetch(() => new Response('not json', { status: 200 }));
    const mediaElement = document.createElement('video');
    const { reactor } = setup({ presentation: makePresentation(), mediaElement });

    await vi.waitFor(() => expect(warn).toHaveBeenCalledOnce());
    await settle();

    expect(chaptersTracks(mediaElement)).toHaveLength(0);
    reactor.destroy();
  });

  it('aborts an in-flight fetch and adds nothing when the source changes', async () => {
    let request: Request | undefined;
    let release!: () => void;
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });

    stubFetch(async (input) => {
      request = input;
      await released;

      return jsonResponse(DOCUMENT);
    });

    const mediaElement = document.createElement('video');
    const { state, reactor } = setup({ presentation: makePresentation(), mediaElement });

    await vi.waitFor(() => expect(request).toBeDefined());

    state.presentation.set({ url: 'http://example.com/next.m3u8' });
    await settle();

    expect(request!.signal.aborted).toBe(true);

    release();
    await settle();

    expect(chaptersTracks(mediaElement)).toHaveLength(0);
    reactor.destroy();
  });

  it('removes its tracks on src unload and leaves subtitle tracks alone', async () => {
    stubFetch();
    const mediaElement = document.createElement('video');

    addSubtitlesTracksToMedia(mediaElement, [
      {
        id: 'subs-en',
        type: 'text',
        kind: 'subtitles',
        label: 'English',
        language: 'en',
        url: 'data:text/vtt,',
        mimeType: 'text/vtt',
        bandwidth: 0,
        groupId: 'subs',
      },
    ]);

    const { state, reactor } = setup({ presentation: makePresentation(), mediaElement });

    await vi.waitFor(() => expect(chaptersTracks(mediaElement)).toHaveLength(2));

    state.presentation.set(undefined);
    await settle();

    expect(chaptersTracks(mediaElement)).toHaveLength(0);
    expect(mediaElement.querySelectorAll('track[data-src-track]')).toHaveLength(1);
    reactor.destroy();
  });

  it('removes its tracks on destroy', async () => {
    stubFetch();
    const mediaElement = document.createElement('video');
    const { reactor } = setup({ presentation: makePresentation(), mediaElement });

    await vi.waitFor(() => expect(chaptersTracks(mediaElement)).toHaveLength(2));

    reactor.destroy();

    expect(chaptersTracks(mediaElement)).toHaveLength(0);
  });

  it('recreates subtitle and chapter tracks on direct media element replacement', async () => {
    stubFetch();
    const first = document.createElement('video');
    const replacement = document.createElement('video');
    const { state, context, reactor } = setup({
      mediaElement: first,
      presentation: {
        ...makePresentation(),
        selectionSets: [
          {
            id: 'text',
            type: 'text',
            switchingSets: [
              {
                id: 'subs',
                type: 'text',
                tracks: [
                  {
                    id: 'subs-en',
                    type: 'text',
                    kind: 'subtitles',
                    label: 'English',
                    language: 'en',
                    url: 'data:text/vtt,',
                    mimeType: 'text/vtt',
                    bandwidth: 0,
                    groupId: 'subs',
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    const subtitles = syncTextTracks.setup({
      state: {
        ...state,
        selectedTextTrackId: signal<string | undefined>('subs-en'),
        userTextTrackSelection: signal<Partial<TextTrack> | 'off' | undefined>(undefined),
      },
      context: { ...context, textTracksActor: signal(undefined) },
      config: { addSubtitlesTracksToMedia, getShowingSubtitlesTrackFromMedia, removeAllSubtitlesTracksFromMedia },
    });

    try {
      await vi.waitFor(() => expect(first.querySelectorAll('track')).toHaveLength(3));

      context.mediaElement.set(replacement);

      await vi.waitFor(() =>
        expect([first.querySelectorAll('track').length, replacement.querySelectorAll('track').length]).toEqual([0, 3])
      );
      expect(getShowingSubtitlesTrackFromMedia(replacement)?.id).toBe('subs-en');
      await vi.waitFor(() => expect(cuesOf(chaptersTracks(replacement)[0]!)).toHaveLength(3));
    } finally {
      subtitles.destroy();
      reactor.destroy();
    }
  });

  it('projects again for a new source', async () => {
    const fetchMock = stubFetch();
    const mediaElement = document.createElement('video');
    const { state, reactor } = setup({ presentation: makePresentation(), mediaElement });

    await vi.waitFor(() => expect(chaptersTracks(mediaElement)).toHaveLength(2));

    state.presentation.set({ url: 'http://example.com/next.m3u8' });
    await settle();
    expect(chaptersTracks(mediaElement)).toHaveLength(0);

    state.presentation.set({
      ...makePresentation(),
      id: 'pres-2',
      url: 'http://example.com/next.m3u8',
    });

    await vi.waitFor(() => expect(chaptersTracks(mediaElement)).toHaveLength(2));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(cuesOf(chaptersTracks(mediaElement)[0]!)).toHaveLength(3));
    reactor.destroy();
  });
});
