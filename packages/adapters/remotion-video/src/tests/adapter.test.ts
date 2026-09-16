import type { PlayerRef } from '@remotion/player';
import { MediaReadyState } from '@videojs/media';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { RemotionAdapter, type RemotionComposition, type RemotionSource, resolveChapterSpans } from '..';

type Listener = (data: { detail: unknown }) => void;

/** The `PlayerRef` surface the adapter touches, plus `emit` to drive Remotion's side of the contract. */
class MockPlayer {
  listeners = new Map<string, Set<Listener>>();
  frame = 0;
  playing = false;
  muted = false;
  volume = 1;

  play = vi.fn(() => {
    this.playing = true;
    this.emit('play');
  });
  pause = vi.fn(() => {
    this.playing = false;
    this.emit('pause');
  });
  seekTo = vi.fn((frame: number) => {
    this.frame = frame;
  });
  getCurrentFrame = vi.fn(() => this.frame);
  isPlaying = vi.fn(() => this.playing);
  isMuted = vi.fn(() => this.muted);
  getVolume = vi.fn(() => this.volume);
  setVolume = vi.fn((volume: number) => {
    this.volume = volume;
    this.emit('volumechange', { volume });
  });
  mute = vi.fn(() => {
    this.muted = true;
    this.emit('mutechange', { isMuted: true });
  });
  unmute = vi.fn(() => {
    this.muted = false;
    this.emit('mutechange', { isMuted: false });
  });

  addEventListener(type: string, listener: Listener) {
    let set = this.listeners.get(type);

    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }

    set.add(listener);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string, detail: unknown = undefined) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) listener({ detail });
  }

  asRef() {
    return this as unknown as PlayerRef;
  }
}

const Composition = () => null;

type SourceOverrides = Partial<Omit<RemotionSource, 'composition'>> & { composition?: Partial<RemotionComposition> };

function createSource({ composition, ...overrides }: SourceOverrides = {}): RemotionSource {
  return {
    id: 'greeting',
    composition: {
      component: Composition,
      durationInFrames: 150,
      fps: 30,
      compositionWidth: 1920,
      compositionHeight: 1080,
      ...composition,
    },
    ...overrides,
  };
}

/** Collect every media event the adapter dispatches, in order. */
function recordEvents(media: RemotionAdapter, types: string[]) {
  const seen: string[] = [];

  for (const type of types) media.addEventListener(type, () => seen.push(type));

  return seen;
}

