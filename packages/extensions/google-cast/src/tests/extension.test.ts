import { PlayerExtensionCoordinator } from '@videojs/core/dom';
import type { Media } from '@videojs/media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { GoogleCastExtension } from '../index';

const mocks = vi.hoisted(() => {
  class FakeRemote extends EventTarget {
    state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
    listenerCounts = new Map<string, number>();

    override addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions
    ) {
      this.listenerCounts.set(type, (this.listenerCounts.get(type) ?? 0) + 1);
      super.addEventListener(type, listener, options);
    }
  }

  class FakeProvider {
    static instances: FakeProvider[] = [];

    remote = new FakeRemote();
    currentTime = 42;
    muted = false;
    loadedSrc: string | null = null;
    target: unknown = null;
    load = vi.fn();
    attach = vi.fn((target: unknown) => {
      this.target = target;
    });
    detach = vi.fn(() => {
      this.target = null;
    });
    destroy = vi.fn();

    constructor(public config: unknown) {
      FakeProvider.instances.push(this);
    }
  }

  return { FakeProvider };
});

vi.mock('../provider', () => ({
  GoogleCastProvider: mocks.FakeProvider,
}));

function setup() {
  const video = document.createElement('video');
  const googleCast = new GoogleCastExtension();
  const coordinator = new PlayerExtensionCoordinator(() => {});

  coordinator.register(googleCast);
  coordinator.attach({ media: video, container: null });

  const provider = mocks.FakeProvider.instances.at(-1)!;
  // What the player's store sees once the extension is registered.
  const media = coordinator.getStoreMedia(video);

  return { video, media, googleCast, provider };
}

/** A media component or adapter: fronts a native element as `target` and forwards its events. */
function createHost(element: HTMLVideoElement) {
  return Object.assign(new EventTarget(), { target: element, src: '', currentSrc: '' });
}

function connect(provider: InstanceType<typeof mocks.FakeProvider>) {
  provider.remote.state = 'connected';
  provider.remote.dispatchEvent(new Event('connect'));
}

function disconnect(provider: InstanceType<typeof mocks.FakeProvider>) {
  provider.remote.state = 'disconnected';
  provider.remote.dispatchEvent(new Event('disconnect'));
}

