import { combine, createStore } from '@videojs/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { podcastChapters } from '../../../../core/text-track/chapters';
import { defineTextTrack } from '../../../../core/text-track/definition';
import type { PlayerTarget } from '../../../player';
import { textCuesFeature } from '../text-cues';
import { textTrackFeature } from '../text-track';
import { createTrack, type MockTrack, setSrc, setTime, setTracks } from './mock-text-tracks';

vi.mock('../../parse-vtt', () => ({
  parseVtt: vi.fn(async (text: string) => [{ id: 'vtt', startTime: 0, endTime: 5, text: text.split('\n').at(-1) }]),
}));

/**
 * Jsdom does not populate textTracks through addTextTrack or link a track element to its TextTrack. Supply track data
 * explicitly and dispatch media events; the feature owns selection and publication into store state.
 */

function createVideo(): HTMLVideoElement {
  return document.createElement('video');
}

function mockTextTracks(video: HTMLVideoElement, tracks: TextTrack[]): void {
  const list: Partial<TextTrackList> & Record<number, TextTrack> = { length: tracks.length };

  for (const [index, track] of tracks.entries()) {
    list[index] = track;
  }

  Object.defineProperty(video, 'textTracks', {
    configurable: true,
    value: list as TextTrackList,
  });
}

function createMockTrack(
  kind: TextTrackKind,
  mode: TextTrackMode = 'disabled',
  options: { id?: string; label?: string; language?: string; cues?: VTTCue[] | null | undefined } = {}
): TextTrack {
  return {
    id: options.id ?? '',
    kind,
    mode,
    label: options.label ?? '',
    language: options.language ?? '',
    cues: options.cues,
  } as unknown as TextTrack;
}

/** A cue as the DOM would hold it; jsdom has no `VTTCue`, so a plain object stands in. */
function createCue(startTime: number, endTime: number, text: string): VTTCue {
  return { startTime, endTime, text } as VTTCue;
}

function setDuration(video: HTMLVideoElement, duration: number): void {
  Object.defineProperty(video, 'duration', { configurable: true, value: duration });
}

/** A store with the text cues feature too, so app tracks can be checked through the cues read from them. */
function setupWithCues(tracks: MockTrack[]) {
  const video = document.createElement('video');
  const list = setTracks(video, tracks);
  const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

  Object.defineProperty(video, 'currentTime', { configurable: true, value: 0 });
  store.attach({ media: video, container: null });

  return { video, list, store };
}