describe('RemotionAdapter', () => {
  let media: RemotionAdapter;
  let player: MockPlayer;

  beforeEach(() => {
    media = new RemotionAdapter();
    player = new MockPlayer();
  });

  describe('source', () => {
    it('derives src and duration from the composition', () => {
      media.source = createSource();

      expect(media.src).toBe('remotion:greeting');
      expect(media.currentSrc).toBe('remotion:greeting');
      expect(media.duration).toBe(5);
      expect(media.videoWidth).toBe(1920);
      expect(media.videoHeight).toBe(1080);
    });

    it('reports no duration without a source', () => {
      expect(media.src).toBe('');
      expect(media.duration).toBeNaN();
    });

    it('treats new input props on the same composition as a live update, not a new source', () => {
      const source = createSource();

      media.source = source;

      const seen = recordEvents(media, ['sourcechange', 'emptied']);

      media.source = { ...source, composition: { ...source.composition, inputProps: { name: 'Ada' } } };

      expect(seen).toEqual([]);
      expect(media.source?.composition.inputProps).toEqual({ name: 'Ada' });
    });

    it('treats a different id as a new source', () => {
      media.source = createSource();

      const seen = recordEvents(media, ['sourcechange', 'emptied', 'loadstart']);

      media.source = createSource({ id: 'outro', composition: { durationInFrames: 60 } });

      expect(seen).toEqual(['sourcechange', 'emptied', 'loadstart']);
    });

    it('keeps the same source when only the composition changes, and re-reports the duration', () => {
      media.source = createSource();

      const seen = recordEvents(media, ['sourcechange', 'emptied', 'durationchange']);

      media.source = createSource({ composition: { durationInFrames: 60 } });

      // `id` names the source, so a mounted Player keeps playing and takes the rest as props.
      expect(seen).toEqual(['durationchange']);
      expect(media.duration).toBe(2);
    });

    it('does not reload when an equal chapters array is rebuilt, as an inline one is on every render', () => {
      const chapters = () => [{ title: 'Intro', from: 0 }];

      media.source = createSource({ chapters: chapters() });

      const seen = recordEvents(media, ['sourcechange', 'emptied']);

      media.source = createSource({ chapters: chapters() });

      expect(seen).toEqual([]);
    });

    it('only claims its own content type', () => {
      expect(media.canPlayType('video/remotion')).toBe('probably');
      expect(media.canPlayType('video/mp4')).toBe('');
    });
  });

  describe('attach', () => {
    it('announces readiness and mirrors what the mounted player already holds', () => {
      media.source = createSource();
      player.muted = true;
      player.frame = 30;

      const seen = recordEvents(media, ['loadedmetadata', 'durationchange', 'loadeddata', 'canplay', 'canplaythrough']);

      media.attach(player.asRef());

      expect(seen).toEqual(['loadedmetadata', 'durationchange', 'loadeddata', 'canplay', 'canplaythrough']);
      expect(media.readyState).toBe(MediaReadyState.HAVE_ENOUGH_DATA);
      expect(media.muted).toBe(true);
      expect(media.currentTime).toBe(1);
    });

    it('unbinds player events on detach', () => {
      media.source = createSource();
      media.attach(player.asRef());
      media.detach();

      const seen = recordEvents(media, ['play']);

      player.emit('play');

      expect(seen).toEqual([]);
      expect(media.readyState).toBe(MediaReadyState.HAVE_NOTHING);
    });
  });

  describe('currentTime', () => {
    beforeEach(() => {
      media.source = createSource();
      media.attach(player.asRef());
    });

    it('snaps a seek to the nearest frame', () => {
      media.currentTime = 1.02;

      expect(player.seekTo).toHaveBeenCalledWith(31);
      expect(media.currentTime).toBeCloseTo(31 / 30);
    });

    it('clamps a seek past the end to the last frame', () => {
      media.currentTime = 99;

      expect(player.seekTo).toHaveBeenCalledWith(149);
    });

    it('emits seeking, then seeked once Remotion answers', () => {
      const seen = recordEvents(media, ['seeking', 'timeupdate', 'seeked']);

      media.currentTime = 1;

      expect(seen).toEqual(['seeking']);
      expect(media.seeking).toBe(true);

      player.emit('seeked', { frame: 30 });

      expect(seen).toEqual(['seeking', 'timeupdate', 'seeked']);
      expect(media.seeking).toBe(false);
    });

    it('finishes a seek Remotion only reports as a frame update', () => {
      media.currentTime = 1;

      const seen = recordEvents(media, ['seeked']);

      player.emit('frameupdate', { frame: 30 });

      expect(seen).toEqual(['seeked']);
    });

    it('swallows the pause and play Remotion emits around a seek while playing', () => {
      player.play();

      const seen = recordEvents(media, ['pause', 'play']);

      media.currentTime = 1;
      // Remotion pauses, seeks, then resumes in an effect.
      player.emit('pause');
      player.emit('play');

      expect(seen).toEqual([]);
      expect(media.paused).toBe(false);
    });

    it('ignores a repeat seek to the frame already in flight', () => {
      player.play();
      media.currentTime = 1;
      media.currentTime = 1;

      const seen = recordEvents(media, ['pause', 'play']);

      // One seek, so one pause/play pair is owed. A second debt would eat this real pause.
      player.emit('pause');
      player.emit('play');
      player.emit('pause');

      expect(seen).toEqual(['pause']);
    });

    it('does not swallow a deliberate play', () => {
      player.play();
      media.currentTime = 1;

      const seen = recordEvents(media, ['play']);

      void media.play();

      expect(seen).toEqual(['play']);
    });
  });

  describe('autoplay', () => {
    it('arms autoplay when play lands before a Player mounts', () => {
      media.source = createSource();
      void media.play();

      expect(media.autoplay).toBe(true);
    });

    it('disarms it again when pause lands before a Player mounts', () => {
      media.source = createSource();
      void media.play();
      media.pause();

      expect(media.autoplay).toBe(false);
    });
  });

  describe('load', () => {
    it('takes an attached Player back to a paused first frame', () => {
      media.source = createSource();
      media.attach(player.asRef());
      player.play();
      player.frame = 90;

      void media.load();

      expect(player.pause).toHaveBeenCalled();
      expect(player.seekTo).toHaveBeenCalledWith(0);
      expect(media.currentTime).toBe(0);
      expect(media.paused).toBe(true);
    });
  });

  describe('ended', () => {
    beforeEach(() => {
      media.source = createSource();
      media.attach(player.asRef());
    });

    it('finishes an in-flight seek and clears the swallow debt', () => {
      player.playing = true;
      media.currentTime = 4;

      const seen = recordEvents(media, ['seeked', 'ended', 'pause', 'play']);

      player.emit('ended');
      // The pause Remotion would have emitted around the seek must not be swallowed after ending.
      player.emit('pause');

      expect(seen).toEqual(['seeked', 'ended', 'pause']);
      expect(media.ended).toBe(true);
      expect(media.paused).toBe(true);
    });

    it('clears on a seek away from the end', () => {
      player.emit('ended');
      media.currentTime = 1;

      expect(media.ended).toBe(false);
    });
  });

  describe('buffering', () => {
    beforeEach(() => {
      media.source = createSource();
      media.attach(player.asRef());
    });

    it('lowers and restores readyState around a stall', () => {
      player.emit('waiting', {});

      expect(media.readyState).toBe(MediaReadyState.HAVE_CURRENT_DATA);

      player.emit('resume', {});

      expect(media.readyState).toBe(MediaReadyState.HAVE_ENOUGH_DATA);
    });

    it('holds back playing until the stall resolves', () => {
      player.emit('waiting', {});

      const seen = recordEvents(media, ['play', 'playing']);

      player.play();

      expect(seen).toEqual(['play']);

      player.emit('resume', {});

      expect(seen).toEqual(['play', 'playing']);
    });
  });

  describe('player props', () => {
    it('routes volume and muted through the player once attached', () => {
      media.source = createSource();
      media.attach(player.asRef());

      media.volume = 0.5;
      media.muted = true;

      expect(player.setVolume).toHaveBeenCalledWith(0.5);
      expect(player.mute).toHaveBeenCalled();
      expect(media.volume).toBe(0.5);
      expect(media.muted).toBe(true);
    });

    it('carries values Remotion only takes as props to the subscriber', () => {
      const listener = vi.fn();

      media.subscribePlayerProps(listener);
      media.source = createSource();
      media.playbackRate = 2;
      media.loop = true;
      media.muted = true;

      expect(listener).toHaveBeenCalledTimes(4);
      expect(media.getPlayerProps()).toMatchObject({
        loop: true,
        playbackRate: 2,
        initiallyMuted: true,
        initialVolume: 1,
      });
    });

    it('reports the rate optimistically and waits for Remotion to confirm it', () => {
      media.source = createSource();
      media.attach(player.asRef());

      const seen = recordEvents(media, ['ratechange']);

      media.playbackRate = 2;

      expect(media.playbackRate).toBe(2);
      expect(seen).toEqual([]);

      player.emit('ratechange', { playbackRate: 2 });

      expect(seen).toEqual(['ratechange']);
    });
  });

  describe('ranges', () => {
    it('reports the whole composition as seekable, and as buffered once mounted', () => {
      media.source = createSource();

      expect(media.seekable.length).toBe(1);
      expect(media.seekable.end(0)).toBe(5);
      expect(media.buffered.length).toBe(0);

      media.attach(player.asRef());

      expect(media.buffered.length).toBe(1);
      expect(media.buffered.end(0)).toBe(5);
    });
  });

  describe('text tracks', () => {
    // jsdom implements `addTextTrack` as a no-op that never populates `textTracks`, so what a real host would publish
    // is covered by `resolveChapterSpans`. Here only the fallback matters.
    it('reports an empty list and stays silent where the host cannot carry tracks', () => {
      expect(() => {
        media.source = createSource({
          chapters: [{ title: 'Intro', from: 0 }],
          subtitles: { label: 'English', language: 'en', cues: [{ text: 'Hello', startMs: 0, endMs: 1000 }] },
        });
      }).not.toThrow();

      expect(media.textTracks.length).toBe(0);
    });
  });
});

