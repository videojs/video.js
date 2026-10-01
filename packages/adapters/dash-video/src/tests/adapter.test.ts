import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock('dashjs', () => {
  const events = {
    STREAM_INITIALIZED: 'streamInitialized',
    QUALITY_CHANGE_RENDERED: 'qualityChangeRendered',
  };

  /** Dash.js merges every `updateSettings()` call into the current settings. */
  function merge(target: Record<string, any>, source: Record<string, any>) {
    for (const [key, value] of Object.entries(source)) {
      const isPlainObject = typeof value === 'object' && value !== null && !Array.isArray(value);

      target[key] = isPlainObject ? merge({ ...target[key] }, value) : value;
    }

    return target;
  }

  function create() {
    const listeners = new Map<string, Set<(event: any) => void>>();

    const player = {
      representations: [] as any[],
      currentRepresentation: null as any,
      settings: {} as Record<string, any>,
      initialize: vi.fn(),
      attachView: vi.fn(),
      attachSource: vi.fn(),
      updateSettings: vi.fn((settings: Record<string, any>) => {
        player.settings = merge(player.settings, settings);
      }),
      resetSettings: vi.fn(() => {
        player.settings = {};
      }),
      getSettings: vi.fn(() => player.settings),
      destroy: vi.fn(),
      on: vi.fn((type: string, listener: (event: any) => void) => {
        const typeListeners = listeners.get(type) ?? new Set();

        typeListeners.add(listener);
        listeners.set(type, typeListeners);
      }),
      off: vi.fn((type: string, listener: (event: any) => void) => {
        listeners.get(type)?.delete(listener);
      }),
      getRepresentationsByType: vi.fn((type: string) => (type === 'video' ? player.representations : [])),
      getCurrentRepresentationForType: vi.fn(() => player.currentRepresentation),
      setRepresentationForTypeById: vi.fn(),
      /** Test-only: dispatch a dash.js player event to its listeners. */
      emit(type: string, event: Record<string, unknown> = {}) {
        for (const listener of [...(listeners.get(type) ?? [])]) listener({ type, ...event });
      },
    };

    return player;
  }

  const MediaPlayer = Object.assign(() => ({ create }), { events });

  return { MediaPlayer, default: { MediaPlayer } };
});

import { DashAdapter, type DashSource } from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

type MockEngine = {
  representations: MockRepresentation[];
  currentRepresentation: MockRepresentation | null;
  settings: Record<string, any>;
  attachView: ReturnType<typeof vi.fn>;
  attachSource: ReturnType<typeof vi.fn>;
  updateSettings: ReturnType<typeof vi.fn>;
  resetSettings: ReturnType<typeof vi.fn>;
  getSettings: ReturnType<typeof vi.fn>;
  setRepresentationForTypeById: ReturnType<typeof vi.fn>;
  emit(type: string, event?: Record<string, unknown>): void;
};

type MockRepresentation = {
  id: string;
  width?: number;
  height?: number;
  bandwidth?: number;
  bitrateInKbit?: number;
  codecs?: string | null;
  frameRate?: number;
};

function setup() {
  const video = document.createElement('video');

  document.body.appendChild(video);

  const media = new DashAdapter();

  media.attach(video);

  return { media, video, engine: media.engine as unknown as MockEngine };
}

/** Dash.js announces a stream with the video representations it can play. */
function initStream(engine: MockEngine, representations: MockRepresentation[]) {
  engine.representations = representations;
  engine.emit('streamInitialized', { error: null });
}

/** Rendition list events are queued, so selection reaches dash.js a microtask later. */
async function flush() {
  await Promise.resolve();
}

const MANIFEST = 'https://example.com/manifest.mpd';
const OTHER_MANIFEST = 'https://example.com/other.mpd';
const AUTO_SWITCH_OFF = { streaming: { abr: { autoSwitchBitrate: { video: false } } } };
const AUTO_SWITCH_ON = { streaming: { abr: { autoSwitchBitrate: { video: true } } } };

