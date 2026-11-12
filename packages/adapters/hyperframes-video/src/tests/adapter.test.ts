import { MediaError } from '@videojs/media';
import { afterEach, describe, expect, it, type Mock, vi } from 'vite-plus/test';

import { HyperFramesAdapter, type HyperFramesSource, type HyperFramesTimeline } from '..';
import { DEFAULT_RUNTIME_SRC } from '../source';

const MEDIA_EVENTS = [
  'emptied',
  'loadstart',
  'durationchange',
  'resize',
  'loadedmetadata',
  'loadeddata',
  'canplay',
  'canplaythrough',
  'play',
  'playing',
  'pause',
  'seeking',
  'seeked',
  'waiting',
  'ended',
  'error',
  'sourcechange',
  'volumechange',
  'ratechange',
];

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** A container holding the frame, sized so the frame can be fit to it. Jsdom only gives a connected iframe a window. */
function createFrame(): HTMLIFrameElement {
  const container = document.createElement('div');
  const iframe = document.createElement('iframe');

  Object.defineProperties(container, { clientWidth: { value: 960 }, clientHeight: { value: 540 } });
  container.append(iframe);
  document.body.append(container);
  return iframe;
}

function frameOf(iframe: HTMLIFrameElement): Window {
  const frame = iframe.contentWindow;
  if (!frame) throw new Error('iframe has no window');

  return frame;
}

