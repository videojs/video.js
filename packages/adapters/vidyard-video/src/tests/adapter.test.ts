import { isMediaPlaybackRateCapable, isMediaVolumeCapable, MediaError, type Video } from '@videojs/media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import {
  VidyardAdapter,
  type VidyardPlayerMetadata,
  type VidyardPlayerStatus,
  type VidyardSource,
  type VidyardVideoAttributes,
} from '..';

// Every other test installs the embed script's global, so the script is only requested when a test removes it.
const loadScript = vi.hoisted(() => vi.fn<(src: string) => Promise<void>>());

vi.mock('@videojs/utils/dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@videojs/utils/dom')>()),
  loadScript,
}));

const UUID = 'YBvcF2BEfvKdowmfrRwk57';
const SRC = `https://share.vidyard.com/watch/${UUID}`;
const OTHER_SRC = 'https://play.vidyard.com/U9TXHnmU2QDq9f5aKppsXx';
const ORIGIN = 'https://play.vidyard.com';

function video(
  seconds: number,
  captions: VidyardVideoAttributes['captions'] = []
): { video_attributes: VidyardVideoAttributes } {
  return {
    video_attributes: { length_in_milliseconds: seconds * 1000, length_in_seconds: Math.round(seconds), captions },
  };
}

/** Stands in for the Player API's player object, the way the embed script builds it and routes its messages. */
class FakePlayer {
  readonly listeners = new Map<string, Set<(data: unknown) => void>>();
  readonly container = document.createElement('div');
  readonly iframe = document.createElement('iframe');
  status: VidyardPlayerStatus = { chapterIndex: 0, currentTime: 0 };
  metadata: VidyardPlayerMetadata = { chapters_attributes: [video(128.25)] };

  play = vi.fn();
  pause = vi.fn();
  seek = vi.fn();
  setVolume = vi.fn();
  setPlaybackSpeed = vi.fn();
  enableCaption = vi.fn();
  disableCaption = vi.fn();
  playVideoAtIndex = vi.fn();

  constructor(
    readonly options: Record<string, unknown> & { container: HTMLElement },
    readonly uuid = String(options.uuid)
  ) {
    this.container.append(this.iframe);
    options.container.append(this.container);
  }

  on(event: string, listener: (data: unknown) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());

    this.listeners.get(event)!.add(listener);
  }

  off(event?: string, listener?: (data: unknown) => void) {
    if (!event) this.listeners.clear();
    else if (listener) this.listeners.get(event)?.delete(listener);
  }

  /** Deliver a message the way the embed script does: the status first, as a `timeupdate` when the time moved. */
  emit(event: string, params?: unknown, status: VidyardPlayerStatus = {}) {
    const previous = this.status.currentTime;

    this.status = { ...this.status, ...status };

    if (this.status.currentTime !== previous) this.#fire('timeupdate', this.status.currentTime);

    if (event !== 'status') this.#fire(event, params);
  }

  /** A status report alone, which the player sends about every 100 ms while it plays. */
  report(currentTime: number) {
    this.emit('status', undefined, { currentTime });
  }

  #fire(event: string, data: unknown) {
    for (const listener of this.listeners.get(event) ?? []) listener(data);
  }
}

let players: FakePlayer[];
let registered: FakePlayer[];
let ready: boolean;
// Resolves the players rendered while `ready` was off, as Vidyard does once each is ready.
let readyPending: () => void;
let renderPlayer: ReturnType<typeof vi.fn>;
let destroyPlayer: ReturnType<typeof vi.fn>;

