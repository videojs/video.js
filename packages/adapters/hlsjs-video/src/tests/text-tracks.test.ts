import { HTMLVideoAdapter } from '@videojs/media/dom';
import Hls from 'hls.js';
import { describe, expect, it, vi } from 'vite-plus/test';

import { HlsJsTextTracksMixin, removeHlsTextTracks, withPreservedTextTracks } from '../text-tracks';

/**
 * Jsdom has no text track implementation, so the media element and its tracks are stubbed with the parts the helper
 * touches: `cues` reads as `null` while a track is disabled, exactly as the spec requires.
 */
class FakeTextTrack {
  #mode: TextTrackMode = 'disabled';

  get mode(): TextTrackMode {
    return this.#mode;
  }

  set mode(value: TextTrackMode) {
    this.#mode = value;
  }
  #cues: TextTrackCue[] = [];

  get cues(): TextTrackCue[] | null {
    return this.mode === 'disabled' ? null : this.#cues;
  }

  addCue(cue: TextTrackCue) {
    this.#cues.push(cue);
  }

  /** Mirrors hls.js's `clearCurrentCues()`, which reads cues through `hidden`. */
  clearCues() {
    const { mode } = this;

    if (mode === 'disabled') this.mode = 'hidden';

    this.#cues = [];

    if (mode === 'disabled') this.mode = mode;
  }
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
 * Jsdom implements neither `HTMLTrackElement.track` nor a track list that dispatches events, so the mixin gets the
 * parts it reaches for: a track object per `<track>` element, and a list it can subscribe to.
 */
function stubTrackSupport(video: HTMLVideoElement): () => void {
  const tracks = new WeakMap<HTMLTrackElement, FakeTextTrack>();
  const descriptor = Object.getOwnPropertyDescriptor(HTMLTrackElement.prototype, 'track');

  Object.defineProperty(HTMLTrackElement.prototype, 'track', {
    configurable: true,
    get(this: HTMLTrackElement) {
      let track = tracks.get(this);

      if (!track) {
        track = new FakeTextTrack();
        tracks.set(this, track);
      }

      return track;
    },
  });

  Object.defineProperty(video, 'textTracks', {
    configurable: true,
    value: Object.assign(new EventTarget(), { getTrackById: () => null }),
  });

  return () => {
    if (descriptor) Object.defineProperty(HTMLTrackElement.prototype, 'track', descriptor);
    else Reflect.deleteProperty(HTMLTrackElement.prototype, 'track');
  };
}

function fakeEngine(): Hls {
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

/** One `#EXT-X-MEDIA:TYPE=SUBTITLES` rendition, shaped the way hls.js reports it. */
const SUBTITLE_TRACKS_FOUND = {
  tracks: [{ label: 'German', kind: 'subtitles', default: false, subtitleTrack: { lang: 'de' } }],
};

function hlsTracks(video: HTMLVideoElement): NodeListOf<HTMLTrackElement> {
  return video.querySelectorAll('track[data-removeondestroy]');
}

describe('HlsJsTextTracksMixin', () => {
  it('keeps the tracks of the current load when MEDIA_ATTACHED arrives after the manifest', () => {
    const engine = fakeEngine();
    const host = new TextTracksHost(engine);
    const video = document.createElement('video');
    const restore = stubTrackSupport(video);

    try {
      host.attach(video);

      (engine as any).emit(Hls.Events.MANIFEST_LOADING);
      (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
      expect(hlsTracks(video)).toHaveLength(1);

      (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

      expect(hlsTracks(video)).toHaveLength(1);
    } finally {
      restore();
    }
  });

  it('drops the tracks of the previous load when a new manifest reports none', () => {
    const engine = fakeEngine();
    const host = new TextTracksHost(engine);
    const video = document.createElement('video');
    const restore = stubTrackSupport(video);

    try {
      host.attach(video);

      (engine as any).emit(Hls.Events.MANIFEST_LOADING);
      (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
      expect(hlsTracks(video)).toHaveLength(1);

      (engine as any).emit(Hls.Events.MANIFEST_LOADING);

      expect(hlsTracks(video)).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('drops the tracks when the media detaches', () => {
    const engine = fakeEngine();
    const host = new TextTracksHost(engine);
    const video = document.createElement('video');
    const restore = stubTrackSupport(video);

    try {
      host.attach(video);

      (engine as any).emit(Hls.Events.MANIFEST_LOADING);
      (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
      expect(hlsTracks(video)).toHaveLength(1);

      (engine as any).emit(Hls.Events.MEDIA_DETACHED);

      expect(hlsTracks(video)).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('drops the tracks when the engine is destroyed', () => {
    const engine = fakeEngine();
    const host = new TextTracksHost(engine);
    const video = document.createElement('video');
    const restore = stubTrackSupport(video);

    try {
      host.attach(video);

      (engine as any).emit(Hls.Events.MANIFEST_LOADING);
      (engine as any).emit(Hls.Events.NON_NATIVE_TEXT_TRACKS_FOUND, SUBTITLE_TRACKS_FOUND);
      expect(hlsTracks(video)).toHaveLength(1);

      (engine as any).emit(Hls.Events.DESTROYING);

      expect(hlsTracks(video)).toHaveLength(0);
    } finally {
      restore();
    }
  });
});