describe('resolveChapterSpans', () => {
  it('fills each scene up to the next one', () => {
    const spans = resolveChapterSpans(
      createSource({
        chapters: [
          { title: 'Intro', from: 0 },
          { title: 'Body', from: 60 },
        ],
      })
    );

    expect(spans).toEqual([
      { title: 'Intro', startTime: 0, endTime: 2 },
      { title: 'Body', startTime: 2, endTime: 5 },
    ]);
  });

  it('honors an explicit chapter duration', () => {
    const spans = resolveChapterSpans(createSource({ chapters: [{ title: 'Sting', from: 0, durationInFrames: 30 }] }));

    expect(spans).toEqual([{ title: 'Sting', startTime: 0, endTime: 1 }]);
  });

  it('orders chapters by frame regardless of how they were listed', () => {
    const spans = resolveChapterSpans(
      createSource({
        chapters: [
          { title: 'Body', from: 60 },
          { title: 'Intro', from: 0 },
        ],
      })
    );

    expect(spans.map((span) => span.title)).toEqual(['Intro', 'Body']);
  });

  it('honors an explicit zero-length chapter rather than filling to the next', () => {
    const spans = resolveChapterSpans(
      createSource({
        chapters: [
          { title: 'Marker', from: 30, durationInFrames: 0 },
          { title: 'Body', from: 60 },
        ],
      })
    );

    expect(spans[0]).toEqual({ title: 'Marker', startTime: 1, endTime: 1 });
  });

  it('is empty for a composition without chapters', () => {
    expect(resolveChapterSpans(createSource())).toEqual([]);
  });
});
