import { MediaError, type Video } from '@videojs/media';
import { loadScript } from '@videojs/utils/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { buildCloudflareIframeSrc, CloudflareAdapter } from '..';

vi.mock(import('@videojs/utils/dom'), async (importOriginal) => {
  const mod = await importOriginal();

  return { ...mod, loadScript: vi.fn(async () => {}) };
});

const VIDEO_ID = 'ea95132c15732412d22c1476fa83f27a';
const OTHER_VIDEO_ID = '8d3c1e05d1a4e9f9e0f0b2c1a7d64f3b';
const SIGNED_TOKEN = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJlYTk1MTMyYyJ9.hOZ8Q9-signature';

/** The Stream player mimics `HTMLVideoElement`, so the mock reads and writes like one. */
class MockPlayer {
  static instances: MockPlayer[] = [];
  target: HTMLIFrameElement;
  listeners = new Map<string, Set<(event: Event) => void>>();

  src = '';
  currentTime = 0;
  volume = 1;
  muted = false;
  playbackRate = 1;
  loop = false;
  autoplay = false;
  controls = false;
  preload = 'metadata';
  poster = '';
  paused = true;
  ended = false;
  seeking = false;
  duration = 60;
  buffered = timeRanges(0);
  played = timeRanges(0);
  videoWidth = 1920;
  videoHeight = 1080;

  play = vi.fn(async () => {});
  pause = vi.fn();

  constructor(target: HTMLIFrameElement) {
    this.target = target;
    MockPlayer.instances.push(this);
  }

  addEventListener(type: string, listener: (event: Event) => void): void {
    let set = this.listeners.get(type);

    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }

    set.add(listener);
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type: string): void {
    this.listeners.get(type)?.forEach((listener) => listener(new Event(type)));
  }
}

function timeRanges(end: number): TimeRanges {
  return { length: end > 0 ? 1 : 0, start: () => 0, end: () => end } as unknown as TimeRanges;
}