describe('textTrackFeature', () => {
  describe('thumbnailsTrack', () => {
    /**
     * Attach to a media element carrying the given tracks. Uses `mockTextTracks` rather than `addTextTrack`, which
     * jsdom implements as a no-op that never populates `textTracks`.
     */
    function attachWithTracks(tracks: TextTrack[], crossOrigin?: string) {
      const video = createVideo();

      if (crossOrigin !== undefined) video.setAttribute('crossorigin', crossOrigin);

      mockTextTracks(video, tracks);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      return store;
    }

    function crossOriginFor(crossOrigin: string | undefined) {
      const store = attachWithTracks([createMockTrack('metadata', 'disabled', { label: 'thumbnails' })], crossOrigin);

      return store.state.thumbnailsTrack?.crossOrigin;
    }

    it('exposes the cues of a metadata track labeled thumbnails', () => {
      const cues = [createCue(0, 5, 'sprite.jpg#xywh=0,0,160,90')];
      const store = attachWithTracks([createMockTrack('metadata', 'hidden', { label: 'thumbnails', cues })]);

      expect(store.state.thumbnailsTrack).toEqual({ cues, src: null, crossOrigin: null });
    });

    it('is null when no metadata track is labeled thumbnails', () => {
      const store = attachWithTracks([
        createMockTrack('metadata', 'hidden', { label: 'ad-cues' }),
        createMockTrack('subtitles', 'disabled', { label: 'thumbnails' }),
      ]);

      expect(store.state.thumbnailsTrack).toBeNull();
    });

    it('uses the first thumbnails track when several exist', () => {
      const first = [createCue(0, 5, 'first.jpg')];
      const second = [createCue(0, 5, 'second.jpg')];
      const store = attachWithTracks([
        createMockTrack('metadata', 'hidden', { label: 'thumbnails', cues: first }),
        createMockTrack('metadata', 'hidden', { label: 'thumbnails', cues: second }),
      ]);

      expect(store.state.thumbnailsTrack?.cues).toEqual(first);
    });

    it('reports the media component CORS mode', () => {
      expect(crossOriginFor('anonymous')).toBe('anonymous');
      expect(crossOriginFor('use-credentials')).toBe('use-credentials');
    });

    it('maps the empty string and unknown keywords to anonymous', () => {
      // The CORS-settings attribute treats every value but `use-credentials` as
      // Anonymous. A media component reflects `crossOrigin` as a plain
      // string, so unnormalized values reach here in practice.
      expect(crossOriginFor('')).toBe('anonymous');
      expect(crossOriginFor('bogus')).toBe('anonymous');
      expect(crossOriginFor('USE-CREDENTIALS')).toBe('use-credentials');
    });

    it('reports a null CORS mode when the media component is not in CORS mode', () => {
      expect(crossOriginFor(undefined)).toBeNull();
    });
  });

  describe('chaptersCues', () => {
    // A chapters document delivered with the stream leaves its last chapter
    // open; the track carries that as a very large end.
    const cues = () => [createCue(0, 3, 'Intro'), createCue(3, Number.MAX_SAFE_INTEGER, 'Outro')];

    it.each([null, undefined])('publishes the chapters track while its cues are %s', (missingCues) => {
      const video = createVideo();

      setDuration(video, 10);
      mockTextTracks(video, [createMockTrack('chapters', 'hidden', { id: 'chapters', cues: missingCues })]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.chaptersCues).toEqual([]);
      expect(store.state.textTrackList).toEqual([
        { id: 'chapters', kind: 'chapters', label: '', language: '', mode: 'hidden', source: 'media' },
      ]);
    });

    it('clamps every cue end to a finite media duration', () => {
      const video = createVideo();

      setDuration(video, 23.872);
      mockTextTracks(video, [createMockTrack('chapters', 'hidden', { cues: cues() })]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.chaptersCues).toMatchObject([
        { startTime: 0, endTime: 3, text: 'Intro' },
        { startTime: 3, endTime: 23.872, text: 'Outro' },
      ]);
    });

    it('leaves cue ends alone while the duration is unknown or infinite', () => {
      for (const duration of [Number.NaN, Number.POSITIVE_INFINITY, 0]) {
        const video = createVideo();

        setDuration(video, duration);
        mockTextTracks(video, [createMockTrack('chapters', 'hidden', { cues: cues() })]);

        const store = createStore<PlayerTarget>()(textTrackFeature);

        store.attach({ media: video, container: null });

        expect(store.state.chaptersCues[1]?.endTime).toBe(Number.MAX_SAFE_INTEGER);
      }
    });

    it('re-clamps on durationchange', () => {
      const video = createVideo();

      setDuration(video, Number.NaN);
      mockTextTracks(video, [createMockTrack('chapters', 'hidden', { cues: cues() })]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.chaptersCues[1]?.endTime).toBe(Number.MAX_SAFE_INTEGER);

      // MSE sets the duration from the playlist first, then the appended media extends it.
      setDuration(video, 23.857);
      video.dispatchEvent(new Event('durationchange'));

      expect(store.state.chaptersCues[1]?.endTime).toBe(23.857);

      setDuration(video, 23.872);
      video.dispatchEvent(new Event('durationchange'));

      expect(store.state.chaptersCues[1]?.endTime).toBe(23.872);
    });

    it('exposes plain cue data rather than the live cues', () => {
      const video = createVideo();
      // SAFETY: This fixture supplies the cue fields the feature reads, including an absent optional text field.
      const textless = { startTime: 0, endTime: 3 } as VTTCue;
      const live = [textless, createCue(3, Number.MAX_SAFE_INTEGER, 'Outro')];

      setDuration(video, 10);
      mockTextTracks(video, [createMockTrack('chapters', 'hidden', { cues: live })]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.chaptersCues[0]).toEqual({ id: '0-3', startTime: 0, endTime: 3, text: '' });
      expect(store.state.chaptersCues[0]).not.toBe(textless);
      expect(store.state.chaptersCues[1]).not.toBe(live[1]);
      expect(live[1]?.endTime).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('attach', () => {
    it('prefers first matching chapters track when multiple exist', () => {
      const video = createVideo();
      const first = [createCue(0, 5, 'First chapter')];
      const second = [createCue(1, 6, 'Second chapter')];

      setDuration(video, 10);
      mockTextTracks(video, [
        createMockTrack('chapters', 'hidden', { cues: first }),
        createMockTrack('chapters', 'hidden', { cues: second }),
      ]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.chaptersCues).toMatchObject([{ startTime: 0, endTime: 5, text: 'First chapter' }]);
    });

    it('resyncs on loadstart event', () => {
      const video = createVideo();

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      mockTextTracks(video, [createMockTrack('metadata', 'hidden', { label: 'thumbnails' })]);
      video.dispatchEvent(new Event('loadstart'));

      expect(store.state.thumbnailsTrack).not.toBeNull();
    });

    it('resolves the thumbnails track src from its track element', () => {
      const video = createVideo();
      const track = createMockTrack('metadata', 'hidden', { label: 'thumbnails' });
      const trackEl = document.createElement('track');

      mockTextTracks(video, [track]);
      Object.defineProperty(trackEl, 'track', { value: track });
      trackEl.kind = 'metadata';
      trackEl.label = 'thumbnails';
      trackEl.src = 'https://cdn.example.com/thumbnails.vtt';
      trackEl.default = true;
      video.appendChild(trackEl);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.thumbnailsTrack?.src).toBe('https://cdn.example.com/thumbnails.vtt');
    });

    it('sets subtitlesShowing when a subtitles track is showing', () => {
      const video = createVideo();

      mockTextTracks(video, [createMockTrack('subtitles', 'showing')]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.subtitlesShowing).toBe(true);
    });

    it('exposes textTrackList for all track kinds', () => {
      const video = createVideo();
      const subtitlesTrack = createMockTrack('subtitles', 'showing', {
        id: 'subtitles-en',
        label: 'English',
        language: 'en',
      });
      const captionsTrack = createMockTrack('captions', 'disabled', {
        id: 'captions-en',
        label: 'CC',
        language: 'en',
      });
      const metadataTrack = createMockTrack('metadata', 'showing', { id: 'metadata-thumbnails' });

      mockTextTracks(video, [subtitlesTrack, captionsTrack, metadataTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.textTrackList).toEqual([
        { id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'showing', source: 'media' },
        { id: 'captions-en', kind: 'captions', label: 'CC', language: 'en', mode: 'disabled', source: 'media' },
        { id: 'metadata-thumbnails', kind: 'metadata', label: '', language: '', mode: 'showing', source: 'media' },
      ]);
    });

    it('toggleSubtitles() enables a single caption/subtitle track and disables them all', () => {
      const video = createVideo();
      const subtitlesTrack = createMockTrack('subtitles');
      const captionsTrack = createMockTrack('captions');

      mockTextTracks(video, [subtitlesTrack, captionsTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      const enabled = store.state.toggleSubtitles();

      expect(enabled).toBe(true);
      // Captions sort before subtitles, matching the captions menu order.
      expect(captionsTrack.mode).toBe('showing');
      expect(subtitlesTrack.mode).toBe('disabled');

      const disabled = store.state.toggleSubtitles(false);

      expect(disabled).toBe(false);
      expect(subtitlesTrack.mode).toBe('disabled');
      expect(captionsTrack.mode).toBe('disabled');
    });

    it('toggleSubtitles() prefers an exact browser locale match', () => {
      const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-CA');
      const video = createVideo();
      const frenchTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-fr', language: 'fr-FR' });
      const canadianTrack = createMockTrack('subtitles', 'disabled', {
        id: 'subtitles-fr-ca',
        language: 'fr-CA',
      });

      mockTextTracks(video, [frenchTrack, canadianTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.toggleSubtitles()).toBe(true);
      expect(frenchTrack.mode).toBe('disabled');
      expect(canadianTrack.mode).toBe('showing');

      language.mockRestore();
    });

    it('toggleSubtitles() falls back from a regional browser locale to its language', () => {
      const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-BE');
      const video = createVideo();
      const canadianTrack = createMockTrack('subtitles', 'disabled', {
        id: 'subtitles-fr-ca',
        language: 'fr-CA',
      });
      const frenchTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-fr', language: 'fr' });

      mockTextTracks(video, [canadianTrack, frenchTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.toggleSubtitles()).toBe(true);
      expect(canadianTrack.mode).toBe('disabled');
      expect(frenchTrack.mode).toBe('showing');

      language.mockRestore();
    });

    it('toggleSubtitles() uses the first track when the browser locale does not match', () => {
      const language = vi.spyOn(navigator, 'language', 'get').mockReturnValue('fr-BE');
      const video = createVideo();
      const spanishTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-es', language: 'es' });
      const englishTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-en', language: 'en' });

      mockTextTracks(video, [spanishTrack, englishTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.toggleSubtitles()).toBe(true);
      expect(spanishTrack.mode).toBe('showing');
      expect(englishTrack.mode).toBe('disabled');

      language.mockRestore();
    });

    it('toggleSubtitles() restores the track that was showing', () => {
      const video = createVideo();
      const englishTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-en', language: 'en' });
      const germanTrack = createMockTrack('subtitles', 'showing', { id: 'subtitles-de', language: 'de' });

      mockTextTracks(video, [englishTrack, germanTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.toggleSubtitles()).toBe(false);
      expect(englishTrack.mode).toBe('disabled');
      expect(germanTrack.mode).toBe('disabled');

      expect(store.state.toggleSubtitles()).toBe(true);
      expect(englishTrack.mode).toBe('disabled');
      expect(germanTrack.mode).toBe('showing');
    });

    it('toggleSubtitles() restores the track selected through selectSubtitlesTrack()', () => {
      const video = createVideo();
      const englishTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-en', language: 'en' });
      const germanTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-de', language: 'de' });

      mockTextTracks(video, [englishTrack, germanTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      store.state.selectSubtitlesTrack('subtitles-de');
      store.state.selectSubtitlesTrack(null);

      expect(store.state.toggleSubtitles()).toBe(true);
      expect(englishTrack.mode).toBe('disabled');
      expect(germanTrack.mode).toBe('showing');
    });

    it('toggleSubtitles(true) keeps the showing track instead of enabling every track', () => {
      const video = createVideo();
      const englishTrack = createMockTrack('subtitles', 'showing', { id: 'subtitles-en', language: 'en' });
      const germanTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-de', language: 'de' });

      mockTextTracks(video, [englishTrack, germanTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.toggleSubtitles(true)).toBe(true);
      expect(englishTrack.mode).toBe('showing');
      expect(germanTrack.mode).toBe('disabled');
    });

    it('toggleSubtitles() falls back to the first track when the remembered track is gone', () => {
      const video = createVideo();
      const germanTrack = createMockTrack('subtitles', 'showing', { id: 'subtitles-de', language: 'de' });

      mockTextTracks(video, [germanTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      store.state.toggleSubtitles(false);

      const frenchTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-fr', language: 'fr' });
      const spanishTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-es', language: 'es' });

      mockTextTracks(video, [frenchTrack, spanishTrack]);

      expect(store.state.toggleSubtitles()).toBe(true);
      expect(frenchTrack.mode).toBe('showing');
      expect(spanishTrack.mode).toBe('disabled');
    });

    it('toggleSubtitles() returns false when no subtitle tracks exist', () => {
      const video = createVideo();
      const metadataTrack = createMockTrack('metadata', 'showing');

      mockTextTracks(video, [metadataTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.toggleSubtitles()).toBe(false);
    });

    it('selectSubtitlesTrack() enables one track and disables the others', () => {
      const video = createVideo();
      const englishTrack = createMockTrack('subtitles', 'showing', { id: 'subtitles-en', label: 'English' });
      const spanishTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-es', label: 'Spanish' });

      mockTextTracks(video, [englishTrack, spanishTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      store.state.selectSubtitlesTrack('subtitles-es');

      expect(englishTrack.mode).toBe('disabled');
      expect(spanishTrack.mode).toBe('showing');
    });

    it('selectSubtitlesTrack(null) disables all caption tracks', () => {
      const video = createVideo();
      const englishTrack = createMockTrack('subtitles', 'showing');
      const spanishTrack = createMockTrack('subtitles', 'disabled');

      mockTextTracks(video, [englishTrack, spanishTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      store.state.selectSubtitlesTrack(null);

      expect(englishTrack.mode).toBe('disabled');
      expect(spanishTrack.mode).toBe('disabled');
    });

    it('selectSubtitlesTrack() selects a track whose id is "off"', () => {
      const video = createVideo();
      const offTrack = createMockTrack('subtitles', 'disabled', { id: 'off' });

      mockTextTracks(video, [offTrack]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      store.state.selectSubtitlesTrack('off');

      expect(offTrack.mode).toBe('showing');
    });

    it('stops updating after destroy', () => {
      const video = createVideo();
      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      store.destroy();

      mockTextTracks(video, [createMockTrack('metadata', 'hidden', { label: 'thumbnails' })]);
      video.dispatchEvent(new Event('loadstart'));

      expect(store.state.thumbnailsTrack).toBeNull();
    });
  });

  describe('addTextTrack', () => {
    const cues = [
      { startTime: 0, endTime: 10, value: { question: 'One?' } },
      { startTime: 30, value: { question: 'Point?' } },
    ];

    it("adds a track whose cues are read like the media's", () => {
      const { video, store } = setupWithCues([]);
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
      const { store } = setupWithCues([]);

      store.addTextTrack({ kind: 'metadata', cues: [{ startTime: 5 }] });

      expect(store.state.textCues[0]!.cues[0]).toMatchObject({ startTime: 5, endTime: 5, text: '' });
    });

    it('adds and removes cues through the returned track', () => {
      const { store } = setupWithCues([]);
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      quiz.addCue({ id: 'b', startTime: 20, endTime: 25 });
      quiz.addCue({ id: 'a', startTime: 10, endTime: 15 });

      expect(store.state.textCues[0]!.cues.map(({ id }) => id)).toEqual(['a', 'b']);

      quiz.removeCue('a');

      expect(store.state.textCues[0]!.cues.map(({ id }) => id)).toEqual(['b']);
    });

    it('removes the track', () => {
      const { store } = setupWithCues([]);
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
      const { store } = setupWithCues([createTrack('metadata', { id: 'ads' })]);

      store.removeTextTrack('ads');

      expect(store.state.textCues).toHaveLength(1);
    });

    it('takes a track definition', () => {
      const quizTrack = defineTextTrack<{ question: string }>({ kind: 'metadata', label: 'quiz' });
      const { store } = setupWithCues([]);

      store.addTextTrack(quizTrack, { cues: [{ startTime: 0, value: { question: 'Ready?' } }] });

      expect(store.state.textCues[0]!.track.label).toBe('quiz');
      expect(store.state.textCues[0]!.cues[0]!.value).toEqual({ question: 'Ready?' });
    });

    it('records tracks added before the store attaches', () => {
      const video = document.createElement('video');
      const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

      setTracks(video, []);
      store.addTextTrack({ kind: 'metadata', label: 'quiz', cues });
      store.attach({ media: video, container: null });

      expect(store.state.textCues.map(({ track }) => track.label)).toEqual(['quiz']);
    });

    it('keeps tracks through source changes', () => {
      const { video, store } = setupWithCues([]);
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      setSrc(video, 'https://example.com/one.mp4');
      setSrc(video, 'https://example.com/two.mp4');

      expect(quiz.removed).toBe(false);
      expect(store.state.textCues.map(({ track }) => track.label)).toEqual(['quiz']);
    });

    it('keeps tracks through a re-attach to the same media', () => {
      const video = document.createElement('video');
      const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

      setTracks(video, []);

      const detach = store.attach({ media: video, container: null });
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      // A container change or an extension re-attaches the store to the same media.
      detach();
      expect(quiz.removed).toBe(false);

      store.attach({ media: video, container: document.createElement('div') });

      expect(quiz.removed).toBe(false);
      expect(store.state.textCues.map(({ track }) => track.label)).toEqual(['quiz']);
    });

    it('keeps tracks through a media swap', () => {
      const first = document.createElement('video');
      const second = document.createElement('video');
      const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

      setTracks(first, []);
      setTracks(second, []);
      Object.defineProperty(first, 'currentSrc', { configurable: true, value: 'https://example.com/one.mp4' });

      const detach = store.attach({ media: first, container: null });
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      detach();
      store.attach({ media: second, container: null });

      expect(quiz.removed).toBe(false);
      expect(store.state.textCues.map(({ track }) => track.label)).toEqual(['quiz']);
    });

    it('removes a track while the store is detached', () => {
      const video = document.createElement('video');
      const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

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
      const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

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
      const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));

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

      const { store } = setupWithCues([]);

      store.addTextTrack({ kind: 'metadata', src: '/cues.json', cues: [{ startTime: 0, text: 'given' }] });
      await settle();

      expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['given', 'loaded']);
    });

    it('stands in as the thumbnails track, with its file to resolve images against', async () => {
      respond(JSON.stringify([{ startTime: 0, endTime: 5, text: 'sprite.webp#xywh=0,0,160,90' }]));

      const { store } = setupWithCues([]);

      store.addTextTrack({ kind: 'metadata', label: 'thumbnails', src: 'https://image.example.com/storyboard.json' });
      await settle();

      expect(store.state.thumbnailsTrack).toMatchObject({
        cues: [{ startTime: 0, endTime: 5, text: 'sprite.webp#xywh=0,0,160,90' }],
        src: 'https://image.example.com/storyboard.json',
        crossOrigin: null,
      });
      expect(store.state.textCues).toEqual([]);
    });

    it('reads a file through a format', async () => {
      respond(JSON.stringify({ version: '1.2.0', chapters: [{ startTime: 0, title: 'Intro' }] }));

      const { store } = setupWithCues([]);

      store.addTextTrack({ kind: 'chapters', src: '/chapters.json', format: podcastChapters });
      await settle();

      expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['Intro']);
    });

    it("waits for a format's promise, and takes the cues of a parse result", async () => {
      respond('1\n00:00:00,000 --> 00:00:05,000\nHello\n\n2\n00:00:05,000 --> 00:00:10,000\nWorld');

      const { store } = setupWithCues([]);
      // Stands in for a parser loaded on demand. Its cues leave `id` empty, as the platform's cues do.
      const srt = async (text: string) => ({
        cues: text.split('\n\n').map((block, index) => ({ id: '', startTime: index * 5, text: block.split('\n')[2] })),
        regions: [],
      });

      store.addTextTrack({ kind: 'subtitles', src: '/episode.srt', format: srt });
      store.watchTextCues({ kind: 'subtitles' });
      await settle();

      const { cues } = store.state.textCues[0]!;

      expect(cues.map(({ text }) => text)).toEqual(['Hello', 'World']);
      expect(new Set(cues.map(({ id }) => id)).size).toBe(2);
    });

    it("parses WebVTT with the browser's parser", async () => {
      respond('WEBVTT\n\n00:00.000 --> 00:05.000\nChapter one');

      const { store } = setupWithCues([]);

      store.addTextTrack({ kind: 'chapters', src: '/chapters.vtt' });
      await settle();

      expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['Chapter one']);
    });

    it('keeps the track and warns when the file fails to load', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      respond('', false);

      const { store } = setupWithCues([]);
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz', src: '/missing.json' });

      await settle();

      expect(quiz.removed).toBe(false);
      expect(store.state.textCues[0]!.cues).toEqual([]);
      expect(warn).toHaveBeenCalledOnce();
    });

    it('stops loading a track that is removed', async () => {
      const fetch = vi.fn((_src: string, _init: RequestInit) => new Promise<Response>(() => {}));

      vi.stubGlobal('fetch', fetch);

      const { store } = setupWithCues([]);
      const quiz = store.addTextTrack({ kind: 'metadata', label: 'quiz', src: '/quiz.json' });
      const other = store.addTextTrack({ kind: 'metadata', label: 'other', src: '/other.json' });

      await settle();
      quiz.remove();
      await settle();

      expect(fetch.mock.calls[0]![1].signal!.aborted).toBe(true);
      expect(fetch.mock.calls[1]![1].signal!.aborted).toBe(false);
      expect(other.removed).toBe(false);
    });
  });

  describe('app captions', () => {
    const trackDescriptor = Object.getOwnPropertyDescriptor(HTMLTrackElement.prototype, 'track');

    /** Jsdom never links a `<track>` element to a `TextTrack`, so each element gets a stand-in. */
    class ElementTrack {
      mode: TextTrackMode = 'disabled';
      cues: { startTime: number; endTime: number; text: string }[] = [];

      constructor(readonly element: HTMLTrackElement) {}

      get id() {
        return this.element.id;
      }

      get kind() {
        return this.element.kind;
      }

      get label() {
        return this.element.label;
      }

      get language() {
        return this.element.srclang;
      }

      addCue(cue: { startTime: number; endTime: number; text: string }) {
        this.cues.push(cue);
      }

      removeCue(cue: { startTime: number; endTime: number; text: string }) {
        this.cues.splice(this.cues.indexOf(cue), 1);
      }
    }

    beforeEach(() => {
      const tracks = new WeakMap<HTMLTrackElement, ElementTrack>();

      Object.defineProperty(HTMLTrackElement.prototype, 'track', {
        configurable: true,
        get(this: HTMLTrackElement) {
          if (!tracks.has(this)) tracks.set(this, new ElementTrack(this));

          return tracks.get(this);
        },
      });

      vi.stubGlobal(
        'VTTCue',
        class {
          id = '';

          constructor(
            readonly startTime: number,
            readonly endTime: number,
            readonly text: string
          ) {}
        }
      );
    });

    afterEach(() => {
      if (trackDescriptor) Object.defineProperty(HTMLTrackElement.prototype, 'track', trackDescriptor);
      else Reflect.deleteProperty(HTMLTrackElement.prototype, 'track');

      vi.unstubAllGlobals();
    });

    /** A video whose `textTracks` lists the tracks of its `<track>` children, as a browser's does. */
    function setupWithElements() {
      const video = document.createElement('video');
      const list = new EventTarget() as EventTarget & Record<string, unknown>;

      Object.defineProperty(video, 'textTracks', {
        configurable: true,
        get() {
          const tracks = Array.from(video.querySelectorAll('track'), (element) => element.track);

          for (const key of Object.keys(list)) delete list[key];

          return Object.assign(list, tracks, { length: tracks.length });
        },
      });

      const store = createStore<PlayerTarget>()(combine(textTrackFeature, textCuesFeature));
      const detach = store.attach({ media: video, container: null });
      const copyOf = (id: string) => video.querySelector<HTMLTrackElement>(`track[id="${id}"]`);

      return { video, list, store, detach, copyOf };
    }

    const captions = {
      kind: 'captions',
      label: 'English',
      language: 'en',
      cues: [{ startTime: 0, endTime: 2, text: 'Hello' }],
    } as const;

    it('copies them into the media, writing cues once the copy settles', () => {
      const { store, copyOf } = setupWithElements();
      const track = store.addTextTrack(captions);
      const copy = copyOf(track.id)!;

      expect(copy).toMatchObject({ kind: 'captions', label: 'English', srclang: 'en' });
      expect((copy.track as unknown as ElementTrack).cues).toEqual([]);

      copy.dispatchEvent(new Event('error'));

      expect((copy.track as unknown as ElementTrack).cues.map(({ text }) => text)).toEqual(['Hello']);
      expect(copy.track.mode).toBe('disabled');
    });

    it("lists the app track once, in its copy's mode, and shows it through the captions menu", () => {
      const { list, store } = setupWithElements();
      const track = store.addTextTrack(captions);

      list.dispatchEvent(new Event('addtrack'));

      expect(store.state.textTrackList.map(({ id, source }) => [id, source])).toEqual([[track.id, 'app']]);

      store.selectSubtitlesTrack(track.id);
      list.dispatchEvent(new Event('change'));

      expect(store.state.textTrackList[0]!.mode).toBe('showing');
      expect(store.state.subtitlesShowing).toBe(true);
    });

    it("reads the app track in its copy's mode", () => {
      const { list, store } = setupWithElements();
      const track = store.addTextTrack(captions);

      store.watchTextCues((candidate) => candidate.mode === 'showing');
      store.selectSubtitlesTrack(track.id);
      list.dispatchEvent(new Event('change'));

      expect(store.state.textCues.map(({ track }) => [track.id, track.mode])).toEqual([[track.id, 'showing']]);
      expect(store.state.textCues[0]!.cues.map(({ text }) => text)).toEqual(['Hello']);
    });

    it('tells a media track apart from an app track that shares its id', () => {
      const { video, list, store } = setupWithElements();
      const authored = document.createElement('track');

      authored.id = 'app-text-track-1';
      authored.kind = 'captions';
      authored.label = 'Authored';
      video.append(authored);

      const track = store.addTextTrack(captions);

      expect(track.id).toBe('app-text-track-1');

      list.dispatchEvent(new Event('addtrack'));

      expect(store.state.textTrackList.map(({ label, source }) => [label, source])).toEqual([
        ['Authored', 'media'],
        ['English', 'app'],
      ]);
      expect(new Set(store.state.textTrackList.map(({ id }) => id)).size).toBe(2);

      store.selectSubtitlesTrack(track.id);

      const [, copy] = video.querySelectorAll('track');

      expect(authored.track.mode).toBe('disabled');
      expect(copy!.track.mode).toBe('showing');
    });

    it('removes the copy with the app track, and when the store detaches', () => {
      const { store, detach, copyOf } = setupWithElements();
      const first = store.addTextTrack(captions);
      const second = store.addTextTrack({ ...captions, label: 'Again' });

      first.remove();

      expect(copyOf(first.id)).toBeNull();
      expect(copyOf(second.id)).not.toBeNull();

      detach();

      expect(copyOf(second.id)).toBeNull();
    });

    it('keeps a showing copy showing through a re-attach to the same media', () => {
      const { video, store, detach, copyOf } = setupWithElements();
      const track = store.addTextTrack(captions);

      store.selectSubtitlesTrack(track.id);
      detach();

      expect(copyOf(track.id)).toBeNull();

      store.attach({ media: video, container: null });

      expect(copyOf(track.id)!.track.mode).toBe('showing');
    });

    it('leaves metadata tracks out of the media', () => {
      const { video, store } = setupWithElements();

      store.addTextTrack({ kind: 'metadata', label: 'quiz' });

      expect(video.querySelector('track')).toBeNull();
    });
  });
});
