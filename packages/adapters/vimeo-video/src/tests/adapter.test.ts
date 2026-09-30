import { describe, expect, it, vi } from 'vite-plus/test';

import { buildVimeoIframeSrc, VimeoAdapter } from '..';

vi.mock('@vimeo/player', () => {
  class MockPlayer {
    static instances: MockPlayer[] = [];
    target: unknown;
    handlers = new Map<string, Set<(data: unknown) => void>>();
    destroyed = false;

    play = vi.fn(async () => {});
    pause = vi.fn(async () => {});
    setVolume = vi.fn(async (v: number) => v);
    setMuted = vi.fn(async (v: boolean) => v);
    setCurrentTime = vi.fn(async (s: number) => s);
    setPlaybackRate = vi.fn(async (r: number) => r);
    setLoop = vi.fn(async (v: boolean) => v);
    loadVideo = vi.fn(async () => {});
    unload = vi.fn(async () => {});
    requestFullscreen = vi.fn(async () => {});
    exitFullscreen = vi.fn(async () => {});
    requestPictureInPicture = vi.fn(async () => {});
    exitPictureInPicture = vi.fn(async () => {});
    enableTextTrack = vi.fn(async () => {});
    disableTextTrack = vi.fn(async () => {});
    getMuted = vi.fn(async () => false);
    getVolume = vi.fn(async () => 1);
    getDuration = vi.fn(async () => 60);
    getVideoTitle = vi.fn(async () => 'Sample Video');
    getCurrentTime = vi.fn(async () => 0);
    getTextTracks = vi.fn(async () => [] as unknown[]);
    destroy = vi.fn(async () => {
      this.destroyed = true;
    });

    constructor(target: unknown) {
      // The real player rejects any iframe that isn't a Vimeo embed, and reads the
      // attribute rather than the property (an empty `src` attribute resolves to
      // the document URL). Mirror it so tests can't pass on an embed the real
      // player would have thrown on.
      const src = (target as Element | null)?.getAttribute?.('src') ?? '';

      if (!/^https?:\/\/((player|www)\.)?vimeo\.com\//.test(src)) {
        throw new Error('The player element passed isn’t a Vimeo embed.');
      }

      this.target = target;
      MockPlayer.instances.push(this);
    }

    on(event: string, handler: (data: unknown) => void): void {
      let set = this.handlers.get(event);

      if (!set) {
        set = new Set();
        this.handlers.set(event, set);
      }

      set.add(handler);
    }

    off(event: string, handler?: (data: unknown) => void): void {
      const set = this.handlers.get(event);
      if (!set) return;

      if (handler) set.delete(handler);
      else set.clear();
    }

    emit(event: string, data: unknown = {}): void {
      this.handlers.get(event)?.forEach((handler) => handler(data));
    }
  }

  return { default: MockPlayer };
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

async function waitForVimeoLoaded(media: VimeoAdapter): Promise<void> {
  if (media.readyState >= 1 && Number.isFinite(media.duration)) return;

  await new Promise<void>((resolve) => {
    media.addEventListener('loadcomplete', () => resolve(), { once: true });
  });
}

async function attachAndLoad(media: VimeoAdapter): Promise<{ iframe: HTMLIFrameElement; player: MockPlayerLike }> {
  // There is no embed to attach to without a source, so tests that don't care
  // which video is playing get one.
  if (!media.src) media.src = '76979871';

  const iframe = createIframe();

  media.attach(iframe);
  const player = media.engine as unknown as MockPlayerLike;

  player.emit('loaded');
  await waitForVimeoLoaded(media);
  return { iframe, player };
}

interface MockPlayerLike {
  emit(event: string, data?: unknown): void;
  getVideoTitle: ReturnType<typeof vi.fn>;
  unload: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  setVolume: ReturnType<typeof vi.fn>;
  setMuted: ReturnType<typeof vi.fn>;
  setCurrentTime: ReturnType<typeof vi.fn>;
  setPlaybackRate: ReturnType<typeof vi.fn>;
  setLoop: ReturnType<typeof vi.fn>;
  loadVideo: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

describe('buildVimeoIframeSrc', () => {
  it('builds embed URL from id with default playsinline and hidden controls', () => {
    const src = buildVimeoIframeSrc('76979871');

    expect(src).toContain('https://player.vimeo.com/video/76979871');
    expect(src).toContain('playsinline=1');
    expect(src).toContain('preload=metadata');
    expect(src).toContain('controls=0');
  });

  it('encodes autoplay, defaultMuted, loop', () => {
    const src = buildVimeoIframeSrc('76979871', {
      autoplay: true,
      defaultMuted: true,
      loop: true,
    });

    expect(src).toContain('autoplay=1');
    expect(src).toContain('muted=1');
    expect(src).toContain('loop=1');
  });

  it('disables controls by default and when controls=false', () => {
    expect(buildVimeoIframeSrc('76979871', { controls: false })).toContain('controls=0');
  });

  it('shows Vimeo controls when controls=true', () => {
    const src = buildVimeoIframeSrc('76979871', { controls: true });

    expect(src).not.toContain('controls=0');
  });

  it('forwards preload and Vimeo-specific knobs', () => {
    const src = buildVimeoIframeSrc('76979871', {
      preload: 'auto',
      source: { engine: { vimeo: { autopause: true } } },
    });

    expect(src).toContain('preload=auto');
    expect(src).toContain('autopause=1');
  });

  it('embeds h hash for unlisted videos', () => {
    expect(buildVimeoIframeSrc('https://vimeo.com/12345?h=secret')).toContain('h=secret');
  });

  it('embeds vimeo/<id> shorthands', () => {
    const src = buildVimeoIframeSrc('vimeo/12345/secret');

    expect(src).toContain('https://player.vimeo.com/video/12345?');
    expect(src).toContain('h=secret');
  });

  it('builds event embed URL with hashPath', () => {
    const src = buildVimeoIframeSrc('https://vimeo.com/event/123/abc');

    expect(src).toContain('https://vimeo.com/event/123/embed/abc');
    expect(src).not.toContain('h=');
  });

  it('merges arbitrary Vimeo options into params', () => {
    const src = buildVimeoIframeSrc('76979871', { source: { engine: { vimeo: { background: true, byline: false } } } });

    expect(src).toContain('background=1');
    expect(src).toContain('byline=0');
  });

  it('lets Vimeo options override derived params', () => {
    const src = buildVimeoIframeSrc('76979871', { controls: false, source: { engine: { vimeo: { controls: true } } } });

    expect(src).toContain('controls=1');
    expect(src).not.toContain('controls=0');
  });

  it('returns empty string for invalid src', () => {
    expect(buildVimeoIframeSrc('not-a-vimeo-url')).toBe('');
  });
});

describe('VimeoAdapter', () => {
  it('has expected default state before attach', () => {
    const media = new VimeoAdapter();

    expect(media.engine).toBe(null);
    expect(media.target).toBe(null);
    expect(media.paused).toBe(true);
    expect(media.ended).toBe(false);
    expect(media.currentTime).toBe(0);
    expect(media.duration).toBeNaN();
    expect(media.src).toBe(VimeoAdapter.defaultProps.src);
    expect(media.buffered.length).toBe(0);
    expect(media.played.length).toBeGreaterThanOrEqual(1);
  });

  it('creates a Player when attached to an iframe', () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);

    expect(media.target).toBe(iframe);
    expect(media.engine).not.toBe(null);
  });

  it('defers the player until a source arrives', async () => {
    const media = new VimeoAdapter();
    const loadstart = vi.fn();

    media.addEventListener('loadstart', loadstart);

    // How every framework builds the element: created first, `src` set after.
    const iframe = createIframe();

    expect(() => media.attach(iframe)).not.toThrow();
    expect(media.engine).toBe(null);
    expect(media.currentSrc).toBe('');
    expect(loadstart).not.toHaveBeenCalled();

    media.src = '76979871';
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('https://player.vimeo.com/video/76979871');
    expect(media.engine).not.toBe(null);
    expect(media.currentSrc).toContain('https://player.vimeo.com/video/76979871');
    expect(loadstart).toHaveBeenCalledTimes(1);
  });

  it('defers the player for an iframe rendered with an empty src', async () => {
    const media = new VimeoAdapter();
    // React renders `src=""` before a source resolves. The `src` property reports
    // the document URL for it, so only the attribute says there is no embed.
    const iframe = createEmptySrcIframe();

    expect(() => media.attach(iframe)).not.toThrow();
    expect(media.engine).toBe(null);

    media.src = '76979871';
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('https://player.vimeo.com/video/76979871');
    expect(media.engine).not.toBe(null);
  });

  it('builds a deferred embed from every prop set in the same task', async () => {
    const media = new VimeoAdapter();
    const iframe = createIframe();

    media.attach(iframe);

    // Frameworks apply props in whatever order the template lists them, so props
    // that follow `src` still have to reach the embed URL.
    media.source = { src: '76979871', engine: { vimeo: { autopause: true } } };
    media.autoplay = true;
    media.defaultMuted = true;
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('autoplay=1');
    expect(iframe.getAttribute('src')).toContain('muted=1');
    expect(iframe.getAttribute('src')).toContain('autopause=1');
  });

  it('builds a deferred embed once for repeated source changes in the same task', async () => {
    const media = new VimeoAdapter();
    const iframe = createIframe();

    media.attach(iframe);

    media.src = '76979871';
    media.src = '12345';
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('https://player.vimeo.com/video/12345');
    expect((media.engine as unknown as MockPlayerLike).loadVideo).not.toHaveBeenCalled();
  });

  it('does not leave play() waiting while the embed is deferred', async () => {
    const media = new VimeoAdapter();

    media.attach(createIframe());

    // No embed means no `loaded` is ever coming; waiting on it would hang.
    await expect(media.play()).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
  });

  it('reports an error instead of throwing for an iframe that is not a Vimeo embed', () => {
    const media = new VimeoAdapter();
    const error = vi.fn();

    media.addEventListener('error', error);

    const iframe = createIframe();

    iframe.setAttribute('src', 'https://example.com/embed');

    // `attach()` runs in a custom element constructor, where a throw breaks the
    // element outright.
    expect(() => media.attach(iframe)).not.toThrow();
    expect(media.engine).toBe(null);
    expect(media.error?.code).toBe(4);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('emits loadstart on attach and loadedmetadata/loadcomplete after loaded', async () => {
    const media = new VimeoAdapter();
    const events: string[] = [];

    for (const type of ['loadstart', 'loadedmetadata', 'loadcomplete', 'durationchange'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    const { player } = await attachAndLoad(media);

    expect(events).toContain('loadstart');
    expect(events).toContain('loadedmetadata');
    expect(events).toContain('loadcomplete');
    expect(events).toContain('durationchange');
    expect(media.duration).toBe(60);

    // Re-emit doesn't re-fire load events:
    events.length = 0;
    player.emit('timeupdate', { seconds: 1, duration: 60 });
    expect(events).toEqual([]);
  });

  it('exposes the video title in contentData once the embed loads', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);

    // Nothing to report before the embed answers.
    expect(media.contentData).toEqual({});

    const player = media.engine as unknown as MockPlayerLike;

    player.emit('loaded');
    await waitForVimeoLoaded(media);

    expect(media.contentData).toEqual({ title: 'Sample Video' });
  });

  it('clears contentData when the source changes', async () => {
    const media = new VimeoAdapter();

    await attachAndLoad(media);

    media.src = '12345';

    expect(media.contentData).toEqual({});
  });

  it('dispatches `contentdatachange` when the title arrives and when it is cleared', async () => {
    const media = new VimeoAdapter();

    // There is no embed to build without a source, so the player only exists once
    // one is set; `attachAndLoad` is skipped here to watch the attach itself.
    media.src = '76979871';
    const handler = vi.fn();

    media.addEventListener('contentdatachange', handler);

    const iframe = createIframe();

    media.attach(iframe);

    // Attaching reports nothing, so there is nothing to announce yet.
    expect(handler).not.toHaveBeenCalled();

    const player = media.engine as unknown as MockPlayerLike;

    player.emit('loaded');
    await waitForVimeoLoaded(media);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(media.contentData).toEqual({ title: 'Sample Video' });

    media.src = '12345';

    expect(handler).toHaveBeenCalledTimes(2);
    expect(media.contentData).toEqual({});
  });

  it('dedupes `contentdatachange` when the embed reports the same title again', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    const handler = vi.fn();

    media.addEventListener('contentdatachange', handler);

    // A second `loaded` for the same video re-reads the same title.
    player.emit('loaded');
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handler).not.toHaveBeenCalled();
    expect(media.contentData).toEqual({ title: 'Sample Video' });
  });

  it('reports a blank title as an absent key rather than an empty string', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);

    const player = media.engine as unknown as MockPlayerLike;

    player.getVideoTitle.mockResolvedValueOnce('');
    player.emit('loaded');
    await waitForVimeoLoaded(media);

    // An empty string would read as a deliberate blank and stop a consumer's
    // fallback chain, and Vimeo cannot tell that apart from a failed read.
    expect(media.contentData).toEqual({});
    expect('title' in media.contentData).toBe(false);
  });

  it('has the rest of the reset in step when it announces a cleared title', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const { player } = await attachAndLoad(media);

    player.emit('resize', { videoWidth: 1280, videoHeight: 720 });

    const seen: number[] = [];

    media.addEventListener('contentdatachange', () => seen.push(media.videoWidth));

    media.src = '12345';

    // The dimensions are cleared after the title is, so announcing from the
    // middle of the reset would hand a listener the old video's frame size
    // alongside the cleared title.
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBeNaN();
  });

  it('clears state reported about the old video when the source is cleared', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const { player } = await attachAndLoad(media);

    // There is nothing to load, so the reset has to happen without one.
    media.source = null;

    expect(media.contentData).toEqual({});
    expect(media.duration).toBeNaN();
    // A running embed would write all of that back through its own events.
    expect(player.unload).toHaveBeenCalled();
  });

  it('announces the reset when the source is cleared', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    await attachAndLoad(media);

    const emptied = vi.fn();

    media.addEventListener('emptied', emptied);
    media.source = null;

    // The embed is unloaded and reports nothing further, so nothing else is
    // coming to say the last video's duration and buffer are gone.
    expect(emptied).toHaveBeenCalledTimes(1);
  });

  it('unblocks a pending play() when the source is replaced mid-load', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);
    const player = media.engine as unknown as MockPlayerLike;

    // Never loads, so `play()` is left waiting on the current load barrier.
    const played = media.play();

    media.src = '12345';

    // Replacing the barrier without resolving it would hang this forever.
    await played;
    expect(player.play).toHaveBeenCalled();
  });

  it('does not settle the new load when a superseded one finishes', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);
    const player = media.engine as unknown as MockPlayerLike;

    // Hold the first load's metadata reads open, then supersede it.
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });

    player.getVideoTitle.mockImplementationOnce(async () => {
      await held;
      return 'First Video';
    });
    player.emit('loaded');
    media.src = '12345';

    let playing = false;
    const played = media.play().then(() => {
      playing = true;
    });

    // The superseded load finishing says nothing about the one now in progress.
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(playing).toBe(false);

    player.emit('loaded');
    await played;
    expect(playing).toBe(true);
    expect(media.contentData).toEqual({ title: 'Sample Video' });
  });

  it('settles the load for a src the player can never load', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);
    const player = media.engine as unknown as MockPlayerLike;

    player.loadVideo.mockClear();

    media.src = 'not-a-vimeo-url';

    // No `loaded` will ever arrive for it, so waiting on the load must not hang.
    await media.play();
    expect(player.loadVideo).not.toHaveBeenCalled();
  });

  it('ignores metadata that arrives after the source is cleared', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);
    const player = media.engine as unknown as MockPlayerLike;

    // Hold the metadata reads open so they resolve after the clear.
    let release = () => {};
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });

    player.getVideoTitle.mockImplementationOnce(async () => {
      await held;
      return 'Sample Video';
    });

    player.emit('loaded');
    media.source = null;
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(media.contentData).toEqual({});
    expect(media.duration).toBeNaN();
  });

  it('omits the title when Vimeo reports none', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);

    const player = media.engine as unknown as MockPlayerLike;

    player.getVideoTitle.mockResolvedValueOnce('');
    player.emit('loaded');
    await waitForVimeoLoaded(media);

    expect(media.contentData).toEqual({});
  });

  it('updates state from player events', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    const playSpy = vi.fn();

    media.addEventListener('play', playSpy);
    player.emit('play', { seconds: 0, duration: 60, percent: 0 });
    expect(media.paused).toBe(false);
    expect(playSpy).toHaveBeenCalled();

    player.emit('timeupdate', { seconds: 12.5, duration: 60, percent: 0.2 });
    expect(media.currentTime).toBe(12.5);
    expect(media.duration).toBe(60);

    player.emit('progress', { seconds: 30 });
    expect(media.buffered.length).toBe(1);
    expect(media.buffered.end(0)).toBe(30);

    player.emit('resize', { videoWidth: 1280, videoHeight: 720 });
    expect(media.videoWidth).toBe(1280);
    expect(media.videoHeight).toBe(720);

    player.emit('volumechange', { volume: 0.25 });
    expect(media.volume).toBe(0.25);

    player.emit('pause', { seconds: 12.5, duration: 60, percent: 0.2 });
    expect(media.paused).toBe(true);

    player.emit('ended', { seconds: 60, duration: 60, percent: 1 });
    expect(media.ended).toBe(true);
  });

  it('forwards play() and pause() to the player', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    await media.play();
    expect(player.play).toHaveBeenCalledTimes(1);

    media.pause();
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it('forwards setters to the player after load', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    media.currentTime = 30;
    media.volume = 0.5;
    media.muted = true;
    media.playbackRate = 1.5;
    media.loop = true;

    // setters defer via loadComplete microtask — flush.
    await Promise.resolve();
    await Promise.resolve();

    expect(player.setCurrentTime).toHaveBeenCalledWith(30);
    expect(player.setVolume).toHaveBeenCalledWith(0.5);
    expect(player.setMuted).toHaveBeenCalledWith(true);
    expect(player.setPlaybackRate).toHaveBeenCalledWith(1.5);
    expect(player.setLoop).toHaveBeenCalledWith(true);
  });

  it('calls loadVideo when src changes after attach', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    player.loadVideo.mockClear();

    media.src = '12345';
    await Promise.resolve();
    expect(player.loadVideo).toHaveBeenCalledWith({ url: 'https://player.vimeo.com/video/12345' });
  });

  it('derives src from a source object', () => {
    const media = new VimeoAdapter();
    const sourcechange = vi.fn();

    media.addEventListener('sourcechange', sourcechange);

    media.source = { src: '76979871' };
    expect(media.src).toBe('76979871');
    expect(sourcechange).toHaveBeenCalledTimes(1);
  });

  it('preserves source Vimeo options across a src change', () => {
    const media = new VimeoAdapter();

    media.source = { src: '76979871', engine: { vimeo: { autopause: true } } };

    media.src = 'https://vimeo.com/12345';
    expect(media.source).toEqual({ src: 'https://vimeo.com/12345', engine: { vimeo: { autopause: true } } });
  });

  it('does not reload for a structurally equal source', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    media.source = { src: '76979871', engine: { vimeo: { autopause: true } } };
    await Promise.resolve();

    const sourcechange = vi.fn();

    media.addEventListener('sourcechange', sourcechange);
    player.loadVideo.mockClear();

    media.source = { src: '76979871', engine: { vimeo: { autopause: true } } };
    await Promise.resolve();

    // Assigning is always announced, but nothing reaches the Vimeo player.
    expect(sourcechange).toHaveBeenCalledOnce();
    expect(player.loadVideo).not.toHaveBeenCalled();
    expect(media.src).toBe('76979871');
  });

  it('clears src when source is set to null', () => {
    const media = new VimeoAdapter();

    media.source = { src: '76979871' };

    media.source = null;
    expect(media.source).toBe(null);
    expect(media.src).toBe('');
  });

  it('carries Vimeo options into the initial embed URL', () => {
    const media = new VimeoAdapter();

    media.source = { src: '76979871', engine: { vimeo: { autopause: true } } };

    const iframe = createIframe();

    media.attach(iframe);
    expect(iframe.src).toContain('https://player.vimeo.com/video/76979871');
    expect(iframe.src).toContain('autopause=1');
  });

  it('reloads when only Vimeo options change', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    media.source = { src: '76979871', engine: { vimeo: { autopause: true } } };
    await Promise.resolve();
    player.loadVideo.mockClear();

    // Same video, new embed options. They are read at load time, so the video
    // has to be loaded again for them to take effect.
    media.source = { src: '76979871', engine: { vimeo: { autopause: false } } };
    await Promise.resolve();

    expect(player.loadVideo).toHaveBeenCalledWith({
      url: 'https://player.vimeo.com/video/76979871',
      autopause: false,
    });
  });

  it('carries Vimeo options into loadVideo options', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    player.loadVideo.mockClear();

    media.source = { src: '76979871', engine: { vimeo: { autopause: false } } };
    await Promise.resolve();
    expect(player.loadVideo).toHaveBeenCalledWith({
      url: 'https://player.vimeo.com/video/76979871',
      autopause: false,
    });
  });

  it('forwards fullscreen and pip requests', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    await media.requestFullscreen();
    await media.exitFullscreen();
    await media.requestPictureInPicture();
    await media.exitPictureInPicture();

    expect((player as unknown as { requestFullscreen: ReturnType<typeof vi.fn> }).requestFullscreen).toHaveBeenCalled();
    expect((player as unknown as { exitFullscreen: ReturnType<typeof vi.fn> }).exitFullscreen).toHaveBeenCalled();
    expect(
      (player as unknown as { requestPictureInPicture: ReturnType<typeof vi.fn> }).requestPictureInPicture
    ).toHaveBeenCalled();
    expect(
      (player as unknown as { exitPictureInPicture: ReturnType<typeof vi.fn> }).exitPictureInPicture
    ).toHaveBeenCalled();
  });

  it('tracks played ranges via the played-ranges mixin', async () => {
    const media = new VimeoAdapter();
    const { player } = await attachAndLoad(media);

    player.emit('play', {});
    player.emit('timeupdate', { seconds: 1 });
    player.emit('timeupdate', { seconds: 2 });
    player.emit('timeupdate', { seconds: 3 });
    player.emit('pause', {});

    const played = media.played;

    expect(played.length).toBe(1);
    expect(played.start(0)).toBe(0);
    expect(played.end(0)).toBe(3);
  });

  it('unblocks pending play() when detached before load completes', async () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);

    // Await load without the player ever emitting `loaded`.
    const pending = media.play();

    media.detach();

    await expect(pending).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
  });

  it('destroys the player on detach', () => {
    const media = new VimeoAdapter();

    media.src = '76979871';
    const iframe = createIframe();

    media.attach(iframe);
    const player = media.engine as unknown as MockPlayerLike;

    media.detach();
    expect(player.destroy).toHaveBeenCalled();
    expect(media.target).toBe(null);
    expect(media.engine).toBe(null);
  });
});