beforeEach(() => {
  MockPlayer.instances.length = 0;
  vi.stubGlobal('Stream', (target: HTMLIFrameElement) => new MockPlayer(target));
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

/**
 * An iframe as a server-rendered page delivers it: the embed URL is already in the markup and the frame has navigated
 * to it, so a same-origin read of its location throws the way a real cross-origin embed does.
 */
function createServerRenderedIframe(src: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  iframe.setAttribute('src', src);
  Object.defineProperty(iframe, 'contentWindow', {
    configurable: true,
    get: () => ({
      get location(): Location {
        throw new DOMException('cross-origin', 'SecurityError');
      },
    }),
  });
  return iframe;
}

/** Record every `src` assignment, so a same-URL reload is visible. */
function spyOnSrcAssignment(iframe: HTMLIFrameElement, current: string): string[] {
  const assigned: string[] = [];

  Object.defineProperty(iframe, 'src', {
    configurable: true,
    get: () => current,
    set: (value: string) => assigned.push(value),
  });
  return assigned;
}

/** Flush the microtask the deferred embed waits on before it is built. */
async function flushDeferredEmbed(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForEngine(media: CloudflareAdapter): Promise<MockPlayer> {
  await vi.waitFor(() => {
    if (!media.engine) throw new Error('player not created yet');
  });
  return media.engine as unknown as MockPlayer;
}

async function attachAndLoad(media: CloudflareAdapter): Promise<{ iframe: HTMLIFrameElement; player: MockPlayer }> {
  // There is no embed to attach to without a source, so tests that don't care
  // which video is playing get one.
  if (!media.src) media.src = VIDEO_ID;

  const iframe = createIframe();

  media.attach(iframe);
  const player = await waitForEngine(media);

  player.emit('loadedmetadata');
  return { iframe, player };
}

describe('buildCloudflareIframeSrc', () => {
  it('builds embed URL with hidden controls and the default preload', () => {
    const src = buildCloudflareIframeSrc(VIDEO_ID);

    expect(src).toContain(`https://iframe.videodelivery.net/${VIDEO_ID}?`);
    expect(src).toContain('controls=0');
    expect(src).toContain('preload=metadata');
  });

  it('encodes autoplay, defaultMuted, loop', () => {
    const src = buildCloudflareIframeSrc(VIDEO_ID, { autoplay: true, defaultMuted: true, loop: true });

    expect(src).toContain('autoplay=1');
    expect(src).toContain('muted=1');
    expect(src).toContain('loop=1');
  });

  it('omits autoplay, muted, and loop rather than turning them off', () => {
    // Cloudflare reads these three by presence, not by value, so `autoplay=0`
    // autoplays and `muted=0` starts the video silenced — which also makes the
    // volume control look broken, since the embed is muted underneath it.
    const src = buildCloudflareIframeSrc(VIDEO_ID, { autoplay: false, defaultMuted: false, loop: false });

    expect(src).not.toContain('autoplay');
    expect(src).not.toContain('muted');
    expect(src).not.toContain('loop');

    // The props the HTML and React wrappers pass by default must be just as quiet.
    const fromDefaults = buildCloudflareIframeSrc(VIDEO_ID, CloudflareAdapter.defaultProps);

    expect(fromDefaults).not.toContain('autoplay');
    expect(fromDefaults).not.toContain('muted');
    expect(fromDefaults).not.toContain('loop');
  });

  it('shows Cloudflare controls when controls=true', () => {
    const src = buildCloudflareIframeSrc(VIDEO_ID, { controls: true });

    expect(src).not.toContain('controls=');
  });

  it('falls back to the default preload when the attribute carries no value', () => {
    // A bare `preload` attribute reads as empty, which serializes to `1` — not
    // one of the values Cloudflare accepts.
    const src = buildCloudflareIframeSrc(VIDEO_ID, { preload: '' });

    expect(src).toContain(`preload=${CloudflareAdapter.defaultProps.preload}`);
    expect(src).not.toContain('preload=1');
  });

  it('forwards preload and poster', () => {
    const src = buildCloudflareIframeSrc(VIDEO_ID, { preload: 'auto', poster: 'https://example.com/poster.jpg' });

    expect(src).toContain('preload=auto');
    expect(src).toContain('poster=https%3A%2F%2Fexample.com%2Fposter.jpg');
  });

  it('omits poster when none is set', () => {
    // Cloudflare reads `poster` as an image URL, and an empty one serializes to
    // `1`, which the embed refuses with "poster value should be a valid encoded
    // URL" rather than falling back to its own thumbnail.
    expect(buildCloudflareIframeSrc(VIDEO_ID)).not.toContain('poster=');
    expect(buildCloudflareIframeSrc(VIDEO_ID, { poster: '' })).not.toContain('poster=');
    expect(buildCloudflareIframeSrc(VIDEO_ID, { poster: '' })).not.toContain('poster=1');
    // The React host passes the defaults through, so the very first embed URL
    // carries whatever an unset poster serializes to.
    expect(buildCloudflareIframeSrc(VIDEO_ID, CloudflareAdapter.defaultProps)).not.toContain('poster=');
  });

  it('serializes Cloudflare embed parameters verbatim', () => {
    const src = buildCloudflareIframeSrc(VIDEO_ID, {
      source: {
        engine: {
          cloudflare: {
            defaultTextTrack: 'de',
            primaryColor: '#ff0000',
            letterboxColor: 'transparent',
            startTime: '5m30s',
            'ad-url': 'https://ads.example.com/vast.xml',
          },
        },
      },
    });

    expect(src).toContain('defaultTextTrack=de');
    expect(src).toContain('primaryColor=%23ff0000');
    expect(src).toContain('letterboxColor=transparent');
    expect(src).toContain('startTime=5m30s');
    expect(src).toContain('ad-url=https%3A%2F%2Fads.example.com%2Fvast.xml');
  });

  it('keeps referrerPolicy off the embed URL', () => {
    // It configures the iframe hosting the embed; the player has no such
    // parameter and would be handed a stray one.
    const src = buildCloudflareIframeSrc(VIDEO_ID, {
      source: { engine: { cloudflare: { referrerPolicy: 'no-referrer' } } },
    });

    expect(src).not.toContain('referrerPolicy');
    expect(src).not.toContain('no-referrer');
  });

  it('carries undeclared Cloudflare embed parameters through', () => {
    const src = buildCloudflareIframeSrc(VIDEO_ID, { source: { engine: { cloudflare: { someFutureParam: 'on' } } } });

    expect(src).toContain('someFutureParam=on');
  });

  it('lets Cloudflare embed parameters override the defaults the host sets', () => {
    const src = buildCloudflareIframeSrc(VIDEO_ID, { source: { engine: { cloudflare: { controls: 1 } } } });

    expect(src).toContain('controls=1');
  });

  it('builds the embed URL for a signed token', () => {
    expect(buildCloudflareIframeSrc(SIGNED_TOKEN)).toContain(`https://iframe.videodelivery.net/${SIGNED_TOKEN}?`);
  });

  it('returns empty string for invalid src', () => {
    expect(buildCloudflareIframeSrc('https://example.com/video.mp4')).toBe('');
  });

  it('embeds on the per-customer origin when the source names one', () => {
    const src = buildCloudflareIframeSrc(`https://customer-abc123.cloudflarestream.com/${VIDEO_ID}/iframe`);

    expect(src).toContain(`https://customer-abc123.cloudflarestream.com/${VIDEO_ID}/iframe?`);
    expect(src).not.toContain('videodelivery.net');
  });

  it('keeps a signed token on its per-customer origin', () => {
    // Signed playback is only authorized for the customer origin, so collapsing
    // it onto the shared host would answer 401.
    const src = buildCloudflareIframeSrc(`https://customer-abc123.cloudflarestream.com/${SIGNED_TOKEN}/iframe`);

    expect(src).toContain(`https://customer-abc123.cloudflarestream.com/${SIGNED_TOKEN}/iframe?`);
  });

  it('embeds on the shared host for a watch URL', () => {
    expect(buildCloudflareIframeSrc(`https://watch.cloudflarestream.com/${VIDEO_ID}`)).toContain(
      `https://iframe.videodelivery.net/${VIDEO_ID}?`
    );
  });
});

describe('CloudflareAdapter', () => {
  it('has expected default state before attach', () => {
    const media = new CloudflareAdapter();

    expect(media.engine).toBe(null);
    expect(media.target).toBe(null);
    expect(media.paused).toBe(true);
    expect(media.ended).toBe(false);
    expect(media.currentTime).toBe(0);
    expect(media.duration).toBeNaN();
    expect(media.src).toBe(CloudflareAdapter.defaultProps.src);
    expect(media.buffered.length).toBe(0);
    expect(media.played.length).toBeGreaterThanOrEqual(1);
  });

  it('offers no picture-in-picture surface', () => {
    // The Stream SDK documents no request or exit method and no enter or leave
    // event, so the members are absent rather than present and inert — a control
    // the player cannot drive is worse than one it does not offer.
    const media = new CloudflareAdapter() as Partial<Video>;

    expect(media.requestPictureInPicture).toBeUndefined();
    expect(media.exitPictureInPicture).toBeUndefined();
    expect(media.isPictureInPicture).toBeUndefined();
    expect(media.disablePictureInPicture).toBeUndefined();
  });

  it('reloads a server-rendered embed so the SDK does not miss its ready message', async () => {
    // The frame already navigated, so it has posted `iframeReady` with nothing
    // listening; only a reload puts that message back after the SDK attaches.
    const embedSrc = `https://iframe.videodelivery.net/${VIDEO_ID}?controls=0`;
    const iframe = createServerRenderedIframe(embedSrc);
    const assigned = spyOnSrcAssignment(iframe, embedSrc);

    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    media.attach(iframe);
    await waitForEngine(media);

    // Same URL, reassigned: that is what reloads the frame.
    expect(assigned).toEqual([embedSrc]);
    media.detach();
  });

  it('reloads a server-rendered embed only once the SDK is there to hear it', async () => {
    // Reloading before the script lands loses the `iframeReady` message all over
    // again, which is the only thing the reload exists to recover.
    const embedSrc = `https://iframe.videodelivery.net/${VIDEO_ID}?controls=0`;
    const iframe = createServerRenderedIframe(embedSrc);
    const assigned = spyOnSrcAssignment(iframe, embedSrc);
    // How many reloads had happened by the time the SDK was handed the frame.
    const assignedAtPlayerCreation: number[] = [];

    let resolveSdk!: () => void;

    vi.stubGlobal('Stream', undefined);
    vi.mocked(loadScript).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSdk = () => {
            vi.stubGlobal('Stream', (target: HTMLIFrameElement) => {
              assignedAtPlayerCreation.push(assigned.length);
              return new MockPlayer(target);
            });
            resolve();
          };
        })
    );

    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    media.attach(iframe);
    await flushDeferredEmbed();

    expect(assigned).toEqual([]);

    resolveSdk();
    await waitForEngine(media);

    expect(assigned).toEqual([embedSrc]);
    expect(assignedAtPlayerCreation).toEqual([1]);
    media.detach();
  });

  it('leaves a client-rendered embed alone', async () => {
    // The embed URL is in the markup, as React renders it, but the frame has not
    // navigated yet: the ready message is still coming, and a reload would only
    // throw away the load already in flight. Asserted on assignments rather than
    // on the attribute, since reassigning the same URL reloads the frame without
    // changing what the attribute reads.
    const embedSrc = `https://iframe.videodelivery.net/${VIDEO_ID}?controls=0`;
    const iframe = document.createElement('iframe');

    iframe.setAttribute('src', embedSrc);
    const readLocation = vi.fn(() => 'about:blank');

    Object.defineProperty(iframe, 'contentWindow', {
      configurable: true,
      value: {
        location: {
          get href() {
            return readLocation();
          },
        },
      },
    });
    const assigned = spyOnSrcAssignment(iframe, embedSrc);

    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    media.attach(iframe);
    await waitForEngine(media);

    expect(readLocation).toHaveBeenCalledOnce();
    expect(assigned).toEqual([]);
    media.detach();
  });

  it('sets the initial iframe src and creates a player when attached', async () => {
    const media = new CloudflareAdapter();

    media.src = `https://customer-abc123.cloudflarestream.com/${VIDEO_ID}/iframe`;
    const iframe = createIframe();

    media.attach(iframe);

    expect(iframe.src).toContain(`https://customer-abc123.cloudflarestream.com/${VIDEO_ID}/iframe`);
    expect(media.target).toBe(iframe);

    await waitForEngine(media);
    expect(media.engine).not.toBe(null);
    media.detach();
  });

  it('defers the player until a source arrives', async () => {
    const media = new CloudflareAdapter();
    const loadstart = vi.fn();

    media.addEventListener('loadstart', loadstart);

    // How every framework builds the element: created first, `src` set after.
    const iframe = createIframe();

    media.attach(iframe);
    expect(iframe.getAttribute('src')).toBe(null);
    expect(media.engine).toBe(null);
    expect(loadstart).not.toHaveBeenCalled();

    media.src = VIDEO_ID;
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain(`https://iframe.videodelivery.net/${VIDEO_ID}`);
    expect(loadstart).toHaveBeenCalledTimes(1);
    await waitForEngine(media);
    media.detach();
  });

  it('defers the player for an iframe rendered with an empty src', async () => {
    const media = new CloudflareAdapter();
    // React renders `src=""` before a source resolves. The `src` property reports
    // the document URL for it, so only the attribute says there is no embed.
    const iframe = createEmptySrcIframe();

    media.attach(iframe);
    expect(media.engine).toBe(null);

    media.src = VIDEO_ID;
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain(`https://iframe.videodelivery.net/${VIDEO_ID}`);
    await waitForEngine(media);
    media.detach();
  });

  it('builds a deferred embed once for repeated source changes in the same task', async () => {
    const media = new CloudflareAdapter();
    const iframe = createIframe();

    media.attach(iframe);

    media.src = VIDEO_ID;
    media.src = OTHER_VIDEO_ID;
    await waitForEngine(media);

    expect(iframe.getAttribute('src')).toContain(`https://iframe.videodelivery.net/${OTHER_VIDEO_ID}`);
    expect(MockPlayer.instances.length).toBe(1);
    media.detach();
  });

  it('does not leave play() waiting while the embed is deferred', async () => {
    const media = new CloudflareAdapter();

    media.attach(createIframe());

    // No embed means no player is coming to report a load; waiting would hang.
    await expect(media.play()).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
  });

  it('waits for a deferred embed to load before playing', async () => {
    const media = new CloudflareAdapter();

    media.attach(createIframe());

    media.src = VIDEO_ID;
    let played = false;
    const pending = media.play().then(() => {
      played = true;
    });

    // The player the deferred embed creates has not reported metadata, so
    // playing now would run against a video that is not there yet.
    const player = await waitForEngine(media);

    expect(played).toBe(false);

    player.emit('loadedmetadata');
    await pending;

    expect(player.play).toHaveBeenCalled();
    media.detach();
  });

  it('emits loadstart on attach and loadedmetadata/loadcomplete after metadata', async () => {
    const media = new CloudflareAdapter();
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
    expect(media.readyState).toBe(1);
    media.detach();
  });

  it('updates state from player events', async () => {
    const media = new CloudflareAdapter();
    const { player } = await attachAndLoad(media);

    const playSpy = vi.fn();
    const waitingSpy = vi.fn();

    media.addEventListener('play', playSpy);
    media.addEventListener('waiting', waitingSpy);

    player.emit('loadeddata');
    expect(media.readyState).toBe(2);

    player.emit('waiting');
    expect(waitingSpy).toHaveBeenCalledTimes(1);

    player.emit('play');
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(media.paused).toBe(false);

    player.emit('playing');
    expect(media.readyState).toBe(3);

    player.currentTime = 5;
    player.emit('timeupdate');
    expect(media.currentTime).toBe(5);

    player.volume = 0.25;
    player.muted = true;
    player.emit('volumechange');
    expect(media.volume).toBe(0.25);
    expect(media.muted).toBe(true);

    player.playbackRate = 1.5;
    player.emit('ratechange');
    expect(media.playbackRate).toBe(1.5);

    player.buffered = timeRanges(30);
    player.emit('progress');
    expect(media.buffered.end(0)).toBe(30);
    expect(media.seekable.end(0)).toBe(60);

    player.emit('seeking');
    expect(media.seeking).toBe(true);
    player.emit('seeked');
    expect(media.seeking).toBe(false);

    player.videoWidth = 1280;
    player.videoHeight = 720;
    player.emit('resize');
    expect(media.videoWidth).toBe(1280);
    expect(media.videoHeight).toBe(720);

    player.emit('pause');
    expect(media.paused).toBe(true);

    player.emit('ended');
    expect(media.ended).toBe(true);
    expect(media.paused).toBe(true);
    media.detach();
  });

  it.each(['stream-adstart', 'stream-adend', 'stream-adtimeout'])(
    'forwards the %s ad lifecycle event',
    async (type) => {
      const media = new CloudflareAdapter();
      const { player } = await attachAndLoad(media);
      const onAd = vi.fn();

      media.addEventListener(type, onAd);
      player.emit(type);

      expect(onAd).toHaveBeenCalledOnce();
      expect(onAd.mock.calls[0]![0].type).toBe(type);
      media.detach();
    }
  );

  it('forwards the encrypted-media events the embed reports', async () => {
    const media = new CloudflareAdapter();
    const { player } = await attachAndLoad(media);
    const encrypted = vi.fn();
    const waitingForKey = vi.fn();

    media.addEventListener('encrypted', encrypted);
    media.addEventListener('waitingforkey', waitingForKey);

    player.emit('encrypted');
    player.emit('waitingforkey');

    expect(encrypted).toHaveBeenCalledTimes(1);
    expect(waitingForKey).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('reports the mute the embed is being built with before it reports one', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    media.defaultMuted = true;
    media.attach(createIframe());

    // The embed URL carries the mute, so anything reading `muted` in the meantime
    // would draw an unmuted volume control over silent video.
    expect(media.muted).toBe(true);
    await waitForEngine(media);
    expect(media.muted).toBe(true);
    media.detach();
  });

  it('carries a runtime mute onto a rebuilt embed', async () => {
    const media = new CloudflareAdapter();

    media.source = { src: VIDEO_ID, engine: { cloudflare: { primaryColor: '#ff0000' } } };
    const { iframe, player } = await attachAndLoad(media);

    player.muted = true;
    player.emit('volumechange');
    expect(media.muted).toBe(true);

    // A changed embed parameter rebuilds the frame, and the new one knows only
    // what its URL tells it.
    media.source = { src: VIDEO_ID, engine: { cloudflare: { primaryColor: '#0000ff' } } };
    await Promise.resolve();

    expect(iframe.getAttribute('src')).toContain('muted=1');
    expect(media.muted).toBe(true);
    media.detach();
  });

  it('forwards play() and pause() to the player', async () => {
    const media = new CloudflareAdapter();
    const { player } = await attachAndLoad(media);

    await media.play();
    expect(player.play).toHaveBeenCalledTimes(1);

    media.pause();
    expect(player.pause).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('forwards setters to the player after load', async () => {
    const media = new CloudflareAdapter();
    const { player } = await attachAndLoad(media);

    media.currentTime = 30;
    media.volume = 0.5;
    media.muted = true;
    media.playbackRate = 1.5;
    media.loop = true;
    media.controls = true;
    media.preload = 'auto';
    media.poster = 'https://example.com/poster.jpg';

    // Setters defer via the loadComplete microtask — flush.
    await Promise.resolve();
    await Promise.resolve();

    expect(player.currentTime).toBe(30);
    expect(player.volume).toBe(0.5);
    expect(player.muted).toBe(true);
    expect(player.playbackRate).toBe(1.5);
    expect(player.loop).toBe(true);
    expect(player.controls).toBe(true);
    expect(player.preload).toBe('auto');
    expect(player.poster).toBe('https://example.com/poster.jpg');
    media.detach();
  });

  it('swaps the video on the existing player when src changes after attach', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    const { iframe, player } = await attachAndLoad(media);
    const embedSrc = iframe.getAttribute('src');

    media.src = `https://videodelivery.net/${OTHER_VIDEO_ID}`;
    await Promise.resolve();

    // The embed and the SDK connection survive the swap; only the video changes.
    expect(player.src).toBe(OTHER_VIDEO_ID);
    expect(iframe.getAttribute('src')).toBe(embedSrc);
    expect(MockPlayer.instances.length).toBe(1);

    // The new video's metadata completes the reload.
    const loadCompleteSpy = vi.fn();

    media.addEventListener('loadcomplete', loadCompleteSpy);
    player.emit('loadedmetadata');
    expect(loadCompleteSpy).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('defers the swap when src changes while the SDK is still loading', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    const iframe = createIframe();

    media.attach(iframe);

    // The embed is already built from the first src; only the player can be
    // moved off it, and there is no player until the SDK resolves.
    media.src = OTHER_VIDEO_ID;
    const player = await waitForEngine(media);

    expect(iframe.getAttribute('src')).toContain(VIDEO_ID);
    expect(player.src).toBe(OTHER_VIDEO_ID);
    media.detach();
  });

  it('completes the deferred swap rather than the embed it replaced', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    media.attach(createIframe());
    media.src = OTHER_VIDEO_ID;

    // Binding the embed's events and replaying the deferred load happen in one
    // task, so the swap owns the barrier before any metadata can arrive.
    const player = await waitForEngine(media);
    const loadCompleteSpy = vi.fn();

    media.addEventListener('loadcomplete', loadCompleteSpy);
    expect(media.readyState).toBe(0);

    player.emit('loadedmetadata');

    expect(loadCompleteSpy).toHaveBeenCalledTimes(1);
    await media.play();
    expect(player.play).toHaveBeenCalled();
    media.detach();
  });

  it('errors and unblocks pending play() when src is unrecognized', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    await attachAndLoad(media);

    const errorSpy = vi.fn();

    media.addEventListener('error', errorSpy);

    media.src = 'https://example.com/not-a-cloudflare-video';
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(media.error).toBeInstanceOf(MediaError);
    expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    await expect(media.play()).resolves.toBeUndefined();
    media.detach();
  });

  it('stops the embed when src is unrecognized', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    const { player } = await attachAndLoad(media);

    player.emit('playing');
    player.pause.mockClear();
    player.play.mockClear();

    media.src = 'https://example.com/not-a-cloudflare-video';
    await Promise.resolve();

    // There is no video to swap to, so the embed keeps the previous one; left
    // running it plays on under the error and writes the reset state back.
    expect(player.pause).toHaveBeenCalled();
    player.currentTime = 20;
    player.emit('timeupdate');
    player.emit('ended');
    expect(media.currentTime).toBe(0);
    expect(media.ended).toBe(false);
    expect(media.duration).toBeNaN();

    await media.play();
    expect(player.play).not.toHaveBeenCalled();
    media.detach();
  });

  it('surfaces player errors', async () => {
    const media = new CloudflareAdapter();
    const { player } = await attachAndLoad(media);

    const errorSpy = vi.fn();

    media.addEventListener('error', errorSpy);
    player.emit('error');

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(media.error).toBeInstanceOf(MediaError);
    expect(media.error).toMatchObject({ code: MediaError.MEDIA_ERR_CUSTOM, fatal: true });
    media.detach();
  });

  it('errors and unblocks pending play() when the SDK is unavailable', async () => {
    vi.stubGlobal('Stream', undefined);
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    const errorSpy = vi.fn();

    media.addEventListener('error', errorSpy);

    media.attach(createIframe());

    await vi.waitFor(() => {
      if (!errorSpy.mock.calls.length) throw new Error('SDK has not failed yet');
    });
    expect(media.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    await expect(media.play()).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
    media.detach();
  });

  it('tracks played ranges via the played-ranges mixin', async () => {
    const media = new CloudflareAdapter();
    const { player } = await attachAndLoad(media);

    player.emit('play');
    player.currentTime = 0.08;
    player.emit('timeupdate');
    player.currentTime = 0.16;
    player.emit('timeupdate');
    player.emit('pause');

    const played = media.played;

    expect(played.length).toBe(1);
    expect(played.start(0)).toBe(0);
    expect(played.end(0)).toBe(0.16);
    media.detach();
  });

  it('pauses the embed and stops listening to it on detach', async () => {
    const media = new CloudflareAdapter();
    const { player } = await attachAndLoad(media);

    media.detach();

    expect(player.pause).toHaveBeenCalled();
    expect(media.target).toBe(null);
    expect(media.engine).toBe(null);

    // The embed lives on in the iframe; nothing it reports may reach the media.
    player.currentTime = 42;
    player.emit('timeupdate');
    expect(media.currentTime).toBe(0);
  });

  it('unblocks pending play() when detached before load completes', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    media.attach(createIframe());

    // Await load without the player ever reporting metadata.
    const pending = media.play();

    media.detach();

    await expect(pending).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
  });

  it('does not create a player when detached before the SDK resolves', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    media.attach(createIframe());
    media.detach();

    // Flush the async player creation path.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(media.engine).toBe(null);
  });

  it('ignores events from a superseded player', async () => {
    const media = new CloudflareAdapter();
    const { player: stale } = await attachAndLoad(media);

    media.detach();
    const { player: current } = await attachAndLoad(media);

    expect(current).not.toBe(stale);

    const playSpy = vi.fn();

    media.addEventListener('play', playSpy);

    // The old embed keeps reporting; none of it may touch the new session.
    stale.emit('play');
    stale.volume = 0.1;
    stale.emit('volumechange');

    expect(playSpy).not.toHaveBeenCalled();
    expect(media.paused).toBe(true);
    expect(media.volume).toBe(1);
    media.detach();
  });

  it('unblocks waiters from a superseded load when a reload starts first', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    const { player } = await attachAndLoad(media);

    // Start a second load and wait on its barrier without ever completing it.
    media.src = OTHER_VIDEO_ID;
    const pending = media.play();

    // A third load takes over; the waiter above must not be stranded on the
    // barrier it already captured.
    media.src = SIGNED_TOKEN;

    await expect(pending).resolves.toBeUndefined();
    expect(player.src).toBe(SIGNED_TOKEN);
    media.detach();
  });

  it('does not report fullscreen when there is no element to request it on', async () => {
    const media = new CloudflareAdapter();

    await media.requestFullscreen();

    expect(media.isFullscreen).toBe(false);
  });
});

