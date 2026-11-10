import { HTMLVideoAdapter } from '@videojs/media/dom';
import Hls from 'hls.js';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { HlsJsTextTracksMixin, removeHlsTextTracks, withPreservedTextTracks } from '../text-tracks';

/**
 * Jsdom has no text track implementation, so the media element and its tracks are stubbed with the parts the helper
 * touches: `cues` reads as `null` while a track is disabled, exactly as the spec requires.
 */
class FakeTextTrack {
  /**
   * The cues the media element renders, the way WebKit tracks them for a `<track>` that failed to load: disabling the
   * track drops its cues, and turning it back on does not restore them. Only `addCue` registers a cue.
   */
  readonly rendered = new Set<TextTrackCue>();

  #mode: TextTrackMode = 'disabled';
  #cues: TextTrackCue[] = [];

  id = '';
  kind = 'subtitles';
  label = '';
  language = '';

  /** Set by the list stub so a mode write fires `change` the way a real `TextTrackList` does. */
  onModeChange?: () => void;

  get mode(): TextTrackMode {
    return this.#mode;
  }

  set mode(mode: TextTrackMode) {
    const changed = mode !== this.#mode;

    if (mode === 'disabled') this.rendered.clear();

    this.#mode = mode;

    if (changed) this.onModeChange?.();
  }

  get cues(): TextTrackCue[] | null {
    if (this.#mode === 'disabled') return null;

    // The real `TextTrackCueList` also resolves cues by id, which `onCuesParsed` relies on.
    const list = [...this.#cues] as TextTrackCue[] & { getCueById?(id: string): TextTrackCue | undefined };

    list.getCueById = (id) => list.find((cue) => cue.id === id);

    return list;
  }

  addCue(cue: TextTrackCue) {
    this.addCueCalls += 1;

    // Adding a cue the track already holds is a no-op, as in WebKit.
    if (this.#cues.includes(cue)) return;

    this.#cues.push(cue);

    if (this.mode !== 'disabled') this.rendered.add(cue);
  }

  removeCue(cue: TextTrackCue) {
    this.#cues = this.#cues.filter((present) => present !== cue);
    this.rendered.delete(cue);
  }

  /** Mirrors hls.js's `clearCurrentCues()`, which reads cues through `hidden`. */
  clearCues() {
    const { mode } = this;

    if (mode === 'disabled') this.mode = 'hidden';

    this.#cues = [];
    this.rendered.clear();

    if (mode === 'disabled') this.mode = mode;
  }

  /** How many times a cue was handed to `addCue`, so a re-add of an already present cue is observable. */
  addCueCalls = 0;
}

interface FakeTrackElementInit {
  mode?: TextTrackMode;
  cues?: string[];
  readyState?: number;
  hlsOwned?: boolean;
}

function fakeTrackElement({ mode = 'showing', cues = [], readyState = 2, hlsOwned = false }: FakeTrackElementInit) {
  const track = new FakeTextTrack();

  track.mode = 'hidden';

  for (const id of cues) track.addCue({ id } as TextTrackCue);

  track.mode = mode;

  return {
    track,
    readyState,
    hasAttribute: (name: string) => hlsOwned && name === 'data-removeondestroy',
  };
}

function fakeMedia(...trackEls: ReturnType<typeof fakeTrackElement>[]) {
  return { querySelectorAll: () => trackEls } as unknown as HTMLMediaElement;
}

function cueIds(track: FakeTextTrack): string[] {
  const { mode } = track;

  if (mode === 'disabled') track.mode = 'hidden';

  const ids = (track.cues ?? []).map((cue) => cue.id);

  track.mode = mode;
  return ids;
}

describe('withPreservedTextTracks', () => {
  it('puts back cues the action removed from a sideloaded track', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one', 'two'] });

    withPreservedTextTracks(fakeMedia(trackEl), () => trackEl.track.clearCues());

    expect(cueIds(trackEl.track)).toEqual(['one', 'two']);
  });

  it('puts back the mode the action changed', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one'] });

    withPreservedTextTracks(fakeMedia(trackEl), () => {
      trackEl.track.clearCues();
      trackEl.track.mode = 'disabled';
    });

    expect(trackEl.track.mode).toBe('showing');
    expect(cueIds(trackEl.track)).toEqual(['one']);
  });

  it('keeps cues the action left alone from being added twice', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one'] });

    withPreservedTextTracks(fakeMedia(trackEl), () => {
      trackEl.track.addCue({ id: 'two' } as TextTrackCue);
    });

    expect(cueIds(trackEl.track)).toEqual(['one', 'two']);
  });

  it('restores a disabled track that already loaded its cues', () => {
    const trackEl = fakeTrackElement({ mode: 'disabled', cues: ['one'], readyState: 2 });

    withPreservedTextTracks(fakeMedia(trackEl), () => trackEl.track.clearCues());

    expect(trackEl.track.mode).toBe('disabled');
    expect(cueIds(trackEl.track)).toEqual(['one']);
  });

  it('restores a disabled track without a src that holds cues written from code', () => {
    // A `<track>` without `src` settles in the error state.
    const trackEl = fakeTrackElement({ mode: 'disabled', cues: ['one'], readyState: 3 });

    withPreservedTextTracks(fakeMedia(trackEl), () => trackEl.track.clearCues());

    expect(trackEl.track.mode).toBe('disabled');
    expect(cueIds(trackEl.track)).toEqual(['one']);
  });

  it('does not touch the mode of a disabled track that never loaded', () => {
    const trackEl = fakeTrackElement({ mode: 'disabled', readyState: 0 });
    const setMode = vi.spyOn(trackEl.track, 'mode', 'set');

    withPreservedTextTracks(fakeMedia(trackEl), () => {});

    expect(setMode).not.toHaveBeenCalled();
  });

  it('leaves the tracks hls.js owns to hls.js', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one'], hlsOwned: true });

    withPreservedTextTracks(fakeMedia(trackEl), () => {
      trackEl.track.clearCues();
      trackEl.track.mode = 'disabled';
    });

    expect(trackEl.track.mode).toBe('disabled');
    expect(cueIds(trackEl.track)).toEqual([]);
  });