beforeEach(() => {
  // `requiresCastFramework()` requires a Chromium-like environment.
  vi.stubGlobal('chrome', {});
  mocks.FakeProvider.instances.length = 0;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GoogleCastExtension', () => {
  it('does not create a provider outside a Chromium-like environment', () => {
    vi.stubGlobal('chrome', undefined);

    const googleCast = new GoogleCastExtension();

    googleCast.attach({ media: document.createElement('video'), container: null });

    expect(mocks.FakeProvider.instances).toHaveLength(0);
    expect(googleCast.mediaOverride).toBeNull();
  });

  describe('embeds', () => {
    /** Shaped like the YouTube and Vimeo adapters: an iframe `target`, a provider page `src`, no DOM children. */
    function createEmbed() {
      return Object.assign(new EventTarget(), {
        target: document.createElement('iframe'),
        src: 'https://www.youtube.com/watch?v=abc',
        currentSrc: 'https://www.youtube.com/watch?v=abc',
      });
    }

    it('attaches to an embed', () => {
      const googleCast = new GoogleCastExtension();
      const embed = createEmbed();

      googleCast.attach({ media: embed as unknown as Media, container: null });

      expect(mocks.FakeProvider.instances.at(-1)!.attach).toHaveBeenCalledWith(embed);
      expect(googleCast.mediaOverride).not.toBeNull();
    });

    it('never falls back to the page an embed plays', () => {
      const googleCast = new GoogleCastExtension();

      googleCast.attach({ media: createEmbed() as unknown as Media, container: null });

      expect(googleCast.src).toBe('');
    });

    it('casts an explicit src for an embed', () => {
      const googleCast = new GoogleCastExtension();

      googleCast.attach({ media: createEmbed() as unknown as Media, container: null });
      googleCast.src = 'https://example.com/stream.m3u8';

      expect(googleCast.src).toBe('https://example.com/stream.m3u8');
    });
  });

  it('drives the native element behind a media component or adapter', () => {
    const googleCast = new GoogleCastExtension();
    const video = document.createElement('video');

    googleCast.attach({ media: createHost(video) as unknown as Media, container: null });

    expect(mocks.FakeProvider.instances.at(-1)!.attach).toHaveBeenCalledWith(video);
  });

  it('follows the native element when the media swaps it', () => {
    const googleCast = new GoogleCastExtension();
    const first = document.createElement('video');
    const second = document.createElement('video');
    const host = createHost(first);

    googleCast.attach({ media: host as unknown as Media, container: null });

    const provider = mocks.FakeProvider.instances.at(-1)!;

    host.target = second;
    host.dispatchEvent(new Event('loadstart'));

    expect(provider.detach).toHaveBeenCalledTimes(1);
    expect(provider.attach).toHaveBeenLastCalledWith(second);

    // The same element on the next load is left bound.
    host.dispatchEvent(new Event('loadstart'));

    expect(provider.attach).toHaveBeenCalledTimes(2);
  });

  it('attaches the provider to the media and follows media changes', () => {
    const { video, googleCast, provider } = setup();
    const next = document.createElement('video');

    expect(provider.attach).toHaveBeenCalledWith(video);

    googleCast.attach({ media: next, container: null });

    expect(provider.detach).toHaveBeenCalledTimes(1);
    expect(provider.attach).toHaveBeenLastCalledWith(next);
    expect(mocks.FakeProvider.instances).toHaveLength(1);
  });

  it('registers remote state listeners only once across media changes', () => {
    const { googleCast, provider } = setup();

    googleCast.attach({ media: document.createElement('video'), container: null });

    expect(provider.remote.listenerCounts.get('connect')).toBe(1);
    expect(provider.remote.listenerCounts.get('disconnect')).toBe(1);
  });

  it('keeps the provider override when the media changes during a connected session', () => {
    const { googleCast, provider } = setup();

    connect(provider);
    googleCast.attach({ media: document.createElement('video'), container: null });

    expect(googleCast.mediaOverride).toBe(provider);
  });

  it('destroys the provider once and releases the media', () => {
    const { googleCast, provider } = setup();

    googleCast.destroy();

    expect(provider.destroy).toHaveBeenCalledTimes(1);
    expect(googleCast.mediaOverride).toBeNull();
  });

  describe('override swap on connect/disconnect', () => {
    it('routes player reads to the media while disconnected', () => {
      const { media, googleCast, provider } = setup();

      expect(googleCast.mediaOverride).not.toBe(provider);
      expect(media.currentTime).toBe(0);
      // Only `remote` is taken over, so the cast button can prompt.
      expect(media.remote).toBe(provider.remote);
    });

    it('swaps the override to the provider on connect', () => {
      const { media, googleCast, provider } = setup();

      connect(provider);

      expect(googleCast.mediaOverride).toBe(provider);
      expect(media.currentTime).toBe(42);
    });

    it('restores the remote-only override on disconnect', () => {
      const { media, googleCast, provider } = setup();

      connect(provider);
      disconnect(provider);

      expect(googleCast.mediaOverride).not.toBe(provider);
      expect(media.currentTime).toBe(0);
      expect(media.remote).toBe(provider.remote);
    });

    it('routes property writes to the provider while connected', () => {
      const { media, video, provider } = setup();

      connect(provider);
      media.muted = true;

      expect(provider.muted).toBe(true);
      expect(video.muted).toBe(false);
    });

    it('routes property writes to the media after disconnect', () => {
      const { media, video, provider } = setup();

      connect(provider);
      disconnect(provider);
      media.muted = true;

      expect(provider.muted).toBe(false);
      expect(video.muted).toBe(true);
    });
  });

  describe('cast prop changes', () => {
    it('reloads the receiver when a cast prop changes while connected', () => {
      const { googleCast, provider } = setup();

      connect(provider);
      googleCast.src = 'https://example.com/stream.m3u8';

      expect(provider.load).toHaveBeenCalledTimes(1);
    });

    it('does not reload the receiver while disconnected', () => {
      const { googleCast, provider } = setup();

      googleCast.src = 'https://example.com/stream.m3u8';

      expect(provider.load).not.toHaveBeenCalled();
    });
  });

  describe('local source changes', () => {
    it('follows a new local source on the receiver while connected', () => {
      const { video, provider } = setup();

      connect(provider);
      video.src = 'https://example.com/next.mp4';
      video.dispatchEvent(new Event('loadstart'));

      expect(provider.load).toHaveBeenCalledTimes(1);
    });

    it('does not reload a source the receiver already has', () => {
      const { video, provider } = setup();

      connect(provider);
      video.src = 'https://example.com/next.mp4';
      provider.loadedSrc = video.src;
      video.dispatchEvent(new Event('loadstart'));

      expect(provider.load).not.toHaveBeenCalled();
    });

    it('ignores local loads while disconnected', () => {
      const { video, provider } = setup();

      video.dispatchEvent(new Event('loadstart'));

      expect(provider.load).not.toHaveBeenCalled();
    });

    it('follows media swapped in mid-session whose load has already started', () => {
      const { googleCast, provider } = setup();
      const next = document.createElement('video');

      connect(provider);
      // Its `loadstart` fired before the player attached it, so no later one will arrive.
      next.src = 'https://example.com/next.mp4';
      googleCast.attach({ media: next, container: null });

      expect(provider.load).toHaveBeenCalledTimes(1);
    });

    it('does not reload a swapped-in source the receiver already has', () => {
      const { googleCast, provider } = setup();
      const next = document.createElement('video');

      connect(provider);
      next.src = 'https://example.com/next.mp4';
      provider.loadedSrc = next.src;
      googleCast.attach({ media: next, container: null });

      expect(provider.load).not.toHaveBeenCalled();
    });

    it('does not load swapped-in media while disconnected', () => {
      const { googleCast, provider } = setup();
      const next = document.createElement('video');

      next.src = 'https://example.com/next.mp4';
      googleCast.attach({ media: next, container: null });

      expect(provider.load).not.toHaveBeenCalled();
    });

    it('stops following the media after detach', () => {
      const { video, googleCast, provider } = setup();

      connect(provider);
      googleCast.detach();
      video.dispatchEvent(new Event('loadstart'));

      expect(provider.load).not.toHaveBeenCalled();
    });
  });

  describe('src fallback', () => {
    it('reads the media source when no cast src is set', () => {
      const { video, googleCast } = setup();

      video.src = 'https://example.com/local.mp4';

      expect(googleCast.src).toBe('https://example.com/local.mp4');
    });

    it('prefers the media src over its source children, as resource selection does', () => {
      const { video, googleCast } = setup();
      const source = document.createElement('source');

      source.src = 'https://example.com/source.mp4';
      video.append(source);
      video.src = 'https://example.com/local.mp4';

      expect(googleCast.src).toBe('https://example.com/local.mp4');
    });

    it('reads the source child the browser selected', () => {
      const { video, googleCast } = setup();
      const first = document.createElement('source');
      const second = document.createElement('source');

      first.src = 'https://example.com/first.webm';
      second.src = 'https://example.com/second.mp4';
      video.append(first, second);
      // The test environment never runs resource selection; stand in for the browser picking the second.
      Object.defineProperty(video, 'currentSrc', { value: second.src, configurable: true });

      expect(googleCast.src).toBe('https://example.com/second.mp4');
    });

    it('falls back to the first source child before selection has run', () => {
      const { video, googleCast } = setup();
      const source = document.createElement('source');

      source.src = 'https://example.com/source.mp4';
      video.append(source);

      expect(googleCast.src).toBe('https://example.com/source.mp4');
    });

    it('does not cast a blob currentSrc', () => {
      const { video, googleCast } = setup();

      Object.defineProperty(video, 'currentSrc', { value: 'blob:https://example.com/1', configurable: true });

      expect(googleCast.src).toBe('');
    });

    it('prefers an explicit cast src over the media', () => {
      const { video, googleCast } = setup();

      video.src = 'https://example.com/local.mp4';
      googleCast.src = 'https://example.com/cast.m3u8';

      expect(googleCast.src).toBe('https://example.com/cast.m3u8');
    });
  });
});
