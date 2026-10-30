import { createStore } from '@videojs/store';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { textCuesFeature } from '../text-cues';

/**
 * Jsdom has no `VTTCue` and never populates `textTracks`, so tracks and cues are plain stand-ins. Tracks and the track
 * list are event targets so the feature's `cuechange` and `addtrack` listeners can be exercised.
 */

interface MockCue {
  id?: string;
  startTime: number;
  endTime: number;
  text?: string;
  value?: unknown;
  type?: string;
}

interface MockTrack extends EventTarget {
  id: string;
  kind: TextTrackKind;
  label: string;
  language: string;
  mode: TextTrackMode;
  cues: MockCue[] | null;
}

function createTrack(
  kind: TextTrackKind,
  options: { mode?: TextTrackMode; label?: string; language?: string; id?: string; cues?: MockCue[] } = {}
): MockTrack {
  return Object.assign(new EventTarget(), {
    id: options.id ?? '',
    kind,
    label: options.label ?? '',
    language: options.language ?? '',
    mode: options.mode ?? 'hidden',
    cues: options.cues ?? [],
  });
}

function setTracks(video: HTMLVideoElement, tracks: MockTrack[]): EventTarget {
  const list = Object.assign(new EventTarget(), { length: tracks.length }, tracks);

  Object.defineProperty(video, 'textTracks', { configurable: true, value: list });

  return list;
}

function setTime(video: HTMLVideoElement, currentTime: number, event = 'timeupdate'): void {
  Object.defineProperty(video, 'currentTime', { configurable: true, value: currentTime });
  video.dispatchEvent(new Event(event));
}

function setup(tracks: MockTrack[]) {
  const video = document.createElement('video');
  const list = setTracks(video, tracks);
  const store = createStore<PlayerTarget>()(textCuesFeature);

  Object.defineProperty(video, 'currentTime', { configurable: true, value: 0 });
  store.attach({ media: video, container: null });

  return { video, list, store };
}