  it('restores when the action throws', () => {
    const trackEl = fakeTrackElement({ mode: 'showing', cues: ['one'] });

    expect(() =>
      withPreservedTextTracks(fakeMedia(trackEl), () => {
        trackEl.track.clearCues();
        throw new Error('attach failed');
      })
    ).toThrow('attach failed');

    expect(cueIds(trackEl.track)).toEqual(['one']);
  });

  it('runs the action without a media element', () => {
    const action = vi.fn();

    withPreservedTextTracks(null, action);

    expect(action).toHaveBeenCalledOnce();
  });
});

describe('removeHlsTextTracks', () => {
  it('disables hls.js tracks before removing them', () => {
    const actions: string[] = [];
    const media = document.createElement('video');
    const trackEl = document.createElement('track');
    const remove = trackEl.remove.bind(trackEl);

    trackEl.setAttribute('data-removeondestroy', '');
    Object.defineProperty(trackEl, 'track', {
      value: {
        set mode(mode: TextTrackMode) {
          actions.push(`mode:${mode}`);
        },
      },
    });
    vi.spyOn(trackEl, 'remove').mockImplementation(() => {
      actions.push('remove');
      remove();
    });
    media.append(trackEl);

    removeHlsTextTracks(media);

    expect(actions).toEqual(['mode:disabled', 'remove']);
  });

  it('does nothing without a media element', () => {
    expect(() => removeHlsTextTracks(null)).not.toThrow();
  });
});

/**
 * Jsdom implements neither `HTMLTrackElement.track` nor a track list with `getTrackById`, so the mixin gets the parts
 * it reaches for: a track object per `<track>` element, and a list that resolves ids against those elements.
 */
function tracksOf(video: HTMLVideoElement): FakeTextTrack[] {
  return [...video.querySelectorAll('track')].map((trackEl) => trackEl.track as unknown as FakeTextTrack);
}

function trackOf(video: HTMLVideoElement, id: string): TextTrack | null {
  const el = [...video.querySelectorAll('track')].find((trackEl) => trackEl.id === id);

  return el ? el.track : null;
}

