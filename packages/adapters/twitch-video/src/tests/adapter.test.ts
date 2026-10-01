import { MediaError } from '@videojs/media';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { buildTwitchIframeSrc, TwitchAdapter } from '..';

const VOD_SRC = 'https://www.twitch.tv/videos/123456789';
const CHANNEL_SRC = 'https://www.twitch.tv/twitchpresents';
const ORIGIN = 'https://player.twitch.tv';
const PROXY_NAMESPACE = 'twitch-embed-player-proxy';
const EMBED_NAMESPACE = 'twitch-embed';

// https://dev.twitch.tv/docs/embed/video-and-clips/
const COMMAND = { PAUSE: 2, PLAY: 3, SEEK: 4, SET_CHANNEL: 5, SET_VIDEO: 9, SET_MUTED: 10, SET_VOLUME: 11 } as const;

/** How long the host waits for the state snapshot behind a lifecycle event. */
const SETTLE_MS = 10;

interface EmbedWindow {
  postMessage: ReturnType<typeof vi.fn>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * An iframe with a stand-in for the embed's window. It is the whole protocol surface: commands are posted to it, and
 * only messages claiming to come from it are allowed to drive state.
 */
function createIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  Object.defineProperty(iframe, 'contentWindow', {
    value: { postMessage: vi.fn() } satisfies EmbedWindow,
    configurable: true,
  });
  return iframe;
}

/** An iframe as React renders it before a source resolves: `src` present but empty. */
function createEmptySrcIframe(): HTMLIFrameElement {
  const iframe = createIframe();

  iframe.setAttribute('src', '');
  return iframe;
}

function embedOf(iframe: HTMLIFrameElement): EmbedWindow {
  return iframe.contentWindow as unknown as EmbedWindow;
}

/**
 * Post a message as the embed would. A real `MessageEvent` cannot name an arbitrary object as its `source`, so the
 * event is assembled by hand.
 */
function postFromWindow(source: unknown, data: unknown): void {
  const event = new Event('message');

  Object.defineProperties(event, { data: { value: data }, source: { value: source } });
  globalThis.dispatchEvent(event);
}

function postEmbedEvent(iframe: HTMLIFrameElement, eventName: string): void {
  postFromWindow(iframe.contentWindow, { namespace: EMBED_NAMESPACE, eventName });
}

function postPlayerState(iframe: HTMLIFrameElement, params: Record<string, unknown>): void {
  postFromWindow(iframe.contentWindow, { namespace: PROXY_NAMESPACE, eventName: 'UPDATE_STATE', params });
}

/** Wait out the delay the host gives a lifecycle event's state snapshot to arrive. */
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(SETTLE_MS);
}

