import { HTMLVideoAdapter } from '@videojs/media/dom';
import { MediaTracksMixin } from '@videojs/media/media-tracks';
import Hls from 'hls.js';
import { describe, expect, it } from 'vite-plus/test';

import { HlsJsMediaTracksMixin } from '../media-tracks';

class FakeHost extends HTMLVideoAdapter {
  engine: Hls | null;

  constructor(engine: Hls | null = null) {
    super();
    this.engine = engine;
  }
}

const HlsJsMediaTracks = HlsJsMediaTracksMixin(MediaTracksMixin(FakeHost));

function createEngine(): Hls {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  const engine = {
    audioTracks: [{ id: 0 }, { id: 1 }],
    audioTrack: 0,
    manualLevel: -1,
    // Level of the fragment buffered after the playing one, or -1 if none.
    bufferedLevel: -1,
    nextLevelWrites: [] as number[],
    // Mirrors hls.js: the getter reports buffer state, the setter sets the selection.
    get nextLevel(): number {
      return engine.bufferedLevel;
    },
    set nextLevel(level: number) {
      engine.manualLevel = level;
      engine.nextLevelWrites.push(level);
    },
    on(event: string, fn: (...args: any[]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());

      listeners.get(event)!.add(fn);
    },
    once(event: string, fn: (...args: any[]) => void) {
      const wrapped = (...args: any[]) => {
        listeners.get(event)?.delete(wrapped);
        fn(...args);
      };

      if (!listeners.has(event)) listeners.set(event, new Set());

      listeners.get(event)!.add(wrapped);
    },
    off(event: string, fn: (...args: any[]) => void) {
      listeners.get(event)?.delete(fn);
    },
    emit(event: string, ...args: any[]) {
      for (const fn of [...(listeners.get(event) ?? [])]) fn(event, ...args);
    },
  };

  return engine as unknown as Hls;
}

const manifestParsed = (engine: Hls, levels: Array<Record<string, unknown>>) =>
  (engine as any).emit(Hls.Events.MANIFEST_PARSED, { levels });

const audioTracksUpdated = (engine: Hls, audioTracks: Array<Record<string, unknown>>) =>
  (engine as any).emit(Hls.Events.AUDIO_TRACKS_UPDATED, { audioTracks });

const audioTrackSwitching = (engine: Hls, audioTrack: Record<string, unknown>) =>
  (engine as any).emit(Hls.Events.AUDIO_TRACK_SWITCHING, audioTrack);

const audioTrackSwitched = (engine: Hls, audioTrack: Record<string, unknown>) =>
  (engine as any).emit(Hls.Events.AUDIO_TRACK_SWITCHED, audioTrack);

function flush() {
  return Promise.resolve();
}

