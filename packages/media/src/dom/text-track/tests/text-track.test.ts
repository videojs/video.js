import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { EMPTY_TEXT_TRACKS } from '../../../core/constants';
import type { MediaTextTrackCapability, TextTrackCueLike, TextTrackLike } from '../../../core/types';
import { HTMLVideoAdapter } from '../../html-video-adapter';
import { createTextTrack } from '../text-track';

class FakeTextTrack implements TextTrackLike {
  readonly id = '';
  readonly kind = '';
  readonly label = '';
  readonly language = '';
  readonly cues: TextTrackCueLike[] = [];

  mode: TextTrackLike['mode'] = 'disabled';

  addCue(cue: TextTrackCueLike): void {
    this.cues.push(cue);
  }

  /** Throws for a cue the track doesn't hold, like `TextTrack.removeCue()`. */
  removeCue(cue: TextTrackCueLike): void {
    const index = this.cues.indexOf(cue);
    if (index < 0) throw new DOMException('The cue is not in this track.', 'NotFoundError');

    this.cues.splice(index, 1);
  }
}

class FakeVTTCue {
  id = '';

  constructor(
    readonly startTime: number,
    readonly endTime: number,
    readonly text: string
  ) {}
}

class FakeDataCue {
  id = '';

  constructor(
    readonly startTime: number,
    readonly endTime: number,
    readonly value: unknown,
    readonly type?: string
  ) {}
}

/** A media that adds its tracks without `<track>` elements. */
class FakeMedia implements MediaTextTrackCapability {
  readonly textTracks = EMPTY_TEXT_TRACKS;
  readonly removeTextTrack = vi.fn();

  addTextTrack(): TextTrackLike {
    return new FakeTextTrack();
  }
}

const trackDescriptor = Object.getOwnPropertyDescriptor(HTMLTrackElement.prototype, 'track');

/** Jsdom doesn't link a `<track>` element to a `TextTrack`, so give each element one. */
function stubTrackElements() {
  const tracks = new WeakMap<HTMLTrackElement, FakeTextTrack>();

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
}

function cuesOf(track: TextTrackLike): TextTrackCueLike[] {
  return Array.from(track.cues ?? []);
}

function cueTexts(track: TextTrackLike): string[] {
  return cuesOf(track).map((cue) => (cue as FakeVTTCue).text);
}

beforeEach(() => {
  stubTrackElements();
  vi.stubGlobal('VTTCue', FakeVTTCue);
});

