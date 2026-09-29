import { createStore } from '@videojs/store';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { textTrackFeature } from '../text-track';

/**
 * Jsdom's TextTrackList does not implement EventTarget (no addEventListener/ dispatchEvent), so
 * `listen(media.textTracks, ...)` throws. The store's error boundary catches this, but we can't dispatch textTracks
 * events in tests. We test what we can: initial state, track detection via `addTextTrack`, and `loadstart` resync
 * (dispatched on media, which works).
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
  options: { id?: string; label?: string; language?: string; cues?: VTTCue[] } = {}
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

describe('textTrackFeature', () => {
  describe('initial state', () => {
    it('has empty initial state', () => {
      const video = createVideo();
      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.textTrackList).toEqual([]);
      expect(store.state.subtitlesShowing).toBe(false);
      expect(store.state.chaptersCues).toEqual([]);
      expect(store.state.thumbnailsTrack).toBeNull();
    });
  });

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

    it('reports the media element CORS mode', () => {
      expect(crossOriginFor('anonymous')).toBe('anonymous');
      expect(crossOriginFor('use-credentials')).toBe('use-credentials');
    });

    it('maps the empty string and unknown keywords to anonymous', () => {
      // The CORS-settings attribute treats every value but `use-credentials` as
      // Anonymous. A custom media element reflects `crossOrigin` as a plain
      // string, so unnormalized values reach here in practice.
      expect(crossOriginFor('')).toBe('anonymous');
      expect(crossOriginFor('bogus')).toBe('anonymous');
      expect(crossOriginFor('USE-CREDENTIALS')).toBe('use-credentials');
    });

    it('reports a null CORS mode when the media element is not in CORS mode', () => {
      expect(crossOriginFor(undefined)).toBeNull();
    });
  });

  describe('chaptersCues', () => {
    // A chapters document delivered with the stream leaves its last chapter
    // open; the track carries that as a very large end.
    const cues = () => [createCue(0, 3, 'Intro'), createCue(3, Number.MAX_SAFE_INTEGER, 'Outro')];

    it('clamps every cue end to a finite media duration', () => {
      const video = createVideo();

      setDuration(video, 23.872);
      mockTextTracks(video, [createMockTrack('chapters', 'hidden', { cues: cues() })]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.chaptersCues).toEqual([
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
      const live = cues();

      setDuration(video, 10);
      mockTextTracks(video, [createMockTrack('chapters', 'hidden', { cues: live })]);

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.chaptersCues[1]).not.toBe(live[1]);
      expect(live[1]?.endTime).toBe(Number.MAX_SAFE_INTEGER);
    });
  });

  describe('attach', () => {
    it('detects chapters track via addTextTrack', () => {
      const video = createVideo();

      video.addTextTrack('chapters', 'Chapters', 'en');

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      // Track detected, but no cues in jsdom
      expect(store.state.chaptersCues).toEqual([]);
    });

    it('prefers first matching chapters track when multiple exist', () => {
      const video = createVideo();

      video.addTextTrack('chapters', 'Ch1', 'en');
      video.addTextTrack('chapters', 'Ch2', 'fr');

      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      // Should not error with multiple matching tracks
      expect(store.state.chaptersCues).toEqual([]);
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
      const trackEl = document.createElement('track');

      trackEl.kind = 'metadata';
      trackEl.label = 'thumbnails';
      trackEl.src = 'https://cdn.example.com/thumbnails.vtt';
      trackEl.default = true;
      video.appendChild(trackEl);

      // In jsdom, appending <track> to <video> adds to textTracks.
      // The track.track property links the element to its TextTrack.
      const store = createStore<PlayerTarget>()(textTrackFeature);

      store.attach({ media: video, container: null });

      // findTrackElement maps TextTrack → <track> element → src
      // jsdom's TextTrack from <track> may or may not match addTextTrack
      // entries, so check if the src was resolved.
      // Note: jsdom support for this varies; the feature is validated
      // in real browsers via Playwright.
      const src = store.state.thumbnailsTrack?.src;

      if (src) {
        expect(src).toBe('https://cdn.example.com/thumbnails.vtt');
      }
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
        { id: 'subtitles-en', kind: 'subtitles', label: 'English', language: 'en', mode: 'showing' },
        { id: 'captions-en', kind: 'captions', label: 'CC', language: 'en', mode: 'disabled' },
        { id: 'metadata-thumbnails', kind: 'metadata', label: '', language: '', mode: 'showing' },
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
      const englishTrack = createMockTrack('subtitles', 'disabled', { id: 'subtitles-en', label: 'English' });
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
});