/** Flush the microtask the deferred embed waits on before it is built. */
async function flushDeferredEmbed(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

function command(eventName: number, params?: unknown) {
  return { namespace: PROXY_NAMESPACE, eventName, params };
}

async function attachAndLoad(media: TwitchAdapter): Promise<{ iframe: HTMLIFrameElement; embed: EmbedWindow }> {
  // There is no embed to attach to without a source, so tests that don't care
  // which video is playing get one.
  if (!media.src) media.src = VOD_SRC;

  const iframe = createIframe();

  media.attach(iframe);
  postEmbedEvent(iframe, 'ready');
  await settle();
  return { iframe, embed: embedOf(iframe) };
}

describe('buildTwitchIframeSrc', () => {
  it('builds a VOD embed URL with the page hostname as parent', () => {
    const src = buildTwitchIframeSrc(VOD_SRC);

    expect(src).toContain(`${ORIGIN}/?video=v123456789`);
    expect(src).toContain('controls=false');
    expect(src).toContain('autoplay=false');
    expect(src).toContain('muted=false');
    expect(src).toContain('preload=metadata');
    expect(src).toContain(`parent=${globalThis.location.hostname}`);
  });

  it('builds a channel embed URL', () => {
    expect(buildTwitchIframeSrc(CHANNEL_SRC)).toContain(`${ORIGIN}/?channel=twitchpresents`);
  });

  it('leaves the embed on its own defaults when controls and autoplay are set', () => {
    const src = buildTwitchIframeSrc(VOD_SRC, { controls: true, autoplay: true, defaultMuted: true });

    expect(src).not.toContain('controls=');
    expect(src).not.toContain('autoplay=');
    expect(src).toContain('muted=true');
  });

  it('repeats parent for every hostname, including the page it is embedded in', () => {
    const src = buildTwitchIframeSrc(VOD_SRC, {
      source: { engine: { twitch: { parent: ['embed.example.com', 'www.example.com'] } } },
    });
    const parents = new URL(src).searchParams.getAll('parent');

    expect(parents).toEqual(['embed.example.com', 'www.example.com', globalThis.location.hostname]);
  });

  it('does not repeat a parent that is already the page hostname', () => {
    const src = buildTwitchIframeSrc(VOD_SRC, {
      source: { engine: { twitch: { parent: globalThis.location.hostname } } },
    });

    expect(new URL(src).searchParams.getAll('parent')).toEqual([globalThis.location.hostname]);
  });

  it('forwards Twitch-specific knobs, spelling booleans the way Twitch reads them', () => {
    const src = buildTwitchIframeSrc(VOD_SRC, {
      source: { engine: { twitch: { time: '1h30m10s', collection: 'abc123', allowfullscreen: false } } },
    });

    expect(src).toContain('time=1h30m10s');
    expect(src).toContain('collection=abc123');
    expect(src).toContain('allowfullscreen=false');
  });

  it('leaves out a parameter that was given no value', () => {
    const src = buildTwitchIframeSrc(VOD_SRC, {
      source: { engine: { twitch: { time: '', collection: 'abc123' } } },
    });

    // An empty value is not presence: written through, `time=1` is a timestamp
    // the embed cannot read.
    expect(src).not.toContain('time=');
    expect(src).toContain('collection=abc123');
  });

  it('keeps referrerPolicy off the embed URL', () => {
    const src = buildTwitchIframeSrc(VOD_SRC, {
      source: { engine: { twitch: { referrerPolicy: 'no-referrer' } } },
    });

    expect(src).not.toContain('referrerPolicy');
  });

  it('returns empty string for invalid src', () => {
    expect(buildTwitchIframeSrc('https://example.com/videos/1')).toBe('');
    expect(buildTwitchIframeSrc('')).toBe('');
  });
});

describe('TwitchAdapter', () => {
  it('has expected default state before attach', () => {
    const media = new TwitchAdapter();

    expect(media.engine).toBe(null);
    expect(media.target).toBe(null);
    expect(media.paused).toBe(true);
    expect(media.ended).toBe(false);
    expect(media.currentTime).toBe(0);
    expect(media.duration).toBeNaN();
    expect(media.src).toBe(TwitchAdapter.defaultProps.src);
    expect(media.buffered.length).toBe(0);
    expect(media.textTracks.length).toBe(0);
    expect(media.played.length).toBeGreaterThanOrEqual(1);
  });

  it('sets the initial iframe src and binds the embed when attached', () => {
    const media = new TwitchAdapter();

    media.src = VOD_SRC;
    const iframe = createIframe();

    media.attach(iframe);

    expect(iframe.getAttribute('src')).toContain(`${ORIGIN}/?video=v123456789`);
    expect(media.currentSrc).toBe(iframe.getAttribute('src'));
    expect(media.target).toBe(iframe);
    expect(media.engine).toBe(iframe.contentWindow);
    media.detach();
  });

  it('names the page as a parent on an embed URL that arrived without one', () => {
    const media = new TwitchAdapter();

    media.src = VOD_SRC;
    const iframe = createIframe();

    // Server rendering has no `location`, so the URL it froze names only the
    // hostnames the app configured, and the embed would refuse to play.
    iframe.setAttribute('src', `${ORIGIN}/?video=v123456789&parent=embed.example.com`);
    media.attach(iframe);

    expect(new URL(iframe.getAttribute('src') ?? '').searchParams.getAll('parent')).toEqual([
      'embed.example.com',
      globalThis.location.hostname,
    ]);
    media.detach();
  });

  it('leaves an embed URL that already names the page alone', () => {
    const media = new TwitchAdapter();

    media.src = VOD_SRC;
    const iframe = createIframe();
    const src = `${ORIGIN}/?video=v123456789&parent=${globalThis.location.hostname}`;

    iframe.setAttribute('src', src);
    const navigate = vi.spyOn(iframe, 'src', 'set');

    media.attach(iframe);

    expect(navigate).not.toHaveBeenCalled();
    expect(iframe.getAttribute('src')).toBe(src);
    media.detach();
    navigate.mockRestore();
  });

  it('defers the embed until a source arrives', async () => {
    const media = new TwitchAdapter();
    const loadstart = vi.fn();

    media.addEventListener('loadstart', loadstart);

    // How every framework builds the element: created first, `src` set after.
    const iframe = createIframe();

    media.attach(iframe);
    expect(iframe.getAttribute('src')).toBe(null);
    expect(media.engine).toBe(null);
    expect(loadstart).not.toHaveBeenCalled();

    media.src = VOD_SRC;
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('video=v123456789');
    expect(loadstart).toHaveBeenCalledTimes(1);
    expect(media.engine).toBe(iframe.contentWindow);
    media.detach();
  });

  it('defers the embed for an iframe rendered with an empty src', async () => {
    const media = new TwitchAdapter();
    // React renders `src=""` before a source resolves. The `src` property reports
    // the document URL for it, so only the attribute says there is no embed.
    const iframe = createEmptySrcIframe();

    media.attach(iframe);
    expect(media.engine).toBe(null);

    media.src = VOD_SRC;
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('video=v123456789');
    media.detach();
  });

  it('builds a deferred embed once for repeated source changes in the same task', async () => {
    const media = new TwitchAdapter();
    const loadstart = vi.fn();

    media.addEventListener('loadstart', loadstart);
    const iframe = createIframe();

    media.attach(iframe);

    media.src = VOD_SRC;
    media.src = 'https://www.twitch.tv/videos/222';
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain('video=v222');
    expect(loadstart).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('does not leave play() waiting while the embed is deferred', async () => {
    const media = new TwitchAdapter();

    media.attach(createIframe());

    // No embed means no `ready` is coming to report a load; waiting would hang.
    await expect(media.play()).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
  });

  it('emits loadstart on attach and loadedmetadata/loadcomplete after ready', async () => {
    const media = new TwitchAdapter();
    const events: string[] = [];

    for (const type of ['loadstart', 'loadedmetadata', 'loadcomplete'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    await attachAndLoad(media);

    expect(events).toEqual(['loadstart', 'loadedmetadata', 'loadcomplete']);
    expect(media.readyState).toBe(1);
    media.detach();
  });

  it('waits for the embed to report ready before playing', async () => {
    const media = new TwitchAdapter();

    media.src = VOD_SRC;
    const iframe = createIframe();

    media.attach(iframe);

    let played = false;
    const pending = media.play().then(() => {
      played = true;
    });

    await flushDeferredEmbed();
    expect(played).toBe(false);

    postEmbedEvent(iframe, 'ready');
    await settle();
    await pending;

    expect(embedOf(iframe).postMessage).toHaveBeenCalledWith(command(COMMAND.PLAY), ORIGIN);
    media.detach();
  });

  it('does not complete the load on a snapshot that arrives before ready', async () => {
    const media = new TwitchAdapter();

    media.src = VOD_SRC;
    const iframe = createIframe();

    media.attach(iframe);
    const loadcomplete = vi.fn();

    media.addEventListener('loadcomplete', loadcomplete);

    let played = false;

    void media.play().then(() => {
      played = true;
    });
    // The player proxy starts describing the embed before the embed says it can
    // hear anything; every command until then is dropped.
    postPlayerState(iframe, { duration: 120, playback: 'Ready' });
    await flushDeferredEmbed();

    expect(loadcomplete).not.toHaveBeenCalled();
    expect(played).toBe(false);
    expect(embedOf(iframe).postMessage).not.toHaveBeenCalled();

    postEmbedEvent(iframe, 'ready');
    await settle();
    await flushDeferredEmbed();

    expect(loadcomplete).toHaveBeenCalledTimes(1);
    expect(embedOf(iframe).postMessage).toHaveBeenCalledWith(command(COMMAND.PLAY), ORIGIN);
    media.detach();
  });

  it('forwards play() and pause() to the embed', async () => {
    const media = new TwitchAdapter();
    const { iframe, embed } = await attachAndLoad(media);

    await media.play();
    expect(embed.postMessage).toHaveBeenCalledWith(command(COMMAND.PLAY), ORIGIN);
    expect(media.paused).toBe(false);

    media.pause();
    expect(embed.postMessage).toHaveBeenCalledWith(command(COMMAND.PAUSE), ORIGIN);
    expect(media.paused).toBe(true);

    // The embed's own report takes over as soon as there is one.
    postPlayerState(iframe, { playback: 'Playing' });
    expect(media.paused).toBe(false);
    media.detach();
  });

  it('forwards setters to the embed after load', async () => {
    const media = new TwitchAdapter();
    const { embed } = await attachAndLoad(media);

    media.currentTime = 30;
    media.volume = 0.5;
    media.muted = true;

    // Setters defer via the loadComplete microtask — flush.
    await flushDeferredEmbed();

    expect(embed.postMessage).toHaveBeenCalledWith(command(COMMAND.SEEK, 30), ORIGIN);
    expect(embed.postMessage).toHaveBeenCalledWith(command(COMMAND.SET_VOLUME, 0.5), ORIGIN);
    expect(embed.postMessage).toHaveBeenCalledWith(command(COMMAND.SET_MUTED, true), ORIGIN);
    media.detach();
  });

  it('announces a volume or mute it is given, without repeating the embed echo', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);
    const volumechange = vi.fn();

    media.addEventListener('volumechange', volumechange);

    // A snapshot is a patch against what is already reported, so nothing else
    // is going to announce a level the host set itself.
    media.volume = 0.5;
    expect(media.volume).toBe(0.5);
    expect(volumechange).toHaveBeenCalledTimes(1);

    media.muted = true;
    expect(media.muted).toBe(true);
    expect(volumechange).toHaveBeenCalledTimes(2);

    // The embed echoing what it was told is not a second change.
    postPlayerState(iframe, { volume: 0.5, muted: true });
    expect(volumechange).toHaveBeenCalledTimes(2);

    // A level set from the embed's own controls still is.
    postPlayerState(iframe, { volume: 0.8 });
    expect(media.volume).toBe(0.8);
    expect(volumechange).toHaveBeenCalledTimes(3);

    // Setting what is already reported changes nothing.
    media.volume = 0.8;
    expect(volumechange).toHaveBeenCalledTimes(3);
    media.detach();
  });

  it('updates state from player state snapshots', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['durationchange', 'timeupdate', 'volumechange', 'progress'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    postPlayerState(iframe, {
      duration: 120,
      currentTime: 5,
      volume: 0.5,
      muted: true,
      playback: 'Playing',
      stats: { videoStats: { bufferSize: 10 } },
    });

    expect(events).toEqual(['durationchange', 'timeupdate', 'volumechange', 'progress']);
    expect(media.duration).toBe(120);
    expect(media.currentTime).toBe(5);
    expect(media.volume).toBe(0.5);
    expect(media.muted).toBe(true);
    expect(media.paused).toBe(false);
    expect(media.seekable.start(0)).toBe(0);
    expect(media.seekable.end(0)).toBe(120);
    // `bufferSize` is buffer ahead of the playhead, not a position.
    expect(media.buffered.start(0)).toBe(5);
    expect(media.buffered.end(0)).toBe(15);

    // Only what changed is reported, and an unchanged field says nothing.
    events.length = 0;
    postPlayerState(iframe, { currentTime: 6 });
    expect(events).toEqual(['timeupdate']);
    expect(media.duration).toBe(120);
    media.detach();
  });

  it('emits waiting when the embed reports buffering', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);
    const waiting = vi.fn();

    media.addEventListener('waiting', waiting);

    postPlayerState(iframe, { playback: 'Buffering' });

    expect(waiting).toHaveBeenCalledTimes(1);
    // A stall is not a pause; the embed is still trying to play.
    expect(media.paused).toBe(false);

    // Still buffering is still the same stall.
    postPlayerState(iframe, { playback: 'Buffering' });
    expect(waiting).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('reports the end of a VOD from the playback state', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);
    const ended = vi.fn();

    media.addEventListener('ended', ended);

    postPlayerState(iframe, { playback: 'Ended' });
    postEmbedEvent(iframe, 'ended');
    await settle();

    expect(media.ended).toBe(true);
    expect(media.paused).toBe(true);
    expect(ended).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('maps seek and playing onto seeking/seeked', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['seeking', 'seeked', 'playing'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    postEmbedEvent(iframe, 'seek');
    await settle();
    expect(media.seeking).toBe(true);

    postEmbedEvent(iframe, 'playing');
    await settle();
    expect(media.seeking).toBe(false);
    expect(events).toEqual(['seeking', 'seeked', 'playing']);
    expect(media.readyState).toBe(3);
    media.detach();
  });

  it('re-dispatches the embed events that already read as media events', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['play', 'pause', 'offline'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    for (const type of ['play', 'pause', 'offline']) {
      postEmbedEvent(iframe, type);
      await settle();
    }

    expect(events).toEqual(['play', 'pause', 'offline']);
    media.detach();
  });

  it('ignores messages from a window that is not the embed', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);
    const timeupdate = vi.fn();

    media.addEventListener('timeupdate', timeupdate);

    const params = { currentTime: 9 };

    postFromWindow({ postMessage: vi.fn() }, { namespace: PROXY_NAMESPACE, eventName: 'UPDATE_STATE', params });
    expect(media.currentTime).toBe(0);
    expect(timeupdate).not.toHaveBeenCalled();

    postFromWindow(iframe.contentWindow, { namespace: 'some-other-embed', eventName: 'UPDATE_STATE', params });

    expect(media.currentTime).toBe(0);
    expect(timeupdate).not.toHaveBeenCalled();

    postPlayerState(iframe, params);
    expect(media.currentTime).toBe(9);
    expect(timeupdate).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('removes its message listener on detach', async () => {
    const addEventListener = vi.spyOn(globalThis, 'addEventListener');
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);

    const options = addEventListener.mock.calls.find(([type]) => type === 'message')?.[2] as AddEventListenerOptions;

    expect(options.signal?.aborted).toBe(false);

    media.detach();
    expect(options.signal?.aborted).toBe(true);

    // Nothing the embed says afterwards can reach the host.
    const timeupdate = vi.fn();

    media.addEventListener('timeupdate', timeupdate);
    postPlayerState(iframe, { currentTime: 9 });
    expect(timeupdate).not.toHaveBeenCalled();
    addEventListener.mockRestore();
  });

  it('ignores a settling embed event from a superseded attach', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);
    const playing = vi.fn();

    media.addEventListener('playing', playing);

    // The event is in flight when the attach it belongs to goes away.
    postEmbedEvent(iframe, 'playing');
    media.detach();
    await settle();

    expect(playing).not.toHaveBeenCalled();
  });

  it('unblocks pending play() when detached before the embed reports ready', async () => {
    const media = new TwitchAdapter();

    media.src = VOD_SRC;
    media.attach(createIframe());

    const pending = media.play();

    media.detach();

    await expect(pending).resolves.toBeUndefined();
  });

  it('errors and unblocks pending play() when src is unrecognized', async () => {
    const media = new TwitchAdapter();

    await attachAndLoad(media);
    const error = vi.fn();

    media.addEventListener('error', error);

    media.src = 'https://example.com/not-twitch';
    await flushDeferredEmbed();

    expect(error).toHaveBeenCalledTimes(1);
    expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    await expect(media.play()).resolves.toBeUndefined();
    media.detach();
  });

  it('tracks played ranges via the played-ranges mixin', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);

    postPlayerState(iframe, { currentTime: 0, playback: 'Playing' });
    postEmbedEvent(iframe, 'play');
    await settle();
    postPlayerState(iframe, { currentTime: 10 });
    postEmbedEvent(iframe, 'pause');
    await settle();

    const played = media.played;

    expect(played.length).toBeGreaterThanOrEqual(1);
    expect(played.end(0)).toBeGreaterThan(0);
    media.detach();
  });

  it('does not report fullscreen when there is no element to request it on', async () => {
    const media = new TwitchAdapter();

    await media.requestFullscreen();
    expect(media.isFullscreen).toBe(false);
  });
});

