import { MediaError } from '@videojs/media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { buildYouTubeIframeSrc, YouTubeAdapter } from '..';

interface StateChangeEvent {
  data: number;
}

interface MockPlayerEvents {
  onReady?: () => void;
  onError?: (event: StateChangeEvent) => void;
}

class MockPlayer {
  static instances: MockPlayer[] = [];
  target: HTMLIFrameElement;
  events: MockPlayerEvents | undefined;
  listeners = new Map<string, Set<(event: StateChangeEvent) => void>>();

  playVideo = vi.fn();
  pauseVideo = vi.fn();
  seekTo = vi.fn();
  mute = vi.fn(() => {
    this.isMuted.mockReturnValue(true);
  });
  unMute = vi.fn(() => {
    this.isMuted.mockReturnValue(false);
  });
  isMuted = vi.fn(() => false);
  setVolume = vi.fn((volume: number) => {
    this.getVolume.mockReturnValue(volume);
  });
  getVolume = vi.fn(() => 100);
  getDuration = vi.fn(() => 60);
  getCurrentTime = vi.fn(() => 0);
  getPlaybackRate = vi.fn(() => 1);
  setPlaybackRate = vi.fn((rate: number) => {
    this.getPlaybackRate.mockReturnValue(rate);
  });
  getVideoLoadedFraction = vi.fn(() => 0);
  getPlayerState = vi.fn(() => -1);
  loadVideoById = vi.fn();
  cueVideoById = vi.fn();
  loadPlaylist = vi.fn();
  cuePlaylist = vi.fn();
  stopVideo = vi.fn();
  getOption = vi.fn((_module: string, _option: string): unknown => undefined);
  setOption = vi.fn();
  destroy = vi.fn();

  constructor(target: HTMLIFrameElement, options?: { events?: MockPlayerEvents }) {
    this.target = target;
    this.events = options?.events;
    MockPlayer.instances.push(this);
  }

  addEventListener(type: string, listener: (event: StateChangeEvent) => void): void {
    let set = this.listeners.get(type);

    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }

    set.add(listener);
  }

  emit(type: string, data = 0): void {
    this.listeners.get(type)?.forEach((listener) => listener({ data }));
  }

  ready(): void {
    this.events?.onReady?.();
  }
}

// https://developers.google.com/youtube/iframe_api_reference#onStateChange
const STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