let patchList: ((track: FakeTextTrack) => void) | undefined;

function stubTrackSupport(video: HTMLVideoElement): () => void {
  const tracks = new WeakMap<HTMLTrackElement, FakeTextTrack>();
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTrackElement.prototype, 'track');

  Object.defineProperty(HTMLTrackElement.prototype, 'track', {
    configurable: true,
    get(this: HTMLTrackElement) {
      let track = tracks.get(this);

      if (!track) {
        track = new FakeTextTrack();
        track.id = this.id;
        track.kind = this.getAttribute('kind') ?? 'subtitles';
        track.label = this.getAttribute('label') ?? '';
        track.language = this.getAttribute('srclang') ?? '';
        patchList?.(track);
        tracks.set(this, track);
      }

      return track;
    },
  });

  // A real `TextTrackList` is iterable and fires `change` on every mode write; `onTextTrackChange` reads both, so a
  // bare EventTarget here would silently neuter the handler under test.
  const list = Object.assign(new EventTarget(), {
    getTrackById: (id: string) => trackOf(video, id),
    [Symbol.iterator]: () => tracksOf(video)[Symbol.iterator](),
  });

  Object.defineProperty(video, 'textTracks', { configurable: true, value: list });

  patchList = (track: FakeTextTrack) => {
    track.onModeChange = () => list.dispatchEvent(new Event('change'));
  };

  return () => {
    patchList = undefined;

    if (descriptor) Object.defineProperty(HTMLTrackElement.prototype, 'track', descriptor);
    else Reflect.deleteProperty(HTMLTrackElement.prototype, 'track');
  };
}

function createEngine(): Hls {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  return {
    subtitleTracks: [{ lang: 'de', name: 'German', type: 'SUBTITLES' }],
    subtitleTrack: -1,
    on(event: string, fn: (...args: any[]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());

      listeners.get(event)!.add(fn);
    },
    off(event: string, fn: (...args: any[]) => void) {
      listeners.get(event)?.delete(fn);
    },
    emit(event: string, ...args: any[]) {
      for (const fn of [...(listeners.get(event) ?? [])]) fn(event, ...args);
    },
  } as unknown as Hls;
}

class FakeHost extends HTMLVideoAdapter {
  engine: Hls | null;

  constructor(engine: Hls | null = null) {
    super();
    this.engine = engine;
  }
}

const TextTracksHost = HlsJsTextTracksMixin(FakeHost) as unknown as new (engine: Hls | null) => FakeHost;

/** The subtitle set, announced in one batch, the way hls.js's subtitle-track-controller reports it. */
const SUBTITLE_TRACKS_FOUND = {
  tracks: [{ label: 'German', kind: 'subtitles', default: true, subtitleTrack: { lang: 'de' } }],
};

/** One CEA-608 track, announced on its own by hls.js's timeline-controller once 608 data appears. */
const CC_TRACK_FOUND = {
  tracks: [
    { _id: 'textTrack1', label: 'English CC', kind: 'captions', default: false, closedCaptions: { instreamId: 'CC1' } },
  ],
};

/** The second CEA-608 channel, announced separately from the first. */
const CC2_TRACK_FOUND = {
  tracks: [
    { _id: 'textTrack2', label: 'Spanish CC', kind: 'captions', default: false, closedCaptions: { instreamId: 'CC2' } },
  ],
};

let restoreTrackSupport: (() => void) | undefined;

function mount() {
  const engine = createEngine();
  const host = new TextTracksHost(engine);
  const video = document.createElement('video');

  restoreTrackSupport = stubTrackSupport(video);
  host.attach(video);
  (engine as any).emit(Hls.Events.MANIFEST_LOADING);

  return { engine, video };
}

function hlsTracks(video: HTMLVideoElement) {
  return [...video.querySelectorAll('track[data-removeondestroy]')].map((el) => `${el.getAttribute('kind')}:${el.id}`);
}