describe('textCuesFeature', () => {
  it('reads metadata and chapters tracks that are not disabled', () => {
    const { store } = setup([
      createTrack('metadata', { label: 'ads', cues: [{ startTime: 0, endTime: 5, text: 'ad' }] }),
      createTrack('chapters', { label: 'chapters' }),
      createTrack('metadata', { label: 'off', mode: 'disabled' }),
      createTrack('metadata', { label: 'thumbnails' }),
      createTrack('captions', { label: 'English', mode: 'showing' }),
    ]);

    expect(store.state.textCues.map(({ track }) => track.label)).toEqual(['ads', 'chapters']);
    expect(store.state.textCues[0]).toEqual({
      track: {
        id: 'track:0:metadata::ads',
        kind: 'metadata',
        label: 'ads',
        language: '',
        mode: 'hidden',
        source: 'media',
      },
      cues: [{ id: '0-5', startTime: 0, endTime: 5, text: 'ad' }],
      activeCues: [{ id: '0-5', startTime: 0, endTime: 5, text: 'ad' }],
    });
  });

  it('reads JSON metadata as values', () => {
    const { store } = setup([
      createTrack('metadata', { cues: [{ startTime: 10, endTime: 20, text: '{"question":"Ready?"}' }] }),
    ]);

    expect(store.state.textCues[0]!.cues[0]!.value).toEqual({ question: 'Ready?' });
  });

  it('orders cues by start time', () => {
    const { store } = setup([
      createTrack('metadata', {
        cues: [
          { startTime: 20, endTime: 30, text: 'b' },
          { startTime: 0, endTime: 10, text: 'a' },
        ],
      }),
    ]);

    expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['a', 'b']);
  });

  describe('activeCues', () => {
    it('follows the current time', () => {
      const { video, store } = setup([
        createTrack('metadata', {
          cues: [
            { startTime: 0, endTime: 10, text: 'a' },
            { startTime: 5, endTime: 15, text: 'b' },
          ],
        }),
      ]);

      setTime(video, 7);
      expect(store.state.textCues[0]!.activeCues.map(({ text }) => text)).toEqual(['a', 'b']);

      setTime(video, 10);
      expect(store.state.textCues[0]!.activeCues.map(({ text }) => text)).toEqual(['b']);

      setTime(video, 15, 'seeked');
      expect(store.state.textCues[0]!.activeCues).toEqual([]);
    });

    it('keeps a point active for one second, and not after a seek past it', () => {
      const { video, store } = setup([
        createTrack('metadata', { cues: [{ startTime: 30, endTime: 30, text: 'point' }] }),
      ]);

      setTime(video, 30.5);
      expect(store.state.textCues[0]!.activeCues).toHaveLength(1);

      setTime(video, 31);
      expect(store.state.textCues[0]!.activeCues).toHaveLength(0);

      setTime(video, 0);
      setTime(video, 60, 'seeked');
      expect(store.state.textCues[0]!.activeCues).toHaveLength(0);
    });

    it('counts a cue playback passed between updates, and not one a seek jumped over', () => {
      const { video, store } = setup([
        createTrack('metadata', { cues: [{ startTime: 30, endTime: 30, text: 'point' }] }),
      ]);

      // Fast playback can move further between updates than a point stays active.
      setTime(video, 29.5);
      setTime(video, 32);
      expect(store.state.textCues[0]!.activeCues).toHaveLength(1);

      setTime(video, 34);
      expect(store.state.textCues[0]!.activeCues).toHaveLength(0);

      // A seek fires `seeking`, then `timeupdate`, then `seeked`.
      setTime(video, 29.5, 'seeked');
      setTime(video, 32, 'seeking');
      setTime(video, 32);
      setTime(video, 32, 'seeked');
      expect(store.state.textCues[0]!.activeCues).toHaveLength(0);
    });

    it('updates on cuechange', () => {
      const track = createTrack('metadata', { cues: [{ startTime: 1, endTime: 2, text: 'a' }] });
      const { video, store } = setup([track]);

      Object.defineProperty(video, 'currentTime', { configurable: true, value: 1 });
      track.dispatchEvent(new Event('cuechange'));

      expect(store.state.textCues[0]!.activeCues).toHaveLength(1);
    });

    it('does not notify while the active cues stay the same', async () => {
      const { video, store } = setup([createTrack('metadata', { cues: [{ startTime: 0, endTime: 10, text: 'a' }] })]);
      const listener = vi.fn();

      // Store notifications flush in a microtask; let the one from attaching pass first.
      await Promise.resolve();
      store.subscribe(listener);
      setTime(video, 1);
      setTime(video, 2);
      await Promise.resolve();

      expect(listener).not.toHaveBeenCalled();

      setTime(video, 11);
      await Promise.resolve();

      expect(listener).toHaveBeenCalledOnce();

      // Nothing active is the same as before, too.
      setTime(video, 12);
      await Promise.resolve();

      expect(listener).toHaveBeenCalledOnce();
    });
  });

  describe('cue lists', () => {
    it('picks up cues an engine appends without an event', () => {
      const track = createTrack('metadata', { cues: [{ startTime: 0, endTime: 5, text: 'a' }] });
      const { video, store } = setup([track]);

      track.cues!.push({ startTime: 5, endTime: 10, text: 'b' });
      setTime(video, 6);

      expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['a', 'b']);
      expect(store.state.textCues[0]!.activeCues.map(({ text }) => text)).toEqual(['b']);
    });

    it('picks up a cue an engine changes in place', () => {
      const cue = { startTime: 0, endTime: 100, text: 'a' };
      const track = createTrack('metadata', { cues: [cue] });
      const { video, store } = setup([track]);

      cue.endTime = 5;
      Object.defineProperty(video, 'currentTime', { configurable: true, value: 6 });
      track.dispatchEvent(new Event('cuechange'));

      expect(store.state.textCues[0]!.cues[0]!.endTime).toBe(5);
      expect(store.state.textCues[0]!.activeCues).toEqual([]);
    });

    it('picks up a cue an engine swaps for another without an event', () => {
      const track = createTrack('metadata', {
        cues: [
          { startTime: 0, endTime: 5, text: 'a' },
          { startTime: 5, endTime: 10, text: 'b' },
        ],
      });
      const { video, store } = setup([track]);

      track.cues!.shift();
      track.cues!.push({ startTime: 10, endTime: 15, text: 'c' });
      setTime(video, 11, 'seeked');

      expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['b', 'c']);
      expect(store.state.textCues[0]!.activeCues.map(({ text }) => text)).toEqual(['c']);
    });

    it('keeps cue identity across syncs that change nothing', () => {
      const { video, store } = setup([
        createTrack('metadata', { cues: [{ startTime: 0, endTime: 5, text: '{"id":1}' }] }),
      ]);
      const before = store.state.textCues;

      video.dispatchEvent(new Event('loadstart'));

      expect(store.state.textCues).toBe(before);
    });

    it('re-reads tracks as they are added', () => {
      const tracks = [createTrack('metadata', { label: 'a' })];
      const { video, list, store } = setup(tracks);

      setTracks(video, [...tracks, createTrack('metadata', { label: 'b' })]);
      list.dispatchEvent(new Event('addtrack'));

      // The list was replaced, so listen on the media for the re-read.
      video.dispatchEvent(new Event('loadstart'));

      expect(store.state.textCues.map(({ track }) => track.label)).toEqual(['a', 'b']);
    });

    it('clamps cue ends to the media duration', () => {
      const { video, store } = setup([
        createTrack('chapters', { cues: [{ startTime: 0, endTime: Number.MAX_SAFE_INTEGER, text: 'all' }] }),
      ]);

      Object.defineProperty(video, 'duration', { configurable: true, value: 42 });
      video.dispatchEvent(new Event('durationchange'));

      expect(store.state.textCues[0]!.cues[0]!.endTime).toBe(42);
    });
  });

  describe('watchTextCues', () => {
    it('reads more tracks until stopped', () => {
      const { store } = setup([createTrack('captions', { label: 'English', language: 'en', mode: 'showing' })]);

      expect(store.state.textCues).toEqual([]);

      const stop = store.watchTextCues({ kind: ['captions', 'subtitles'], language: 'en' });

      expect(store.state.textCues.map(({ track }) => track.kind)).toEqual(['captions']);

      stop();

      expect(store.state.textCues).toEqual([]);
    });

    it('takes a function filter', () => {
      const { store } = setup([createTrack('subtitles', { label: 'Deutsch' })]);

      store.watchTextCues((track) => track.label === 'Deutsch');

      expect(store.state.textCues).toHaveLength(1);
    });

    it('keeps reading for each watcher until every one stops', () => {
      const { store } = setup([createTrack('captions')]);
      const filter = { kind: 'captions' } as const;
      const stopA = store.watchTextCues(filter);
      const stopB = store.watchTextCues(filter);

      stopA();
      stopA();
      expect(store.state.textCues).toHaveLength(1);

      stopB();
      expect(store.state.textCues).toHaveLength(0);
    });

    it('applies filters added before the store attaches, and across a detach', () => {
      const video = document.createElement('video');

      setTracks(video, [createTrack('captions')]);

      const store = createStore<PlayerTarget>()(textCuesFeature);

      store.watchTextCues({ kind: 'captions' });

      const detach = store.attach({ media: video, container: null });

      expect(store.state.textCues).toHaveLength(1);

      detach();
      expect(store.state.textCues).toEqual([]);

      store.attach({ media: video, container: null });
      expect(store.state.textCues).toHaveLength(1);
    });
  });

  it('stays empty for media without text tracks', () => {
    const store = createStore<PlayerTarget>()(textCuesFeature);

    store.attach({ media: new EventTarget() as PlayerTarget['media'], container: null });

    expect(store.state.textCues).toEqual([]);
  });
});