describe('HlsJsMediaTracksMixin', () => {
  it('mirrors manifest levels into a selected video track with renditions', () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    manifestParsed(engine, [
      { url: ['high.m3u8'], width: 1920, height: 1080, videoCodec: 'avc1', bitrate: 6_000_000 },
      { url: ['low.m3u8'], width: 640, height: 360, videoCodec: 'avc1', bitrate: 800_000 },
    ]);

    expect(host.videoTracks.length).toBe(1);
    expect(host.videoTracks[0]?.selected).toBe(true);
    expect(host.videoRenditions.length).toBe(2);
    expect([...host.videoRenditions].map((rendition) => rendition.id)).toEqual(['0', '1']);
    expect([...host.videoRenditions].map((rendition) => rendition.height)).toEqual([1080, 360]);
  });

  it('mirrors alternate audio tracks', () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    audioTracksUpdated(engine, [
      { id: 0, default: true, name: 'English', lang: 'en' },
      { id: 1, name: 'Spanish', lang: 'es' },
    ]);

    expect(host.audioTracks.length).toBe(2);
    expect([...host.audioTracks].map((track) => track.id)).toEqual(['0', '1']);
    expect([...host.audioTracks].map((track) => track.kind)).toEqual(['main', 'alternative']);
    expect([...host.audioTracks].map((track) => track.label)).toEqual(['English', 'Spanish']);
    expect([...host.audioTracks].map((track) => track.language)).toEqual(['en', 'es']);
  });

  it('enables the audio track announced by the engine', () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    audioTracksUpdated(engine, [
      { id: 0, default: true, name: 'English', lang: 'en' },
      { id: 1, name: 'Spanish', lang: 'es' },
    ]);
    audioTrackSwitching(engine, { id: 0, default: true, name: 'English', lang: 'en' });

    expect([...host.audioTracks].map((track) => track.enabled)).toEqual([true, false]);

    // hls.js can pick a non-default track on its own (e.g. `audioPreference`).
    audioTrackSwitched(engine, { id: 1, name: 'Spanish', lang: 'es' });

    expect([...host.audioTracks].map((track) => track.enabled)).toEqual([false, true]);
  });

  it('forwards a rendition selection to engine.nextLevel', async () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    manifestParsed(engine, [{ url: ['a'] }, { url: ['b'] }, { url: ['c'] }]);

    host.videoRenditions.selectedIndex = 2;
    await flush();

    expect(engine.manualLevel).toBe(2);
  });

  it('restores auto level selection when nothing is buffered ahead', async () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    manifestParsed(engine, [{ url: ['a'] }, { url: ['b'] }, { url: ['c'] }]);

    host.videoRenditions.selectedIndex = 2;
    await flush();

    // Stalled: no fragment is buffered after the playing one.
    (engine as any).bufferedLevel = -1;
    host.videoRenditions.selectedIndex = -1;
    await flush();

    expect(engine.manualLevel).toBe(-1);
  });

  it('applies a manual selection that matches the next buffered level', async () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    manifestParsed(engine, [{ url: ['a'] }, { url: ['b'] }, { url: ['c'] }]);

    // Auto mode has already buffered the next fragment at level 1.
    (engine as any).bufferedLevel = 1;
    host.videoRenditions.selectedIndex = 1;
    await flush();

    expect(engine.manualLevel).toBe(1);
  });

  it('skips the engine write when the selection is unchanged', async () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    manifestParsed(engine, [{ url: ['a'] }, { url: ['b'] }, { url: ['c'] }]);

    host.videoRenditions.selectedIndex = 2;
    await flush();

    // Selection changes back and forth within one tick, so `change` fires with the original value.
    host.videoRenditions.selectedIndex = 1;
    host.videoRenditions.selectedIndex = 2;
    await flush();

    expect((engine as any).nextLevelWrites).toEqual([2]);
  });

  it('marks the active rendition from LEVEL_SWITCHED', () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    manifestParsed(engine, [{ url: ['a'] }, { url: ['b'] }, { url: ['c'] }]);

    (engine as any).emit(Hls.Events.LEVEL_SWITCHED, { level: 1 });

    expect([...host.videoRenditions].map((rendition) => rendition.active)).toEqual([false, true, false]);
    expect(engine.manualLevel).toBe(-1);
  });

  it('forwards an audio track selection to engine.audioTrack', async () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    audioTracksUpdated(engine, [
      { id: 0, default: true, name: 'English', lang: 'en' },
      { id: 1, name: 'Spanish', lang: 'es' },
    ]);

    const [english, spanish] = [...host.audioTracks];

    english!.enabled = false;
    spanish!.enabled = true;
    await flush();

    expect(engine.audioTrack).toBe(1);
  });

  it('prunes renditions when LEVELS_UPDATED carries new level object references', () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    const levels = [{ url: ['a'] }, { url: ['b'] }, { url: ['c'] }];

    manifestParsed(engine, levels);
    expect(host.videoRenditions.length).toBe(3);

    (engine as any).emit(Hls.Events.LEVELS_UPDATED, { levels: [{ ...levels[0] }, { ...levels[2] }] });

    expect([...host.videoRenditions].map((rendition) => rendition.id)).toEqual(['0', '2']);
  });

  it('switches to the newly enabled audio track when multiple are enabled', async () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    audioTracksUpdated(engine, [
      { id: 0, default: true, name: 'English', lang: 'en' },
      { id: 1, name: 'Spanish', lang: 'es' },
    ]);

    const [english, spanish] = [...host.audioTracks];

    // Enable without disabling the current track first.
    spanish!.enabled = true;
    await flush();

    expect(engine.audioTrack).toBe(1);
    expect(english!.enabled).toBe(false);
    expect(spanish!.enabled).toBe(true);
  });

  it('keeps the audio selection when a group switch re-emits the same track set', async () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    const audioTracks = [
      { id: 0, default: true, name: 'English', lang: 'en' },
      { id: 1, name: 'Spanish', lang: 'es' },
    ];

    audioTracksUpdated(engine, audioTracks);
    audioTrackSwitching(engine, audioTracks[0]!);

    const [english, spanish] = [...host.audioTracks];

    english!.enabled = false;
    spanish!.enabled = true;
    await flush();
    expect(engine.audioTrack).toBe(1);

    // A rendition switch moves to another audio group: hls.js clears its
    // selection, re-announces the same languages, then re-applies the match.
    (engine as any).audioTrack = -1;
    audioTracksUpdated(
      engine,
      audioTracks.map((audioTrack) => ({ ...audioTrack }))
    );
    expect(host.audioTracks[0]).toBe(english);
    expect(host.audioTracks[1]).toBe(spanish);
    expect(spanish!.enabled).toBe(true);

    (engine as any).audioTrack = 1;
    audioTrackSwitching(engine, audioTracks[1]!);
    await flush();

    expect([...host.audioTracks].map((track) => track.enabled)).toEqual([false, true]);
    expect(engine.audioTrack).toBe(1);
  });

  it('rebuilds the audio track list when the track set changes', () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    audioTracksUpdated(engine, [
      { id: 0, default: true, name: 'English', lang: 'en' },
      { id: 1, name: 'Spanish', lang: 'es' },
    ]);

    audioTracksUpdated(engine, [
      { id: 0, default: true, name: 'English', lang: 'en' },
      { id: 1, name: 'French', lang: 'fr' },
    ]);

    expect(host.audioTracks.length).toBe(2);
    expect([...host.audioTracks].map((track) => track.label)).toEqual(['English', 'French']);
  });

  it('clears all media tracks on DESTROYING', () => {
    const engine = createEngine();
    const host = new HlsJsMediaTracks(engine);

    manifestParsed(engine, [{ url: ['a'] }]);
    audioTracksUpdated(engine, [{ id: 0, default: true }]);
    expect(host.videoTracks.length).toBe(1);
    expect(host.audioTracks.length).toBe(1);

    (engine as any).emit(Hls.Events.DESTROYING);

    expect(host.videoTracks.length).toBe(0);
    expect(host.audioTracks.length).toBe(0);
  });
});