describe('TwitchAdapter live channels', () => {
  it('reports an infinite duration and no seekable range', async () => {
    const media = new TwitchAdapter();

    media.src = CHANNEL_SRC;
    const { iframe } = await attachAndLoad(media);

    expect(iframe.getAttribute('src')).toContain('channel=twitchpresents');
    expect(media.duration).toBe(Number.POSITIVE_INFINITY);
    expect(media.seekable.length).toBe(0);
    media.detach();
  });

  it('keeps the infinite duration and never ends', async () => {
    const media = new TwitchAdapter();

    media.src = CHANNEL_SRC;
    const { iframe } = await attachAndLoad(media);
    const durationchange = vi.fn();

    media.addEventListener('durationchange', durationchange);

    // Twitch sends the seconds it has been streaming, which is not a duration.
    postPlayerState(iframe, { duration: 42, playback: 'Ended' });

    expect(durationchange).not.toHaveBeenCalled();
    expect(media.duration).toBe(Number.POSITIVE_INFINITY);
    expect(media.ended).toBe(false);
    media.detach();
  });
});

describe('TwitchAdapter source', () => {
  it('derives src from a structured source and announces the change', () => {
    const media = new TwitchAdapter();
    const sourceChange = vi.fn();

    media.addEventListener('sourcechange', sourceChange);

    media.source = { src: VOD_SRC };

    expect(media.src).toBe(VOD_SRC);
    expect(sourceChange).toHaveBeenCalledTimes(1);
  });

  it('re-derives source from src, carrying Twitch embed parameters over', () => {
    const media = new TwitchAdapter();

    media.source = { src: VOD_SRC, engine: { twitch: { time: '0h1m0s' } } };

    media.src = CHANNEL_SRC;

    expect(media.source).toEqual({ engine: { twitch: { time: '0h1m0s' } }, src: CHANNEL_SRC });
  });

  it('serializes Twitch embed parameters onto the initial iframe src', () => {
    const media = new TwitchAdapter();

    media.source = { src: VOD_SRC, engine: { twitch: { time: '0h1m0s', parent: 'embed.example.com' } } };
    const iframe = createIframe();

    media.attach(iframe);

    const src = iframe.getAttribute('src') ?? '';

    expect(src).toContain('time=0h1m0s');
    expect(new URL(src).searchParams.getAll('parent')).toContain('embed.example.com');
    media.detach();
  });

  it('swaps a new VOD into the running embed instead of rebuilding it', async () => {
    const media = new TwitchAdapter();
    const { iframe, embed } = await attachAndLoad(media);
    const embedSrc = iframe.getAttribute('src');

    media.src = 'https://www.twitch.tv/videos/222';
    await flushDeferredEmbed();

    expect(embed.postMessage).toHaveBeenCalledWith(command(COMMAND.SET_VIDEO, 'v222'), ORIGIN);
    // The embed (and its session) is still the one that was there.
    expect(iframe.getAttribute('src')).toBe(embedSrc);

    // A swap reports no readiness of its own, so the first snapshot completes it.
    const loadcomplete = vi.fn();

    media.addEventListener('loadcomplete', loadcomplete);
    postPlayerState(iframe, { duration: 30 });
    expect(loadcomplete).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('swaps a channel into an embed that was playing a VOD', async () => {
    const media = new TwitchAdapter();
    const { embed } = await attachAndLoad(media);

    media.src = CHANNEL_SRC;
    await flushDeferredEmbed();

    expect(embed.postMessage).toHaveBeenCalledWith(command(COMMAND.SET_CHANNEL, 'twitchpresents'), ORIGIN);
    media.detach();
  });

  it('rebuilds the embed when an embed parameter changes', async () => {
    const media = new TwitchAdapter();
    const { iframe, embed } = await attachAndLoad(media);

    media.source = { src: VOD_SRC, engine: { twitch: { time: '0h1m0s' } } };
    await flushDeferredEmbed();

    // Embed parameters only exist on the URL, so there is nothing to command.
    expect(embed.postMessage).not.toHaveBeenCalledWith(command(COMMAND.SET_VIDEO, 'v123456789'), ORIGIN);
    expect(iframe.getAttribute('src')).toContain('time=0h1m0s');

    // The rebuilt embed reports `ready` again, which completes the load.
    const loadcomplete = vi.fn();

    media.addEventListener('loadcomplete', loadcomplete);
    postEmbedEvent(iframe, 'ready');
    await settle();
    expect(loadcomplete).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('ignores what the outgoing embed reports while a rebuilt one is in flight', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);

    media.source = { src: VOD_SRC, engine: { twitch: { time: '0h1m0s' } } };
    await flushDeferredEmbed();

    const loadcomplete = vi.fn();

    media.addEventListener('loadcomplete', loadcomplete);
    // The iframe keeps its window across the `src` change, so the document on its
    // way out still reaches the host, describing the video being replaced.
    postPlayerState(iframe, { duration: 120, currentTime: 42 });

    expect(loadcomplete).not.toHaveBeenCalled();
    expect(media.currentTime).toBe(0);

    postEmbedEvent(iframe, 'ready');
    await settle();
    expect(loadcomplete).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('replays a source change that arrived before the embed was ready', async () => {
    const media = new TwitchAdapter();

    media.src = VOD_SRC;
    const iframe = createIframe();

    media.attach(iframe);

    media.src = 'https://www.twitch.tv/videos/222';
    await flushDeferredEmbed();
    // Commands are dropped before `ready`, so nothing has been sent yet.
    expect(embedOf(iframe).postMessage).not.toHaveBeenCalled();

    postEmbedEvent(iframe, 'ready');
    await settle();

    expect(embedOf(iframe).postMessage).toHaveBeenCalledWith(command(COMMAND.SET_VIDEO, 'v222'), ORIGIN);
    media.detach();
  });

  it('stops the embed and resets state when the source is cleared', async () => {
    const media = new TwitchAdapter();
    const { iframe, embed } = await attachAndLoad(media);

    postPlayerState(iframe, { duration: 120, currentTime: 5, playback: 'Playing' });

    media.source = null;
    await flushDeferredEmbed();

    expect(media.src).toBe('');
    expect(embed.postMessage).toHaveBeenCalledWith(command(COMMAND.PAUSE), ORIGIN);
    expect(media.duration).toBeNaN();
    expect(media.currentTime).toBe(0);
    media.detach();
  });

  it('announces the reset when the source is cleared', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);

    postPlayerState(iframe, { duration: 120, currentTime: 5, playback: 'Playing' });

    const emptied = vi.fn();

    media.addEventListener('emptied', emptied);
    media.source = null;
    await flushDeferredEmbed();

    // The embed is paused and its messages are ignored from here, so nothing else
    // is coming to say the last video's duration and buffer are gone.
    expect(emptied).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('ignores what the stopped embed reports after the source is cleared', async () => {
    const media = new TwitchAdapter();
    const { iframe } = await attachAndLoad(media);

    postPlayerState(iframe, { duration: 120, currentTime: 5, playback: 'Playing' });

    media.source = null;
    await flushDeferredEmbed();

    const events: string[] = [];

    for (const type of ['durationchange', 'timeupdate', 'progress', 'playing'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    // A paused embed keeps describing the video it still holds.
    postPlayerState(iframe, { duration: 120, currentTime: 5, stats: { videoStats: { bufferSize: 10 } } });
    postEmbedEvent(iframe, 'playing');
    await settle();

    expect(events).toEqual([]);
    expect(media.duration).toBeNaN();
    expect(media.currentTime).toBe(0);
    expect(media.buffered.length).toBe(0);
    expect(media.readyState).toBe(0);
    media.detach();
  });

  it('does not play a source that was cleared', async () => {
    const media = new TwitchAdapter();
    const { embed } = await attachAndLoad(media);

    media.source = null;
    await flushDeferredEmbed();
    embed.postMessage.mockClear();

    await media.play();
    expect(embed.postMessage).not.toHaveBeenCalled();
    media.detach();
  });
});