/** Let the deferred load write the frame. */
async function flush(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

/** Jsdom does not load `srcdoc`, so write the document the adapter generated into the frame and fire its `load`. */
async function loadFrame(iframe: HTMLIFrameElement): Promise<Document> {
  const doc = iframe.contentDocument!;

  doc.open();
  doc.write(iframe.srcdoc);
  doc.close();
  iframe.dispatchEvent(new Event('load'));
  await flush();
  return doc;
}

/** Report a message the way the runtime does: an object on `window`, from the composition frame. */
function report(iframe: HTMLIFrameElement, type: string, data: Record<string, unknown> = {}): void {
  globalThis.dispatchEvent(
    new MessageEvent('message', {
      data: { source: 'hf-preview', type, protocolVersion: 1, fps: { numerator: 30, denominator: 1 }, ...data },
      source: frameOf(iframe),
    })
  );
}

function reportState(iframe: HTMLIFrameElement, currentTime: number, state: Record<string, unknown> = {}): void {
  report(iframe, 'state', { currentTime, isPlaying: false, ended: false, buffering: false, ...state });
}

/** Spy on the controls posted to the runtime. */
function watchControls(iframe: HTMLIFrameElement) {
  const spy = vi.spyOn(frameOf(iframe), 'postMessage');
  const all = () => spy.mock.calls.map(([data]) => data as { action: string; [key: string]: unknown });

  return {
    actions: () => all().map((control) => control.action),
    named: (action: string) => all().filter((control) => control.action === action),
    clear: () => spy.mockClear(),
  };
}

function recordEvents(media: EventTarget): string[] {
  const events: string[] = [];

  for (const type of MEDIA_EVENTS) media.addEventListener(type, () => events.push(type));

  return events;
}

function createTimeline(): HyperFramesTimeline & { pause: Mock<() => unknown> } {
  return { duration: () => 8, seek: vi.fn(), pause: vi.fn<() => unknown>() };
}

/** A media playing inline markup whose runtime has reported ready, its timeline, and settled assets. */
async function createReadyMedia(source: HyperFramesSource = { content: '<div data-start="0"></div>' }) {
  const iframe = createFrame();
  const media = new HyperFramesAdapter();

  media.source = source;
  media.attach(iframe);
  await flush();
  await loadFrame(iframe);

  const controls = watchControls(iframe);

  report(iframe, 'timeline', {
    durationSeconds: 8,
    durationInFrames: 240,
    compositionWidth: 1920,
    compositionHeight: 1080,
  });
  report(iframe, 'ready');
  report(iframe, 'assets-ready');

  return { iframe, media, controls };
}

/** Start playback and have the runtime report it moving. */
async function startPlaying(iframe: HTMLIFrameElement, media: HyperFramesAdapter, at = 0) {
  await media.play();
  reportState(iframe, at, { isPlaying: true });
}

describe('HyperFramesAdapter', () => {
  describe('loading inline markup', () => {
    it('writes the markup into a same-origin frame, hidden until the runtime reports the timeline', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();

      media.source = { content: '<h1 class="clip" data-start="0" data-duration="2">Hi</h1>' };
      media.attach(iframe);
      await flush();

      expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');
      expect(iframe.srcdoc).toContain('<h1 class="clip" data-start="0" data-duration="2">Hi</h1>');
      expect(iframe.style.visibility).toBe('hidden');
    });

    it('builds the timeline from the mounted root, registers it under the root id, then injects the runtime', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();
      const timeline = createTimeline();
      const factory = vi.fn((_root: HTMLElement) => timeline);

      media.source = { id: 'intro', content: '<p class="title">Hello</p>', timeline: factory };
      media.attach(iframe);
      await flush();

      const doc = await loadFrame(iframe);
      const root = factory.mock.calls[0]![0];

      expect(root.getAttribute('data-composition-id')).toBe('intro');
      expect(root.querySelector('.title')?.textContent).toBe('Hello');
      // The runtime drives the timeline from its own clock.
      expect(timeline.pause).toHaveBeenCalled();
      expect((frameOf(iframe) as Window & { __timelines: object }).__timelines).toEqual({ intro: timeline });
      expect([...doc.head.querySelectorAll('script[src]')].map((script) => script.getAttribute('src'))).toEqual([
        DEFAULT_RUNTIME_SRC,
      ]);
    });

    it('mounts through a function and waits for it before building the timeline', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();
      const order: string[] = [];
      let finishMount!: () => void;

      media.source = {
        content: (root) =>
          new Promise<void>((resolve) => {
            finishMount = () => {
              root.innerHTML = '<p class="title"></p>';
              order.push('mounted');
              resolve();
            };
          }),
        timeline: (root) => {
          order.push(`timeline:${root.querySelector('.title') ? 'with markup' : 'empty'}`);
          return createTimeline();
        },
      };
      media.attach(iframe);
      await flush();
      await loadFrame(iframe);

      expect(order).toEqual([]);

      finishMount();
      await flush();

      expect(order).toEqual(['mounted', 'timeline:with markup']);
    });

    it('builds the latest timeline set for the same composition before the frame loaded', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();
      const latest = vi.fn(() => createTimeline());

      media.source = { content: '<div></div>' };
      media.attach(iframe);
      await flush();
      media.source = { content: media.source.content!, timeline: latest };
      await loadFrame(iframe);

      expect(latest).toHaveBeenCalledTimes(1);
    });

    it('reports metadata on the timeline and readiness once the assets settle', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();
      const events = recordEvents(media);

      media.source = { content: '<div></div>' };
      media.attach(iframe);
      await flush();
      await loadFrame(iframe);
      report(iframe, 'timeline', {
        durationSeconds: 8,
        durationInFrames: 240,
        compositionWidth: 1280,
        compositionHeight: 720,
      });

      expect(media.duration).toBe(8);
      expect([media.videoWidth, media.videoHeight]).toEqual([1280, 720]);
      expect(media.readyState).toBe(1);
      expect(iframe.style.visibility).toBe('');
      // Laid out at the composition's size and scaled to fit the 960x540 container.
      expect([iframe.style.width, iframe.style.height]).toEqual(['1280px', '720px']);
      expect(iframe.style.transform).toBe('translate(-50%, -50%) scale(0.75)');

      report(iframe, 'assets-ready');

      expect(media.readyState).toBe(4);
      expect(media.seekable.end(0)).toBe(8);
      expect(events).toEqual([
        'sourcechange',
        'loadstart',
        'resize',
        'durationchange',
        'loadedmetadata',
        'loadeddata',
        'canplay',
        'canplaythrough',
      ]);
    });

    it('fails a composition whose markup cannot be built', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();

      media.source = {
        content: '<div></div>',
        timeline: () => {
          throw new Error('no such element');
        },
      };
      media.attach(iframe);
      await flush();
      await loadFrame(iframe);

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_CUSTOM);
      expect(media.error?.message).toContain('no such element');
    });
  });

  describe('loading a composition document', () => {
    it('plays html in an opaque frame with the runtime first in its head', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();

      media.source = { html: '<html><head></head><body><div data-composition-id="doc"></div></body></html>' };
      media.attach(iframe);
      await flush();

      expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
      expect(iframe.srcdoc).toMatch(
        new RegExp(`<head><base href="[^"]+" /><script src="${DEFAULT_RUNTIME_SRC}"></script>`)
      );
    });

    it('fetches a src and resolves its relative URLs against it', async () => {
      const fetch = vi.fn(async () => new Response('<html><head></head><body></body></html>'));

      vi.stubGlobal('fetch', fetch);

      const iframe = createFrame();
      const media = new HyperFramesAdapter();

      media.src = 'https://example.com/intro/index.html';
      media.attach(iframe);
      await flush();
      await vi.waitFor(() => expect(iframe.srcdoc).not.toBe(''));

      expect(fetch).toHaveBeenCalledWith('https://example.com/intro/index.html');
      expect(iframe.srcdoc).toContain('<base href="https://example.com/intro/index.html" />');
      expect(media.src).toBe('https://example.com/intro/index.html');
    });

    it('fails a src that does not load', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('', { status: 404 }))
      );

      const iframe = createFrame();
      const media = new HyperFramesAdapter();
      const events = recordEvents(media);

      media.src = 'https://example.com/missing.html';
      media.attach(iframe);
      await vi.waitFor(() => expect(media.error).not.toBe(null));

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
      expect(events).toContain('error');
    });
  });

  describe('source changes', () => {
    it('keeps playing through an update to the same composition', async () => {
      const { iframe, media } = await createReadyMedia({ id: 'intro', content: () => {} });
      const events = recordEvents(media);

      media.source = { id: 'intro', content: () => {}, timeline: () => createTimeline() };
      await flush();

      expect(events).toEqual([]);
      expect(media.readyState).toBe(4);
      expect(iframe.style.visibility).toBe('');
    });

    it('reloads for a new composition', async () => {
      const { iframe, media } = await createReadyMedia({ id: 'intro', content: '<p>1</p>' });
      const events = recordEvents(media);

      media.source = { id: 'outro', content: '<p>2</p>' };
      await flush();

      expect(events).toEqual(['emptied', 'sourcechange', 'loadstart']);
      expect(media.readyState).toBe(0);
      expect(media.duration).toBeNaN();
      expect(iframe.srcdoc).toContain('<p>2</p>');
    });
  });

  describe('playback', () => {
    it('holds a play until the runtime listens, then sends it', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();

      media.source = { content: '<div></div>' };
      media.attach(iframe);
      await flush();
      await loadFrame(iframe);

      const controls = watchControls(iframe);

      await media.play();

      expect(controls.actions()).toEqual([]);

      report(iframe, 'ready');

      expect(controls.named('play')).toHaveLength(1);
    });

    it('announces play at once and playing once the runtime reports it moving', async () => {
      const { iframe, media } = await createReadyMedia();
      const events = recordEvents(media);

      await media.play();

      expect(events).toEqual(['play']);

      // Reported before the runtime took the play: not a pause.
      reportState(iframe, 0);
      reportState(iframe, 0.1, { isPlaying: true });

      expect(events).toEqual(['play', 'playing']);
      expect(media.paused).toBe(false);
      expect(media.currentTime).toBe(0.1);
    });

    it('follows a pause the runtime reports', async () => {
      const { iframe, media } = await createReadyMedia();

      await startPlaying(iframe, media);

      const events = recordEvents(media);

      reportState(iframe, 1);

      expect(events).toEqual(['pause']);
      expect(media.paused).toBe(true);
    });

    it('asserts mute, volume, and rate on a runtime that starts without them', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();

      media.source = { content: '<div></div>' };
      media.muted = true;
      media.volume = 0.5;
      media.playbackRate = 2;
      media.attach(iframe);
      await flush();
      await loadFrame(iframe);

      const controls = watchControls(iframe);

      report(iframe, 'ready');

      expect(controls.named('set-muted')[0]).toMatchObject({ muted: true });
      expect(controls.named('set-volume')[0]).toMatchObject({ volume: 0.5 });
      expect(controls.named('set-playback-rate')[0]).toMatchObject({ playbackRate: 2 });
    });

    it('reports buffering inside the composition as waiting, then playing', async () => {
      const { iframe, media } = await createReadyMedia();

      await startPlaying(iframe, media);

      const events = recordEvents(media);

      reportState(iframe, 1, { isPlaying: true, buffering: true });

      expect(events).toEqual(['waiting']);
      expect(media.readyState).toBe(2);

      reportState(iframe, 1, { isPlaying: true });

      expect(events).toEqual(['waiting', 'playing']);
      expect(media.readyState).toBe(4);
    });
  });

  describe('seeking', () => {
    it('settles a seek on the first report at its target, ignoring the ones before', async () => {
      const { iframe, media, controls } = await createReadyMedia();
      const events = recordEvents(media);

      media.currentTime = 4;

      expect(controls.named('seek')[0]).toMatchObject({ timeSeconds: 4 });
      expect(media.seeking).toBe(true);

      reportState(iframe, 1);

      expect(media.currentTime).toBe(4);

      reportState(iframe, 4);

      expect(media.seeking).toBe(false);
      expect(events).toEqual(['seeking', 'seeked']);
    });

    it('resumes a seek made while playing, without the pause the runtime lands it in', async () => {
      const { iframe, media, controls } = await createReadyMedia();

      await startPlaying(iframe, media);
      controls.clear();

      const events = recordEvents(media);

      media.currentTime = 5;
      // The runtime lands every seek paused, and reports so until it takes the resume.
      reportState(iframe, 5);
      reportState(iframe, 5);
      reportState(iframe, 5.1, { isPlaying: true });

      expect(controls.actions().filter((action) => action !== 'tick')).toEqual(['seek', 'play']);
      expect(events).toEqual(['seeking', 'seeked']);
      expect(media.paused).toBe(false);
    });

    it('holds a seek made before the runtime listens and sends it when it does', async () => {
      const iframe = createFrame();
      const media = new HyperFramesAdapter();

      media.source = { content: '<div></div>' };
      media.attach(iframe);
      await flush();
      await loadFrame(iframe);

      const controls = watchControls(iframe);

      media.currentTime = 3;

      expect(media.currentTime).toBe(3);
      expect(controls.actions()).toEqual([]);

      report(iframe, 'ready');

      expect(controls.named('seek')[0]).toMatchObject({ timeSeconds: 3 });
    });
  });

  describe('ending', () => {
    it('ends paused at the end, as a media element does', async () => {
      const { iframe, media } = await createReadyMedia();

      await startPlaying(iframe, media, 7.9);

      const events = recordEvents(media);

      reportState(iframe, 8, { ended: true });

      expect(events).toEqual(['pause', 'ended']);
      expect([media.paused, media.ended]).toEqual([true, true]);
    });

    it('starts over from the beginning when played from the end', async () => {
      const { iframe, media, controls } = await createReadyMedia();

      await startPlaying(iframe, media, 7.9);
      reportState(iframe, 8, { ended: true });
      controls.clear();

      const events = recordEvents(media);

      await media.play();
      // A report from before the runtime took the seek must not end it again.
      reportState(iframe, 8, { ended: true });
      reportState(iframe, 0);
      reportState(iframe, 0.05, { isPlaying: true });

      expect(controls.actions().filter((action) => action !== 'tick')).toEqual(['seek', 'play']);
      expect(controls.named('seek')[0]).toMatchObject({ timeSeconds: 0 });
      expect(events).toEqual(['seeking', 'play', 'seeked', 'playing']);
      expect(media.ended).toBe(false);
    });

    it('ends at a seek to the end made while playing, rather than starting over', async () => {
      const { iframe, media, controls } = await createReadyMedia();

      await startPlaying(iframe, media, 2);
      controls.clear();

      const events = recordEvents(media);

      media.currentTime = 8;
      reportState(iframe, 8, { ended: true });

      expect(controls.actions().filter((action) => action !== 'tick')).toEqual(['seek']);
      expect(events).toEqual(['seeking', 'seeked', 'pause', 'ended']);
      expect([media.paused, media.ended]).toEqual([true, true]);
    });

    it('loops back to the start without ending', async () => {
      const { iframe, media, controls } = await createReadyMedia();

      media.loop = true;
      await startPlaying(iframe, media, 7.9);
      controls.clear();

      const events = recordEvents(media);

      reportState(iframe, 8, { ended: true });
      reportState(iframe, 0);
      reportState(iframe, 0.05, { isPlaying: true });

      expect(controls.actions().filter((action) => action !== 'tick')).toEqual(['seek', 'play']);
      expect(events).toEqual(['seeking', 'seeked']);
      expect([media.paused, media.ended]).toEqual([false, false]);
    });
  });

  describe('messages', () => {
    it('ignores reports from any frame but its own', async () => {
      const { media } = await createReadyMedia();
      const other = createFrame();

      globalThis.dispatchEvent(
        new MessageEvent('message', {
          data: {
            source: 'hf-preview',
            type: 'state',
            currentTime: 6,
            isPlaying: true,
            ended: false,
            buffering: false,
          },
          source: frameOf(other),
        })
      );

      expect(media.currentTime).toBe(0);
      expect(media.paused).toBe(true);
    });

    it('fails on a runtime speaking another protocol version', async () => {
      const { iframe, media } = await createReadyMedia();

      report(iframe, 'ready', { protocolVersion: 2 });

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    });
  });

  it('stops talking to the frame once detached', async () => {
    const { iframe, media, controls } = await createReadyMedia();

    media.detach();
    controls.clear();
    reportState(iframe, 3, { isPlaying: true });
    await media.play();

    expect(media.currentTime).toBe(0);
    expect(controls.actions()).toEqual([]);
  });
});
