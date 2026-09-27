import { isMediaPlaybackRateCapable, isMediaVolumeCapable, MediaError, type Video } from '@videojs/media';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { buildPlayerJsIframeSrc, PlayerJsAdapter, parsePlayerJsSource } from '..';

// Hosts the adapter does not recognize, so the protocol tests see the URL exactly as given. The services it does
// recognize are covered by `buildPlayerJsIframeSrc`.
const EMBED_SRC = 'https://player.example.com/embed/abc123';
const OTHER_EMBED_SRC = 'https://player.example.org/embed/def456';

const GUMLET_SRC = 'https://play.gumlet.io/embed/64bfb0913ed6e5096d66dc1e';
const STREAMABLE_SRC = 'https://streamable.com/e/moo';
const BUNNY_SRC = 'https://player.mediadelivery.net/embed/759/eb1c4f77-0cda-46be-b47d-1118ad7c2ffe';
const LIVID_SRC = 'https://livid.com/embed/AJPwABnzkTXj';
const FRAMERATE_SRC = 'https://framerate.tv/embed/361c224a-b10f-483f-811b-8602f46b7be8';
const MUX_SRC = 'https://player.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM';

/** The query of a built embed URL, as `key=value` entries in order. */
function queryOf(src: string): string[] {
  return [...new URL(src).searchParams].map(([key, value]) => `${key}=${value}`);
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

/** Jsdom only gives a connected iframe the window the embed posts from. */
function createIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  document.body.append(iframe);
  return iframe;
}

function frameOf(iframe: HTMLIFrameElement): Window {
  const frame = iframe.contentWindow;
  if (!frame) throw new Error('iframe has no window');

  return frame;
}

interface Command {
  method: string;
  value?: unknown;
  listener?: string;
}

/** Spy on the commands posted to the embed, decoded from the JSON the spec sends. */
function watchCommands(iframe: HTMLIFrameElement) {
  const spy = vi.spyOn(frameOf(iframe), 'postMessage');

  return {
    spy,
    all: (): Command[] => spy.mock.calls.map(([data]) => JSON.parse(data as string) as Command),
    named: (method: string): Command[] =>
      spy.mock.calls.map(([data]) => JSON.parse(data as string) as Command).filter((c) => c.method === method),
    clear: () => spy.mockClear(),
  };
}

type Commands = ReturnType<typeof watchCommands>;

/** Report a message the way a receiver does: a JSON string on `window`, from the embed's frame. */
function report(iframe: HTMLIFrameElement, event: string, value?: unknown, listener?: string): void {
  globalThis.dispatchEvent(
    new MessageEvent('message', {
      data: JSON.stringify({
        context: 'player.js',
        version: '0.0.11',
        event,
        ...(value !== undefined && { value }),
        ...(listener !== undefined && { listener }),
      }),
      source: frameOf(iframe),
    })
  );
}

/** Answer every getter posted so far, the way a receiver does: an event named after the method, same listener. */
function answer(iframe: HTMLIFrameElement, commands: Commands, values: Record<string, unknown>): void {
  for (const { method, listener } of commands.all()) {
    if (method in values) report(iframe, method, values[method], listener);
  }
}

/** Flush the microtask a load waits on before the embed is built, and any getter answers. */
async function flush(): Promise<void> {
  for (let i = 0; i < 4; i++) await Promise.resolve();
}

const FULL_SUPPORT = {
  methods: [
    'play',
    'pause',
    'getPaused',
    'mute',
    'unmute',
    'getMuted',
    'setVolume',
    'getVolume',
    'getDuration',
    'setCurrentTime',
    'getCurrentTime',
    'setLoop',
    'getLoop',
    'setPlaybackRate',
    'getPlaybackRate',
    'addEventListener',
    'removeEventListener',
  ],
  events: [
    'ready',
    'play',
    'pause',
    'ended',
    'timeupdate',
    'progress',
    'seeked',
    'error',
    'volumeChange',
    'playbackRateChange',
  ],
};

async function attachAndReady(
  media: PlayerJsAdapter,
  ready: unknown = FULL_SUPPORT
): Promise<{ iframe: HTMLIFrameElement; commands: Commands; listener: string }> {
  if (!media.src) media.src = EMBED_SRC;

  const iframe = createIframe();

  media.attach(iframe);
  const commands = watchCommands(iframe);

  report(iframe, 'ready', ready);
  await flush();

  const listener = commands.named('addEventListener').find((c) => c.value !== 'ready')?.listener ?? '';

  return { iframe, commands, listener };
}