const REPRESENTATIONS: MockRepresentation[] = [
  { id: '0', width: 1920, height: 1080, bandwidth: 6_000_000, codecs: 'avc1.640028', frameRate: 30 },
  { id: '1', width: 1280, height: 720, bitrateInKbit: 3000, codecs: 'avc1.64001f', frameRate: 30 },
];

describe('DashAdapter', () => {
  describe('destroy', () => {
    it('removes forwarding listeners from the native element', () => {
      const { media, video } = setup();

      const playHandler = vi.fn();

      media.addEventListener('play', playHandler);

      video.dispatchEvent(new Event('play'));
      expect(playHandler).toHaveBeenCalledOnce();

      media.destroy();
      playHandler.mockClear();

      video.dispatchEvent(new Event('play'));
      expect(playHandler).not.toHaveBeenCalled();
    });

    it('detaches the dash view from the target on destroy', () => {
      const { media, engine } = setup();

      engine.attachView.mockClear();

      media.destroy();

      expect(engine.attachView).toHaveBeenCalledWith(null);
    });
  });

  describe('source', () => {
    it('forwards dash.js settings to the dash.js player', () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } } };

      expect(engine.updateSettings).toHaveBeenCalledWith({ streaming: { abandonLoadTimeout: 1000 } });
    });

    it('derives src and attaches the manifest', () => {
      const { media, engine } = setup();
      const sourcechange = vi.fn();

      media.addEventListener('sourcechange', sourcechange);

      media.source = { src: MANIFEST };

      expect(media.src).toBe(MANIFEST);
      expect(engine.attachSource).toHaveBeenCalledWith(MANIFEST);
      expect(sourcechange).toHaveBeenCalledTimes(1);
    });

    it('leaves the engine alone for a structurally equal source', () => {
      const { media, engine } = setup();
      const source: DashSource = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } } };

      media.source = source;

      const sourcechange = vi.fn();

      media.addEventListener('sourcechange', sourcechange);
      engine.attachSource.mockClear();
      engine.updateSettings.mockClear();
      engine.resetSettings.mockClear();

      media.source = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } } };

      // Assigning is always announced, but nothing reaches dash.js, so an inline
      // React prop cannot disturb what is already playing.
      expect(sourcechange).toHaveBeenCalledOnce();
      expect(engine.attachSource).not.toHaveBeenCalled();
      expect(engine.updateSettings).not.toHaveBeenCalled();
      expect(engine.resetSettings).not.toHaveBeenCalled();
      expect(media.source).toEqual(source);
    });

    it('does not re-attach the manifest when only dash.js settings change', () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } } };
      engine.attachSource.mockClear();

      media.source = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 2000 } } } };

      expect(engine.attachSource).not.toHaveBeenCalled();
      expect(engine.updateSettings).toHaveBeenLastCalledWith({ streaming: { abandonLoadTimeout: 2000 } });
    });

    it('resets settings instead of merging when a dash.js setting is dropped', () => {
      const { media, engine } = setup();

      media.source = {
        src: MANIFEST,
        engine: { dashJs: { streaming: { abandonLoadTimeout: 1000, cacheInitSegments: true } } },
      };
      engine.updateSettings.mockClear();
      engine.resetSettings.mockClear();

      media.source = { src: MANIFEST, engine: { dashJs: { streaming: { cacheInitSegments: true } } } };

      expect(engine.resetSettings).toHaveBeenCalledOnce();
      expect(engine.resetSettings.mock.invocationCallOrder[0]!).toBeLessThan(
        engine.updateSettings.mock.invocationCallOrder[0]!
      );
      expect(engine.updateSettings).toHaveBeenCalledExactlyOnceWith({ streaming: { cacheInitSegments: true } });
    });

    it('resets settings when dash.js settings are removed entirely', () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } } };
      engine.updateSettings.mockClear();
      engine.resetSettings.mockClear();

      media.source = { src: MANIFEST };

      expect(engine.resetSettings).toHaveBeenCalledOnce();
      expect(engine.updateSettings).not.toHaveBeenCalled();
    });

    it('clears src when set to null', () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST };
      engine.attachSource.mockClear();

      media.source = null;

      expect(media.src).toBe('');
      expect(media.source).toBeNull();
      expect(engine.attachSource).toHaveBeenCalledWith('');
    });
  });

  describe('src', () => {
    it('preserves source dash.js settings across a src change', () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } } };
      engine.updateSettings.mockClear();
      engine.resetSettings.mockClear();

      media.src = 'https://example.com/other.mpd';

      expect(media.source).toEqual({
        src: 'https://example.com/other.mpd',
        engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } },
      });
      expect(engine.attachSource).toHaveBeenLastCalledWith('https://example.com/other.mpd');
      // Carried-over options are already applied to the live player.
      expect(engine.resetSettings).not.toHaveBeenCalled();
      expect(engine.updateSettings).not.toHaveBeenCalled();
    });

    it('fires sourcechange through the source setter', () => {
      const { media, engine } = setup();
      const sourcechange = vi.fn(() => media.source?.src);

      media.addEventListener('sourcechange', sourcechange);

      media.src = MANIFEST;

      expect(sourcechange).toHaveBeenCalledTimes(1);
      expect(sourcechange).toHaveReturnedWith(MANIFEST);

      engine.attachSource.mockClear();
      media.src = MANIFEST;

      // Every assignment is announced, but the same URL is not re-attached.
      expect(sourcechange).toHaveBeenCalledTimes(2);
      expect(engine.attachSource).not.toHaveBeenCalled();
    });
  });

  describe('videoRenditions', () => {
    it('mirrors the video representations of the initialized stream', () => {
      const { media, engine } = setup();

      media.src = MANIFEST;

      initStream(engine, REPRESENTATIONS);

      // Renditions hang off a single selected `main` track.
      expect(media.videoTracks.length).toBe(1);
      expect(media.videoTracks[0]!.selected).toBe(true);

      expect([...media.videoRenditions]).toMatchObject([
        { id: '0', width: 1920, height: 1080, bitrate: 6_000_000, codec: 'avc1.640028', frameRate: 30 },
        // Only a kbit reading: converted to bits per second like `bandwidth`.
        { id: '1', width: 1280, height: 720, bitrate: 3_000_000, codec: 'avc1.64001f', frameRate: 30 },
      ]);
    });

    it('rebuilds the list for every stream it is told about', () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      initStream(engine, REPRESENTATIONS);

      initStream(engine, [{ id: '2', width: 640, height: 360, bandwidth: 800_000 }]);

      expect(media.videoTracks.length).toBe(1);
      expect([...media.videoRenditions].map((rendition) => rendition.id)).toEqual(['2']);
    });

    it('ignores a stream that failed to initialize', () => {
      const { media, engine } = setup();

      media.src = MANIFEST;

      engine.representations = REPRESENTATIONS;
      engine.emit('streamInitialized', { error: new Error('nope') });

      expect(media.videoRenditions.length).toBe(0);
    });

    it('pins the selected representation and turns dash.js bitrate switching off', async () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      initStream(engine, REPRESENTATIONS);
      engine.updateSettings.mockClear();

      media.videoRenditions.selectedIndex = 1;
      await flush();

      expect(engine.updateSettings).toHaveBeenCalledWith(AUTO_SWITCH_OFF);
      expect(engine.setRepresentationForTypeById).toHaveBeenCalledWith('video', '1', true);
    });

    it('hands switching back to dash.js when the selection is cleared', async () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      initStream(engine, REPRESENTATIONS);

      media.videoRenditions.selectedIndex = 1;
      await flush();
      engine.updateSettings.mockClear();

      media.videoRenditions.selectedIndex = -1;
      await flush();

      expect(engine.updateSettings).toHaveBeenCalledExactlyOnceWith(AUTO_SWITCH_ON);
    });

    it('leaves dash.js settings alone when nothing was ever pinned', async () => {
      const { media, engine } = setup();

      media.source = { src: MANIFEST, engine: { dashJs: AUTO_SWITCH_OFF } };
      initStream(engine, REPRESENTATIONS);
      await flush();

      const change = vi.fn();

      media.videoRenditions.addEventListener('change', change);
      engine.updateSettings.mockClear();
      engine.setRepresentationForTypeById.mockClear();

      // The queued list event sees only the final selection, before the engine ever pins it.
      media.videoRenditions.selectedIndex = 1;
      media.videoRenditions.selectedIndex = -1;
      await flush();

      expect(change).toHaveBeenCalledOnce();
      expect(engine.settings).toMatchObject(AUTO_SWITCH_OFF);
      expect(engine.updateSettings).not.toHaveBeenCalled();
      expect(engine.setRepresentationForTypeById).not.toHaveBeenCalled();
    });

    it('re-pins the selected representation when dash.js settings are re-applied', async () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      initStream(engine, REPRESENTATIONS);

      media.videoRenditions.selectedIndex = 1;
      await flush();
      engine.setRepresentationForTypeById.mockClear();

      // Applying new settings resets them wholesale, which would otherwise leave
      // dash.js switching bitrates again behind the user's back.
      media.source = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } } };

      expect(engine.updateSettings).toHaveBeenLastCalledWith(AUTO_SWITCH_OFF);
      expect(engine.setRepresentationForTypeById).toHaveBeenCalledWith('video', '1', true);
    });

    it('leaves the pinned representation alone when an equivalent source is re-assigned', async () => {
      const { media, engine } = setup();
      const source: DashSource = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } } };

      media.source = source;
      initStream(engine, REPRESENTATIONS);

      media.videoRenditions.selectedIndex = 1;
      await flush();
      engine.updateSettings.mockClear();
      engine.setRepresentationForTypeById.mockClear();

      media.source = { src: MANIFEST, engine: { dashJs: { streaming: { abandonLoadTimeout: 1000 } } } };

      // Settings were never reset, so the pin still holds — re-pinning would
      // interrupt playback on every render of an inline React `source` prop.
      expect(engine.updateSettings).not.toHaveBeenCalled();
      expect(engine.setRepresentationForTypeById).not.toHaveBeenCalled();
      expect(media.videoRenditions.selectedIndex).toBe(1);
    });

    it('drops renditions and restores switching when the source changes', async () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      initStream(engine, REPRESENTATIONS);

      media.videoRenditions.selectedIndex = 1;
      await flush();
      engine.updateSettings.mockClear();

      media.src = OTHER_MANIFEST;

      expect(media.videoRenditions.length).toBe(0);
      expect(engine.updateSettings).toHaveBeenCalledExactlyOnceWith(AUTO_SWITCH_ON);
    });

    it('marks the representation dash.js renders active', () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      engine.currentRepresentation = REPRESENTATIONS[0]!;
      initStream(engine, REPRESENTATIONS);

      expect([...media.videoRenditions].map((rendition) => rendition.active)).toEqual([true, false]);

      engine.emit('qualityChangeRendered', { mediaType: 'video', newRepresentation: { id: '1' } });

      expect([...media.videoRenditions].map((rendition) => rendition.active)).toEqual([false, true]);
    });

    it('ignores rendered switches for other media types', () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      engine.currentRepresentation = REPRESENTATIONS[0]!;
      initStream(engine, REPRESENTATIONS);

      engine.emit('qualityChangeRendered', { mediaType: 'audio', newRepresentation: { id: '1' } });

      expect([...media.videoRenditions].map((rendition) => rendition.active)).toEqual([true, false]);
    });

    it('stops mirroring representations once destroyed', () => {
      const { media, engine } = setup();

      media.src = MANIFEST;
      initStream(engine, REPRESENTATIONS);

      media.destroy();

      expect(media.videoRenditions.length).toBe(0);

      initStream(engine, REPRESENTATIONS);

      expect(media.videoRenditions.length).toBe(0);
    });
  });
});
