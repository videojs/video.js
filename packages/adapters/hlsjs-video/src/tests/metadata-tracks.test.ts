import { HTMLVideoAdapter } from '@videojs/media/dom';
import Hls from 'hls.js';
import { describe, expect, it } from 'vite-plus/test';

import { HlsJsMetadataTracksMixin } from '../metadata-tracks';

function createHost() {
  const listeners = new Map<string, (() => void)[]>();
  // SAFETY: The mixin only registers engine lifecycle listeners; the stub
  // implements that boundary without running hls.js playback controllers.
  const engine = {
    on(event: string, listener: () => void) {
      listeners.set(event, [...(listeners.get(event) ?? []), listener]);
    },
  } as Hls;

  class Host extends HTMLVideoAdapter {
    engine = engine;
  }

  const MetadataHost = HlsJsMetadataTracksMixin(Host);
  const host = new MetadataHost();
  const video = document.createElement('video');

  // Jsdom does not expose TextTrack objects. Keep the list tied to the actual
  // track children so replacing an element also replaces its track identity.
  Object.defineProperty(video, 'textTracks', {
    get: () => Array.from(video.querySelectorAll('track'), (element) => element.track),
  });
  host.attach(video);

  return {
    video,
    emit(event: string) {
      for (const listener of listeners.get(event) ?? []) listener();
    },
  };
}

function createTrack({
  kind = 'chapters',
  label = '',
  mode = 'disabled',
  cues = ['review-note'],
  readyState = 2,
  src = 'notes.vtt',
  defaultTrack = false,
}: {
  kind?: TextTrackKind;
  label?: string;
  mode?: TextTrackMode;
  cues?: string[];
  readyState?: number;
  src?: string;
  defaultTrack?: boolean;
} = {}) {
  const element = document.createElement('track');
  const cueObjects = cues.map((id) => ({ id }));
  const track = {
    kind,
    label,
    mode,
    // Native TextTrack.cues is null when disabled, even after the VTT loaded.
    get cues() {
      return this.mode === 'disabled' ? null : cueObjects;
    },
  };

  element.kind = kind;
  element.label = label;
  element.default = defaultTrack;

  if (src) element.setAttribute('src', src);

  Object.defineProperty(element, 'track', { value: track });
  Object.defineProperty(element, 'readyState', { value: readyState });
  // A native clone gets a fresh, unloaded track. Supply that missing browser
  // behavior without simulating the recovery logic under test.
  element.cloneNode = () => createTrack({ kind, label, mode: 'disabled', cues: [], readyState: 0, src, defaultTrack });

  return element;
}

describe('HlsJsMetadataTracksMixin', () => {
  it.each([Hls.Events.MANIFEST_LOADED, Hls.Events.MEDIA_ATTACHED])(
    'preserves loaded disabled tracks and their cues on %s',
    (event) => {
      const { video, emit } = createHost();
      const chapters = createTrack();
      const metadata = createTrack({ kind: 'metadata', label: 'Player feedback' });

      video.append(chapters, metadata);
      emit(event);
      emit(event);

      expect(video.children[0]).toBe(chapters);
      expect(video.children[1]).toBe(metadata);
      expect(chapters.track.mode).toBe('disabled');
      expect(metadata.track.mode).toBe('disabled');

      chapters.track.mode = 'hidden';
      metadata.track.mode = 'hidden';

      expect(Array.from(chapters.track.cues ?? [], (cue) => cue.id)).toEqual(['review-note']);
      expect(Array.from(metadata.track.cues ?? [], (cue) => cue.id)).toEqual(['review-note']);
    }
  );

  it.each(['', 'Same label'])('recovers the correct element when tracks share the label %j', (label) => {
    const { video, emit } = createHost();
    const intact = createTrack({ label, mode: 'hidden' });
    const emptied = createTrack({ label, mode: 'hidden', cues: [] });

    video.append(intact, emptied);
    emit(Hls.Events.MANIFEST_LOADED);

    expect(video.children[0]).toBe(intact);
    expect(video.children[1]).not.toBe(emptied);
    expect(video.children).toHaveLength(2);
    expect(video.children[1]?.getAttribute('src')).toBe('notes.vtt');
  });

  it('accepts author-supplied labels containing quotes and selector characters', () => {
    const { video, emit } = createHost();
    const track = createTrack({ label: 'Coach "A" [captain]' });

    video.append(track);

    expect(() => emit(Hls.Events.MANIFEST_LOADED)).not.toThrow();
    expect(video.firstElementChild).toBe(track);
  });

  it.each(['disabled', 'hidden', 'showing'] as const)(
    'reloads an actually emptied track in %s mode and enables its default replacement',
    (mode) => {
      const { video, emit } = createHost();
      const emptied = createTrack({ mode, cues: [], defaultTrack: true });

      video.append(emptied);
      emit(Hls.Events.MANIFEST_LOADED);

      const replacement = video.querySelector('track')!;

      expect(replacement).not.toBe(emptied);
      expect(replacement.src).toBe(emptied.src);
      expect(replacement.default).toBe(true);
      expect(replacement.track.mode).toBe('hidden');
    }
  );

  it.each([0, 1, 3])('does not replace an empty track in readyState %s', (readyState) => {
    const { video, emit } = createHost();
    const track = createTrack({ readyState, cues: [] });

    video.append(track);
    emit(Hls.Events.MANIFEST_LOADED);

    expect(video.firstElementChild).toBe(track);
    expect(track.track.mode).toBe('disabled');
  });

  it('does not replace tracks without a resource or touch caption tracks', () => {
    const { video, emit } = createHost();
    const programmatic = createTrack({ src: '', cues: [] });
    const captions = createTrack({ kind: 'captions', cues: [] });

    video.append(programmatic, captions);
    emit(Hls.Events.MANIFEST_LOADED);

    expect(video.children[0]).toBe(programmatic);
    expect(video.children[1]).toBe(captions);
    expect(captions.track.mode).toBe('disabled');
  });

  it('keeps existing default tracks readable without replacing their cues', () => {
    const { video, emit } = createHost();
    const track = createTrack({ defaultTrack: true });

    video.append(track);
    emit(Hls.Events.MEDIA_ATTACHED);

    expect(video.firstElementChild).toBe(track);
    expect(track.track.mode).toBe('hidden');
    expect(track.track.cues).toHaveLength(1);
  });
});