describe('parsePlayerJsSource', () => {
  it('accepts any absolute http(s) URL', () => {
    expect(parsePlayerJsSource(EMBED_SRC)?.href).toBe(EMBED_SRC);
    expect(parsePlayerJsSource('http://example.com/embed/1')?.origin).toBe('http://example.com');
  });

  it('reads a protocol-relative URL as https', () => {
    expect(parsePlayerJsSource('//streamable.com/e/moo')?.href).toBe(STREAMABLE_SRC);
  });

  it('rejects empty, relative, and non-http sources', () => {
    expect(parsePlayerJsSource('')).toBe(null);
    expect(parsePlayerJsSource('/embed/1')).toBe(null);
    expect(parsePlayerJsSource('javascript:alert(1)')).toBe(null);
    expect(parsePlayerJsSource('not a url')).toBe(null);
  });
});

describe('buildPlayerJsIframeSrc', () => {
  it('leaves the URL of a service it does not recognize untouched', () => {
    expect(buildPlayerJsIframeSrc(EMBED_SRC, { autoplay: true, loop: true, controls: false })).toBe(EMBED_SRC);
  });

  it('returns empty for a source that is not an embed URL', () => {
    expect(buildPlayerJsIframeSrc('abc123')).toBe('');
  });

  it('writes engine options onto the URL verbatim, stringified', () => {
    const src = buildPlayerJsIframeSrc(EMBED_SRC, {
      source: { src: EMBED_SRC, engine: { playerJs: { disable_player_controls: true, start: 10 } } },
    });

    expect(src).toBe(`${EMBED_SRC}?disable_player_controls=true&start=10`);
  });

  it('removes a parameter set to null and keeps the rest of the URL', () => {
    const src = buildPlayerJsIframeSrc(`${EMBED_SRC}?autoplay=true&preload=true`, {
      source: { engine: { playerJs: { autoplay: null } } },
    });

    expect(src).toBe(`${EMBED_SRC}?preload=true`);
  });

  it('repeats a parameter once per value of an array', () => {
    const src = buildPlayerJsIframeSrc(GUMLET_SRC, {
      controls: true,
      source: { engine: { playerJs: { disabled_player_control: ['cast', 'progress'] } } },
    });

    expect(queryOf(src)).toContain('disabled_player_control=cast');
    expect(queryOf(src)).toContain('disabled_player_control=progress');
  });

  it('keeps referrerPolicy off the URL', () => {
    const src = buildPlayerJsIframeSrc(EMBED_SRC, {
      source: { engine: { playerJs: { referrerPolicy: 'no-referrer' } } },
    });

    expect(src).toBe(EMBED_SRC);
  });

  describe('Gumlet', () => {
    it('hides the player controls and turns off autoplay and loop by default', () => {
      expect(queryOf(buildPlayerJsIframeSrc(GUMLET_SRC, PlayerJsAdapter.defaultProps))).toEqual([
        'autoplay=false',
        'loop=false',
        'disable_player_controls=true',
      ]);
    });

    it('writes autoplay and loop, and keeps the controls with controls', () => {
      expect(queryOf(buildPlayerJsIframeSrc(GUMLET_SRC, { autoplay: true, loop: true, controls: true }))).toEqual([
        'autoplay=true',
        'loop=true',
      ]);
    });
  });

  describe('Streamable', () => {
    it('hides the controls and turns off its default loop by default', () => {
      expect(queryOf(buildPlayerJsIframeSrc(STREAMABLE_SRC, PlayerJsAdapter.defaultProps))).toEqual([
        'loop=0',
        'nocontrols=1',
      ]);
    });

    it('writes autoplay and mute as the 1 it reads, and leaves loop and controls to their defaults', () => {
      const src = buildPlayerJsIframeSrc(STREAMABLE_SRC, {
        autoplay: true,
        defaultMuted: true,
        loop: true,
        controls: true,
      });

      expect(queryOf(src)).toEqual(['autoplay=1', 'muted=1']);
    });
  });

  describe('Bunny Stream', () => {
    it('shrinks the control bar to the least it offers and turns off its default autoplay by default', () => {
      expect(queryOf(buildPlayerJsIframeSrc(BUNNY_SRC, PlayerJsAdapter.defaultProps))).toEqual([
        'autoplay=false',
        'loop=false',
        'compactControls=true',
        'showSpeed=false',
        'showHeatmap=false',
        'chromecast=false',
        'disableAirPlay=true',
      ]);
    });

    it('writes autoplay, mute, loop, and preload, and keeps its controls with controls', () => {
      const src = buildPlayerJsIframeSrc(BUNNY_SRC, {
        autoplay: true,
        defaultMuted: true,
        loop: true,
        preload: 'none',
        controls: true,
      });

      expect(queryOf(src)).toEqual(['autoplay=true', 'muted=true', 'loop=true', 'preload=false']);
    });

    it('recognizes the legacy iframe host as well as the player host', () => {
      const src = buildPlayerJsIframeSrc(BUNNY_SRC.replace('player.', 'iframe.'), PlayerJsAdapter.defaultProps);

      expect(queryOf(src)).toContain('compactControls=true');
    });

    it('passes through any documented parameter under engine.playerJs', () => {
      const src = buildPlayerJsIframeSrc(BUNNY_SRC, {
        source: { engine: { playerJs: { t: '1m30s', captions: 'en', lang: 'de', rememberPosition: false } } },
      });

      expect(queryOf(src)).toEqual(
        expect.arrayContaining(['t=1m30s', 'captions=en', 'lang=de', 'rememberPosition=false'])
      );
    });
  });

  describe('Livid', () => {
    it('hides every player element and passes preload through by default', () => {
      expect(queryOf(buildPlayerJsIframeSrc(LIVID_SRC, PlayerJsAdapter.defaultProps))).toEqual([
        'controls=0',
        'preload=metadata',
      ]);
    });

    it('writes autoplay, mute, and loop, and keeps its controls with controls', () => {
      const src = buildPlayerJsIframeSrc(LIVID_SRC, {
        autoplay: true,
        defaultMuted: true,
        loop: true,
        controls: true,
        preload: 'none',
      });

      expect(queryOf(src)).toEqual(['autoplay=1', 'muted=1', 'loop=1', 'preload=none']);
    });

    it('keeps the start time Livid reads from the URL hash', () => {
      const src = buildPlayerJsIframeSrc(`${LIVID_SRC}#t=25`, {
        source: { engine: { playerJs: { color: '4e48f9', share: false } } },
      });

      expect(src).toMatch(/#t=25$/);
      expect(queryOf(src)).toEqual(expect.arrayContaining(['color=4e48f9', 'share=false']));
    });
  });

  describe('FrameRate', () => {
    it('hides both the control bar and the start button by default', () => {
      expect(queryOf(buildPlayerJsIframeSrc(FRAMERATE_SRC, PlayerJsAdapter.defaultProps))).toEqual([
        'show_controls=0',
        'initial_play_btn=0',
      ]);
    });

    it('writes autoplay, mute, and loop as the 1 it reads, and keeps its chrome with controls', () => {
      const src = buildPlayerJsIframeSrc(FRAMERATE_SRC, {
        autoplay: true,
        defaultMuted: true,
        loop: true,
        controls: true,
      });

      expect(queryOf(src)).toEqual(['autoplay=1', 'muted=1', 'loop=1']);
    });
  });

  describe('Mux Player', () => {
    it('writes only preload by default, since no parameter hides its controls', () => {
      expect(queryOf(buildPlayerJsIframeSrc(MUX_SRC, PlayerJsAdapter.defaultProps))).toEqual(['preload=metadata']);
    });

    it('writes its boolean attributes only when on', () => {
      const src = buildPlayerJsIframeSrc(MUX_SRC, { autoplay: true, defaultMuted: true, loop: true, preload: 'auto' });

      expect(queryOf(src)).toEqual(['autoplay=true', 'muted=true', 'loop=true', 'preload=auto']);
    });

    it('passes its other attributes through under engine.playerJs', () => {
      const src = buildPlayerJsIframeSrc(MUX_SRC, {
        source: {
          engine: { playerJs: { 'start-time': 10, 'metadata-video-title': 'Big Buck Bunny', nohotkeys: true } },
        },
      });

      expect(queryOf(src)).toEqual(
        expect.arrayContaining(['start-time=10', 'metadata-video-title=Big Buck Bunny', 'nohotkeys=true'])
      );
    });
  });

  describe('precedence', () => {
    it('keeps a parameter already written into src over the one derived from props', () => {
      const src = buildPlayerJsIframeSrc(
        `${BUNNY_SRC}?autoplay=true&compactControls=false`,
        PlayerJsAdapter.defaultProps
      );

      expect(queryOf(src)).toContain('autoplay=true');
      expect(queryOf(src)).toContain('compactControls=false');
      expect(queryOf(src)).not.toContain('autoplay=false');
    });

    it('lets engine options override both src and derived parameters, or remove them', () => {
      const src = buildPlayerJsIframeSrc(`${GUMLET_SRC}?loop=true`, {
        source: { engine: { playerJs: { loop: 'false', disable_player_controls: null, background: true } } },
      });

      expect(queryOf(src)).toEqual(['autoplay=false', 'loop=false', 'background=true']);
    });
  });
});

describe('PlayerJsAdapter', () => {
  it('has default props', () => {
    expect(PlayerJsAdapter.defaultProps).toEqual({
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
    const media = new PlayerJsAdapter();

    expect(isMediaVolumeCapable(media)).toBe(true);
    expect(isMediaPlaybackRateCapable(media)).toBe(true);
    // Compile-time check that it implements the `Video` surface it claims.
    const video: Partial<Video> = media;

    expect(video).toBe(media);
  });

  describe('load', () => {
    it('points the iframe at the embed on attach and announces loadstart', () => {
      const media = new PlayerJsAdapter();
      const loadstart = vi.fn();

      media.addEventListener('loadstart', loadstart);
      media.src = EMBED_SRC;

      const iframe = createIframe();

      media.attach(iframe);

      expect(iframe.getAttribute('src')).toBe(EMBED_SRC);
      expect(loadstart).toHaveBeenCalledOnce();
      expect(media.currentSrc).toBe(EMBED_SRC);
    });

    it('builds a recognized service with its chrome hidden and the host props in its own spelling', () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();

      media.muted = true;
      media.loop = true;
      media.src = BUNNY_SRC;
      media.attach(iframe);

      const query = queryOf(iframe.getAttribute('src')!);

      expect(query).toEqual(
        expect.arrayContaining(['autoplay=false', 'muted=true', 'loop=true', 'compactControls=true'])
      );
    });

    it('keeps the frame when controls change after load, rather than restart the video', async () => {
      const media = new PlayerJsAdapter();

      media.src = GUMLET_SRC;
      const { iframe } = await attachAndReady(media);
      const built = iframe.getAttribute('src');

      media.controls = true;
      await flush();

      expect(iframe.getAttribute('src')).toBe(built);
    });

    it('leaves a server-rendered frame alone and asks it to repeat ready', () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();

      iframe.setAttribute('src', EMBED_SRC);
      const commands = watchCommands(iframe);

      media.src = EMBED_SRC;
      media.attach(iframe);

      expect(iframe.getAttribute('src')).toBe(EMBED_SRC);
      expect(commands.named('addEventListener')).toEqual([
        expect.objectContaining({ value: 'ready', listener: expect.any(String) }),
      ]);
    });

    it('asks each document the frame loads for ready', () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();

      media.src = EMBED_SRC;
      media.attach(iframe);

      const commands = watchCommands(iframe);

      iframe.dispatchEvent(new Event('load'));

      expect(commands.named('addEventListener')).toEqual([expect.objectContaining({ value: 'ready' })]);
    });

    it('sends every command in the player.js envelope', () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();

      media.src = EMBED_SRC;
      media.attach(iframe);

      const commands = watchCommands(iframe);

      iframe.dispatchEvent(new Event('load'));

      const [data, origin] = commands.spy.mock.calls[0]!;

      expect(JSON.parse(data as string)).toEqual({
        context: 'player.js',
        version: '0.0.11',
        method: 'addEventListener',
        value: 'ready',
        listener: expect.any(String),
      });
      expect(origin).toBe('*');
    });

    it('settles loadComplete on ready and reports metadata', async () => {
      const media = new PlayerJsAdapter();
      const loadedmetadata = vi.fn();
      const loadcomplete = vi.fn();

      media.addEventListener('loadedmetadata', loadedmetadata);
      media.addEventListener('loadcomplete', loadcomplete);

      await attachAndReady(media);

      expect(media.readyState).toBe(1);
      expect(loadedmetadata).toHaveBeenCalledOnce();
      expect(loadcomplete).toHaveBeenCalledOnce();
    });

    it('takes a ready message posted as an object rather than a string', async () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();
      const loadcomplete = vi.fn();

      media.addEventListener('loadcomplete', loadcomplete);
      media.src = EMBED_SRC;
      media.attach(iframe);

      globalThis.dispatchEvent(
        new MessageEvent('message', {
          data: { context: 'player.js', event: 'ready', value: {} },
          source: frameOf(iframe),
        })
      );

      expect(loadcomplete).toHaveBeenCalledOnce();
    });

    it('handles a repeated ready once', async () => {
      const media = new PlayerJsAdapter();
      const loadcomplete = vi.fn();

      media.addEventListener('loadcomplete', loadcomplete);

      const { iframe, commands } = await attachAndReady(media);

      commands.clear();

      report(iframe, 'ready', FULL_SUPPORT);

      expect(loadcomplete).toHaveBeenCalledOnce();
      expect(commands.all()).toEqual([]);
    });

    it('ignores messages from other frames and other protocols', async () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();
      const other = createIframe();
      const loadcomplete = vi.fn();

      media.addEventListener('loadcomplete', loadcomplete);
      media.src = EMBED_SRC;
      media.attach(iframe);

      report(other, 'ready', {});
      globalThis.dispatchEvent(new MessageEvent('message', { data: '{"event":"ready"}', source: frameOf(iframe) }));
      globalThis.dispatchEvent(new MessageEvent('message', { data: 'player.js{', source: frameOf(iframe) }));

      expect(loadcomplete).not.toHaveBeenCalled();
    });

    it('subscribes to the events the embed advertises, and only those', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media, {
        methods: ['play', 'pause'],
        events: ['ready', 'play', 'pause', 'timeupdate'],
      });

      const subscribed = commands
        .named('addEventListener')
        .map((c) => c.value)
        .filter((v) => v !== 'ready');

      expect(subscribed).toEqual(['play', 'pause', 'timeupdate']);
    });

    it('assumes the spec lists when ready carries none', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media, {});

      const subscribed = commands
        .named('addEventListener')
        .map((c) => c.value)
        .filter((v) => v !== 'ready');

      expect(subscribed).toEqual(['play', 'pause', 'ended', 'timeupdate', 'progress', 'error']);
      expect(media.supports('method', 'setCurrentTime')).toBe(true);
      expect(media.supports('method', 'setPlaybackRate')).toBe(false);
    });

    it('rebuilds the frame when src changes and announces the reset', async () => {
      const media = new PlayerJsAdapter();
      const { iframe } = await attachAndReady(media);
      const emptied = vi.fn();

      media.addEventListener('emptied', emptied);
      media.src = OTHER_EMBED_SRC;
      await flush();

      expect(iframe.getAttribute('src')).toBe(OTHER_EMBED_SRC);
      expect(emptied).toHaveBeenCalledOnce();
      expect(media.readyState).toBe(0);
      expect(media.supports('method', 'play')).toBe(false);
    });

    it('rebuilds the frame when engine options change for the same embed', async () => {
      const media = new PlayerJsAdapter();
      const { iframe } = await attachAndReady(media);

      media.source = { src: EMBED_SRC, engine: { playerJs: { disable_player_controls: true } } };
      await flush();

      expect(iframe.getAttribute('src')).toBe(`${EMBED_SRC}?disable_player_controls=true`);
    });

    it('keeps the frame when the same source is set again', async () => {
      const media = new PlayerJsAdapter();
      const { iframe } = await attachAndReady(media);
      const emptied = vi.fn();

      media.addEventListener('emptied', emptied);
      media.source = { src: EMBED_SRC };
      await flush();

      expect(iframe.getAttribute('src')).toBe(EMBED_SRC);
      expect(emptied).not.toHaveBeenCalled();
      expect(media.readyState).toBe(1);
    });

    it('drops the frame URL when src is cleared', async () => {
      const media = new PlayerJsAdapter();
      const { iframe } = await attachAndReady(media);

      media.src = '';
      await flush();

      expect(iframe.hasAttribute('src')).toBe(false);
      expect(media.source).toBe(null);
    });

    it('reports an unrecognized src as an error and settles the load', async () => {
      const media = new PlayerJsAdapter();
      const { iframe } = await attachAndReady(media);
      const error = vi.fn();

      media.addEventListener('error', error);
      media.src = 'not-a-url';
      await flush();

      expect(error).toHaveBeenCalledOnce();
      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      expect(iframe.hasAttribute('src')).toBe(false);
    });

    it('ignores late reports from the document the frame navigated away from', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, listener } = await attachAndReady(media);
      const timeupdate = vi.fn();

      media.src = OTHER_EMBED_SRC;
      await flush();
      report(iframe, 'ready', FULL_SUPPORT);

      media.addEventListener('timeupdate', timeupdate);
      report(iframe, 'timeupdate', { seconds: 42, duration: 100 }, listener);

      expect(timeupdate).not.toHaveBeenCalled();
      expect(media.currentTime).toBe(0);
    });

    it('stops listening on detach', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, listener } = await attachAndReady(media);
      const play = vi.fn();

      media.detach();
      media.addEventListener('play', play);
      report(iframe, 'play', undefined, listener);

      expect(play).not.toHaveBeenCalled();
      expect(media.target).toBe(null);
    });
  });

  describe('supports', () => {
    it('reads false until the embed reports ready', () => {
      const media = new PlayerJsAdapter();

      media.src = EMBED_SRC;
      media.attach(createIframe());

      expect(media.supports('method', 'play')).toBe(false);
    });

    it('answers from the lists the embed advertises', async () => {
      const media = new PlayerJsAdapter();

      await attachAndReady(media, { methods: ['play', 'pause', 'getDuration'], events: ['ready', 'play'] });

      expect(media.supports('method', 'play')).toBe(true);
      expect(media.supports('method', 'setCurrentTime')).toBe(false);
      expect(media.supports('method', ['play', 'pause'])).toBe(true);
      expect(media.supports('method', ['play', 'setVolume'])).toBe(false);
      expect(media.supports('event', 'play')).toBe(true);
      expect(media.supports('event', 'timeupdate')).toBe(false);
    });

    it('exposes the embed window as engine', () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();

      media.src = EMBED_SRC;
      media.attach(iframe);

      expect(media.engine).toBe(iframe.contentWindow);
    });
  });

  describe('state sync', () => {
    it('reads duration, volume, mute, rate, and position from the embed once ready', async () => {
      const media = new PlayerJsAdapter();
      const durationchange = vi.fn();
      const volumechange = vi.fn();
      const ratechange = vi.fn();

      media.addEventListener('durationchange', durationchange);
      media.addEventListener('volumechange', volumechange);
      media.addEventListener('ratechange', ratechange);

      const { iframe, commands } = await attachAndReady(media);

      answer(iframe, commands, {
        getDuration: 120,
        getVolume: 40,
        getMuted: true,
        getPlaybackRate: 1.5,
        getCurrentTime: 12,
        getPaused: true,
      });
      await flush();

      expect(media.duration).toBe(120);
      expect(media.volume).toBe(0.4);
      expect(media.muted).toBe(true);
      expect(media.playbackRate).toBe(1.5);
      expect(media.currentTime).toBe(12);
      expect(media.paused).toBe(true);
      expect(durationchange).toHaveBeenCalledOnce();
      expect(volumechange).toHaveBeenCalled();
      expect(ratechange).toHaveBeenCalledOnce();
    });

    it('reports an embed that is already playing', async () => {
      const media = new PlayerJsAdapter();
      const play = vi.fn();

      media.addEventListener('play', play);

      const { iframe, commands } = await attachAndReady(media);

      answer(iframe, commands, { getPaused: false });
      await flush();

      expect(media.paused).toBe(false);
      expect(play).toHaveBeenCalledOnce();
    });

    it('leaves duration NaN for an embed without getDuration', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media, { methods: ['play', 'pause'], events: ['ready'] });

      expect(commands.named('getDuration')).toEqual([]);
      expect(media.duration).toBeNaN();
      expect(media.seekable.length).toBe(0);
    });

    it('ignores answers that arrive after the load they belong to', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, commands } = await attachAndReady(media);
      const stale = commands.named('getDuration')[0]!;

      media.src = OTHER_EMBED_SRC;
      await flush();
      report(iframe, 'getDuration', 999, stale.listener);
      await flush();

      expect(media.duration).toBeNaN();
    });

    it('re-reads volume when the embed reports volumeChange', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, commands, listener } = await attachAndReady(media);

      commands.clear();
      report(iframe, 'volumeChange', {}, listener);
      answer(iframe, commands, { getVolume: 25, getMuted: false });
      await flush();

      expect(media.volume).toBe(0.25);
    });

    it('subscribes to and handles the lowercase event spellings Bunny Stream advertises', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, commands, listener } = await attachAndReady(media, {
        methods: ['play', 'pause', 'setPlaybackRate', 'getPlaybackRate'],
        events: ['ready', 'play', 'playbackratechange'],
      });

      const subscribed = commands.named('addEventListener').map((c) => c.value);

      expect(subscribed).toContain('playbackratechange');
      expect(subscribed).not.toContain('playbackRateChange');

      commands.clear();
      report(iframe, 'playbackratechange', { speed: 2 }, listener);
      answer(iframe, commands, { getPlaybackRate: 2 });
      await flush();

      expect(media.playbackRate).toBe(2);
    });

    it('re-reads the rate when the embed reports playbackRateChange', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, commands, listener } = await attachAndReady(media);

      commands.clear();
      report(iframe, 'playbackRateChange', {}, listener);
      answer(iframe, commands, { getPlaybackRate: 2 });
      await flush();

      expect(media.playbackRate).toBe(2);
    });
  });

  describe('playback', () => {
    it('posts play and pause once ready', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media);

      commands.clear();
      await media.play();
      media.pause();

      expect(commands.all().map((c) => c.method)).toEqual(['play', 'pause']);
    });

    it('holds a play asked for before ready and replays it then', async () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();

      media.src = EMBED_SRC;
      media.attach(iframe);
      const commands = watchCommands(iframe);

      await media.play();
      expect(commands.named('play')).toEqual([]);

      report(iframe, 'ready', FULL_SUPPORT);
      expect(commands.named('play')).toHaveLength(1);
    });

    it('drops a held play when paused before ready', async () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();

      media.src = EMBED_SRC;
      media.attach(iframe);
      const commands = watchCommands(iframe);

      await media.play();
      media.pause();
      report(iframe, 'ready', FULL_SUPPORT);

      expect(commands.named('play')).toEqual([]);
    });

    it('plays on ready with autoplay, since player.js has no autoplay parameter', async () => {
      const media = new PlayerJsAdapter();

      media.autoplay = true;
      const { commands, iframe } = await attachAndReady(media);

      expect(commands.named('play')).toHaveLength(1);
      expect(iframe.getAttribute('src')).toBe(EMBED_SRC);
    });

    it('maps play, pause, and ended reports to media events', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, listener } = await attachAndReady(media);
      const events: string[] = [];

      for (const type of ['play', 'playing', 'pause', 'ended']) {
        media.addEventListener(type, () => events.push(type));
      }

      report(iframe, 'play', undefined, listener);
      expect(media.paused).toBe(false);
      expect(media.readyState).toBe(3);

      // A repeated report is not a new transition.
      report(iframe, 'play', undefined, listener);

      report(iframe, 'pause', undefined, listener);
      expect(media.paused).toBe(true);

      report(iframe, 'play', undefined, listener);
      report(iframe, 'ended', undefined, listener);

      expect(media.ended).toBe(true);
      expect(media.paused).toBe(true);
      expect(events).toEqual(['play', 'playing', 'pause', 'play', 'playing', 'pause', 'ended']);
    });

    it('takes events that carry no listener', async () => {
      const media = new PlayerJsAdapter();
      const { iframe } = await attachAndReady(media);

      report(iframe, 'play');

      expect(media.paused).toBe(false);
    });

    it('ignores events addressed to another client of the frame', async () => {
      const media = new PlayerJsAdapter();
      const { iframe } = await attachAndReady(media);

      report(iframe, 'play', undefined, 'someone-else');

      expect(media.paused).toBe(true);
    });

    it('tracks position, duration, and buffered range from reports', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, listener } = await attachAndReady(media);
      const timeupdate = vi.fn();
      const progress = vi.fn();

      media.addEventListener('timeupdate', timeupdate);
      media.addEventListener('progress', progress);

      report(iframe, 'timeupdate', { seconds: 10, duration: 100 }, listener);
      report(iframe, 'progress', { seconds: 30, duration: 100 }, listener);

      expect(media.currentTime).toBe(10);
      expect(media.duration).toBe(100);
      expect(media.buffered.end(0)).toBe(30);
      expect(media.seekable.end(0)).toBe(100);
      expect(timeupdate).toHaveBeenCalledOnce();
      expect(progress).toHaveBeenCalledOnce();

      // Some receivers (Gumlet's) report progress as a 0-100 percentage of the duration.
      report(iframe, 'progress', { percent: 50 }, listener);
      expect(media.buffered.end(0)).toBe(50);
    });
  });

  describe('loop', () => {
    it('asserts loop over the protocol once ready', async () => {
      const media = new PlayerJsAdapter();

      media.loop = true;
      const { commands } = await attachAndReady(media);

      expect(commands.named('setLoop')).toEqual([expect.objectContaining({ value: true })]);
    });

    it('turns off looping an embed defaults to', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media);

      expect(commands.named('setLoop')).toEqual([expect.objectContaining({ value: false })]);
    });

    it('replays on ended where the embed lacks setLoop', async () => {
      const media = new PlayerJsAdapter();

      media.loop = true;
      const { iframe, commands, listener } = await attachAndReady(media, {
        methods: ['play', 'pause', 'setCurrentTime'],
        events: ['ready', 'ended'],
      });

      commands.clear();
      report(iframe, 'ended', undefined, listener);

      expect(commands.all().map((c) => [c.method, c.value])).toEqual([
        ['setCurrentTime', 0],
        ['play', undefined],
      ]);
    });
  });

  describe('seeking', () => {
    it('reports the requested position at once and settles on the seeked report', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, commands, listener } = await attachAndReady(media);
      const seeking = vi.fn();
      const seeked = vi.fn();

      media.addEventListener('seeking', seeking);
      media.addEventListener('seeked', seeked);

      media.currentTime = 30;

      expect(media.currentTime).toBe(30);
      expect(media.seeking).toBe(true);
      expect(seeking).toHaveBeenCalledOnce();
      expect(commands.named('setCurrentTime')).toEqual([expect.objectContaining({ value: 30 })]);

      // Positions from before the seek landed must not drag the slider back.
      report(iframe, 'timeupdate', { seconds: 5 }, listener);
      expect(media.currentTime).toBe(30);

      report(iframe, 'seeked', { seconds: 30.2 }, listener);
      expect(media.seeking).toBe(false);
      expect(media.currentTime).toBe(30.2);
      expect(seeked).toHaveBeenCalledOnce();
    });

    it('clears ended when seeking back from the end', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, listener } = await attachAndReady(media);

      report(iframe, 'play', undefined, listener);
      report(iframe, 'ended', undefined, listener);
      expect(media.ended).toBe(true);

      media.currentTime = 9;

      expect(media.ended).toBe(false);
    });

    it('settles on a round trip where the embed reports no seeked event', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, commands } = await attachAndReady(media, {});
      const seeked = vi.fn();

      media.addEventListener('seeked', seeked);
      commands.clear();
      media.currentTime = 30;

      expect(media.seeking).toBe(true);

      answer(iframe, commands, { getCurrentTime: 30 });
      await flush();

      expect(media.seeking).toBe(false);
      expect(seeked).toHaveBeenCalledOnce();
    });

    it('holds a seek asked for before ready and sends it then', async () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();

      media.src = EMBED_SRC;
      media.attach(iframe);
      const commands = watchCommands(iframe);

      media.currentTime = 15;
      expect(commands.named('setCurrentTime')).toEqual([]);

      report(iframe, 'ready', FULL_SUPPORT);
      expect(commands.named('setCurrentTime')).toEqual([expect.objectContaining({ value: 15 })]);
    });

    it('is a no-op where the embed cannot seek', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media, { methods: ['play', 'pause'], events: ['ready'] });
      const seeking = vi.fn();

      media.addEventListener('seeking', seeking);
      commands.clear();
      media.currentTime = 30;

      expect(media.currentTime).toBe(0);
      expect(media.seeking).toBe(false);
      expect(seeking).not.toHaveBeenCalled();
      expect(commands.all()).toEqual([]);
    });

    it('rolls back a seek held before ready when the embed turns out unable to seek', async () => {
      const media = new PlayerJsAdapter();
      const iframe = createIframe();
      const seeked = vi.fn();

      media.src = EMBED_SRC;
      media.attach(iframe);
      media.addEventListener('seeked', seeked);
      media.currentTime = 15;

      report(iframe, 'ready', { methods: ['play'], events: ['ready'] });

      expect(media.currentTime).toBe(0);
      expect(media.seeking).toBe(false);
      expect(seeked).toHaveBeenCalledOnce();
    });
  });

  describe('volume', () => {
    it('sends volume on the spec 0-100 scale and announces the change', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media);
      const volumechange = vi.fn();

      media.addEventListener('volumechange', volumechange);
      commands.clear();
      media.volume = 0.5;

      expect(media.volume).toBe(0.5);
      expect(volumechange).toHaveBeenCalledOnce();
      expect(commands.all()).toEqual([expect.objectContaining({ method: 'setVolume', value: 50 })]);
    });

    it('sends mute and unmute', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media);

      commands.clear();
      media.muted = true;
      media.muted = false;

      expect(commands.all().map((c) => c.method)).toEqual(['mute', 'unmute']);
    });

    it('asserts a mute and level set before ready', async () => {
      const media = new PlayerJsAdapter();

      media.defaultMuted = true;
      media.volume = 0.3;
      const { commands } = await attachAndReady(media);

      expect(media.muted).toBe(true);
      expect(commands.named('mute')).toHaveLength(1);
      expect(commands.named('setVolume')).toEqual([expect.objectContaining({ value: 30 })]);
    });

    it('is a no-op where the embed cannot set a level', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media, { methods: ['play', 'mute', 'unmute'], events: ['ready'] });

      commands.clear();
      media.volume = 0.5;

      expect(media.volume).toBe(1);
      expect(commands.all()).toEqual([]);
    });

    it('falls back to the defaults for values set before ready that the embed cannot take', async () => {
      const media = new PlayerJsAdapter();
      const volumechange = vi.fn();

      media.muted = true;
      media.volume = 0.3;
      media.addEventListener('volumechange', volumechange);
      await attachAndReady(media, { methods: ['play'], events: ['ready'] });

      expect(media.muted).toBe(false);
      expect(media.volume).toBe(1);
      expect(volumechange).toHaveBeenCalled();
    });
  });

  describe('playbackRate', () => {
    it('sends the rate where the embed advertises setPlaybackRate', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media);

      commands.clear();
      media.playbackRate = 2;

      expect(media.playbackRate).toBe(2);
      expect(commands.all()).toEqual([expect.objectContaining({ method: 'setPlaybackRate', value: 2 })]);
    });

    it('is a no-op where the embed lacks the extension', async () => {
      const media = new PlayerJsAdapter();
      const { commands } = await attachAndReady(media, {});

      commands.clear();
      media.playbackRate = 2;

      expect(media.playbackRate).toBe(1);
      expect(commands.all()).toEqual([]);
    });
  });

  describe('errors', () => {
    it('reports an embed error as a media error', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, listener } = await attachAndReady(media);
      const error = vi.fn();

      media.addEventListener('error', error);
      report(iframe, 'error', { code: 1, msg: 'Playback not supported' }, listener);

      expect(error).toHaveBeenCalledOnce();
      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      expect(media.error?.message).toBe('Playback not supported');
    });

    it('reports an undefined embed error as a fatal custom error', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, listener } = await attachAndReady(media);

      report(iframe, 'error', { code: -1, msg: '' }, listener);

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_CUSTOM);
      expect(media.error?.fatal).toBe(true);
      expect(media.error?.message).toBeTruthy();
    });

    it('does not treat a rejected command as a media error', async () => {
      const media = new PlayerJsAdapter();
      const { iframe, listener } = await attachAndReady(media);
      const error = vi.fn();
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      media.addEventListener('error', error);
      report(iframe, 'error', { code: 2, msg: 'Invalid Method "foo"' }, listener);
      report(iframe, 'error', { code: 3, msg: 'Method Not Supported"setLoop"' }, listener);

      expect(error).not.toHaveBeenCalled();
      expect(media.error).toBe(null);
      expect(warn).toHaveBeenCalledTimes(2);
    });
  });

  describe('fullscreen', () => {
    it('targets the iframe, since the protocol has no fullscreen command', async () => {
      const media = new PlayerJsAdapter();
      const { iframe } = await attachAndReady(media);
      const requestFullscreen = vi.fn(async () => {});

      iframe.requestFullscreen = requestFullscreen;
      await media.requestFullscreen();

      expect(requestFullscreen).toHaveBeenCalledOnce();
      expect(media.isFullscreen).toBe(true);
    });
  });
});