describe('CloudflareAdapter source', () => {
  it('derives src from a structured source and announces the change', () => {
    const media = new CloudflareAdapter();
    const sourceChange = vi.fn();

    media.addEventListener('sourcechange', sourceChange);

    media.source = { src: `https://videodelivery.net/${VIDEO_ID}` };

    expect(media.src).toBe(`https://videodelivery.net/${VIDEO_ID}`);
    expect(sourceChange).toHaveBeenCalledTimes(1);
  });

  it('re-derives source from src, carrying Cloudflare embed parameters over', () => {
    const media = new CloudflareAdapter();

    media.source = { src: VIDEO_ID, engine: { cloudflare: { primaryColor: '#ff0000' } } };

    media.src = OTHER_VIDEO_ID;

    expect(media.source).toEqual({ engine: { cloudflare: { primaryColor: '#ff0000' } }, src: OTHER_VIDEO_ID });
  });

  it('rebuilds the embed when only Cloudflare embed parameters change', async () => {
    const media = new CloudflareAdapter();

    media.source = { src: VIDEO_ID, engine: { cloudflare: { primaryColor: '#ff0000' } } };
    const { iframe, player } = await attachAndLoad(media);

    expect(iframe.getAttribute('src')).toContain('primaryColor=%23ff0000');
    player.src = '';

    media.source = { src: VIDEO_ID, engine: { cloudflare: { primaryColor: '#0000ff' } } };
    await Promise.resolve();

    // Embed parameters live on the URL and are read once, so only a rebuilt embed
    // applies them. Swapping the video on the player would leave the old color in
    // place, and re-assigning the id it already holds reports no metadata to
    // settle the load with.
    expect(iframe.getAttribute('src')).toContain('primaryColor=%230000ff');
    expect(player.src).toBe('');
    media.detach();
  });

  it('serializes Cloudflare embed parameters onto the initial iframe src', () => {
    const media = new CloudflareAdapter();

    media.source = { src: VIDEO_ID, engine: { cloudflare: { defaultTextTrack: 'de' } } };
    const iframe = createIframe();

    media.attach(iframe);

    expect(iframe.src).toContain('defaultTextTrack=de');
    media.detach();
  });

  it('clears src when the source is set to null', () => {
    const media = new CloudflareAdapter();

    media.source = { src: VIDEO_ID };

    media.source = null;

    expect(media.src).toBe('');
    expect(media.source).toBe(null);
  });

  it('pauses the embed and resets state when the source is cleared', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    const { player } = await attachAndLoad(media);

    player.emit('playing');
    expect(media.duration).toBe(60);
    player.pause.mockClear();

    media.source = null;
    await Promise.resolve();

    // Left running, the embed keeps playing and its events write state back.
    expect(player.pause).toHaveBeenCalled();
    expect(media.duration).toBeNaN();
    expect(media.currentTime).toBe(0);
    expect(media.paused).toBe(true);
    await expect(media.play()).resolves.toBeUndefined();
    media.detach();
  });

  it('announces the reset when the source is cleared', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    const { player } = await attachAndLoad(media);

    player.emit('playing');

    const emptied = vi.fn();

    media.addEventListener('emptied', emptied);
    media.source = null;
    await Promise.resolve();

    // The embed is paused and its events are ignored from here, so nothing else
    // is coming to say the last video's duration and buffer are gone.
    expect(emptied).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('does not let a cleared source come back through a player event', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    const { player } = await attachAndLoad(media);

    player.emit('playing');

    media.source = null;
    await Promise.resolve();
    // The embed reports its own wind-down after the source is gone.
    player.currentTime = 20;
    player.emit('timeupdate');
    player.emit('ended');

    expect(media.duration).toBeNaN();
    expect(media.readyState).toBe(0);
    expect(media.currentTime).toBe(0);
    expect(media.ended).toBe(false);
    media.detach();
  });

  it('does not play a source that was cleared', async () => {
    const media = new CloudflareAdapter();

    media.src = VIDEO_ID;
    const { player } = await attachAndLoad(media);

    media.source = null;
    await Promise.resolve();
    player.play.mockClear();
    await media.play();

    expect(player.play).not.toHaveBeenCalled();
    media.detach();
  });
});