describe('HlsJsTextTracksMixin', () => {
  afterEach(() => {
    restoreTrackSupport?.();
    restoreTrackSupport = undefined;
  });

  it('keeps the tracks of the current load when MEDIA_ATTACHED arrives after the manifest', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    expect(hlsTracks(video)).toHaveLength(1);

    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(hlsTracks(video)).toHaveLength(1);
  });

  it('drops the tracks of the previous load when a new manifest reports none', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    expect(hlsTracks(video)).toHaveLength(1);

    (engine as any).emit(Hls.Events.MANIFEST_LOADING);

    expect(hlsTracks(video)).toHaveLength(0);
  });

  it('re-creates the subtitle tracks with their mode when the same source re-attaches', () => {
    const { engine, video } = mount();

    (engine as any).subtitleTracks = [
      { id: 0, lang: 'de', name: 'German', type: 'SUBTITLES', default: true },
      { id: 1, lang: 'fr', name: 'French', type: 'SUBTITLES', default: false },
    ];
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, {
      tracks: [
        { label: 'German', kind: 'subtitles', default: true, subtitleTrack: (engine as any).subtitleTracks[0] },
        { label: 'French', kind: 'subtitles', default: false, subtitleTrack: (engine as any).subtitleTracks[1] },
      ],
    });
    video.textTracks.getTrackById('subtitles1')!.mode = 'showing';

    // `hls.recoverMediaError()` detaches and re-attaches the media without reloading the manifest.
    (engine as any).emit(Hls.Events.MEDIA_DETACHED);
    expect(hlsTracks(video)).toHaveLength(0);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(hlsTracks(video)).toEqual(['subtitles:default', 'subtitles:subtitles1']);
    expect(video.textTracks.getTrackById('subtitles1')!.mode).toBe('showing');
  });

  it('does not carry track modes over to a new manifest', () => {
    const { engine, video } = mount();

    (engine as any).subtitleTracks = [{ id: 0, lang: 'de', name: 'German', type: 'SUBTITLES', default: true }];
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    video.textTracks.getTrackById('default')!.mode = 'showing';

    (engine as any).emit(Hls.Events.MEDIA_DETACHED);
    (engine as any).emit(Hls.Events.MANIFEST_LOADING);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(hlsTracks(video)).toEqual(['subtitles:default']);
    expect(video.textTracks.getTrackById('default')!.mode).toBe('disabled');
  });

  it('keeps a CC track showing when hls.js re-announces it after a detach/attach', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);
    video.textTracks.getTrackById('textTrack1')!.mode = 'showing';

    (engine as any).emit(Hls.Events.MEDIA_DETACHED);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);
    expect(hlsTracks(video)).not.toContain('captions:textTrack1');

    // hls.js announces each CC track again only once 608 data shows up after the re-attach.
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);

    expect(video.textTracks.getTrackById('textTrack1')!.mode).toBe('showing');
  });

  it('drops the tracks when the engine is destroyed', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    expect(hlsTracks(video)).toHaveLength(1);

    (engine as any).emit(Hls.Events.DESTROYING);

    expect(hlsTracks(video)).toHaveLength(0);
  });

  it('gives a CC track the id hls.js addresses its cues with', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);

    expect(hlsTracks(video)).toEqual(['captions:textTrack1']);
  });

  it('keeps the subtitle set when a CC track is announced on its own', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);

    expect(hlsTracks(video).sort()).toEqual(['captions:textTrack1', 'subtitles:default']);
  });

  it('lands CUES_PARSED cues on the CC track', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);
    (engine as any).emit(Hls.Events.CUES_PARSED, {
      type: 'captions',
      track: 'textTrack1',
      cues: [{ id: 'c1' } as TextTrackCue],
    });

    const cc = [...video.querySelectorAll('track')].find((el) => el.id === 'textTrack1');
    const mode = cc!.track.mode;

    cc!.track.mode = 'hidden';
    expect([...(cc!.track.cues ?? [])].map((cue) => cue.id)).toEqual(['c1']);
    cc!.track.mode = mode;
  });

  it('replaces the subtitle set on a new batch without touching CC tracks', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);

    expect(hlsTracks(video).sort()).toEqual(['captions:textTrack1', 'subtitles:default']);
  });

  it('replaces a re-announced CC track instead of duplicating it', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);

    expect(hlsTracks(video)).toEqual(['captions:textTrack1']);
  });

  it('drops every track, CC included, when the media detaches', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);
    expect(hlsTracks(video)).toHaveLength(2);

    (engine as any).emit(Hls.Events.MEDIA_DETACHED);

    expect(hlsTracks(video)).toHaveLength(0);
  });

  it('stops subtitle loading when a closed-caption track is selected', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);

    const cc = [...video.querySelectorAll('track')].find((el) => el.id === 'textTrack1')!;

    (engine as any).subtitleTrack = 0;
    cc.track.mode = 'showing';

    // CEA-608 cues come from the video segments, so the subtitle playlist can stop loading without touching CC.
    expect((engine as any).subtitleTrack).toBe(-1);
    expect(cc.track.mode).toBe('showing');
  });

  it('keeps each CC channel announced on its own and routes cues to the right one', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC2_TRACK_FOUND);
    (engine as any).emit(Hls.Events.CUES_PARSED, {
      type: 'captions',
      track: 'textTrack1',
      cues: [{ id: 'cc1' } as TextTrackCue],
    });
    (engine as any).emit(Hls.Events.CUES_PARSED, {
      type: 'captions',
      track: 'textTrack2',
      cues: [{ id: 'cc2' } as TextTrackCue],
    });

    expect(hlsTracks(video)).toEqual(['captions:textTrack1', 'captions:textTrack2']);
    expect(cueIds(trackOf(video, 'textTrack1') as unknown as FakeTextTrack)).toEqual(['cc1']);
    expect(cueIds(trackOf(video, 'textTrack2') as unknown as FakeTextTrack)).toEqual(['cc2']);
  });

  it('switches between CC channels', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC2_TRACK_FOUND);
    (engine as any).emit(Hls.Events.CUES_PARSED, {
      type: 'captions',
      track: 'textTrack2',
      cues: [{ id: 'cc2' } as TextTrackCue],
    });

    const cc1 = trackOf(video, 'textTrack1') as unknown as FakeTextTrack;
    const cc2 = trackOf(video, 'textTrack2') as unknown as FakeTextTrack;

    cc1.mode = 'showing';

    const before = cc2.addCueCalls;

    cc1.mode = 'disabled';
    cc2.mode = 'showing';

    expect((engine as any).subtitleTrack).toBe(-1);
    expect(cc1.mode).toBe('disabled');
    expect(cc2.mode).toBe('showing');
    expect(cc2.addCueCalls).toBe(before + 1);
  });

  it('loads the subtitle playlist again when switching from a CC track to a subtitle track', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);

    const cc = trackOf(video, 'textTrack1') as unknown as FakeTextTrack;
    const subs = trackOf(video, 'default') as unknown as FakeTextTrack;

    cc.mode = 'showing';
    expect((engine as any).subtitleTrack).toBe(-1);

    cc.mode = 'disabled';
    subs.mode = 'showing';

    expect((engine as any).subtitleTrack).toBe(0);
    expect(subs.mode).toBe('showing');
  });

  it('refreshes the cues of a closed-caption track once when it is selected', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);
    (engine as any).emit(Hls.Events.CUES_PARSED, {
      type: 'captions',
      track: 'textTrack1',
      cues: [{ id: 'c1' } as TextTrackCue],
    });

    const cc = [...video.querySelectorAll('track')].find((el) => el.id === 'textTrack1')!;
    const ccTrack = cc.track as unknown as FakeTextTrack;
    const before = ccTrack.addCueCalls;

    ccTrack.mode = 'showing';
    expect(ccTrack.addCueCalls).toBe(before + 1);

    (engine as any).emit(Hls.Events.CUES_PARSED, {
      type: 'captions',
      track: 'textTrack1',
      cues: [{ id: 'c2' } as TextTrackCue],
    });
    expect(ccTrack.addCueCalls).toBe(before + 2);
  });

  it('refreshes a closed-caption track on a stream without subtitle playlists', () => {
    const { engine, video } = mount();

    (engine as any).subtitleTracks = [];
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);
    (engine as any).emit(Hls.Events.CUES_PARSED, {
      type: 'captions',
      track: 'textTrack1',
      cues: [{ id: 'c1' } as TextTrackCue],
    });

    const ccTrack = [...video.querySelectorAll('track')][0]!.track as unknown as FakeTextTrack;
    const before = ccTrack.addCueCalls;

    ccTrack.mode = 'showing';

    expect(ccTrack.addCueCalls).toBe(before + 1);
  });

  it('does not re-add the showing track cues on every forwarded cue batch', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, CC_TRACK_FOUND);

    const subs = [...video.querySelectorAll('track')].find((el) => el.id === 'default')!;
    const subsTrack = subs.track as unknown as FakeTextTrack;

    // The state in which the Chrome cue-refresh applies: hls.js is playing the very track that is showing.
    (engine as any).subtitleTracks = [{ lang: 'de', name: 'German', type: 'SUBTITLES', default: true }];
    (engine as any).subtitleTrack = 0;

    subsTrack.mode = 'showing';
    subsTrack.addCue({ id: 's1' } as TextTrackCue);

    const before = subsTrack.addCueCalls;

    // Three CEA-608 batches on the sibling track, each flipping its mode and so firing `change`.
    for (const id of ['c1', 'c2', 'c3']) {
      (engine as any).emit(Hls.Events.CUES_PARSED, {
        type: 'captions',
        track: 'textTrack1',
        cues: [{ id } as TextTrackCue],
      });
    }

    expect(subsTrack.addCueCalls).toBe(before);
  });

  it('takes the subtitle id from the index hls.js stamped on the playlist', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, {
      tracks: [{ label: 'German', kind: 'subtitles', default: false, subtitleTrack: { id: 2, lang: 'de' } }],
    });

    expect([...video.querySelectorAll('track[data-removeondestroy]')].map((el) => el.id)).toEqual(['subtitles2']);
  });

  it('refreshes a subtitle track the user switches to', () => {
    const { engine, video } = mount();

    (engine as any).subtitleTracks = [
      { lang: 'de', name: 'German', type: 'SUBTITLES', default: true },
      { lang: 'fr', name: 'French', type: 'SUBTITLES', default: false },
    ];
    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, {
      tracks: [
        ...SUBTITLE_TRACKS_FOUND.tracks,
        { label: 'French', kind: 'subtitles', default: false, subtitleTrack: { id: 1, lang: 'fr' } },
      ],
    });
    (engine as any).subtitleTrack = 0;
    (engine as any).emit(Hls.Events.CUES_PARSED, {
      type: 'subtitles',
      track: 'subtitles1',
      cues: [{ id: 'f1' } as TextTrackCue],
    });

    const french = trackOf(video, 'subtitles1') as unknown as FakeTextTrack;
    const before = french.addCueCalls;

    // Hls.js still has German selected when the user picks French, so the refresh has to run on this transition.
    french.mode = 'showing';

    expect((engine as any).subtitleTrack).toBe(1);
    expect(french.addCueCalls).toBe(before + 1);
  });

  it('renders the cues of a track that is turned off and back on', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);

    const track = trackOf(video, 'default') as unknown as FakeTextTrack;
    const toggle = (mode: TextTrackMode) => {
      track.mode = mode;
      video.textTracks.dispatchEvent(new Event('change'));
    };

    toggle('showing');
    track.addCue({ id: 'one' } as TextTrackCue);
    track.addCue({ id: 'two' } as TextTrackCue);

    toggle('disabled');
    expect(track.rendered.size).toBe(0);

    toggle('showing');
    expect(track.rendered.size).toBe(2);
  });

  it('refreshes the cues once per selection rather than on every change', () => {
    const { engine, video } = mount();

    (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);

    const track = trackOf(video, 'default') as unknown as FakeTextTrack;

    track.mode = 'showing';
    track.addCue({ id: 'one' } as TextTrackCue);
    video.textTracks.dispatchEvent(new Event('change'));

    const removeCue = vi.spyOn(track, 'removeCue');

    video.textTracks.dispatchEvent(new Event('change'));

    expect(removeCue).not.toHaveBeenCalled();
  });
});
