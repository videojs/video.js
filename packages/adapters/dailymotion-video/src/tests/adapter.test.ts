import { isMediaPlaybackRateCapable, isMediaVolumeCapable, MediaError, type Video } from '@videojs/media';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vite-plus/test';

import { DailymotionAdapter, type DailymotionPlayerState, resolveDailymotionPlayerOptions } from '..';

const VIDEO_SRC = 'https://www.dailymotion.com/video/x84sh87';
const OTHER_VIDEO_SRC = 'https://www.dailymotion.com/video/x7tgad0';
const PLAYER = 'x8lr5';
const EMBED_SRC = `https://geo.dailymotion.com/player/${PLAYER}.html?video=x84sh87`;

// The event names the SDK's `dailymotion.events` maps its constants to.
const EVENTS = {
  VIDEO_PLAY: 'play',
  VIDEO_PAUSE: 'pause',
  VIDEO_PLAYING: 'playing',
  VIDEO_BUFFERING: 'waiting',
  VIDEO_TIMECHANGE: 'timeupdate',
  VIDEO_DURATIONCHANGE: 'video_durationchange',
  VIDEO_SEEKSTART: 'seeking',
  VIDEO_SEEKEND: 'seeked',
  VIDEO_END: 'video_end',
  AD_PLAY: 'ad_play',
  AD_PAUSE: 'ad_pause',
  PLAYER_VOLUMECHANGE: 'volumechange',
  PLAYER_PLAYBACKSPEEDCHANGE: 'playbackspeedchange',
  PLAYER_PLAYBACKPERMISSION: 'playback_resolution',
  PLAYER_VIDEOCHANGE: 'videochange',
  PLAYER_ERROR: 'error',
} as const;

/** Stands in for the player object `createPlayer` resolves with, the way the SDK builds and tears it down. */
class FakePlayer {
  readonly listeners = new Map<string, Set<(state: DailymotionPlayerState) => void>>();
  state: DailymotionPlayerState = { videoDuration: 25, videoTime: 0, playerVolume: 1, playerIsMuted: false };
  readonly root = document.createElement('div');

  play = vi.fn();
  pause = vi.fn();
  seek = vi.fn();
  // The player has no mute of its own: a level of `0` is what reads back as muted.
  setVolume = vi.fn((volume: number) => {
    Object.assign(this.state, { playerVolume: volume, playerIsMuted: volume === 0 });
  });
  // Rounds up to Dailymotion's quarter steps and caps at 2, without a speed-change report, as the player does.
  setPlaybackSpeed = vi.fn((speed: number) => {
    this.state.playerPlaybackSpeed = Math.min(2, Math.ceil(speed * 4) / 4);
  });
  setLoop = vi.fn();
  updateParams = vi.fn();
  loadContent = vi.fn();
  destroy = vi.fn(() => this.root.replaceWith(this.placeholder));

  constructor(
    readonly placeholder: HTMLElement,
    readonly options: { video: string; player?: string; params?: Record<string, unknown> }
  ) {
    placeholder.replaceWith(this.root);
  }

  getState = vi.fn(async () => ({ ...this.state }));
  settings: { autostart?: string } = { autostart: 'off' };
  // Unlike `getState`, the SDK answers this one synchronously.
  getSettings = vi.fn(() => ({ ...this.settings }));

  on(event: string, listener: (state: DailymotionPlayerState) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());

    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (state: DailymotionPlayerState) => void) {
    this.listeners.get(event)?.delete(listener);
  }

  /** Report an event the way the SDK does: with the state read after it. */
  emit(event: keyof typeof EVENTS, state: DailymotionPlayerState = {}) {
    Object.assign(this.state, state);

    for (const listener of this.listeners.get(EVENTS[event]) ?? []) listener({ ...this.state });
  }
}

let players: FakePlayer[];
let createPlayer: Mock<(id: string, options: FakePlayer['options']) => Promise<FakePlayer>>;

beforeEach(() => {
  players = [];
  createPlayer = vi.fn(async (id: string, options: FakePlayer['options']) => {
    const placeholder = document.getElementById(id);
    if (!placeholder) throw new Error(`DOM element ID not found : #${id}`);

    const player = new FakePlayer(placeholder, options);

    players.push(player);
    return player;
  });

  (globalThis as { dailymotion?: unknown }).dailymotion = { createPlayer, events: EVENTS };
});

