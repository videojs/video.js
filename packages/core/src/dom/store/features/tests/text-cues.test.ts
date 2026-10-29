import { combine, createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { podcastChapters } from '../../../../core/text-track/chapters';
import { defineTextTrack } from '../../../../core/text-track/definition';
import type { PlayerTarget } from '../../../player';
import { textCuesFeature } from '../text-cues';
import { textTrackFeature } from '../text-track';

vi.mock('../../parse-vtt', () => ({
  parseVtt: vi.fn(async (text: string) => [{ id: 'vtt', startTime: 0, endTime: 5, text: text.split('\n').at(-1) }]),
}));

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

function setSrc(video: HTMLVideoElement, src: string): void {
  Object.defineProperty(video, 'currentSrc', { configurable: true, value: src });
  video.dispatchEvent(new Event('loadstart'));
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
      setTime(video, 11);

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

  describe('addTextTrack', () => {
    const cues = [
      { startTime: 0, endTime: 10, value: { question: 'One?' } },
      { startTime: 30, value: { question: 'Point?' } },
    ];

    it("adds a track whose cues are read like the media's", () => {
      const { video, store } = setup([]);
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz', cues });
      const [entry] = store.state.textCues;

      expect(entry!.track).toEqual({
        id: quiz.id,
        kind: 'metadata',
        label: 'quiz',
        language: '',
        mode: 'hidden',
        source: 'app',
      });
      expect(entry!.cues.map(({ value }) => value)).toEqual([{ question: 'One?' }, { question: 'Point?' }]);
      expect(entry!.activeCues).toHaveLength(1);

      setTime(video, 30.5);
      expect(store.state.textCues[0]!.activeCues.map(({ value }) => value)).toEqual([{ question: 'Point?' }]);
    });

    it('keeps a point as a cue that ends where it starts', () => {
      const { store } = setup([]);

      store.addTextTrack({ kind: 'metadata', cues: [{ startTime: 5 }] });

      expect(store.state.textCues[0]!.cues[0]).toMatchObject({ startTime: 5, endTime: 5, text: '' });
    });

    it('adds and removes cues through the returned track', () => {
      const { store } = setup([]);
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      quiz.addCue({ id: 'b', startTime: 20, endTime: 25 });
      quiz.addCue({ id: 'a', startTime: 10, endTime: 15 });

      expect(store.state.textCues[0]!.cues.map(({ id }) => id)).toEqual(['a', 'b']);

      quiz.removeCue('a');

      expect(store.state.textCues[0]!.cues.map(({ id }) => id)).toEqual(['b']);
    });

    it('removes the track', () => {
      const { store } = setup([]);
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });
      const ads = store.addTextTrack({ kind: 'metadata', label: 'ads' });

      expect(quiz.removed).toBe(false);

      quiz.remove();
      store.removeTextTrack(ads.id);

      expect(quiz.removed).toBe(true);
      expect(ads.removed).toBe(true);
      expect(store.state.textCues).toEqual([]);
    });

    it('leaves media tracks alone', () => {
      const { store } = setup([createTrack('metadata', { id: 'ads' })]);

      store.removeTextTrack('ads');

      expect(store.state.textCues).toHaveLength(1);
    });

    it('takes a track definition', () => {
      const quizTrack = defineTextTrack<{ question: string }>({ kind: 'metadata', label: 'quiz' });
      const { store } = setup([]);

      store.addTextTrack(quizTrack, { cues: [{ startTime: 0, value: { question: 'Ready?' } }] });

      expect(store.state.textCues[0]!.track.label).toBe('quiz');
      expect(store.state.textCues[0]!.cues[0]!.value).toEqual({ question: 'Ready?' });
    });

    it('records tracks added before the store attaches', () => {
      const video = document.createElement('video');
      const store = createStore<PlayerTarget>()(textCuesFeature);

      setTracks(video, []);
      store.addTextTrack({ kind: 'metadata', label: 'quiz', cues });
      store.attach({ media: video, container: null });

      expect(store.state.textCues.map(({ track }) => track.label)).toEqual(['quiz']);
    });

    it('clears tracks when the source changes, keeping them through the first source', () => {
      const { video, store } = setup([]);
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      setSrc(video, 'https://example.com/one.mp4');
      expect(quiz.removed).toBe(false);

      setSrc(video, 'https://example.com/one.mp4');
      expect(quiz.removed).toBe(false);

      setSrc(video, 'https://example.com/two.mp4');
      expect(quiz.removed).toBe(true);
      expect(store.state.textCues).toEqual([]);
    });

    it('keeps tracks through a re-attach to the same media', () => {
      const video = document.createElement('video');
      const store = createStore<PlayerTarget>()(textCuesFeature);

      setTracks(video, []);
      Object.defineProperty(video, 'currentSrc', { configurable: true, value: 'https://example.com/one.mp4' });

      const detach = store.attach({ media: video, container: null });
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      // A container change or an extension re-attaches the store to the same media.
      detach();
      expect(quiz.removed).toBe(false);

      store.attach({ media: video, container: document.createElement('div') });

      expect(quiz.removed).toBe(false);
      expect(store.state.textCues.map(({ track }) => track.label)).toEqual(['quiz']);
    });

    it('clears tracks from the last source when the media is swapped', () => {
      const first = document.createElement('video');
      const second = document.createElement('video');
      const store = createStore<PlayerTarget>()(textCuesFeature);

      setTracks(first, []);
      setTracks(second, []);

      const early = store.addTextTrack({ kind: 'metadata', label: 'early' });

      Object.defineProperty(first, 'currentSrc', { configurable: true, value: 'https://example.com/one.mp4' });

      const detach = store.attach({ media: first, container: null });
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      detach();
      // The early track adopted the first media's source, so it goes with it too.
      store.attach({ media: second, container: null });

      expect(quiz.removed).toBe(true);
      expect(early.removed).toBe(true);
    });

    it('keeps a track added before any source through a media swap', () => {
      const first = document.createElement('video');
      const second = document.createElement('video');
      const store = createStore<PlayerTarget>()(textCuesFeature);

      setTracks(first, []);
      setTracks(second, []);

      const detach = store.attach({ media: first, container: null });
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      detach();
      store.attach({ media: second, container: null });

      expect(quiz.removed).toBe(false);
    });

    it('removes a track while the store is detached', () => {
      const video = document.createElement('video');
      const store = createStore<PlayerTarget>()(textCuesFeature);

      setTracks(video, []);

      const detach = store.attach({ media: video, container: null });
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      detach();
      quiz.remove();
      store.attach({ media: video, container: null });

      expect(store.state.textCues).toEqual([]);
    });

    it('works on media without text tracks', () => {
      const media = Object.assign(new EventTarget(), { currentTime: 5, duration: 60, seekable: {}, seek() {} });
      const store = createStore<PlayerTarget>()(textCuesFeature);

      store.attach({ media: media as unknown as PlayerTarget['media'], container: null });
      store.addTextTrack({ kind: 'metadata', label: 'quiz', cues: [{ startTime: 0, endTime: 10, text: 'hi' }] });

      expect(store.state.textCues[0]!.track.source).toBe('app');
    });

    it('stands in for chapters on media without text tracks', () => {
      const media = Object.assign(new EventTarget(), { currentTime: 0, duration: 60, seeking: false });
      const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

      store.attach({ media: media as unknown as PlayerTarget['media'], container: null });
      store.addTextTrack({
        kind: 'chapters',
        label: 'AI chapters',
        cues: [
          { startTime: 0, text: 'Intro' },
          { startTime: 30, text: 'Outro' },
        ],
      });

      expect(store.state.chaptersCues.map(({ text, endTime }) => [text, endTime])).toEqual([
        ['Intro', 30],
        ['Outro', 60],
      ]);
    });

    it('is listed in textTrackList, and its chapters stand in for missing media chapters', () => {
      const video = document.createElement('video');
      const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

      setTracks(video, [createTrack('captions', { id: 'en', label: 'English' })]);
      store.attach({ media: video, container: null });
      store.addTextTrack({
        kind: 'chapters',
        label: 'AI chapters',
        cues: [{ startTime: 0, endTime: 30, text: 'Intro' }],
      });

      expect(store.state.textTrackList.map(({ label, source }) => [label, source])).toEqual([
        ['English', 'media'],
        ['AI chapters', 'app'],
      ]);
      expect(store.state.chaptersCues.map(({ text }) => text)).toEqual(['Intro']);
    });
  });

  it('runs app chapters without an end to the next chapter, and the last to the end of the media', () => {
    const video = document.createElement('video');
    const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

    setTracks(video, []);
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    store.attach({ media: video, container: null });
    store.addTextTrack({
      kind: 'chapters',
      cues: [
        { startTime: 0, text: 'Intro' },
        { startTime: 30, text: 'Main' },
      ],
    });

    expect(store.state.chaptersCues.map(({ startTime, endTime }) => [startTime, endTime])).toEqual([
      [0, 30],
      [30, 100],
    ]);
  });

  it('reads app chapters without an end as running to the next chapter', () => {
    const { video, store } = setup([]);

    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    store.addTextTrack({
      kind: 'chapters',
      cues: [
        { startTime: 0, text: 'Intro' },
        { startTime: 30, text: 'Main' },
      ],
    });

    setTime(video, 45);

    expect(store.state.textCues[0]!.cues.map(({ endTime }) => endTime)).toEqual([30, 100]);
    expect(store.state.textCues[0]!.activeCues.map(({ text }) => text)).toEqual(['Main']);
  });

  describe('addTextTrack with a src', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    function respond(body: string, ok = true) {
      const fetch = vi.fn(async () => ({ ok, status: ok ? 200 : 404, text: async () => body }));

      vi.stubGlobal('fetch', fetch);

      return fetch;
    }

    /** Let the fetch and parse promise chain settle. */
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

    it('loads a JSON array of cues once attached', async () => {
      const fetch = respond(JSON.stringify([{ startTime: 0, endTime: 10, value: { question: 'One?' } }]));
      const video = document.createElement('video');
      const store = createStore<PlayerTarget>()(textCuesFeature);

      setTracks(video, []);
      store.addTextTrack({ kind: 'metadata', label: 'quiz', src: '/quiz.json' });

      expect(fetch).not.toHaveBeenCalled();

      store.attach({ media: video, container: null });
      await settle();

      expect(fetch).toHaveBeenCalledWith('/quiz.json', expect.objectContaining({ signal: expect.any(AbortSignal) }));
      expect(store.state.textCues[0]!.cues.map(({ value }) => value)).toEqual([{ question: 'One?' }]);
    });

    it('loads an object with a cues array, after the cues it was given', async () => {
      respond(JSON.stringify({ cues: [{ startTime: 20, text: 'loaded' }] }));

      const { store } = setup([]);

      store.addTextTrack({ kind: 'metadata', src: '/cues.json', cues: [{ startTime: 0, text: 'given' }] });
      await settle();

      expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['given', 'loaded']);
    });

    it('reads other JSON through a format', async () => {
      respond(JSON.stringify({ version: '1.2.0', chapters: [{ startTime: 0, title: 'Intro' }] }));

      const { store } = setup([]);

      store.addTextTrack({ kind: 'chapters', src: '/chapters.json', format: podcastChapters });
      await settle();

      expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['Intro']);
    });

    it("parses WebVTT with the browser's parser", async () => {
      respond('WEBVTT\n\n00:00.000 --> 00:05.000\nChapter one');

      const { store } = setup([]);

      store.addTextTrack({ kind: 'chapters', src: '/chapters.vtt' });
      await settle();

      expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['Chapter one']);
    });

    it('keeps the track and warns when the file fails to load', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      respond('', false);

      const { store } = setup([]);
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz', src: '/missing.json' });

      await settle();

      expect(quiz.removed).toBe(false);
      expect(store.state.textCues[0]!.cues).toEqual([]);
      expect(warn).toHaveBeenCalledOnce();
    });
  });

  it('stays empty for media without text tracks', () => {
    const store = createStore<PlayerTarget>()(textCuesFeature);

    store.attach({ media: new EventTarget() as PlayerTarget['media'], container: null });

    expect(store.state.textCues).toEqual([]);
  });
});