beforeEach(() => {
  MockPlayer.instances.length = 0;
  vi.stubGlobal('YT', {
    Player: MockPlayer,
    ready: (callback: () => void) => callback(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function createIframe(): HTMLIFrameElement {
  return document.createElement('iframe');
}

/** An iframe as React renders it before a source resolves: `src` present but empty. */
function createEmptySrcIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  iframe.setAttribute('src', '');
  return iframe;
}

/** Flush the microtask the deferred embed waits on before it is built. */
async function flushDeferredEmbed(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForEngine(media: YouTubeAdapter): Promise<MockPlayer> {
  return vi.waitFor(() => {
    const player = media.engine;
    if (!(player instanceof MockPlayer)) throw new Error('player not created yet');

    return player;
  });
}

async function attachAndLoad(media: YouTubeAdapter): Promise<{ iframe: HTMLIFrameElement; player: MockPlayer }> {
  // There is no embed to attach to without a source, so tests that don't care
  // which video is playing get one.
  if (!media.src) media.src = 'aqz-KE-bpKQ';

  const iframe = createIframe();

  media.attach(iframe);
  const player = await waitForEngine(media);

  player.ready();
  return { iframe, player };
}

describe('buildYouTubeIframeSrc', () => {
  it('builds embed URL with default playsinline, hidden controls, and jsapi enabled', () => {
    const src = buildYouTubeIframeSrc('https://www.youtube.com/watch?v=aqz-KE-bpKQ');

    expect(src).toContain('https://www.youtube.com/embed/aqz-KE-bpKQ');
    expect(src).toContain('playsinline=1');
    expect(src).toContain('preload=metadata');
    expect(src).toContain('controls=0');
    expect(src).toContain('enablejsapi=1');
  });

  it('encodes autoplay, defaultMuted, loop', () => {
    const src = buildYouTubeIframeSrc('aqz-KE-bpKQ', {
      autoplay: true,
      defaultMuted: true,
      loop: true,
    });

    expect(src).toContain('autoplay=1');
    expect(src).toContain('mute=1');
    expect(src).toContain('loop=1');
  });

  it('shows YouTube controls when controls=true', () => {
    const src = buildYouTubeIframeSrc('aqz-KE-bpKQ', { controls: true });

    expect(src).not.toContain('controls=0');
  });

  it('forwards preload and YouTube-specific knobs', () => {
    const src = buildYouTubeIframeSrc('aqz-KE-bpKQ', {
      preload: 'auto',
      source: { engine: { youtube: { cc_load_policy: 1 } } },
    });

    expect(src).toContain('preload=auto');
    expect(src).toContain('cc_load_policy=1');
  });

  it('serializes YouTube player parameters verbatim', () => {
    const src = buildYouTubeIframeSrc('aqz-KE-bpKQ', {
      source: {
        engine: {
          youtube: {
            cc_lang_pref: 'fr',
            color: 'white',
            disablekb: 1,
            end: 90,
            fs: 0,
            hl: 'fr-ca',
            origin: 'https://example.com',
            playlist: 'aqz-KE-bpKQ',
            widget_referrer: 'https://widgets.example.com',
          },
        },
      },
    });

    expect(src).toContain('cc_lang_pref=fr');
    expect(src).toContain('color=white');
    expect(src).toContain('disablekb=1');
    expect(src).toContain('end=90');
    expect(src).toContain('fs=0');
    expect(src).toContain('hl=fr-ca');
    expect(src).toContain(`origin=${encodeURIComponent('https://example.com')}`);
    expect(src).toContain('playlist=aqz-KE-bpKQ');
    expect(src).toContain(`widget_referrer=${encodeURIComponent('https://widgets.example.com')}`);
  });

  it('carries undeclared YouTube player parameters through', () => {
    const src = buildYouTubeIframeSrc('aqz-KE-bpKQ', {
      // Undocumented knobs and whatever YouTube adds next stay usable.
      source: { engine: { youtube: { some_future_param: 'x' } } },
    });

    expect(src).toContain('some_future_param=x');
  });

  it('lets YouTube player parameters override the defaults the host sets', () => {
    const src = buildYouTubeIframeSrc('aqz-KE-bpKQ', {
      source: { engine: { youtube: { rel: 1, iv_load_policy: 1 } } },
    });

    expect(src).toContain('rel=1');
    expect(src).toContain('iv_load_policy=1');
  });

  it('omits parameters YouTube has deprecated', () => {
    const src = buildYouTubeIframeSrc('aqz-KE-bpKQ');

    expect(src).not.toContain('modestbranding');
    expect(src).not.toContain('showinfo');
  });

  it('embeds start time from the t param', () => {
    expect(buildYouTubeIframeSrc('https://youtu.be/aqz-KE-bpKQ?t=2m51s')).toContain('start=171');
  });

  it('uses the nocookie embed base for nocookie sources', () => {
    expect(buildYouTubeIframeSrc('https://www.youtube-nocookie.com/watch?v=aqz-KE-bpKQ')).toContain(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ'
    );
  });

  it('embeds youtube/<id> shorthands from the nocookie host', () => {
    expect(buildYouTubeIframeSrc('youtube/aqz-KE-bpKQ')).toContain(
      'https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ?'
    );
  });

  it('builds playlist embed URL', () => {
    const src = buildYouTubeIframeSrc('https://www.youtube.com/playlist?list=PLv3TTBr1W_9tppikBxAE');

    expect(src).toContain('https://www.youtube.com/embed?');
    expect(src).toContain('listType=playlist');
    expect(src).toContain('list=PLv3TTBr1W_9tppikBxAE');
  });

  it('builds playlist embed URL from a videoseries embed source', () => {
    const src = buildYouTubeIframeSrc('https://www.youtube.com/embed/videoseries?list=PLv3TTBr1W_9tppikBxAE');

    expect(src).toContain('https://www.youtube.com/embed?');
    expect(src).toContain('listType=playlist');
    expect(src).toContain('list=PLv3TTBr1W_9tppikBxAE');
    expect(src).not.toContain('videoseries');
  });

  it('returns empty string for invalid src', () => {
    expect(buildYouTubeIframeSrc('not-a-youtube-url')).toBe('');
  });
});

describe('YouTubeAdapter', () => {
  it('has expected default state before attach', () => {
    const media = new YouTubeAdapter();

    expect(media.engine).toBe(null);
    expect(media.target).toBe(null);
    expect(media.paused).toBe(true);
    expect(media.ended).toBe(false);
    expect(media.currentTime).toBe(0);
    expect(media.duration).toBeNaN();
    expect(media.src).toBe(YouTubeAdapter.defaultProps.src);
    expect(media.buffered.length).toBe(0);
    expect(media.played.length).toBeGreaterThanOrEqual(1);
  });

  it('sets the initial iframe src and creates a player when attached', async () => {
    const media = new YouTubeAdapter();

    media.src = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    const iframe = createIframe();

    media.attach(iframe);

    expect(iframe.src).toContain('https://www.youtube.com/embed/aqz-KE-bpKQ');
    expect(media.target).toBe(iframe);

    await waitForEngine(media);
    expect(media.engine).not.toBe(null);
    media.detach();
  });

  it('defers the player until a source arrives', async () => {
    const media = new YouTubeAdapter();
    const loadstart = vi.fn();

    media.addEventListener('loadstart', loadstart);

    // How every framework builds the element: created first, `src` set after.
    const iframe = createIframe();

    media.attach(iframe);
    expect(iframe.getAttribute('src')).toBe(null);
    expect(media.engine).toBe(null);
    expect(loadstart).not.toHaveBeenCalled();

    media.src = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('https://www.youtube.com/embed/aqz-KE-bpKQ');
    expect(loadstart).toHaveBeenCalledTimes(1);
    await waitForEngine(media);
    media.detach();
  });

  it('defers the player for an iframe rendered with an empty src', async () => {
    const media = new YouTubeAdapter();
    // React renders `src=""` before a source resolves. The `src` property reports
    // the document URL for it, so only the attribute says there is no embed.
    const iframe = createEmptySrcIframe();

    media.attach(iframe);
    expect(media.engine).toBe(null);

    media.src = 'aqz-KE-bpKQ';
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('https://www.youtube.com/embed/aqz-KE-bpKQ');
    await waitForEngine(media);
    media.detach();
  });

  it('builds a deferred embed once for repeated source changes in the same task', async () => {
    const media = new YouTubeAdapter();
    const iframe = createIframe();

    media.attach(iframe);

    media.src = 'aqz-KE-bpKQ';
    media.src = 'dQw4w9WgXcQ';
    await waitForEngine(media);

    expect(iframe.getAttribute('src')).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(MockPlayer.instances.length).toBe(1);
    media.detach();
  });

  it('does not leave play() waiting while the embed is deferred', async () => {
    const media = new YouTubeAdapter();

    media.attach(createIframe());

    // No embed means no player is coming to report a load; waiting would hang.
    await expect(media.play()).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
  });

  it('waits for a deferred embed to load before playing', async () => {
    const media = new YouTubeAdapter();

    media.attach(createIframe());

    media.src = 'aqz-KE-bpKQ';
    let played = false;
    const pending = media.play().then(() => {
      played = true;
    });

    // The player the deferred embed creates has not reported readiness, so
    // playing now would run against a player that cannot accept it.
    const player = await waitForEngine(media);

    expect(played).toBe(false);

    player.ready();
    player.emit('onStateChange', STATE.CUED);
    await pending;

    expect(player.playVideo).toHaveBeenCalled();
    media.detach();
  });

  it('emits loadstart on attach and loadedmetadata/loadcomplete after ready', async () => {
    const media = new YouTubeAdapter();
    const events: string[] = [];

    for (const type of ['loadstart', 'loadedmetadata', 'loadcomplete', 'durationchange'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    await attachAndLoad(media);
    expect(events).toContain('loadstart');
    expect(events).toContain('loadedmetadata');
    expect(events).toContain('loadcomplete');
    expect(events).toContain('durationchange');
    expect(media.duration).toBe(60);
    expect(media.readyState).toBeGreaterThanOrEqual(1);
    media.detach();
  });

  it('updates state from player state changes', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    const playSpy = vi.fn();
    const waitingSpy = vi.fn();

    media.addEventListener('play', playSpy);
    media.addEventListener('waiting', waitingSpy);

    player.emit('onStateChange', STATE.BUFFERING);
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(waitingSpy).toHaveBeenCalledTimes(1);
    expect(media.paused).toBe(false);

    player.emit('onStateChange', STATE.PLAYING);
    expect(media.paused).toBe(false);
    expect(media.readyState).toBe(3);
    // play only fires once per playback start
    expect(playSpy).toHaveBeenCalledTimes(1);

    player.getVolume.mockReturnValue(25);
    player.emit('onVolumeChange');
    expect(media.volume).toBe(0.25);

    player.getPlaybackRate.mockReturnValue(1.5);
    player.emit('onPlaybackRateChange');
    expect(media.playbackRate).toBe(1.5);

    player.emit('onStateChange', STATE.PAUSED);
    expect(media.paused).toBe(true);

    player.emit('onStateChange', STATE.ENDED);
    expect(media.ended).toBe(true);
    expect(media.paused).toBe(true);
    media.detach();
  });

  it('forwards play() and pause() to the player', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    const { player } = await attachAndLoad(media);

    await media.play();
    expect(player.playVideo).toHaveBeenCalledTimes(1);

    media.pause();
    expect(player.pauseVideo).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('replays on ended when loop is set', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    media.loop = true;
    const { player } = await attachAndLoad(media);

    player.emit('onStateChange', STATE.ENDED);
    await Promise.resolve();
    await Promise.resolve();
    expect(player.playVideo).toHaveBeenCalled();
    media.detach();
  });

  it('forwards setters to the player after load', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    media.currentTime = 30;
    media.volume = 0.5;
    media.muted = true;
    media.playbackRate = 1.5;

    // setters defer via loadComplete microtask — flush.
    await Promise.resolve();
    await Promise.resolve();

    expect(player.seekTo).toHaveBeenCalledWith(30, true);
    expect(player.setVolume).toHaveBeenCalledWith(50);
    expect(player.mute).toHaveBeenCalled();
    expect(player.setPlaybackRate).toHaveBeenCalledWith(1.5);
    media.detach();
  });

  it('cues the new video when src changes after attach', async () => {
    const media = new YouTubeAdapter();

    media.src = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    const iframe = createIframe();

    media.attach(iframe);
    const player = await waitForEngine(media);

    player.ready();

    media.src = 'https://youtu.be/dQw4w9WgXcQ?t=10';
    await Promise.resolve();
    expect(player.cueVideoById).toHaveBeenCalledWith({ videoId: 'dQw4w9WgXcQ', startSeconds: 10 });

    // A post-load state change completes the reload.
    const loadCompleteSpy = vi.fn();

    media.addEventListener('loadcomplete', loadCompleteSpy);
    player.emit('onStateChange', STATE.CUED);
    expect(loadCompleteSpy).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it.each(['queued writes', 'applied settings', 'clear and refill', 'writes during replacement'])(
    'applies a changed caption policy after replacement readiness (%s)',
    async (scenario) => {
      const media = new YouTubeAdapter();
      const src = 'aqz-KE-bpKQ';

      media.source = scenario === 'clear and refill' ? { src, engine: { youtube: { cc_load_policy: 1 } } } : { src };
      const { iframe, player } = await attachAndLoad(media);

      document.body.append(iframe);
      // The iframe API removes the embed when its player is destroyed.
      player.destroy.mockImplementation(() => iframe.remove());

      try {
        media.volume = 0.5;
        media.muted = true;
        media.playbackRate = 1.5;

        if (scenario === 'applied settings' || scenario === 'clear and refill') await flushDeferredEmbed();

        if (scenario === 'clear and refill') {
          media.source = null;
          media.src = 'dQw4w9WgXcQ';
        } else {
          if (scenario === 'queued writes') media.currentTime = 30;

          media.source = { src, engine: { youtube: { cc_load_policy: 1 } } };
        }

        if (scenario === 'writes during replacement') {
          media.volume = 0.7;
          media.muted = false;
          media.playbackRate = 2;
        }

        expect(iframe.isConnected).toBe(true);
        const replacement = await waitForEngine(media);
        const loadcomplete = vi.fn();

        media.addEventListener('loadcomplete', loadcomplete);
        const pending = media.play();

        if (scenario !== 'clear and refill') {
          player.ready();
          player.emit('onStateChange', STATE.PLAYING);
          await flushDeferredEmbed();

          expect(media.readyState).toBe(0);
          expect(media.paused).toBe(true);
          expect(loadcomplete).not.toHaveBeenCalled();
          expect(replacement.playVideo).not.toHaveBeenCalled();
          expect(replacement.setVolume).not.toHaveBeenCalled();
        }

        replacement.ready();
        await pending;

        expect(new URL(iframe.src).searchParams.get('cc_load_policy')).toBe(
          scenario === 'clear and refill' ? null : '1'
        );
        expect(replacement).not.toBe(player);
        expect(media.readyState).toBe(1);
        expect(loadcomplete).toHaveBeenCalledTimes(1);
        expect(replacement.playVideo).toHaveBeenCalledTimes(1);
        expect(replacement.getVolume()).toBe(scenario === 'writes during replacement' ? 70 : 50);
        expect(replacement.isMuted()).toBe(scenario !== 'writes during replacement');
        expect(replacement.getPlaybackRate()).toBe(scenario === 'writes during replacement' ? 2 : 1.5);
        expect(media.volume).toBe(scenario === 'writes during replacement' ? 0.7 : 0.5);
        expect(media.muted).toBe(scenario !== 'writes during replacement');
        expect(media.playbackRate).toBe(scenario === 'writes during replacement' ? 2 : 1.5);

        if (scenario === 'queued writes') expect(replacement.seekTo).toHaveBeenCalledWith(30, true);
      } finally {
        media.destroy();
        iframe.remove();
      }
    }
  );

  it.each(['pending play', 'default mute'])('recreates before readiness without losing the %s', async (scenario) => {
    const media = new YouTubeAdapter();
    const src = 'aqz-KE-bpKQ';
    const iframe = createIframe();

    media.defaultMuted = scenario === 'default mute';
    media.src = src;
    document.body.append(iframe);
    media.attach(iframe);
    const player = await waitForEngine(media);

    // The iframe API removes the embed when its player is destroyed.
    player.destroy.mockImplementation(() => iframe.remove());

    try {
      const pending = media.play();

      media.source = { src, engine: { youtube: { cc_load_policy: 1 } } };
      const replacement = await vi.waitFor(() => {
        const engine = media.engine;
        if (!(engine instanceof MockPlayer) || engine === player) throw new Error('replacement not created yet');

        return engine;
      });

      replacement.ready();
      await pending;

      expect(replacement.playVideo).toHaveBeenCalledTimes(1);
      expect(new URL(iframe.src).searchParams.get('mute')).toBe(scenario === 'default mute' ? '1' : '0');
      expect(replacement.unMute).not.toHaveBeenCalled();
    } finally {
      media.destroy();
      iframe.remove();
    }
  });

  it('keeps settings written before readiness across recreation', async () => {
    const media = new YouTubeAdapter();
    const src = 'aqz-KE-bpKQ';
    const iframe = createIframe();

    media.defaultMuted = true;
    media.src = src;
    document.body.append(iframe);
    media.attach(iframe);
    const player = await waitForEngine(media);

    // The iframe API removes the embed when its player is destroyed.
    player.destroy.mockImplementation(() => iframe.remove());

    try {
      media.volume = 0.5;
      media.source = { src, engine: { youtube: { cc_load_policy: 1 } } };
      const replacement = await vi.waitFor(() => {
        const engine = media.engine;
        if (!(engine instanceof MockPlayer) || engine === player) throw new Error('replacement not created yet');

        return engine;
      });
      const reportedVolumes: number[] = [];

      media.addEventListener('volumechange', () => reportedVolumes.push(media.volume));
      replacement.ready();
      await media.play();

      expect(reportedVolumes).toEqual([0.5]);
      expect(replacement.getVolume()).toBe(50);
      expect(replacement.unMute).not.toHaveBeenCalled();
    } finally {
      media.destroy();
      iframe.remove();
    }
  });

  it('defers the load when src changes before the player is ready', async () => {
    const media = new YouTubeAdapter();

    media.src = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    const iframe = createIframe();

    media.attach(iframe);
    const player = await waitForEngine(media);

    // Player exists but `onReady` hasn't fired; cueing now would fail.
    media.src = 'https://youtu.be/dQw4w9WgXcQ?t=10';
    await Promise.resolve();
    expect(player.cueVideoById).not.toHaveBeenCalled();

    // The deferred load replays once the player is ready.
    player.ready();
    await Promise.resolve();
    expect(player.cueVideoById).toHaveBeenCalledWith({ videoId: 'dQw4w9WgXcQ', startSeconds: 10 });

    const loadCompleteSpy = vi.fn();

    media.addEventListener('loadcomplete', loadCompleteSpy);
    player.emit('onStateChange', STATE.CUED);
    expect(loadCompleteSpy).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('loads (instead of cueing) the new video when autoplay is set', async () => {
    const media = new YouTubeAdapter();

    media.autoplay = true;
    media.src = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    const iframe = createIframe();

    media.attach(iframe);
    const player = await waitForEngine(media);

    player.ready();

    media.src = 'https://youtu.be/dQw4w9WgXcQ';
    await Promise.resolve();
    expect(player.loadVideoById).toHaveBeenCalledWith({ videoId: 'dQw4w9WgXcQ' });
    media.detach();
  });

  it('errors and unblocks pending play() when src is unrecognized', async () => {
    const media = new YouTubeAdapter();

    media.src = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    const iframe = createIframe();

    media.attach(iframe);
    const player = await waitForEngine(media);

    player.ready();

    const errorSpy = vi.fn();

    media.addEventListener('error', errorSpy);

    media.src = 'https://example.com/not-a-youtube-url';
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(media.error).toBeInstanceOf(MediaError);
    expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    await expect(media.play()).resolves.toBeUndefined();
    media.detach();
  });

  it('surfaces player errors', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    const iframe = createIframe();

    media.attach(iframe);
    const player = await waitForEngine(media);

    const errorSpy = vi.fn();

    media.addEventListener('error', errorSpy);
    player.events?.onError?.({ data: 150 });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(media.error).toBeInstanceOf(MediaError);
    expect(media.error).toMatchObject({
      code: MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED,
      fatal: true,
      data: { youtubeErrorCode: 150 },
    });
    media.detach();
  });

  it('tracks played ranges via the played-ranges mixin', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    player.emit('onStateChange', STATE.PLAYING);
    // Advance time in sub-0.1s steps so polling reports timeupdate, not a seek.
    player.getCurrentTime.mockReturnValue(0.08);
    await vi.waitFor(() => {
      if (media.currentTime !== 0.08) throw new Error('time not polled yet');
    });
    player.getCurrentTime.mockReturnValue(0.16);
    await vi.waitFor(() => {
      if (media.currentTime !== 0.16) throw new Error('time not polled yet');
    });
    player.emit('onStateChange', STATE.PAUSED);

    const played = media.played;

    expect(played.length).toBe(1);
    expect(played.start(0)).toBe(0);
    expect(played.end(0)).toBe(0.16);
    media.detach();
  });

  it('does not interpret coarse playback updates as seeking', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['seeking', 'seeked', 'timeupdate'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    player.getPlayerState.mockReturnValue(STATE.PLAYING);
    player.getVideoLoadedFraction.mockReturnValue(0);
    player.emit('onStateChange', STATE.PLAYING);
    player.getCurrentTime.mockReturnValue(0.25);

    await vi.waitFor(() => {
      if (media.currentTime !== 0.25) throw new Error('time not polled yet');
    });

    expect(media.seeking).toBe(false);
    expect(events).toEqual(['timeupdate']);
    media.detach();
  });

  it('completes a programmatic seek during playback and resumes time updates', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['seeking', 'seeked', 'timeupdate'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    player.getPlayerState.mockReturnValue(STATE.PLAYING);
    player.emit('onStateChange', STATE.PLAYING);
    media.currentTime = 30;
    await Promise.resolve();

    expect(media.seeking).toBe(true);
    expect(events).toEqual(['seeking']);
    expect(player.seekTo).toHaveBeenCalledWith(30, true);

    player.getVideoLoadedFraction.mockReturnValue(0.5);
    player.emit('onStateChange', STATE.PLAYING);
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(media.currentTime).toBe(30);
    expect(media.seeking).toBe(true);
    expect(events).toEqual(['seeking']);

    player.getCurrentTime.mockReturnValue(29.75);
    await vi.waitFor(() => {
      if (media.seeking) throw new Error('seek not completed yet');
    });

    player.getCurrentTime.mockReturnValue(30.5);
    await vi.waitFor(() => {
      if (media.currentTime !== 30.5) throw new Error('time not polled yet');
    });

    expect(media.seeking).toBe(false);
    expect(events).toEqual(['seeking', 'timeupdate', 'seeked', 'timeupdate']);
    media.detach();
  });

  it('completes a programmatic backward seek after a coarse clock update', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['seeking', 'seeked', 'timeupdate'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    player.getPlayerState.mockReturnValue(STATE.PLAYING);
    player.getCurrentTime.mockReturnValue(30);
    player.emit('onStateChange', STATE.PLAYING);
    await vi.waitFor(() => {
      if (media.currentTime !== 30) throw new Error('time not polled yet');
    });
    events.length = 0;

    media.currentTime = 10;
    await Promise.resolve();
    player.getCurrentTime.mockReturnValue(10.25);
    await vi.waitFor(() => {
      if (media.seeking) throw new Error('seek not completed yet');
    });

    expect(media.currentTime).toBe(10.25);
    expect(events).toEqual(['seeking', 'timeupdate', 'seeked']);
    media.detach();
  });

  it('waits for the latest of overlapping programmatic seeks', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['seeking', 'seeked', 'timeupdate'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    player.getPlayerState.mockReturnValue(STATE.PLAYING);
    player.emit('onStateChange', STATE.PLAYING);
    media.currentTime = 10;
    await Promise.resolve();
    media.currentTime = 20;
    await Promise.resolve();

    player.getCurrentTime.mockReturnValue(10.25);
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(media.currentTime).toBe(20);
    expect(media.seeking).toBe(true);
    expect(events).toEqual(['seeking']);

    player.getCurrentTime.mockReturnValue(20.25);
    await vi.waitFor(() => {
      if (media.seeking) throw new Error('latest seek not completed yet');
    });

    expect(media.currentTime).toBe(20.25);
    expect(events).toEqual(['seeking', 'timeupdate', 'seeked']);
    expect(player.seekTo.mock.calls).toEqual([
      [10, true],
      [20, true],
    ]);
    media.detach();
  });

  it('does not complete a nearby seek while the player clock is unchanged', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['seeking', 'seeked', 'timeupdate'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    player.getPlayerState.mockReturnValue(STATE.PLAYING);
    player.getCurrentTime.mockReturnValue(10);
    player.emit('onStateChange', STATE.PLAYING);
    await vi.waitFor(() => {
      if (media.currentTime !== 10) throw new Error('time not polled yet');
    });
    events.length = 0;

    media.currentTime = 10.5;
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(media.currentTime).toBe(10.5);
    expect(media.seeking).toBe(true);
    expect(events).toEqual(['seeking']);

    player.getCurrentTime.mockReturnValue(10.25);
    await vi.waitFor(() => {
      if (media.seeking) throw new Error('nearby seek not completed yet');
    });

    expect(media.currentTime).toBe(10.25);
    expect(events).toEqual(['seeking', 'timeupdate', 'seeked']);
    media.detach();
  });

  it('settles a nearby seek that lands on the original clock time', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);
    const events: string[] = [];
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000);

    for (const type of ['seeking', 'seeked', 'timeupdate'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    player.getPlayerState.mockReturnValue(STATE.PLAYING);
    player.getCurrentTime.mockReturnValue(10);
    player.emit('onStateChange', STATE.PLAYING);
    await vi.waitFor(() => {
      if (media.currentTime !== 10) throw new Error('time not polled yet');
    });
    events.length = 0;

    media.currentTime = 10.5;
    await Promise.resolve();
    now.mockReturnValue(2_000);
    await vi.waitFor(() => {
      if (media.seeking) throw new Error('seek not settled yet');
    });

    expect(media.currentTime).toBe(10);
    expect(events).toEqual(['seeking', 'timeupdate', 'seeked']);
    now.mockRestore();
    media.detach();
  });

  it('destroys the player on detach', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    media.detach();
    expect(player.destroy).toHaveBeenCalled();
    expect(media.target).toBe(null);
    expect(media.engine).toBe(null);
  });

  it('returns the iframe to its host position after the player removes it on detach', async () => {
    const media = new YouTubeAdapter();
    const { iframe, player } = await attachAndLoad(media);
    const container = document.createElement('div');
    const sibling = document.createElement('span');

    container.append(iframe, sibling);
    // The iframe API removes the embed when its player is destroyed.
    player.destroy.mockImplementation(() => iframe.remove());

    media.detach();

    expect(player.destroy).toHaveBeenCalled();
    expect(iframe.nextSibling).toBe(sibling);
    // A framework unmounting the host can still remove the iframe it rendered.
    expect(() => container.removeChild(iframe)).not.toThrow();
  });

  it('unblocks pending play() when detached before load completes', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    const iframe = createIframe();

    media.attach(iframe);

    // Await load without the player ever becoming ready.
    const pending = media.play();

    media.detach();

    await expect(pending).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
  });

  it('does not create a player when detached before the API resolves', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    const iframe = createIframe();

    media.attach(iframe);
    media.detach();

    // Flush the async player creation path.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(media.engine).toBe(null);
  });

  it('ignores ready and state callbacks from a superseded player', async () => {
    const media = new YouTubeAdapter();

    media.src = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    const { player: stale } = await attachAndLoad(media);

    media.detach();
    const { player: current } = await attachAndLoad(media);

    expect(current).not.toBe(stale);

    const playSpy = vi.fn();

    media.addEventListener('play', playSpy);

    // The iframe API keeps invoking callbacks it already scheduled for the
    // destroyed player; none of them may touch the new session's state.
    stale.ready();
    stale.emit('onStateChange', STATE.PLAYING);
    stale.getVolume.mockReturnValue(10);
    stale.emit('onVolumeChange');

    expect(playSpy).not.toHaveBeenCalled();
    expect(media.paused).toBe(true);
    expect(media.volume).toBe(1);
    media.detach();
  });

  it('unblocks waiters from a superseded load when a reload starts first', async () => {
    const media = new YouTubeAdapter();

    media.src = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';
    const { player } = await attachAndLoad(media);

    // Start a second load and wait on its barrier without ever completing it.
    media.src = 'https://youtu.be/dQw4w9WgXcQ';
    const pending = media.play();

    // A third load takes over; the waiter above must not be stranded on the
    // barrier it already captured.
    media.src = 'https://youtu.be/9bZkp7q19f0';

    await expect(pending).resolves.toBeUndefined();
    expect(player.cueVideoById).toHaveBeenLastCalledWith({ videoId: '9bZkp7q19f0' });
    media.detach();
  });

  it('does not report fullscreen when there is no element to request it on', async () => {
    const media = new YouTubeAdapter();

    await media.requestFullscreen();

    expect(media.isFullscreen).toBe(false);
  });
});

describe('YouTubeAdapter source', () => {
  it('derives src from a structured source and announces the change', async () => {
    const media = new YouTubeAdapter();
    const sourceChange = vi.fn();

    media.addEventListener('sourcechange', sourceChange);

    media.source = { src: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ' };

    expect(media.src).toBe('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
    expect(sourceChange).toHaveBeenCalledTimes(1);
  });

  it('re-derives source from src, carrying YouTube player parameters over', () => {
    const media = new YouTubeAdapter();

    media.source = { src: 'aqz-KE-bpKQ', engine: { youtube: { cc_load_policy: 1 } } };

    media.src = 'dQw4w9WgXcQ';

    expect(media.source).toEqual({ engine: { youtube: { cc_load_policy: 1 } }, src: 'dQw4w9WgXcQ' });
  });

  it('serializes YouTube player parameters onto the initial iframe src', () => {
    const media = new YouTubeAdapter();

    media.source = { src: 'aqz-KE-bpKQ', engine: { youtube: { hl: 'fr' } } };
    const iframe = createIframe();

    media.attach(iframe);

    expect(iframe.src).toContain('hl=fr');
    media.detach();
  });

  it('clears src when the source is set to null', () => {
    const media = new YouTubeAdapter();

    media.source = { src: 'aqz-KE-bpKQ' };

    media.source = null;

    expect(media.src).toBe('');
    expect(media.source).toBe(null);
  });

  it('stops the embed and resets state when the source is cleared', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    const { player } = await attachAndLoad(media);

    player.emit('onStateChange', STATE.PLAYING);
    expect(media.duration).toBe(60);

    media.source = null;
    await Promise.resolve();

    // Left running, the embed keeps playing and the poll writes state back.
    expect(player.stopVideo).toHaveBeenCalled();
    expect(media.duration).toBeNaN();
    expect(media.currentTime).toBe(0);
    expect(media.paused).toBe(true);
    await expect(media.play()).resolves.toBeUndefined();
    media.detach();
  });

  it('announces the reset when the source is cleared', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    const { player } = await attachAndLoad(media);

    player.emit('onStateChange', STATE.PLAYING);

    const emptied = vi.fn();

    media.addEventListener('emptied', emptied);
    media.source = null;
    await Promise.resolve();

    // The embed is stopped and the poll is off from here, so nothing else is
    // coming to say the last video's duration and buffer are gone.
    expect(emptied).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('does not let a cleared source come back through a state change', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    const { player } = await attachAndLoad(media);

    player.emit('onStateChange', STATE.PLAYING);

    media.source = null;
    await Promise.resolve();
    // `stopVideo()` reports a transition of its own.
    player.emit('onStateChange', STATE.ENDED);

    expect(media.duration).toBeNaN();
    expect(media.readyState).toBe(0);
    expect(media.currentTime).toBe(0);
    media.detach();
  });

  it('does not play a source that was cleared', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    const { player } = await attachAndLoad(media);

    media.source = null;
    await Promise.resolve();
    player.playVideo.mockClear();
    await media.play();

    expect(player.playVideo).not.toHaveBeenCalled();
    media.detach();
  });

  it('unblocks pending play() when the source is cleared before the player is ready', async () => {
    const media = new YouTubeAdapter();

    media.src = 'aqz-KE-bpKQ';
    const iframe = createIframe();

    media.attach(iframe);
    const player = await waitForEngine(media);

    // Setting src while the player is still loading defers the load, so the
    // clear below is what the replay on ready has to cope with. Nothing else
    // settles the barrier `attach()` opened.
    media.src = 'dQw4w9WgXcQ';
    media.source = null;
    const pending = media.play();

    player.ready();

    await expect(pending).resolves.toBeUndefined();
    media.detach();
  });
});

describe('YouTubeAdapter textTracks', () => {
  const EN = { languageCode: 'en', displayName: 'English' };
  const ES = { languageCode: 'es', displayName: 'Spanish' };
  const FR = { languageCode: 'fr', displayName: 'French' };

  interface CaptionReport {
    tracklist?: { languageCode: string; displayName: string }[];
    track?: { languageCode?: string };
  }

  /** Answer the captions module's options the way the iframe API caches them, then announce the module change. */
  function reportCaptions(player: MockPlayer, { tracklist = [], track = {} }: CaptionReport): void {
    player.getOption.mockImplementation((module, option) => {
      if (module !== 'captions') return undefined;

      return option === 'tracklist' ? tracklist : option === 'track' ? track : undefined;
    });
    player.emit('onApiChange');
  }

  /** Track list events are queued like native ones. */
  async function flushTrackEvents(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
  }

  function snapshot(media: YouTubeAdapter) {
    return Array.from(media.textTracks, ({ kind, label, language, mode }) => ({ kind, label, language, mode }));
  }

  it('surfaces caption tracks on the list read before the player existed', async () => {
    const media = new YouTubeAdapter();
    const textTracks = media.textTracks;
    const addtrack = vi.fn();

    textTracks.addEventListener('addtrack', addtrack);

    const { player } = await attachAndLoad(media);

    reportCaptions(player, { tracklist: [EN, ES] });
    await flushTrackEvents();

    expect(media.textTracks).toBe(textTracks);
    expect(addtrack).toHaveBeenCalledTimes(2);
    expect(snapshot(media)).toEqual([
      { kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled' },
      { kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'disabled' },
    ]);
    media.detach();
  });

  it('surfaces caption tracks on the list read after the player is ready', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);
    const addtrack = vi.fn();

    media.textTracks.addEventListener('addtrack', addtrack);
    reportCaptions(player, { tracklist: [EN] });
    await flushTrackEvents();

    expect(addtrack).toHaveBeenCalledTimes(1);
    expect(snapshot(media).map(({ language }) => language)).toEqual(['en']);
    media.detach();
  });

  it('surfaces tracks the captions module reports after the first playing transition', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    player.emit('onStateChange', STATE.PLAYING);
    expect(media.textTracks).toHaveLength(0);

    reportCaptions(player, { tracklist: [EN] });
    reportCaptions(player, { tracklist: [EN, ES] });

    expect(snapshot(media).map(({ language }) => language)).toEqual(['en', 'es']);
    media.detach();
  });

  it('shows the track YouTube renders on load without echoing it back', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);
    const change = vi.fn();

    media.textTracks.addEventListener('change', change);
    reportCaptions(player, { tracklist: [EN, ES], track: ES });
    await flushTrackEvents();

    expect(snapshot(media).map(({ mode }) => mode)).toEqual(['disabled', 'showing']);
    expect(change).toHaveBeenCalledTimes(1);
    expect(player.setOption).not.toHaveBeenCalled();
    media.detach();
  });

  it('surfaces the track YouTube renders even when the track list omits it', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    reportCaptions(player, { tracklist: [EN], track: FR });

    expect(snapshot(media)).toEqual([
      { kind: 'subtitles', label: 'English', language: 'en', mode: 'disabled' },
      { kind: 'subtitles', label: 'French', language: 'fr', mode: 'showing' },
    ]);
    media.detach();
  });

  it('turns off the captions YouTube shows when the showing track is disabled', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    reportCaptions(player, { tracklist: [EN, ES], track: ES });
    await flushTrackEvents();

    media.textTracks[1]!.mode = 'disabled';
    await flushTrackEvents();

    expect(player.setOption).toHaveBeenCalledTimes(1);
    expect(player.setOption).toHaveBeenCalledWith('captions', 'track', {});
    media.detach();
  });

  it('selects one language for a switch made within a tick', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    reportCaptions(player, { tracklist: [EN, ES], track: ES });
    await flushTrackEvents();

    media.textTracks[1]!.mode = 'disabled';
    media.textTracks[0]!.mode = 'showing';
    await flushTrackEvents();

    expect(player.setOption).toHaveBeenCalledTimes(1);
    expect(player.setOption).toHaveBeenCalledWith('captions', 'track', { languageCode: 'en' });
    media.detach();
  });

  it('keeps a selection over the stale track YouTube keeps reporting', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    reportCaptions(player, { tracklist: [EN, ES], track: ES });
    await flushTrackEvents();

    media.textTracks[1]!.mode = 'disabled';
    await flushTrackEvents();

    // The embed's cached `track` still names the language that was turned off.
    reportCaptions(player, { tracklist: [EN, ES], track: ES });
    player.emit('onStateChange', STATE.PLAYING);
    await flushTrackEvents();

    expect(snapshot(media).map(({ mode }) => mode)).toEqual(['disabled', 'disabled']);
    expect(player.setOption).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('leaves modes alone while the captions module is not loaded', async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);

    reportCaptions(player, { tracklist: [EN], track: EN });
    player.getOption.mockReturnValue(undefined);
    player.emit('onStateChange', STATE.BUFFERING);

    expect(snapshot(media).map(({ mode }) => mode)).toEqual(['showing']);
    media.detach();
  });

  it("drops the previous video's tracks when the source changes", async () => {
    const media = new YouTubeAdapter();
    const { player } = await attachAndLoad(media);
    const removetrack = vi.fn();

    reportCaptions(player, { tracklist: [EN, ES], track: ES });
    await flushTrackEvents();
    media.textTracks[1]!.mode = 'disabled';
    await flushTrackEvents();

    media.textTracks.addEventListener('removetrack', removetrack);
    media.src = 'dQw4w9WgXcQ';
    await flushTrackEvents();

    expect(media.textTracks).toHaveLength(0);
    expect(media.textTracks[0]).toBeUndefined();
    expect(removetrack).toHaveBeenCalledTimes(2);

    // The new video's report is YouTube's own state again, not stale after the earlier selection.
    reportCaptions(player, { tracklist: [FR], track: FR });
    await flushTrackEvents();

    expect(snapshot(media)).toEqual([{ kind: 'subtitles', label: 'French', language: 'fr', mode: 'showing' }]);
    expect(player.setOption).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('keeps one track list across embed recreation, dropping the old tracks', async () => {
    const media = new YouTubeAdapter();
    const src = 'aqz-KE-bpKQ';

    media.source = { src };
    const { iframe, player } = await attachAndLoad(media);
    const textTracks = media.textTracks;

    document.body.append(iframe);
    // The iframe API removes the embed when its player is destroyed.
    player.destroy.mockImplementation(() => iframe.remove());

    try {
      reportCaptions(player, { tracklist: [EN] });

      media.source = { src, engine: { youtube: { cc_load_policy: 1 } } };
      const replacement = await vi.waitFor(() => {
        const engine = media.engine;
        if (!(engine instanceof MockPlayer) || engine === player) throw new Error('replacement not created yet');

        return engine;
      });

      expect(media.textTracks).toHaveLength(0);

      replacement.ready();
      reportCaptions(replacement, { tracklist: [ES], track: ES });
      // A report from the destroyed player belongs to the old embed.
      reportCaptions(player, { tracklist: [FR], track: FR });

      expect(media.textTracks).toBe(textTracks);
      expect(snapshot(media)).toEqual([{ kind: 'subtitles', label: 'Spanish', language: 'es', mode: 'showing' }]);
    } finally {
      media.destroy();
      iframe.remove();
    }
  });
});