afterEach(() => {
  delete (globalThis as { dailymotion?: unknown }).dailymotion;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function source(src = VIDEO_SRC, dailymotion: Record<string, unknown> = {}) {
  return { src, engine: { dailymotion: { player: PLAYER, ...dailymotion } } };
}

function createContainer(): HTMLDivElement {
  const container = document.createElement('div');

  document.body.append(container);
  return container;
}

/** Flush the SDK load and `createPlayer` the adapter awaits, and the state read that follows. */
async function flush(): Promise<void> {
  for (let i = 0; i < 10; i++) await Promise.resolve();
}

async function attachAndReady(media: DailymotionAdapter) {
  if (!media.src) media.source = source();

  const container = createContainer();

  media.attach(container);
  await flush();

  const player = players.at(-1);
  if (!player) throw new Error('no player was created');

  return { container, player };
}

describe('resolveDailymotionPlayerOptions', () => {
  it('names the video and the player configuration', () => {
    expect(resolveDailymotionPlayerOptions(VIDEO_SRC, { source: source() })).toEqual({
      video: 'x84sh87',
      player: PLAYER,
      params: { loop: false, autoplay: false },
    });
  });

  it('takes the player configuration a player embed URL names', () => {
    expect(resolveDailymotionPlayerOptions(EMBED_SRC)?.player).toBe(PLAYER);
  });

  it('prefers the configured player over the one the URL names', () => {
    expect(
      resolveDailymotionPlayerOptions(EMBED_SRC, { source: source(EMBED_SRC, { player: 'xother' }) })?.player
    ).toBe('xother');
  });

  it('returns null without a player configuration, which Dailymotion refuses to embed without', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(resolveDailymotionPlayerOptions(VIDEO_SRC)).toBe(null);
    expect(console.warn).toHaveBeenCalledOnce();
  });

  it('returns null for a source that is not a Dailymotion video', () => {
    expect(resolveDailymotionPlayerOptions('https://example.com/video.mp4', { source: source() })).toBe(null);
  });

  it('passes engine options as runtime parameters beside loop and autoplay, and the referrer policy beside them', () => {
    const options = resolveDailymotionPlayerOptions(VIDEO_SRC, {
      autoplay: true,
      loop: true,
      source: source(VIDEO_SRC, { startTime: 30, customConfig: { section: 'news' }, referrerPolicy: 'origin' }),
    });

    expect(options).toEqual({
      video: 'x84sh87',
      player: PLAYER,
      params: { startTime: 30, customConfig: { section: 'news' }, loop: true, autoplay: true },
      referrerPolicy: 'origin',
    });
  });
});

describe('DailymotionAdapter', () => {
  it('has default props', () => {
    expect(DailymotionAdapter.defaultProps).toEqual({
      src: '',
      autoplay: false,
      defaultMuted: false,
      muted: false,
      loop: false,
      controls: false,
      playsInline: true,
      preload: 'metadata',
      poster: '',
      source: null,
    });
  });

  it('satisfies the media capability contracts the player reads', () => {
    const media = new DailymotionAdapter();

    expect(isMediaVolumeCapable(media)).toBe(true);
    expect(isMediaPlaybackRateCapable(media)).toBe(true);
    // Compile-time check that it implements the `Video` surface it claims.
    const video: Partial<Video> = media;

    expect(video).toBe(media);
  });

  describe('load', () => {
    it('creates the player in a placeholder the SDK can find by id, and announces loadstart', async () => {
      const media = new DailymotionAdapter();
      const loadstart = vi.fn();

      media.addEventListener('loadstart', loadstart);
      media.source = source();

      const container = createContainer();

      media.attach(container);

      const placeholder = container.firstElementChild!;

      expect(placeholder.id).toMatch(/^videojs-dailymotion-/);
      expect(loadstart).toHaveBeenCalledOnce();

      await flush();

      expect(createPlayer).toHaveBeenCalledWith(placeholder.id, {
        video: 'x84sh87',
        player: PLAYER,
        params: { loop: false, autoplay: false },
      });
      expect(media.engine).toBe(players[0]);
      expect(media.currentSrc).toBe(VIDEO_SRC);
    });

    it('makes the player fill the container rather than keep the configured aspect ratio', async () => {
      const { player } = await attachAndReady(new DailymotionAdapter());

      expect(player.updateParams).toHaveBeenCalledWith({ aspectRatio: 'inherit' });
    });

    it('reports metadata once the player is ready, and reads its state', async () => {
      const media = new DailymotionAdapter();
      const loadedmetadata = vi.fn();
      const loadcomplete = vi.fn();

      media.addEventListener('loadedmetadata', loadedmetadata);
      media.addEventListener('loadcomplete', loadcomplete);

      await attachAndReady(media);

      expect(loadedmetadata).toHaveBeenCalledOnce();
      expect(loadcomplete).toHaveBeenCalledOnce();
      expect(media.readyState).toBe(1);
      expect(media.duration).toBe(25);
    });

    it('loads a new video into the running player when only the video changes', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);
      const emptied = vi.fn();
      const loadcomplete = vi.fn();

      media.addEventListener('emptied', emptied);
      media.addEventListener('loadcomplete', loadcomplete);
      media.source = source(OTHER_VIDEO_SRC);
      await flush();

      expect(player.loadContent).toHaveBeenCalledWith({ video: 'x7tgad0' });
      expect(media.currentSrc).toBe(OTHER_VIDEO_SRC);
      expect(createPlayer).toHaveBeenCalledOnce();
      expect(emptied).toHaveBeenCalledOnce();
      expect(media.duration).toBeNaN();

      player.emit('PLAYER_VIDEOCHANGE', { videoId: 'x7tgad0', videoDuration: 86 });

      expect(loadcomplete).toHaveBeenCalledOnce();
      expect(media.duration).toBe(86);
    });

    it('rebuilds the player for a new video when autoplay changed, since the player reads it only when created', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      media.autoplay = true;
      media.source = source(OTHER_VIDEO_SRC);
      await flush();

      expect(player.loadContent).not.toHaveBeenCalled();
      expect(createPlayer.mock.calls[1]![1].params).toEqual({ loop: false, autoplay: true });
    });

    it('drops a load still waiting when attaching creates the player instead', async () => {
      const media = new DailymotionAdapter();
      const next = createContainer();
      const events: string[] = [];

      media.source = source();
      media.attach(createContainer());
      await flush();

      for (const type of ['emptied', 'loadstart']) media.addEventListener(type, () => events.push(type));

      media.source = source(OTHER_VIDEO_SRC);
      media.attach(next);
      await flush();

      expect(events).toEqual(['loadstart']);
      expect(createPlayer).toHaveBeenCalledTimes(2);
      expect(next.firstElementChild).toBe(players[1]!.root);
    });

    it('rebuilds the player when the runtime parameters change', async () => {
      const media = new DailymotionAdapter();
      const { container, player } = await attachAndReady(media);

      media.source = source(VIDEO_SRC, { startTime: 10 });
      await flush();

      expect(player.destroy).toHaveBeenCalledOnce();
      expect(createPlayer).toHaveBeenCalledTimes(2);
      expect(createPlayer.mock.calls[1]![1].params).toEqual({ startTime: 10, loop: false, autoplay: false });
      // The outgoing player's placeholder is gone; only the new player is left in the container.
      expect(container.children).toHaveLength(1);
      expect(container.firstElementChild).toBe(players[1]!.root);
    });

    it('ignores reports from a player that was replaced', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      media.source = source(VIDEO_SRC, { startTime: 10 });
      await flush();

      player.emit('VIDEO_TIMECHANGE', { videoTime: 12 });

      expect(media.currentTime).toBe(0);
    });

    it('destroys a player that finishes creating after it was superseded', async () => {
      let resolve!: () => void;
      const created = new Promise<void>((r) => {
        resolve = r;
      });
      const create = createPlayer.getMockImplementation()!;

      createPlayer.mockImplementationOnce(async (id, options) => {
        const player = await create(id, options);

        await created;
        return player;
      });

      const media = new DailymotionAdapter();

      media.source = source();
      media.attach(createContainer());
      await flush();

      expect(createPlayer).toHaveBeenCalledOnce();

      media.detach();
      resolve();
      await flush();

      expect(players[0]!.destroy).toHaveBeenCalledOnce();
      expect(media.engine).toBe(null);
    });

    it('reports a source without a player configuration as an unsupported source', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const media = new DailymotionAdapter();
      const error = vi.fn();

      media.addEventListener('error', error);
      media.src = VIDEO_SRC;
      media.attach(createContainer());

      expect(error).toHaveBeenCalledOnce();
      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      expect(media.error?.message).toMatch(/Player ID/);
      expect(createPlayer).not.toHaveBeenCalled();
    });

    it('reports an unrecognized src as an unsupported source', () => {
      const media = new DailymotionAdapter();

      media.source = source('https://example.com/video.mp4');
      media.attach(createContainer());

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      expect(media.error?.message).toMatch(/Unrecognized Dailymotion source/);
    });

    it('reports a player the SDK fails to create with the reason it gives', async () => {
      createPlayer.mockRejectedValueOnce(new Error('Player options invalid'));

      const media = new DailymotionAdapter();

      media.source = source();
      media.attach(createContainer());
      await flush();

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_CUSTOM);
      expect(media.error?.message).toMatch(/Player options invalid/);
    });

    it('reports a container inside a shadow root, which the SDK cannot find by id', () => {
      const host = createContainer();
      const container = document.createElement('div');

      host.attachShadow({ mode: 'open' }).append(container);

      const media = new DailymotionAdapter();

      media.source = source();
      media.attach(container);

      expect(media.error?.message).toMatch(/shadow root/);
      expect(container.children).toHaveLength(0);
      expect(createPlayer).not.toHaveBeenCalled();
    });

    it('waits for a container out of the page, which the SDK cannot find, and creates on the next load', async () => {
      const container = document.createElement('div');
      const media = new DailymotionAdapter();

      media.source = source();
      media.attach(container);
      await flush();

      expect(media.error).toBeNull();
      expect(container.children).toHaveLength(0);
      expect(createPlayer).not.toHaveBeenCalled();

      document.body.append(container);
      await media.load();
      await flush();

      expect(createPlayer).toHaveBeenCalledOnce();
    });

    it('keeps the running player when only the video changes after loop was toggled', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      media.loop = true;
      media.source = source(OTHER_VIDEO_SRC);
      await flush();

      expect(player.setLoop).toHaveBeenCalledWith(true);
      expect(player.loadContent).toHaveBeenCalledWith({ video: 'x7tgad0' });
      expect(createPlayer).toHaveBeenCalledOnce();
    });

    it('destroys the player on detach, leaving the container as it was rendered', async () => {
      const media = new DailymotionAdapter();
      const { container, player } = await attachAndReady(media);

      media.detach();
      player.emit('VIDEO_TIMECHANGE', { videoTime: 5 });

      expect(player.destroy).toHaveBeenCalledOnce();
      expect(container.children).toHaveLength(0);
      expect(media.currentTime).toBe(0);
      expect(media.engine).toBe(null);
    });
  });

  describe('state sync', () => {
    it('applies the state the player starts in', async () => {
      const create = createPlayer.getMockImplementation()!;

      createPlayer.mockImplementationOnce(async (id, options) => {
        const player = await create(id, options);

        player.state = {
          videoDuration: 214,
          videoTime: 60,
          playerVolume: 0.5,
          playerIsMuted: false,
          playerPlaybackSpeed: 1.5,
          playerIsPlaying: true,
        };
        return player;
      });

      const media = new DailymotionAdapter();
      const play = vi.fn();

      media.addEventListener('play', play);
      await attachAndReady(media);

      expect(media.duration).toBe(214);
      expect(media.currentTime).toBe(60);
      expect(media.volume).toBe(0.5);
      expect(media.playbackRate).toBe(1.5);
      expect(media.paused).toBe(false);
      expect(play).toHaveBeenCalledOnce();
    });
  });

  describe('playback', () => {
    it('calls play and pause once ready', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      void media.play();
      media.pause();

      expect(player.play).toHaveBeenCalledOnce();
      expect(player.pause).toHaveBeenCalledOnce();
    });

    it('holds a play asked for before ready and replays it then', async () => {
      const media = new DailymotionAdapter();

      media.source = source();
      media.attach(createContainer());
      void media.play();
      await flush();

      expect(players[0]!.play).toHaveBeenCalledOnce();
    });

    it('holds a play asked for before attach', async () => {
      const media = new DailymotionAdapter();

      media.source = source();
      void media.play();
      media.attach(createContainer());
      await flush();

      expect(players[0]!.play).toHaveBeenCalledOnce();
    });

    it('keeps a held play when autoplay turns off before ready', async () => {
      const media = new DailymotionAdapter();

      media.autoplay = true;
      media.source = source();
      media.attach(createContainer());
      void media.play();
      media.autoplay = false;
      await flush();

      expect(players[0]!.play).toHaveBeenCalledOnce();
    });

    it('drops autoplay when paused before ready, since the pause is the later intent', async () => {
      const media = new DailymotionAdapter();

      media.autoplay = true;
      media.source = source();
      media.attach(createContainer());
      media.pause();
      await flush();

      expect(players[0]!.play).not.toHaveBeenCalled();
    });

    it('drops a held play when paused before ready', async () => {
      const media = new DailymotionAdapter();

      media.source = source();
      media.attach(createContainer());
      void media.play();
      media.pause();
      await flush();

      expect(players[0]!.play).not.toHaveBeenCalled();
    });

    it('warns once per player configuration that starts playback while autoplay is off', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      createPlayer.mockImplementation(async (id, options) => {
        const player = new FakePlayer(document.getElementById(id)!, options);

        player.settings = { autostart: 'firstTimeViewable' };
        players.push(player);
        return player;
      });

      const media = new DailymotionAdapter();

      media.source = source(VIDEO_SRC, { player: 'xautostart' });
      media.attach(createContainer());
      await flush();
      media.source = source(VIDEO_SRC, { player: 'xautostart', startTime: 5 });
      await flush();

      expect(players).toHaveLength(2);
      expect(warn).toHaveBeenCalledExactlyOnceWith(expect.stringMatching(/xautostart starts playback itself/));
    });

    it('does not warn about autostart when autoplay is on or the configuration leaves it off', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await attachAndReady(new DailymotionAdapter());

      const media = new DailymotionAdapter();

      media.autoplay = true;
      createPlayer.mockImplementationOnce(async (id, options) => {
        const player = new FakePlayer(document.getElementById(id)!, options);

        player.settings = { autostart: 'on' };
        players.push(player);
        return player;
      });
      await attachAndReady(media);

      expect(warn).not.toHaveBeenCalled();
    });

    it('still loads when the player cannot report its settings', async () => {
      const media = new DailymotionAdapter();
      const loadedmetadata = vi.fn();

      createPlayer.mockImplementationOnce(async (id, options) => {
        const player = new FakePlayer(document.getElementById(id)!, options);

        player.getSettings.mockImplementation(() => {
          throw new Error('not supported');
        });
        players.push(player);
        return player;
      });
      media.addEventListener('loadedmetadata', loadedmetadata);
      await attachAndReady(media);

      expect(loadedmetadata).toHaveBeenCalledOnce();
    });

    it('plays on ready with autoplay, since the player configuration owns autostart', async () => {
      const media = new DailymotionAdapter();

      media.autoplay = true;

      const { player } = await attachAndReady(media);

      expect(player.play).toHaveBeenCalledOnce();
    });

    it('maps play, playing, pause, buffering, and end to media events', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);
      const events: string[] = [];

      for (const type of ['play', 'playing', 'pause', 'waiting', 'ended']) {
        media.addEventListener(type, () => events.push(type));
      }

      player.emit('VIDEO_PLAY');
      player.emit('VIDEO_PLAYING');
      player.emit('VIDEO_BUFFERING');
      player.emit('VIDEO_END');

      expect(events).toEqual(['play', 'playing', 'waiting', 'pause', 'ended']);
      expect(media.paused).toBe(true);
      expect(media.ended).toBe(true);
      expect(media.readyState).toBe(3);
    });

    it('does not end when looping, since the player restarts itself', async () => {
      const media = new DailymotionAdapter();

      media.loop = true;

      const { player } = await attachAndReady(media);

      player.emit('VIDEO_PLAY');
      player.emit('VIDEO_END');

      expect(media.ended).toBe(false);
      expect(media.paused).toBe(false);
    });

    it('reports a refused playback as paused', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);
      const pause = vi.fn();

      player.emit('VIDEO_PLAY');
      media.addEventListener('pause', pause);
      player.emit('PLAYER_PLAYBACKPERMISSION', { playerPlaybackPermissionReason: 'rejectedByBrowser' });

      expect(media.paused).toBe(true);
      expect(pause).toHaveBeenCalledOnce();
    });

    it('takes an allowed playback as no change', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      player.emit('VIDEO_PLAY');
      player.emit('PLAYER_PLAYBACKPERMISSION', { playerPlaybackPermissionReason: 'allowedFallbackMuted' });

      expect(media.paused).toBe(false);
    });

    it('tracks the position and duration of the video', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      player.emit('VIDEO_DURATIONCHANGE', { videoDuration: 100 });
      player.emit('VIDEO_TIMECHANGE', { videoTime: 10 });

      expect(media.duration).toBe(100);
      expect(media.currentTime).toBe(10);
      expect(media.buffered.end(0)).toBe(10);
      expect(media.seekable.end(0)).toBe(100);
    });

    it('treats an ad as playback without letting it touch the video position', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      player.emit('AD_PLAY', { adIsPlaying: true });

      expect(media.paused).toBe(false);
      expect(media.duration).toBe(25);
      expect(media.currentTime).toBe(0);

      player.emit('AD_PAUSE');

      expect(media.paused).toBe(true);
    });
  });

  describe('loop', () => {
    it('changes looping in place once ready', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      media.loop = true;

      expect(player.setLoop).toHaveBeenCalledWith(true);
    });

    it('applies a change made while the player was being created', async () => {
      const media = new DailymotionAdapter();

      media.source = source();
      media.attach(createContainer());
      media.loop = true;
      await flush();

      const [player] = players;

      expect(player!.options.params).toEqual({ loop: false, autoplay: false });
      expect(player!.setLoop).toHaveBeenCalledWith(true);

      media.source = source(OTHER_VIDEO_SRC);
      await flush();

      expect(player!.loadContent).toHaveBeenCalledWith({ video: 'x7tgad0' });
      expect(createPlayer).toHaveBeenCalledOnce();
    });
  });

  describe('seeking', () => {
    it('reports the requested position at once and settles on seeked', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);
      const events: string[] = [];

      for (const type of ['seeking', 'seeked', 'timeupdate']) {
        media.addEventListener(type, () => events.push(type));
      }

      media.currentTime = 15;

      expect(media.seeking).toBe(true);
      expect(player.seek).toHaveBeenCalledWith(15);

      // A position from before the seek landed would drag the slider back.
      player.emit('VIDEO_TIMECHANGE', { videoTime: 2 });
      expect(media.currentTime).toBe(15);

      player.emit('VIDEO_SEEKEND', { videoTime: 15.1 });

      expect(media.seeking).toBe(false);
      expect(media.currentTime).toBe(15.1);
      expect(events).toEqual(['seeking', 'timeupdate', 'timeupdate', 'seeked']);
    });

    it('settles a seek the player never reports the end of, from the state it then reports', async () => {
      vi.useFakeTimers();

      try {
        const media = new DailymotionAdapter();
        const { player } = await attachAndReady(media);
        const seeked = vi.fn();

        media.addEventListener('seeked', seeked);
        media.currentTime = 15;
        player.state.videoTime = 14.9;

        await vi.advanceTimersByTimeAsync(2_000);

        expect(media.seeking).toBe(false);
        expect(media.currentTime).toBe(14.9);
        expect(seeked).toHaveBeenCalledOnce();

        player.emit('VIDEO_TIMECHANGE', { videoTime: 16 });

        expect(media.currentTime).toBe(16);
      } finally {
        vi.useRealTimers();
      }
    });

    it('keeps the requested position when the player is still where the seek started', async () => {
      vi.useFakeTimers();

      try {
        const media = new DailymotionAdapter();
        const { player } = await attachAndReady(media);
        const seeked = vi.fn();

        media.addEventListener('seeked', seeked);
        media.currentTime = 15;

        await vi.advanceTimersByTimeAsync(2_000);

        expect(media.seeking).toBe(false);
        expect(media.currentTime).toBe(15);

        player.emit('VIDEO_SEEKEND', { videoTime: 15.1 });

        expect(media.currentTime).toBe(15.1);
        expect(seeked).toHaveBeenCalledOnce();
      } finally {
        vi.useRealTimers();
      }
    });

    it('leaves a later seek alone when an earlier one times out', async () => {
      vi.useFakeTimers();

      try {
        const media = new DailymotionAdapter();
        const { player } = await attachAndReady(media);

        media.currentTime = 5;
        await vi.advanceTimersByTimeAsync(1_500);
        media.currentTime = 15;
        await vi.advanceTimersByTimeAsync(600);

        expect(media.seeking).toBe(true);
        expect(media.currentTime).toBe(15);

        player.emit('VIDEO_SEEKEND', { videoTime: 15 });

        expect(media.seeking).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    it('announces a seek made in the player chrome', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);
      const seeking = vi.fn();

      media.addEventListener('seeking', seeking);
      player.emit('VIDEO_SEEKSTART');

      expect(media.seeking).toBe(true);
      expect(seeking).toHaveBeenCalledOnce();
    });

    it('holds a seek asked for before ready and sends it then', async () => {
      const media = new DailymotionAdapter();

      media.source = source();
      media.attach(createContainer());
      media.currentTime = 20;
      await flush();

      expect(players[0]!.seek).toHaveBeenCalledWith(20);
    });
  });

  describe('volume', () => {
    it('sets the level and announces the change', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);
      const volumechange = vi.fn();

      media.addEventListener('volumechange', volumechange);
      media.volume = 0.4;

      expect(player.setVolume).toHaveBeenCalledWith(0.4);
      expect(volumechange).toHaveBeenCalledOnce();
    });

    it('mutes with a level of 0, since setMute is deprecated, and unmutes back to the level held', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      media.volume = 0.4;
      media.muted = true;
      media.muted = false;

      expect(player.setVolume.mock.calls.map(([volume]) => volume)).toEqual([0.4, 0, 0.4]);
    });

    it('holds a level set while muted until the unmute', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      media.muted = true;
      player.setVolume.mockClear();
      media.volume = 0.3;

      expect(player.setVolume).not.toHaveBeenCalled();

      media.muted = false;
      expect(player.setVolume).toHaveBeenCalledWith(0.3);
    });

    it('asserts a mute set before ready', async () => {
      const media = new DailymotionAdapter();

      media.defaultMuted = true;

      const { player } = await attachAndReady(media);

      expect(media.muted).toBe(true);
      expect(player.setVolume).toHaveBeenCalledWith(0);
    });

    it('takes a mute made in the player chrome without losing the level', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);
      const volumechange = vi.fn();

      media.addEventListener('volumechange', volumechange);
      player.emit('PLAYER_VOLUMECHANGE', { playerVolume: 0, playerIsMuted: true });

      expect(media.muted).toBe(true);
      expect(media.volume).toBe(1);
      expect(volumechange).toHaveBeenCalledOnce();

      player.emit('PLAYER_VOLUMECHANGE', { playerVolume: 0.6, playerIsMuted: false });

      expect(media.muted).toBe(false);
      expect(media.volume).toBe(0.6);
    });
  });

  describe('playbackRate', () => {
    it('sets the speed once ready and reads back the rate the player rounded to', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);
      const ratechange = vi.fn();

      media.addEventListener('ratechange', ratechange);
      media.playbackRate = 1.1;
      await flush();

      expect(player.setPlaybackSpeed).toHaveBeenCalledWith(1.1);
      expect(media.playbackRate).toBe(1.25);
      expect(ratechange).toHaveBeenCalledTimes(2);

      media.playbackRate = 3;
      await flush();

      expect(media.playbackRate).toBe(2);
    });

    it('takes a speed changed in the player chrome', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);

      player.emit('PLAYER_PLAYBACKSPEEDCHANGE', { playerPlaybackSpeed: 0.75 });

      expect(media.playbackRate).toBe(0.75);
    });
  });

  describe('errors', () => {
    it('reports a player error as a fatal media error carrying the Dailymotion code', async () => {
      const media = new DailymotionAdapter();
      const { player } = await attachAndReady(media);
      const error = vi.fn();

      media.addEventListener('error', error);
      player.emit('PLAYER_ERROR', {
        playerError: { code: 'DM007', title: 'Video geo-restricted', message: 'Not available here.' },
      });

      expect(error).toHaveBeenCalledOnce();
      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_CUSTOM);
      expect(media.error?.message).toBe('Not available here.');
      expect(media.error?.data).toEqual({ dailymotionErrorCode: 'DM007' });
    });
  });

  describe('fullscreen', () => {
    it('targets the container holding the player', async () => {
      const media = new DailymotionAdapter();
      const { container } = await attachAndReady(media);
      const requestFullscreen = vi.fn(async () => {});

      container.requestFullscreen = requestFullscreen;
      await media.requestFullscreen();

      expect(requestFullscreen).toHaveBeenCalledOnce();
      expect(media.isFullscreen).toBe(true);
    });
  });
});