beforeEach(() => {
  players = [];
  registered = [];
  ready = true;
  readyPending = () => {};
  renderPlayer = vi.fn((options: FakePlayer['options']) => {
    const player = new FakePlayer(options);

    players.push(player);
    registered.push(player);

    if (ready) return Promise.resolve(player);

    return new Promise((resolve) => {
      const previous = readyPending;

      readyPending = () => {
        previous();
        resolve(player);
      };
    });
  });
  // Splices every player registered after this one out too, as Vidyard's does.
  destroyPlayer = vi.fn((player: FakePlayer) => {
    const index = registered.indexOf(player);
    if (index < 0) return;

    player.off();
    player.container.remove();
    registered.splice(index);
  });

  (globalThis as { VidyardV4?: unknown }).VidyardV4 = {
    api: { renderPlayer, destroyPlayer },
    get players() {
      return registered;
    },
  };
});

afterEach(() => {
  delete (globalThis as { VidyardV4?: unknown }).VidyardV4;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function createContainer(): HTMLDivElement {
  const container = document.createElement('div');

  document.body.append(container);
  return container;
}

/** Flush the script load and `renderPlayer` the media awaits. */
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

async function attachAndReady(media: VidyardAdapter, source: VidyardSource = { src: SRC }) {
  if (!media.src) media.source = source;

  media.attach(createContainer());
  await flush();

  return players.at(-1)!;
}

function recordEvents(media: VidyardAdapter, types: string[]): string[] {
  const events: string[] = [];

  for (const type of types) media.addEventListener(type, () => events.push(type));

  return events;
}

describe('VidyardAdapter', () => {
  it('is a media with volume and a playback rate', () => {
    const media = new VidyardAdapter();

    expect(isMediaVolumeCapable(media)).toBe(true);
    expect(isMediaPlaybackRateCapable(media)).toBe(true);
    expect(media.playbackRateRange).toEqual({ min: 0.5, max: 2 });
  });

  describe('building the player', () => {
    it('renders the player in a shadow root of its own inside the container', async () => {
      const media = new VidyardAdapter();
      const events = recordEvents(media, ['loadstart']);
      const player = await attachAndReady(media);
      const [options] = renderPlayer.mock.calls[0]!;
      const mount = media.target!.firstElementChild as HTMLElement;

      expect(events).toEqual(['loadstart']);
      expect(options).toMatchObject({
        uuid: UUID,
        type: 'inline',
        hidden_controls: '1',
        disable_ctas: '1',
        viral_sharing: '0',
      });
      expect(options.container.getRootNode()).toBe(mount.shadowRoot);
      expect(mount.shadowRoot!.querySelector('style')!.textContent).toContain('!important');
      expect(media.engine).toBe(player);
      expect(media.currentSrc).toBe(SRC);
    });

    it('loads the embed script when the page has none', async () => {
      const api = (globalThis as { VidyardV4?: unknown }).VidyardV4;

      delete (globalThis as { VidyardV4?: unknown }).VidyardV4;
      loadScript.mockImplementationOnce(async () => {
        (globalThis as { VidyardV4?: unknown }).VidyardV4 = api;
      });

      const media = new VidyardAdapter();

      await attachAndReady(media);

      expect(loadScript).toHaveBeenCalledWith('https://play.vidyard.com/embed/v4.js');
      expect(media.engine).not.toBeNull();
    });

    it('reports a script that fails to load as a network error', async () => {
      delete (globalThis as { VidyardV4?: unknown }).VidyardV4;
      loadScript.mockRejectedValueOnce(new Error('blocked'));

      const media = new VidyardAdapter();

      await attachAndReady(media);

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    });

    it('reports a source that is not Vidyard as unsupported, without rendering', async () => {
      const media = new VidyardAdapter();

      await attachAndReady(media, { src: 'https://example.com/watch/video' });

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      expect(renderPlayer).not.toHaveBeenCalled();
    });

    it('reports a player Vidyard cannot render as a network error', async () => {
      renderPlayer.mockResolvedValueOnce(undefined);

      const media = new VidyardAdapter();

      await attachAndReady(media);

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    });

    it("reports the error page of a missing player, which Vidyard's own routing drops", async () => {
      ready = false;

      const media = new VidyardAdapter();
      const errors = recordEvents(media, ['error']);
      const player = await attachAndReady(media);
      const message = JSON.stringify({ event: 'error', params: { message: 'This video does not exist.' } });

      window.dispatchEvent(new MessageEvent('message', { data: message, origin: ORIGIN, source: window }));

      expect(errors).toEqual([]);

      window.dispatchEvent(
        new MessageEvent('message', { data: message, origin: ORIGIN, source: player.iframe.contentWindow })
      );

      expect(errors).toEqual(['error']);
      expect(media.error).toMatchObject({
        code: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
        context: 'This video does not exist.',
        message: MediaError.defaultMessages[MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED],
      });
    });

    it('reports the duration of the video on screen and the start position once ready', async () => {
      ready = false;

      const media = new VidyardAdapter();
      const events = recordEvents(media, ['durationchange', 'timeupdate', 'loadedmetadata']);
      const player = await attachAndReady(media, { src: `${SRC}?second=60` });

      expect(renderPlayer.mock.calls[0]![0]).toMatchObject({ second: '60' });
      expect(media.readyState).toBe(0);

      player.status.currentTime = 60;
      readyPending();
      await flush();

      expect(media.duration).toBe(128.25);
      expect(media.currentTime).toBe(60);
      expect(media.readyState).toBe(1);
      expect(events).toEqual(['durationchange', 'timeupdate', 'loadedmetadata']);
    });

    it('builds a new player for a new source, and announces the old one is gone', async () => {
      const media = new VidyardAdapter();
      const first = await attachAndReady(media);
      const events = recordEvents(media, ['emptied', 'loadstart']);

      media.src = OTHER_SRC;
      await flush();

      expect(destroyPlayer).toHaveBeenCalledWith(first);
      expect(renderPlayer.mock.calls[1]![0]).toMatchObject({ uuid: 'U9TXHnmU2QDq9f5aKppsXx' });
      expect(media.target!.children).toHaveLength(1);
      expect(events).toEqual(['emptied', 'loadstart']);
    });

    it('tears the player down on detach, keeping the other players on the page registered', async () => {
      const first = new VidyardAdapter();
      const second = new VidyardAdapter();
      const firstPlayer = await attachAndReady(first);
      const secondPlayer = await attachAndReady(second);
      const target = first.target!;

      first.detach();

      expect(destroyPlayer).toHaveBeenCalledWith(firstPlayer);
      expect(target.children).toHaveLength(0);
      expect(registered).toEqual([secondPlayer]);
      expect(first.engine).toBeNull();
    });

    it('tears down a player Vidyard is still building', async () => {
      ready = false;

      const media = new VidyardAdapter();
      const player = await attachAndReady(media);

      media.detach();

      expect(destroyPlayer).toHaveBeenCalledWith(player);
    });
  });

  describe('playback', () => {
    it('plays and pauses through the player, as it reports', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);
      const events = recordEvents(media, ['play', 'playing', 'canplay', 'pause', 'timeupdate']);

      await media.play();
      expect(player.play).toHaveBeenCalledOnce();
      expect(media.paused).toBe(true);

      player.emit('play', 0);
      expect(media.paused).toBe(false);
      expect(events).toEqual(['play']);

      player.report(0.1);
      player.report(0.2);
      expect(events).toEqual(['play', 'timeupdate', 'canplay', 'playing', 'timeupdate']);
      expect(media.currentTime).toBe(0.2);
      expect(media.readyState).toBe(3);

      media.pause();
      player.emit('pause');
      expect(player.pause).toHaveBeenCalledOnce();
      expect(media.paused).toBe(true);
      expect(events.at(-1)).toBe('pause');
    });

    it('holds a play made before the player is ready', async () => {
      const media = new VidyardAdapter();

      media.source = { src: SRC };
      await media.play();

      const player = await attachAndReady(media);

      expect(player.play).toHaveBeenCalledOnce();
    });

    it('mutes the player and plays it to autoplay muted', async () => {
      const media = new VidyardAdapter();

      media.autoplay = true;
      media.muted = true;

      const player = await attachAndReady(media);
      const [options] = renderPlayer.mock.calls[0]!;

      expect(options).not.toHaveProperty('autoplay');
      expect(player.setVolume).toHaveBeenCalledWith(0);
      expect(player.play).toHaveBeenCalledOnce();
      expect(player.setVolume.mock.invocationCallOrder[0]).toBeLessThan(player.play.mock.invocationCallOrder[0]!);
    });

    it('leaves an unmuted autoplay to Vidyard, which starts only with sound', async () => {
      const media = new VidyardAdapter();

      media.autoplay = true;

      const player = await attachAndReady(media);

      expect(renderPlayer.mock.calls[0]![0]).toMatchObject({ autoplay: '2' });
      expect(player.play).not.toHaveBeenCalled();

      // A browser that refuses sound leaves the player paused, as it reports.
      player.emit('play', 0);
      player.emit('pause');
      expect(media.paused).toBe(true);
    });

    it('pauses an unmuted autoplay withdrawn before the player was ready', async () => {
      ready = false;

      const media = new VidyardAdapter();

      media.autoplay = true;

      const player = await attachAndReady(media);

      media.pause();
      readyPending();
      await flush();

      expect(player.pause).toHaveBeenCalledOnce();
      expect(player.play).not.toHaveBeenCalled();
    });

    it('ends at the duration and ignores the start screen the player rewinds to', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);

      player.emit('play', 0);
      player.report(128.3);

      const events = recordEvents(media, ['timeupdate', 'pause', 'ended']);

      player.emit('playerComplete', undefined, { currentTime: 128.3 });
      player.emit('videoComplete', 0, { currentTime: 0 });

      expect(media.ended).toBe(true);
      expect(media.paused).toBe(true);
      expect(media.currentTime).toBe(128.25);
      expect(events).toEqual(['pause', 'ended']);

      await media.play();
      player.emit('play', 0, { currentTime: 0 });

      expect(media.ended).toBe(false);
      expect(media.currentTime).toBe(0);
    });

    it('starts over at the end instead of ending while looping', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);
      const events = recordEvents(media, ['ended', 'pause']);

      media.loop = true;
      player.emit('play', 0);
      player.emit('playerComplete', undefined, { currentTime: 128.3 });

      expect(player.play).toHaveBeenCalledOnce();
      expect(media.ended).toBe(false);
      expect(events).toEqual([]);
    });
  });

  describe('seeking', () => {
    it('seeks through the player and lands on its beforeSeek report', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);
      const events = recordEvents(media, ['seeking', 'seeked', 'timeupdate']);

      player.emit('play', 0);
      media.currentTime = 60;

      expect(player.seek).toHaveBeenCalledWith(60);
      expect(media.seeking).toBe(true);
      expect(events).toEqual(['seeking', 'timeupdate']);

      // A report from before the seek landed doesn't drag the position back.
      player.report(4.2);
      expect(media.currentTime).toBe(60);

      player.emit('beforeSeek', { start: 4.2 }, { currentTime: 60 });
      expect(media.seeking).toBe(false);
      expect(events).toEqual(['seeking', 'timeupdate', 'seeked']);
    });

    it('settles a seek the player never answers', async () => {
      vi.useFakeTimers();

      const media = new VidyardAdapter();

      await attachAndReady(media);
      media.currentTime = 10;
      vi.advanceTimersByTime(2_000);

      expect(media.seeking).toBe(false);
    });

    it('clamps a seek to the video', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);

      media.currentTime = 500;

      expect(player.seek).toHaveBeenCalledWith(128.25);
    });

    it("reports a seek made in Vidyard's own controls once the viewer lets go", async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);
      const events = recordEvents(media, ['seeking', 'seeked']);

      player.emit('beforeSeek', { start: 4 }, { currentTime: 30 });
      player.emit('beforeSeek', { start: 30 }, { currentTime: 41.5 });
      expect(events).toEqual(['seeking']);
      expect(media.seeking).toBe(true);

      player.emit('seek', [4, 41.5], { currentTime: 41.5 });

      expect(events).toEqual(['seeking', 'seeked']);
      expect(media.currentTime).toBe(41.5);
    });

    it("reports a click in Vidyard's own controls, which sends seek alone", async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);
      const events = recordEvents(media, ['seeking', 'seeked']);

      player.emit('seek', [4, 41.5], { currentTime: 41.5 });

      expect(events).toEqual(['seeking', 'seeked']);
      expect(media.currentTime).toBe(41.5);
    });

    it('seeks once the player is ready to a position set before', async () => {
      ready = false;

      const media = new VidyardAdapter();
      const player = await attachAndReady(media);

      media.currentTime = 30;
      expect(player.seek).not.toHaveBeenCalled();

      readyPending();
      await flush();

      expect(player.seek).toHaveBeenCalledWith(30);
      expect(media.currentTime).toBe(30);
    });

    it('starts a new source at a position set while it loads', async () => {
      const media = new VidyardAdapter();

      await attachAndReady(media);
      media.src = OTHER_SRC;
      media.currentTime = 12;
      await flush();

      expect(players.at(-1)!.seek).toHaveBeenCalledWith(12);
    });
  });

  describe('volume', () => {
    it('sets the level through the player and ignores its echo', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);
      const events = recordEvents(media, ['volumechange']);

      media.volume = 0.5;
      media.volume = 0.8;
      player.emit('volumeChange', 0.5);
      player.emit('volumeChange', 0.8);

      expect(player.setVolume.mock.calls).toEqual([[0.5], [0.8]]);
      expect(media.volume).toBe(0.8);
      expect(events).toEqual(['volumechange', 'volumechange']);
    });

    it('mutes by setting the level to 0, and restores it on unmute', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);

      media.volume = 0.6;
      media.muted = true;
      media.volume = 0.4;
      media.muted = false;

      expect(player.setVolume.mock.calls).toEqual([[0.6], [0], [0.4]]);
      expect(media.volume).toBe(0.4);
    });

    it("follows a level or mute set in Vidyard's own controls", async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);
      const events = recordEvents(media, ['volumechange']);

      player.emit('volumeChange', 0);
      expect(media.muted).toBe(true);
      expect(media.volume).toBe(1);

      player.emit('volumeChange', 0.3);
      expect(media.muted).toBe(false);
      expect(media.volume).toBe(0.3);
      expect(events).toEqual(['volumechange', 'volumechange']);
    });

    it('applies a level and mute set before the player was ready', async () => {
      const media = new VidyardAdapter();

      media.defaultMuted = true;

      const player = await attachAndReady(media);

      expect(media.muted).toBe(true);
      expect(player.setVolume).toHaveBeenCalledWith(0);
    });
  });

  describe('playback rate', () => {
    it('sets the rate through the player and announces it', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);
      const events = recordEvents(media, ['ratechange']);

      media.playbackRate = 1.5;

      expect(player.setPlaybackSpeed).toHaveBeenCalledWith(1.5);
      expect(media.playbackRate).toBe(1.5);
      expect(events).toEqual(['ratechange']);
    });

    it('applies a rate set before the player was ready', async () => {
      const media = new VidyardAdapter();

      media.playbackRate = 2;

      const player = await attachAndReady(media);

      expect(player.setPlaybackSpeed).toHaveBeenCalledWith(2);
    });
  });

  describe('playlists', () => {
    it('follows the player to the next video of its playlist', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);

      player.metadata = { chapters_attributes: [video(120), video(140.5, [{ name: 'English', language: 'en' }])] };
      player.emit('play', 0);
      player.report(119.9);

      const events = recordEvents(media, ['durationchange', 'timeupdate', 'ended']);

      player.emit('play', 0, { chapterIndex: 1, currentTime: 0 });
      player.emit('videoComplete', 1);
      // The player still reports the previous video once after moving on.
      player.emit('status', undefined, { chapterIndex: 0, currentTime: 121.28 });
      player.emit('status', undefined, { chapterIndex: 1, currentTime: 0.2 });

      expect(media.duration).toBe(140.5);
      expect(media.currentTime).toBe(0.2);
      expect(media.ended).toBe(false);
      expect(events).toEqual(['durationchange', 'timeupdate', 'timeupdate']);
      expect(Array.from(media.textTracks!, (track) => track.language)).toEqual(['en']);
    });
  });

  describe('captions', () => {
    const captions = [
      { name: 'English', language: 'en', is_default: true },
      { name: 'Deutsch', language: 'de' },
    ];

    it("lists the video's caption tracks, the default one showing", async () => {
      const media = new VidyardAdapter();
      const player = new Promise<FakePlayer>((resolve) => {
        renderPlayer.mockImplementationOnce((options: FakePlayer['options']) => {
          const created = new FakePlayer(options);

          created.metadata = { chapters_attributes: [video(60, captions)] };
          players.push(created);
          resolve(created);
          return Promise.resolve(created);
        });
      });

      await attachAndReady(media);
      await player;

      const tracks = Array.from(media.textTracks!);

      expect(tracks.map((track) => [track.kind, track.label, track.language, track.mode])).toEqual([
        ['captions', 'English', 'en', 'showing'],
        ['captions', 'Deutsch', 'de', 'disabled'],
      ]);
    });

    it('shows and hides captions through the player', async () => {
      const media = new VidyardAdapter();

      renderPlayer.mockImplementationOnce((options: FakePlayer['options']) => {
        const created = new FakePlayer(options);

        created.metadata = { chapters_attributes: [video(60, captions)] };
        players.push(created);
        return Promise.resolve(created);
      });

      const player = await attachAndReady(media);
      const [english, german] = Array.from(media.textTracks!);

      expect(player.enableCaption).toHaveBeenCalledWith('English', 'en');

      english!.mode = 'disabled';
      german!.mode = 'showing';
      await flush();
      expect(player.enableCaption).toHaveBeenLastCalledWith('Deutsch', 'de');

      german!.mode = 'disabled';
      await flush();
      expect(player.disableCaption).toHaveBeenCalledOnce();
    });

    it('sends no caption command for a video without captions', async () => {
      const media = new VidyardAdapter();
      const player = await attachAndReady(media);

      expect(media.textTracks!.length).toBe(0);
      expect(player.enableCaption).not.toHaveBeenCalled();
      expect(player.disableCaption).not.toHaveBeenCalled();
    });
  });

  describe('source', () => {
    it('announces every source change, and loads only for a new player or parameters', async () => {
      const media = new VidyardAdapter();

      await attachAndReady(media);

      const sourceChanges = recordEvents(media, ['sourcechange']);
      const engine = { vidyard: { quality: '720p' } };

      media.source = { src: SRC, engine };
      await flush();
      media.source = { src: SRC, engine: { vidyard: { quality: '720p' } } };
      await flush();

      expect(sourceChanges).toEqual(['sourcechange', 'sourcechange']);
      expect(renderPlayer).toHaveBeenCalledTimes(2);
      expect(renderPlayer.mock.calls[1]![0]).toMatchObject({ quality: '720p' });
    });

    it('keeps the player parameters when src changes', () => {
      const media = new VidyardAdapter();

      media.source = { src: SRC, engine: { vidyard: { quality: '720p' } } };
      media.src = OTHER_SRC;

      expect(media.source).toEqual({ src: OTHER_SRC, engine: { vidyard: { quality: '720p' } } });
    });

    it('builds nothing for an empty source', async () => {
      const media = new VidyardAdapter();

      media.attach(createContainer());
      await flush();

      expect(renderPlayer).not.toHaveBeenCalled();
      expect(media.error).toBeNull();
    });
  });

  it('implements the Video members a skin reads', () => {
    const media: Partial<Video> = new VidyardAdapter();

    expect(media.buffered?.length).toBe(0);
    expect(media.seekable?.length).toBe(0);
  });
});
