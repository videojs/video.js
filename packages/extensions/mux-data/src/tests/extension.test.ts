import { HTMLVideoAdapter } from '@videojs/media/dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MuxDataExtension } from '..';
import type { MuxDataSdk } from '../types';

function createSdk() {
  const emit = vi.fn();
  const updateData = vi.fn();
  const addHLSJS = vi.fn();
  const removeHLSJS = vi.fn();
  const addDashJS = vi.fn();
  const removeDashJS = vi.fn();
  const destroy = vi.fn();
  let uuid = 0;

  // Like the real SDK, `monitor` installs a live handle on the element.
  const monitor = vi.fn((target: HTMLVideoElement, _options?: any) => {
    destroy.mockImplementation(() => {
      delete target.mux;
    });
    target.mux = { deleted: false, emit, updateData, addHLSJS, removeHLSJS, addDashJS, removeDashJS, destroy } as any;
  });

  const sdk = {
    monitor,
    utils: { now: () => 0, generateUUID: () => `uuid-${++uuid}` },
  } as unknown as MuxDataSdk;

  return { sdk, monitor, emit, updateData, addHLSJS, removeHLSJS, addDashJS, removeDashJS, destroy };
}

/** A real adapter whose `src` lives on the adapter, like the HLS adapters that play a `blob:` URL. */
class FakeAdapter extends HTMLVideoAdapter {
  #src = '';

  override get src() {
    return this.#src;
  }

  override set src(value: string) {
    this.#src = value;
  }
}

/**
 * Shaped like the hls.js- and dash.js-backed adapters: the same adapter, fronting a JS engine. Like the hls.js adapter,
 * it names the engine it picked per source on the instance.
 */
class FakeEngineAdapter extends FakeAdapter {
  engine: unknown = null;
  engineName: string | undefined = undefined;
}

/** Shaped like an adapter that always plays through one engine, which its class names. */
class FakeShakaAdapter extends FakeAdapter {
  static readonly engineName: string = 'shaka';
}

/**
 * Shaped like the SPF background-video Media: no `HTMLMediaAdapter`, just the element as `target`, a `src`, an SPF
 * engine, and the element's `loadstart` forwarded. No `currentSrc`, `readyState`, or `load()`.
 */
class FakeBackgroundVideoMedia extends EventTarget {
  static readonly engineName: string = 'spf-hls-background-video';
  readonly engine = {};
  src = '';
  #target: HTMLVideoElement | null = null;

  get target() {
    return this.#target;
  }

  attach(target: HTMLVideoElement) {
    this.#target = target;
    target.addEventListener('loadstart', () => this.dispatchEvent(new Event('loadstart')));
  }
}

/** Shaped like an hls.js instance, class statics included. */
class FakeHlsJsEngine {
  static Events = { MANIFEST_LOADED: 'hlsManifestLoaded' };
  static ErrorDetails = { MANIFEST_LOAD_ERROR: 'manifestLoadError' };
  static version = '1.6.15';
  levels: unknown[] = [];
  on() {}
  off() {}
}

/** Shaped like a dash.js `MediaPlayerClass`. */
class FakeDashJsEngine {
  getCurrentTrackFor() {
    return null;
  }
  getRepresentationsByType() {
    return [];
  }
  on() {}
  off() {}
}

/** Attach `adapter` to a fresh `<video>` and hand it to the extension the way the player does. */
function attach(data: MuxDataExtension, adapter: FakeAdapter) {
  const video = document.createElement('video');

  adapter.attach(video);
  data.attach({ media: adapter, container: null });

  return video;
}

/** The test environment's `currentSrc` never reflects resource selection, so stand in for the browser's pick. */
function setCurrentSrc(video: HTMLVideoElement, value: string) {
  Object.defineProperty(video, 'currentSrc', { value, configurable: true });
}

