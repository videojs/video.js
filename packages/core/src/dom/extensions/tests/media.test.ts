import { REGISTERED_MEDIA, getRegisteredMedia } from '@videojs/media';
import { describe, expect, it, vi } from 'vite-plus/test';

import { createMediaFacade, type MediaOverride, type MediaOverrideSource } from '../media';

class MutedOverride implements MediaOverrideSource {
  get mediaOverride() {
    return { muted: true };
  }
}

class VolumeOverride implements MediaOverrideSource {
  get mediaOverride() {
    return { volume: 0.5 };
  }
}

class CastLikeOverride implements MediaOverrideSource {
  readonly api = {
    muted: false,
    volume: 1,
    playCount: 0,
    play() {
      this.playCount++;
      return Promise.resolve();
    },
  };

  get mediaOverride(): MediaOverride {
    return this.api;
  }
}

/** `pause()` touches `#private` state, which throws unless `this` is the instance rather than the facade. */
class PrivateMedia extends EventTarget {
  #pauseCount = 0;

  get pauseCount() {
    return this.#pauseCount;
  }

  play() {
    return Promise.resolve();
  }

  pause() {
    this.#pauseCount++;
  }
}

class ShadowMedia extends HTMLElement {
  play() {
    return Promise.resolve();
  }
}

customElements.define('test-shadow-media', ShadowMedia);

function createVideo(): HTMLVideoElement {
  return document.createElement('video');
}

describe('createMediaFacade', () => {
  it('reads from the media when no source overrides the member', () => {
    const video = createVideo();

    video.muted = true;

    const media = createMediaFacade(video, () => []);

    expect(media.paused).toBe(true);
    expect(media.muted).toBe(true);
  });

  it('returns the override value when a source defines the member', () => {
    const video = createVideo();

    video.muted = false;

    const media = createMediaFacade(video, () => [new MutedOverride()]);

    expect(media.muted).toBe(true);
  });

  it('falls through to the media for members the override lacks', () => {
    const video = createVideo();

    video.muted = true;
    video.defaultMuted = true;

    const media = createMediaFacade(video, () => [new VolumeOverride()]);

    expect(media.volume).toBe(0.5);
    expect(media.muted).toBe(true);
    expect(media.defaultMuted).toBe(true);
  });

  it('lets the first source with a defined value own the member', () => {
    const video = createVideo();
    const media = createMediaFacade(video, () => [
      { mediaOverride: { volume: 0.25 } },
      { mediaOverride: { volume: 0.75, muted: true } },
    ]);

    expect(media.volume).toBe(0.25);
    expect(media.muted).toBe(true);
  });

  it('re-reads a source override on every access', () => {
    const video = createVideo();
    const source = {
      connected: false,
      get mediaOverride() {
        return this.connected ? { muted: true, volume: 0.5 } : null;
      },
    };
    const media = createMediaFacade(video, () => [source]);

    expect(media.muted).toBe(false);
    expect(media.volume).toBe(1);

    source.connected = true;

    expect(media.muted).toBe(true);
    expect(media.volume).toBe(0.5);

    source.connected = false;

    expect(media.muted).toBe(false);
  });

  it('consults the live source collection on every access', () => {
    const video = createVideo();
    const registry = new Map<string, MediaOverrideSource>();
    const media = createMediaFacade(video, () => registry.values());

    expect(media.muted).toBe(false);

    registry.set('muted', new MutedOverride());

    expect(media.muted).toBe(true);

    registry.delete('muted');

    expect(media.muted).toBe(false);
  });

  it('writes to the media when no source owns the member', () => {
    const video = createVideo();
    const media = createMediaFacade(video, () => []);

    media.volume = 0.5;

    expect(video.volume).toBe(0.5);
  });

  it('writes to the override that owns the member', () => {
    const video = createVideo();
    const source = new CastLikeOverride();
    const media = createMediaFacade(video, () => [source]);

    media.volume = 0.5;
    media.muted = true;

    expect(source.api.volume).toBe(0.5);
    expect(source.api.muted).toBe(true);
    expect(video.volume).toBe(1);
    expect(video.muted).toBe(false);
  });

  it('binds override methods to the override that owns them', async () => {
    const video = createVideo();
    const play = vi.spyOn(video, 'play').mockResolvedValue(undefined);
    const source = new CastLikeOverride();
    const media = createMediaFacade(video, () => [source]);

    await media.play();

    expect(source.api.playCount).toBe(1);
    expect(play).not.toHaveBeenCalled();
  });

  it('binds media methods to the media rather than the facade', () => {
    const raw = new PrivateMedia();
    const media = createMediaFacade(raw, () => []);

    media.pause();

    expect(raw.pauseCount).toBe(1);
    expect(media.pauseCount).toBe(1);
  });

  it('never lets an override shadow Object.prototype members', () => {
    const video = createVideo();
    const media = createMediaFacade(video, () => [{ mediaOverride: { remote: new EventTarget() } as MediaOverride }]);

    expect(media.constructor).toBe(HTMLVideoElement);
    expect(String(media)).toBe('[object HTMLVideoElement]');
  });

  it('preserves Element semantics of the wrapped media', () => {
    const video = createVideo();
    const track = document.createElement('track');

    video.append(track);

    const media = createMediaFacade(video, () => [new MutedOverride()]);

    expect(media instanceof HTMLVideoElement).toBe(true);
    expect(media instanceof Element).toBe(true);
    expect(media.matches('video')).toBe(true);
    expect(media.matches('audio')).toBe(false);
    expect(media.querySelectorAll('track')).toHaveLength(1);
    expect(media.querySelectorAll('track')[0]).toBe(track);
  });

  it('forwards the shadow root of a custom media element', () => {
    const host = new ShadowMedia();
    const root = host.attachShadow({ mode: 'open' });

    root.append(document.createElement('track'));

    const media = createMediaFacade(host, () => []);

    expect(media instanceof HTMLElement).toBe(true);
    expect(media.shadowRoot).toBe(root);
    expect(media.shadowRoot?.querySelectorAll('track')).toHaveLength(1);
  });

  it('reports members an override supplies as present', () => {
    const video = createVideo();
    const media = createMediaFacade(video, () => [{ mediaOverride: { remote: new EventTarget() } as MediaOverride }]);

    expect('remote' in media).toBe(true);
    expect('paused' in media).toBe(true);
    expect('nonsense' in media).toBe(false);
  });

  it('delivers events dispatched on the media to listeners added through the facade', () => {
    const video = createVideo();
    const media = createMediaFacade(video, () => []);
    const listener = vi.fn();

    media.addEventListener('play', listener);
    video.dispatchEvent(new Event('play'));

    expect(listener).toHaveBeenCalledOnce();

    media.removeEventListener('play', listener);
    video.dispatchEvent(new Event('play'));

    expect(listener).toHaveBeenCalledOnce();
  });

  it('leads back to the registered media', () => {
    const video = createVideo();
    const media = createMediaFacade(video, () => []);

    expect(media).not.toBe(video);
    expect(getRegisteredMedia(media)).toBe(video);
  });

  it('never lets an override shadow the registered media key', () => {
    const video = createVideo();
    const media = createMediaFacade(video, () => [{ mediaOverride: { [REGISTERED_MEDIA]: {} } as MediaOverride }]);

    expect(getRegisteredMedia(media)).toBe(video);
  });
});