afterEach(() => {
  if (trackDescriptor) Object.defineProperty(HTMLTrackElement.prototype, 'track', trackDescriptor);
  else Reflect.deleteProperty(HTMLTrackElement.prototype, 'track');

  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createTextTrack', () => {
  it('backs a track on a media element with a track element that remove() takes out', () => {
    const video = document.createElement('video');
    const handle = createTextTrack(video, { kind: 'metadata', label: 'Ads', language: 'en' })!;
    const element = video.querySelector('track')!;

    expect(element).toMatchObject({ kind: 'metadata', label: 'Ads', srclang: 'en' });
    expect(handle.track).toBe(element.track);
    expect(handle.track.mode).toBe('hidden');

    handle.remove();
    handle.remove();

    expect(video.querySelector('track')).toBeNull();
    expect(handle.track.mode).toBe('disabled');
  });

  it('holds cues until the track element settles', () => {
    const video = document.createElement('video');
    const handle = createTextTrack(video, { kind: 'metadata' })!;
    const element = video.querySelector('track')!;
    const kept = { startTime: 0, endTime: 1, text: 'kept' };
    const dropped = { startTime: 1, endTime: 2, text: 'dropped' };

    handle.addCue(kept);
    handle.addCue(dropped);
    handle.removeCue(dropped);

    expect(handle.track.cues).toEqual([]);

    element.dispatchEvent(new Event('error'));

    expect(cueTexts(handle.track)).toEqual(['kept']);

    handle.addCue({ startTime: 2, endTime: 3, text: 'after' });

    expect(cueTexts(handle.track)).toEqual(['kept', 'after']);
  });

  it('settles on load as well as error', () => {
    const video = document.createElement('video');
    const handle = createTextTrack(video, { kind: 'chapters' })!;

    handle.addCue({ startTime: 0, endTime: 1, text: 'Intro' });
    video.querySelector('track')!.dispatchEvent(new Event('load'));

    expect(cueTexts(handle.track)).toEqual(['Intro']);
  });

  it('writes right away to a track element that has already settled', () => {
    vi.spyOn(HTMLTrackElement.prototype, 'readyState', 'get').mockReturnValue(3);

    const handle = createTextTrack(document.createElement('video'), { kind: 'metadata' })!;

    handle.addCue({ startTime: 0, endTime: 1, text: 'now' });

    expect(cueTexts(handle.track)).toEqual(['now']);
  });

  it('applies a requested disabled mode once the track element settles', () => {
    const video = document.createElement('video');
    const handle = createTextTrack(video, { kind: 'chapters', mode: 'disabled' })!;

    expect(handle.track.mode).toBe('hidden');

    video.querySelector('track')!.dispatchEvent(new Event('load'));

    expect(handle.track.mode).toBe('disabled');
  });

  it('keeps a mode set while the track element loads', () => {
    const video = document.createElement('video');
    const handle = createTextTrack(video, { kind: 'captions', mode: 'disabled' })!;

    handle.track.mode = 'showing';
    video.querySelector('track')!.dispatchEvent(new Event('error'));

    expect(handle.track.mode).toBe('showing');
  });

  it('applies the requested mode right away when no element has to settle', () => {
    expect(createTextTrack(new FakeMedia(), { kind: 'captions', mode: 'showing' })!.track.mode).toBe('showing');
    expect(createTextTrack(new FakeMedia(), { kind: 'captions', mode: 'disabled' })!.track.mode).toBe('disabled');
  });

  it('writes a copy of the cue that removeCue() takes back given the same object', () => {
    const handle = createTextTrack(new FakeMedia(), { kind: 'captions' })!;
    const cue = { id: 'one', startTime: 0, endTime: 1, text: 'Hello' };

    handle.addCue(cue);
    handle.addCue(cue);

    const [written, ...rest] = cuesOf(handle.track);

    expect(rest).toEqual([]);
    expect(written).toBeInstanceOf(FakeVTTCue);
    expect(written).not.toBe(cue);
    expect(written).toMatchObject(cue);

    handle.removeCue(cue);

    expect(handle.track.cues).toEqual([]);
  });

  it('ignores removing a cue the track already dropped', () => {
    const handle = createTextTrack(new FakeMedia(), { kind: 'metadata' })!;
    const cue = { startTime: 0, endTime: 1, text: 'gone' };

    handle.addCue(cue);
    (handle.track.cues as TextTrackCueLike[]).length = 0;

    expect(() => handle.removeCue(cue)).not.toThrow();
  });

  it('writes a data cue as a DataCue where the platform has one', () => {
    vi.stubGlobal('DataCue', FakeDataCue);

    const handle = createTextTrack(new FakeMedia(), { kind: 'metadata' })!;
    const value = { key: 'TXXX', data: 'ad' };

    handle.addCue({ id: 'ad', startTime: 0, endTime: 1, value, type: 'org.id3' });

    const [written] = cuesOf(handle.track);

    expect(written).toBeInstanceOf(FakeDataCue);
    expect(written).toMatchObject({ id: 'ad', startTime: 0, endTime: 1, value, type: 'org.id3' });
  });

  it('writes a data cue as a VTTCue carrying its value elsewhere', () => {
    const handle = createTextTrack(new FakeMedia(), { kind: 'metadata' })!;
    const value = { key: 'TXXX', data: 'ad' };

    handle.addCue({ startTime: 0, endTime: 1, value, type: 'org.id3' });
    handle.addCue({ startTime: 1, endTime: 2, value: 1n });

    const [withType, unserializable] = cuesOf(handle.track);

    expect(withType).toBeInstanceOf(FakeVTTCue);
    expect(withType).toMatchObject({ text: JSON.stringify(value), value, type: 'org.id3' });
    expect(unserializable).toMatchObject({ text: '', value: 1n });
    expect(unserializable).not.toHaveProperty('type');
  });

  it('skips cues the platform has no constructor for', () => {
    vi.stubGlobal('VTTCue', undefined);

    const handle = createTextTrack(new FakeMedia(), { kind: 'metadata' })!;

    expect(() => handle.addCue({ startTime: 0, endTime: 1, text: 'lost' })).not.toThrow();
    expect(handle.track.cues).toEqual([]);
  });

  it('skips cues the platform rejects', () => {
    vi.stubGlobal(
      'VTTCue',
      class {
        constructor() {
          throw new TypeError('The provided double value is non-finite.');
        }
      }
    );

    const handle = createTextTrack(new FakeMedia(), { kind: 'chapters' })!;

    expect(() => handle.addCue({ startTime: 0, endTime: Infinity, text: 'open' })).not.toThrow();
    expect(handle.track.cues).toEqual([]);
  });

  it('removes a track through the media that added it', () => {
    const media = new FakeMedia();
    const handle = createTextTrack(media, { kind: 'metadata' })!;

    handle.remove();
    handle.remove();

    expect(media.removeTextTrack).toHaveBeenCalledExactlyOnceWith(handle.track);
    expect(handle.track.mode).toBe('disabled');
  });

  it('stops writing cues once removed', () => {
    const video = document.createElement('video');
    const handle = createTextTrack(video, { kind: 'metadata' })!;
    const element = video.querySelector('track')!;

    handle.addCue({ startTime: 0, endTime: 1, text: 'pending' });
    handle.remove();
    element.dispatchEvent(new Event('error'));
    handle.addCue({ startTime: 1, endTime: 2, text: 'late' });

    expect(handle.track.cues).toEqual([]);
  });

  it('waits for the track element behind a media adapter', () => {
    const video = document.createElement('video');
    const adapter = new HTMLVideoAdapter();

    adapter.attach(video);

    const handle = createTextTrack(adapter, { kind: 'metadata' })!;
    const element = video.querySelector('track')!;

    handle.addCue({ startTime: 0, endTime: 1, text: 'held' });

    expect(handle.track).toBe(element.track);
    expect(handle.track.cues).toEqual([]);

    element.dispatchEvent(new Event('error'));

    expect(cueTexts(handle.track)).toEqual(['held']);

    handle.remove();

    expect(video.querySelector('track')).toBeNull();
  });

  it('returns null when the media gives no track', () => {
    const media = new FakeMedia();

    vi.spyOn(media, 'addTextTrack').mockReturnValue(undefined as unknown as TextTrackLike);

    expect(createTextTrack(media, { kind: 'metadata' })).toBeNull();
  });
});