// Syncing is deferred by a microtask so all props settle first.
async function settle() {
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('MuxDataExtension', () => {
  it('accepts a player software name', () => {
    expect(new MuxDataExtension({ playerSoftwareName: 'mux-video' }).playerSoftwareName).toBe('mux-video');
  });

  it('monitors the element behind the media with the configured data', async () => {
    const { sdk, monitor } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key', playerSoftwareName: 'mux-video' });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    const video = attach(data, adapter);

    await settle();

    expect(monitor).toHaveBeenCalledWith(
      video,
      expect.objectContaining({
        data: expect.objectContaining({
          env_key: 'key',
          player_software_name: 'mux-video',
          player_software: 'mux-video',
          video_id: 'abc123',
        }),
      })
    );
  });

  it('reports the framework, the engine, and this extension as the player software by default', async () => {
    const { sdk, monitor } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk });

    data.framework = 'html';

    const video = attach(data, new FakeShakaAdapter());

    await settle();

    expect(data.playerSoftwareName).toBeUndefined();
    expect(monitor).toHaveBeenCalledWith(
      video,
      expect.objectContaining({
        data: expect.objectContaining({
          player_software_name: 'videojs-html-shaka',
          player_software: 'videojs-html-shaka',
          player_software_version: __PLAYER_VERSION__,
          player_mux_plugin_name: '@videojs/mux-data',
          player_mux_plugin_version: __PLAYER_VERSION__,
        }),
      })
    );
  });

  it('reports the browser as the engine for media with no JS engine', async () => {
    const { sdk, monitor } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk });
    const video = document.createElement('video');

    data.framework = 'react';
    data.attach({ media: video, container: null });

    await settle();

    expect(monitor).toHaveBeenCalledWith(
      video,
      expect.objectContaining({ data: expect.objectContaining({ player_software_name: 'videojs-react-browser' }) })
    );
  });

  it('renames the live view when a source change switches engines', async () => {
    const { sdk, monitor, updateData } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk });
    const adapter = new FakeEngineAdapter();

    data.framework = 'html';
    adapter.engineName = 'browser';
    adapter.src = 'https://stream.mux.com/abc123.m3u8';
    attach(data, adapter);
    await settle();

    expect(monitor).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ data: expect.objectContaining({ player_software_name: 'videojs-html-browser' }) })
    );

    adapter.engineName = 'hlsjs';
    adapter.src = 'https://stream.mux.com/def456.m3u8';
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);
    expect(updateData).toHaveBeenCalledWith({
      player_software_name: 'videojs-html-hlsjs',
      player_software: 'videojs-html-hlsjs',
    });

    updateData.mockClear();
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(updateData).not.toHaveBeenCalled();
  });

  it('reports a configured player software name over the default', async () => {
    const { sdk, monitor, updateData } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, playerSoftwareName: 'mux-video' });
    const adapter = new FakeEngineAdapter();

    data.framework = 'html';

    const video = attach(data, adapter);

    await settle();

    expect(monitor).toHaveBeenCalledWith(
      video,
      expect.objectContaining({ data: expect.objectContaining({ player_software_name: 'mux-video' }) })
    );

    // A configured name holds across engine switches.
    adapter.engineName = 'hlsjs';
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(updateData).not.toHaveBeenCalledWith(expect.objectContaining({ player_software_name: expect.anything() }));
  });

  it('updates the live view when the player software name changes', async () => {
    const { sdk, updateData } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk });

    data.framework = 'html';
    data.attach({ media: document.createElement('video'), container: null });

    await settle();

    data.playerSoftwareName = 'mux-video';

    expect(updateData).toHaveBeenCalledWith({ player_software_name: 'mux-video', player_software: 'mux-video' });

    data.playerSoftwareName = undefined;

    expect(updateData).toHaveBeenLastCalledWith({
      player_software_name: 'videojs-html-browser',
      player_software: 'videojs-html-browser',
    });
  });

  it('reports the time the player was created as the player init time', async () => {
    const { sdk, monitor } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk });
    const video = document.createElement('video');

    data.connect({ initTime: 1_000 });
    data.attach({ media: video, container: null });

    await settle();

    expect(data.playerInitTime).toBe(1_000);
    expect(monitor).toHaveBeenCalledWith(
      video,
      expect.objectContaining({ data: expect.objectContaining({ player_init_time: 1_000 }) })
    );
  });

  it('prefers an explicit player init time over the player creation time', async () => {
    const { sdk, monitor } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, playerInitTime: 500 });
    const video = document.createElement('video');

    data.connect({ initTime: 1_000 });
    data.attach({ media: video, container: null });

    await settle();

    expect(monitor).toHaveBeenCalledWith(
      video,
      expect.objectContaining({ data: expect.objectContaining({ player_init_time: 500 }) })
    );

    data.playerInitTime = undefined;

    expect(data.playerInitTime).toBe(1_000);
  });

  it('stops using the player creation time once released from the player', () => {
    const data = new MuxDataExtension();

    data.connect({ initTime: 1_000 });
    data.disconnect();

    expect(data.playerInitTime).not.toBe(1_000);
  });

  it('monitors a plain video element directly', async () => {
    const { sdk, monitor } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const video = document.createElement('video');

    video.src = 'https://example.com/video.mp4';
    data.attach({ media: video, container: null });

    await settle();

    expect(monitor).toHaveBeenCalledWith(
      video,
      expect.objectContaining({ data: expect.objectContaining({ video_id: 'https://example.com/video.mp4' }) })
    );
  });

  it('reads the selected source of a plain video that loads from source children', async () => {
    const { sdk, monitor, emit } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const video = document.createElement('video');

    // Resource selection from `<source>` children leaves `src` empty and reports the pick on `currentSrc`.
    setCurrentSrc(video, 'https://example.com/first.mp4');
    data.attach({ media: video, container: null });

    await settle();

    expect(monitor).toHaveBeenCalledWith(
      video,
      expect.objectContaining({ data: expect.objectContaining({ video_id: 'https://example.com/first.mp4' }) })
    );

    setCurrentSrc(video, 'https://example.com/second.mp4');
    video.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(emit).toHaveBeenCalledWith(
      'videochange',
      expect.objectContaining({ video_id: 'https://example.com/second.mp4' })
    );
  });

  it('does not treat a blob currentSrc as a video', async () => {
    const { sdk, monitor, emit } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    const video = attach(data, adapter);

    await settle();

    // The adapter cleared its source but the element still holds the MediaSource it was fed.
    adapter.src = '';
    setCurrentSrc(video, 'blob:https://example.com/0f3a');
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);
    expect(emit).not.toHaveBeenCalled();
  });

  it('does not monitor media without a native element behind it', async () => {
    const { sdk, monitor } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    data.attach({ media: adapter, container: null });

    await settle();

    expect(monitor).not.toHaveBeenCalled();
  });

  it('monitors a background video through the element it fronts', async () => {
    const { sdk, monitor, emit } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const media = new FakeBackgroundVideoMedia();
    const video = document.createElement('video');

    data.framework = 'html';

    media.src = 'https://stream.mux.com/abc123.m3u8';
    media.attach(video);
    data.attach({ media: media as any, container: null });

    await settle();

    expect(monitor).toHaveBeenCalledWith(
      video,
      expect.objectContaining({
        data: expect.objectContaining({
          player_software_name: 'videojs-html-spf-hls-background-video',
          video_id: 'abc123',
        }),
      })
    );

    media.src = 'https://stream.mux.com/def456.m3u8';
    video.dispatchEvent(new Event('loadstart'));

    await settle();

    expect(emit).toHaveBeenCalledWith('videochange', expect.objectContaining({ video_id: 'def456' }));
  });

  it('keeps the monitor across a same-source loadstart', async () => {
    const { sdk, monitor, emit, destroy } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    attach(data, adapter);
    await settle();

    // e.g. remote playback engaging or a MediaSource re-attach reruns `load()`.
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);
    expect(destroy).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('emits videochange on the live monitor when the source changes', async () => {
    const { sdk, monitor, emit, destroy } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    attach(data, adapter);
    await settle();

    adapter.src = 'https://stream.mux.com/def456.m3u8';
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);
    expect(destroy).not.toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith('videochange', expect.objectContaining({ video_id: 'def456' }));
  });

  it('names the pending view instead of changing videos when the first source arrives', async () => {
    const { sdk, monitor, emit, updateData } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    attach(data, adapter);
    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);

    adapter.src = 'https://stream.mux.com/abc123.m3u8';
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);
    expect(emit).not.toHaveBeenCalled();
    expect(updateData).toHaveBeenCalledWith(expect.objectContaining({ video_id: 'abc123' }));
  });

  it('emits videochange for a new video loaded after the source was cleared', async () => {
    const { sdk, monitor, emit } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    attach(data, adapter);
    await settle();

    adapter.src = '';
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(emit).not.toHaveBeenCalled();

    adapter.src = 'https://stream.mux.com/def456.m3u8';
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith('videochange', expect.objectContaining({ video_id: 'def456' }));
  });

  it('hooks a new engine into the live monitor instead of re-monitoring', async () => {
    const { sdk, monitor, addHLSJS, removeHLSJS, destroy } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    attach(data, adapter);
    await settle();

    // An engine rebuild with the same source reruns `load()` with a new instance.
    const engine = new FakeHlsJsEngine();

    adapter.engine = engine;
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);
    expect(destroy).not.toHaveBeenCalled();
    expect(addHLSJS).toHaveBeenCalledWith({ hlsjs: engine, Hls: FakeHlsJsEngine });

    const rebuilt = new FakeHlsJsEngine();

    adapter.engine = rebuilt;
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(removeHLSJS).toHaveBeenCalledTimes(1);
    expect(addHLSJS).toHaveBeenLastCalledWith({ hlsjs: rebuilt, Hls: FakeHlsJsEngine });
  });

  it('monitors a dash.js engine through the dash.js integration', async () => {
    const { sdk, monitor } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    adapter.engine = new FakeDashJsEngine();
    adapter.src = 'https://example.com/manifest.mpd';

    attach(data, adapter);

    await settle();

    const [, options] = monitor.mock.lastCall!;

    expect(options.dashjs).toBe(adapter.engine);
    expect(options).not.toHaveProperty('hlsjs');
    expect(options).not.toHaveProperty('Hls');
  });

  it('monitors an adapter with no engine from the media element alone', async () => {
    const { sdk, monitor } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeAdapter();

    adapter.src = 'https://example.com/video.mp4';

    attach(data, adapter);

    await settle();

    const [, options] = monitor.mock.lastCall!;

    expect(options).not.toHaveProperty('hlsjs');
    expect(options).not.toHaveProperty('Hls');
    expect(options).not.toHaveProperty('dashjs');
  });

  it('keeps one view session id across video changes', async () => {
    const { sdk, monitor, emit } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    attach(data, adapter);
    await settle();

    const [, options] = monitor.mock.lastCall!;
    const { view_session_id } = options.data;

    expect(view_session_id).toBeTruthy();

    adapter.src = 'https://stream.mux.com/def456.m3u8';
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(emit).toHaveBeenCalledWith('videochange', expect.objectContaining({ view_session_id }));
  });

  it('honors a caller-supplied view session id and never mutates caller metadata', async () => {
    const { sdk, monitor } = createSdk();
    const metadata = { view_session_id: 'caller-session', video_title: 'Some Title' };
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key', metadata });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    attach(data, adapter);
    await settle();

    const [, options] = monitor.mock.lastCall!;

    expect(options.data).toEqual(expect.objectContaining({ view_session_id: 'caller-session' }));
    expect(metadata).toEqual({ view_session_id: 'caller-session', video_title: 'Some Title' });
  });

  it('does not write a generated view session id into caller metadata', async () => {
    const { sdk } = createSdk();
    const metadata = { video_title: 'Some Title' };
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key', metadata });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    attach(data, adapter);
    await settle();

    expect(metadata).toEqual({ video_title: 'Some Title' });
  });

  it('re-monitors when the media swaps the element it fronts', async () => {
    const { sdk, monitor, destroy } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    const first = attach(data, adapter);

    await settle();

    const second = document.createElement('video');

    adapter.detach();
    adapter.attach(second);
    adapter.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(first.mux).toBeUndefined();
    expect(monitor).toHaveBeenCalledTimes(2);
    expect(monitor).toHaveBeenLastCalledWith(second, expect.anything());
  });

  it('follows the media the player attaches', async () => {
    const { sdk, monitor, emit, destroy } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk });
    const first = new FakeEngineAdapter();
    const second = new FakeEngineAdapter();

    first.src = 'https://stream.mux.com/abc123.m3u8';
    second.src = 'https://stream.mux.com/def456.m3u8';

    const firstVideo = attach(data, first);

    await settle();

    const secondVideo = attach(data, second);

    await settle();

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(firstVideo.mux).toBeUndefined();
    expect(monitor).toHaveBeenCalledTimes(2);
    expect(monitor).toHaveBeenLastCalledWith(
      secondVideo,
      expect.objectContaining({ data: expect.objectContaining({ video_id: 'def456' }) })
    );

    emit.mockClear();
    first.dispatchEvent(new Event('loadstart'));
    await settle();

    expect(emit).not.toHaveBeenCalled();
  });

  it('destroys active monitoring on destroy', async () => {
    const data = new MuxDataExtension();
    const video = document.createElement('video');
    const destroy = vi.fn();

    Object.defineProperty(video, 'mux', {
      value: { deleted: false, destroy, updateData: vi.fn() },
      writable: true,
      configurable: true,
    });

    data.attach({ media: video, container: null });
    await settle();
    data.destroy();

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(video.mux).toBeUndefined();
  });

  it('stops syncing after destroy', async () => {
    const { sdk, monitor, emit } = createSdk();
    const data = new MuxDataExtension({ MuxDataSdk: sdk, envKey: 'key' });
    const adapter = new FakeEngineAdapter();

    adapter.src = 'https://stream.mux.com/abc123.m3u8';

    attach(data, adapter);

    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);

    data.destroy();
    adapter.src = 'https://stream.mux.com/def456.m3u8';
    adapter.dispatchEvent(new Event('loadstart'));

    await settle();

    expect(monitor).toHaveBeenCalledTimes(1);
    expect(emit).not.toHaveBeenCalled();
  });
});
