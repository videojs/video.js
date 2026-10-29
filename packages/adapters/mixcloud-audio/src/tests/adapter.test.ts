import {
  isMediaBufferCapable,
  isMediaPictureInPictureCapable,
  isMediaPlaybackRateCapable,
  isMediaVolumeCapable,
  MediaError,
} from '@videojs/media';
import { getMediaEngineName } from '@videojs/media/dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { buildMixcloudIframeSrc, MixcloudAdapter } from '..';

const SHOW = 'https://www.mixcloud.com/spartacus/lambiance/';
const KEY = '/spartacus/lambiance/';
const OTHER_SHOW = 'https://www.mixcloud.com/citiesandmemory/radio-afghanistan-station-id/';
const WIDGET_ORIGIN = 'https://player-widget.mixcloud.com';
const DURATION = 3903;

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

interface Call {
  methodId: number;
  methodName: string;
  args: unknown[];
}

/**
 * Stands in for the widget document in a jsdom iframe: records what is posted to it and reports back the way the widget
 * does, as JSON strings on `window` from its frame and origin.
 */
class FakeWidget {
  readonly iframe: HTMLIFrameElement;
  #posted: string[] = [];
  #answered = new Set<number>();
  #watched: Window | null = null;

  constructor(iframe?: HTMLIFrameElement) {
    this.iframe = iframe ?? document.createElement('iframe');

    if (!this.iframe.isConnected) document.body.append(this.iframe);

    this.#watch();
  }

  // Jsdom gives the frame a new window each time it navigates.
  get frame(): Window {
    this.#watch();

    return this.#watched!;
  }

  #watch() {
    const frame = this.iframe.contentWindow;
    if (!frame) throw new Error('iframe has no window');

    if (frame === this.#watched) return;

    this.#watched = frame;
    vi.spyOn(frame, 'postMessage').mockImplementation((data: unknown) => {
      this.#posted.push(data as string);
    });
  }

  messages(): { type: string; data?: Call }[] {
    this.#watch();

    return this.#posted.map((data) => JSON.parse(data));
  }

  calls(): Call[] {
    return this.messages()
      .filter(({ type }) => type === 'method')
      .map(({ data }) => data!);
  }

  named(methodName: string): Call[] {
    return this.calls().filter((call) => call.methodName === methodName);
  }

  methods(): string[] {
    return this.calls().map(({ methodName }) => methodName);
  }

  apiRequests(): number {
    return this.messages().filter(({ type }) => type === 'getApi').length;
  }

  clear() {
    this.#watch();
    this.#posted = [];
  }

  post(type: string, data?: unknown, { origin = WIDGET_ORIGIN, source = this.frame as MessageEventSource } = {}) {
    globalThis.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ type, data, mixcloud: 'playerWidget' }),
        source,
        origin,
      })
    );
  }

  /** Announce the document and answer the `getApi` request that follows, as the widget does. */
  start() {
    this.post('ready');
    this.post('api', { methods: [], events: [] });
  }

  emit(eventName: string, ...args: unknown[]) {
    this.post('event', { eventName, args });
  }

  /** Answer every unanswered call to each method in `values`, in order. */
  answer(values: Record<string, unknown>) {
    for (const { methodId, methodName } of this.calls()) {
      if (this.#answered.has(methodId) || !(methodName in values)) continue;

      this.#answered.add(methodId);
      this.post('methodResponse', { methodId, value: values[methodName] });
    }
  }
}

const SHOW_ANSWERS = { getIsPaused: true, getDuration: DURATION };

/** Flush the microtask a load waits on, and the answers that follow. */
async function flush(): Promise<void> {
  for (let i = 0; i < 6; i++) await Promise.resolve();
}

function recordEvents(media: EventTarget, types: string[]) {
  const events: string[] = [];

  for (const type of types) media.addEventListener(type, () => events.push(type));

  return events;
}

async function createReadyMedia(src = SHOW, setup?: (media: MixcloudAdapter) => void) {
  const media = new MixcloudAdapter();

  setup?.(media);
  media.src = src;

  const widget = new FakeWidget();

  media.attach(widget.iframe);
  await flush();
  widget.start();
  widget.answer(SHOW_ANSWERS);
  await flush();

  return { media, widget };
}

/** Bring the show to playing, through the `play` and `pause` toggling the widget reports while it loads. */
async function startPlaying(media: MixcloudAdapter, widget: FakeWidget) {
  await media.play();
  widget.emit('play');
  widget.emit('pause');
  widget.emit('play');
  widget.emit('pause');
  widget.emit('buffering');
  widget.emit('play');
  widget.emit('play');
  widget.emit('progress', 1, DURATION);
  await flush();
}

describe('buildMixcloudIframeSrc', () => {
  it('builds the widget URL on its own host, in its classic layout', () => {
    const url = new URL(buildMixcloudIframeSrc(`${SHOW}?utm_source=widget`));

    expect(url.origin + url.pathname).toBe(`${WIDGET_ORIGIN}/`);
    expect(Object.fromEntries(url.searchParams)).toEqual({ feed: KEY, hide_cover: '1' });
  });

  it('keeps the parameters of an embed URL and lets engine options win over them', () => {
    const src = `https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(SHOW)}&light=1&hide_artwork=1`;
    const url = new URL(
      buildMixcloudIframeSrc(src, { source: { engine: { mixcloud: { hide_artwork: false, hide_tracklist: true } } } })
    );

    expect(url.origin).toBe(WIDGET_ORIGIN);
    expect(url.searchParams.get('feed')).toBe(KEY);
    expect(url.searchParams.get('light')).toBe('1');
    expect(url.searchParams.get('hide_artwork')).toBe('0');
    expect(url.searchParams.get('hide_tracklist')).toBe('1');
  });

  it('removes a default set to null and keeps autoplay and referrerPolicy off the URL', () => {
    const url = new URL(
      buildMixcloudIframeSrc(SHOW, {
        source: { engine: { mixcloud: { hide_cover: null, autoplay: true, referrerPolicy: 'no-referrer' } } },
      })
    );

    expect(url.searchParams.has('hide_cover')).toBe(false);
    expect(url.searchParams.has('autoplay')).toBe(false);
    expect(url.searchParams.has('referrerPolicy')).toBe(false);
  });

  it('builds nothing for a source that is not a Mixcloud show', () => {
    expect(buildMixcloudIframeSrc('https://www.mixcloud.com/spartacus/')).toBe('');
    expect(buildMixcloudIframeSrc('https://example.com/spartacus/lambiance/')).toBe('');
  });
});

describe('MixcloudAdapter', () => {
  describe('loading', () => {
    it('points an empty iframe at the widget and reports it ready to play once the duration arrives', async () => {
      const media = new MixcloudAdapter();
      const events = recordEvents(media, ['loadstart', 'loadedmetadata', 'durationchange', 'loadeddata', 'canplay']);
      const widget = new FakeWidget();

      media.src = SHOW;
      media.attach(widget.iframe);
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(buildMixcloudIframeSrc(SHOW));
      expect(media.readyState).toBe(0);

      widget.post('ready');

      expect(widget.apiRequests()).toBe(1);

      widget.post('api', { methods: [], events: [] });
      widget.answer(SHOW_ANSWERS);
      await flush();

      expect(events).toEqual(['loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'canplay']);
      expect(media.duration).toBe(DURATION);
      expect(media.seekable.end(0)).toBe(DURATION);
      expect(media.readyState).toBe(4);
      expect(media.paused).toBe(true);
    });

    it('asks again for a duration the widget does not know yet', async () => {
      vi.useFakeTimers();

      const media = new MixcloudAdapter();
      const widget = new FakeWidget();

      media.src = SHOW;
      media.attach(widget.iframe);
      await flush();
      widget.start();
      widget.answer({ getIsPaused: true, getDuration: null });
      await flush();

      expect(media.readyState).toBe(0);

      await vi.advanceTimersByTimeAsync(250);
      widget.answer({ getDuration: DURATION });
      await flush();

      expect(media.duration).toBe(DURATION);
      expect(media.readyState).toBe(4);
    });

    it('fails with a network error when the widget never learns the duration', async () => {
      vi.useFakeTimers();

      const media = new MixcloudAdapter();
      const widget = new FakeWidget();

      media.src = SHOW;
      media.attach(widget.iframe);
      await flush();
      widget.start();

      for (let i = 0; i < 60; i++) {
        widget.answer({ getIsPaused: true, getDuration: null });
        await vi.advanceTimersByTimeAsync(250);
      }

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    });

    it('fails when a loaded frame never answers, as a show the widget cannot find does', async () => {
      vi.useFakeTimers();

      const media = new MixcloudAdapter();
      const widget = new FakeWidget();
      const errors = recordEvents(media, ['error']);

      media.src = 'https://www.mixcloud.com/spartacus/no-such-show/';
      media.attach(widget.iframe);
      await flush();
      widget.clear();

      // Jsdom never loads the widget, so its document stays same-origin until the frame reports one.
      vi.spyOn(widget.iframe, 'contentDocument', 'get').mockReturnValue(null);
      widget.iframe.dispatchEvent(new Event('load'));

      expect(widget.apiRequests()).toBe(1);

      await vi.advanceTimersByTimeAsync(8_000);

      expect(errors).toEqual(['error']);
      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    });

    it('keeps a widget rendered for the same show, applying the layout it asks for in place', async () => {
      const iframe = document.createElement('iframe');

      iframe.setAttribute('src', buildMixcloudIframeSrc(SHOW));
      document.body.append(iframe);

      const widget = new FakeWidget(iframe);
      const media = new MixcloudAdapter();
      const events = recordEvents(media, ['emptied', 'loadstart']);
      const assign = vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set');

      media.attach(iframe);
      media.source = { src: SHOW, engine: { mixcloud: { light: true } } };
      await flush();

      expect(assign).not.toHaveBeenCalled();
      expect(events).toEqual(['loadstart']);
      expect(widget.apiRequests()).toBe(0);

      // A frame that loaded before anything listened answers this instead of its missed `ready`.
      vi.spyOn(iframe, 'contentDocument', 'get').mockReturnValue(null);
      iframe.dispatchEvent(new Event('load'));

      expect(widget.apiRequests()).toBe(1);

      widget.post('api', { methods: [], events: [] });
      widget.answer(SHOW_ANSWERS);
      await flush();

      expect(media.readyState).toBe(4);
      expect(widget.named('setOption').map(({ args }) => args)).toEqual([['light', true]]);
    });

    it("moves a widget rendered from Mixcloud's embed code onto the widget host", async () => {
      const iframe = document.createElement('iframe');
      const embed = `https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(KEY)}&hide_cover=1&mini=1`;

      iframe.setAttribute('src', embed);
      document.body.append(iframe);

      const media = new MixcloudAdapter();

      media.attach(iframe);
      media.src = embed;
      await flush();

      expect(iframe.getAttribute('src')).toBe(buildMixcloudIframeSrc(embed));
      expect(new URL(iframe.getAttribute('src')!).searchParams.get('mini')).toBe('1');
    });

    it('applies the referrerPolicy option to the iframe before it loads the widget', async () => {
      const media = new MixcloudAdapter();
      const widget = new FakeWidget();
      const assign = vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set');
      let policyAtLoad = '';

      assign.mockImplementation(function (this: HTMLIFrameElement, value: string) {
        policyAtLoad = this.referrerPolicy;
        this.setAttribute('src', value);
      });

      media.source = { src: SHOW, engine: { mixcloud: { referrerPolicy: 'no-referrer' } } };
      media.attach(widget.iframe);
      await flush();

      expect(policyAtLoad).toBe('no-referrer');
    });

    it('fails a source that is not a Mixcloud show without loading anything', async () => {
      const media = new MixcloudAdapter();
      const widget = new FakeWidget();

      media.src = 'https://www.mixcloud.com/spartacus/';
      media.attach(widget.iframe);
      await flush();

      expect(widget.iframe.hasAttribute('src')).toBe(false);
      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    });

    it('starts over when the frame loads a new document by itself', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['emptied', 'loadstart', 'loadedmetadata']);

      await startPlaying(media, widget);
      widget.clear();
      widget.start();
      widget.answer(SHOW_ANSWERS);
      await flush();

      expect(events).toEqual(['emptied', 'loadstart', 'loadedmetadata']);
      expect(media.paused).toBe(true);
      expect(media.currentTime).toBe(0);
      expect(widget.apiRequests()).toBe(1);
    });

    it('ignores messages from another origin or frame, and ones that are not the widget protocol', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['play']);

      widget.post('event', { eventName: 'play', args: [] }, { origin: 'https://example.com' });
      widget.post('event', { eventName: 'play', args: [] }, { source: window });
      globalThis.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ type: 'event', data: { eventName: 'play', args: [] } }),
          source: widget.frame as MessageEventSource,
          origin: WIDGET_ORIGIN,
        })
      );

      expect(events).toEqual([]);
      expect(media.paused).toBe(true);
    });

    it('clears the widget when the source is removed', async () => {
      const { media, widget } = await createReadyMedia();

      media.src = '';
      await flush();

      expect(widget.iframe.hasAttribute('src')).toBe(false);
      expect(media.readyState).toBe(0);
    });
  });

  describe('preload', () => {
    it('loads no widget under preload="none" until play(), then plays once it is ready', async () => {
      const media = new MixcloudAdapter();
      const widget = new FakeWidget();

      media.preload = 'none';
      media.src = SHOW;
      media.attach(widget.iframe);
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(null);

      await media.play();

      expect(widget.iframe.getAttribute('src')).toBe(buildMixcloudIframeSrc(SHOW));

      widget.start();
      widget.answer(SHOW_ANSWERS);
      await flush();

      expect(widget.named('play')).toHaveLength(1);
    });

    it('loads no widget for a source set after preload="none" in the same task, as lazy-audio sets them', async () => {
      const media = new MixcloudAdapter();
      const widget = new FakeWidget();

      media.attach(widget.iframe);
      media.src = SHOW;
      media.preload = 'none';
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(null);
    });

    it('holds a new target back again after detach', async () => {
      const media = new MixcloudAdapter();

      media.preload = 'none';
      media.src = SHOW;
      media.attach(new FakeWidget().iframe);
      await media.play();
      media.detach();

      // Playing was asked of the old widget; a new one waits to be asked again.
      const widget = new FakeWidget();

      media.attach(widget.iframe);
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(null);
    });

    it('loads the widget when preload is raised from "none"', async () => {
      const media = new MixcloudAdapter();
      const widget = new FakeWidget();

      media.preload = 'none';
      media.src = SHOW;
      media.attach(widget.iframe);
      await flush();
      media.preload = 'metadata';

      expect(widget.iframe.getAttribute('src')).toBe(buildMixcloudIframeSrc(SHOW));
    });

    it.each<[string, (media: MixcloudAdapter) => void]>([
      ['autoplay', (media) => (media.autoplay = true)],
      ['the autoplay parameter', (media) => (media.source = { engine: { mixcloud: { autoplay: true } } })],
      // The widget's own play button is then the way to start it, and it needs a widget to show.
      ['controls', (media) => (media.controls = true)],
    ])('loads the widget at once under preload="none" for %s', async (_, setup) => {
      const media = new MixcloudAdapter();
      const widget = new FakeWidget();

      media.preload = 'none';
      setup(media);
      media.src = SHOW;
      media.attach(widget.iframe);
      await flush();

      expect(widget.iframe.getAttribute('src')).not.toBe(null);
    });

    it('clears a widget left from an earlier source when the next one is held back', async () => {
      const { media, widget } = await createReadyMedia();

      media.preload = 'none';
      media.src = OTHER_SHOW;
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(null);
    });
  });

  describe('playback', () => {
    it('reports play, waiting, and playing through the play and pause toggling of loading', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['play', 'pause', 'waiting', 'playing', 'timeupdate']);

      await startPlaying(media, widget);

      expect(widget.methods()).toContain('play');
      expect(events).toEqual(['play', 'waiting', 'timeupdate', 'playing']);
      expect(media.paused).toBe(false);
      expect(media.currentTime).toBe(1);
    });

    it('counts a pause the widget still holds once loading has had its time', async () => {
      vi.useFakeTimers();

      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['play', 'pause']);

      await media.play();
      widget.emit('play');
      widget.emit('pause');
      await vi.advanceTimersByTimeAsync(8_000);
      widget.answer({ getIsPaused: true });
      await flush();

      expect(events).toEqual(['play', 'pause']);
      expect(media.paused).toBe(true);
    });

    it('reports nothing for a play the browser refuses, as the widget reports nothing', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['play', 'playing']);

      await media.play();

      expect(widget.methods()).toContain('play');
      expect(events).toEqual([]);
      expect(media.paused).toBe(true);
    });

    it('holds a play asked for before the widget is ready, and sends it after the volume', async () => {
      const media = new MixcloudAdapter();
      const widget = new FakeWidget();

      media.src = SHOW;
      media.muted = true;
      media.attach(widget.iframe);
      await flush();
      await media.play();

      expect(widget.methods()).toEqual([]);

      widget.start();
      await flush();

      expect(widget.methods().filter((name) => name === 'setVolume' || name === 'play')).toEqual(['setVolume', 'play']);
      expect(widget.named('setVolume')[0]!.args).toEqual([0]);
    });

    it('autoplays once the widget is ready, from the prop or the widget parameter, which stays off the URL', async () => {
      const { widget } = await createReadyMedia(SHOW, (media) => {
        media.autoplay = true;
      });

      expect(widget.methods()).toContain('play');

      const fromParam = await createReadyMedia(
        `https://www.mixcloud.com/widget/iframe/?feed=${encodeURIComponent(KEY)}&autoplay=1`
      );

      expect(fromParam.widget.methods()).toContain('play');
      expect(new URL(fromParam.widget.iframe.getAttribute('src')!).searchParams.has('autoplay')).toBe(false);
    });

    it('reports a pause it asked for even while the show is loading', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['play', 'pause']);

      await media.play();
      widget.emit('play');
      media.pause();
      widget.emit('pause');

      expect(widget.methods()).toContain('pause');
      expect(events).toEqual(['play', 'pause']);
      expect(media.paused).toBe(true);
    });

    it('resumes without waiting once the show has started', async () => {
      const { media, widget } = await createReadyMedia();

      await startPlaying(media, widget);
      widget.emit('pause');

      const events = recordEvents(media, ['play', 'waiting', 'playing']);

      widget.emit('play');
      widget.emit('progress', 2, DURATION);

      expect(events).toEqual(['play', 'playing']);
    });

    it('reports the end, then plays an ended show from the start', async () => {
      const { media, widget } = await createReadyMedia();

      await startPlaying(media, widget);

      const events = recordEvents(media, ['pause', 'ended', 'play']);

      widget.emit('progress', DURATION, DURATION);
      widget.emit('ended');
      widget.emit('pause');

      expect(events).toEqual(['pause', 'ended']);
      expect(media.ended).toBe(true);
      expect(media.currentTime).toBe(DURATION);

      await media.play();
      widget.emit('play');

      expect(events).toEqual(['pause', 'ended', 'play']);
      expect(media.ended).toBe(false);
      expect(media.currentTime).toBe(0);
    });

    it('plays the show again when it ends with loop, once the widget settles', async () => {
      const { media, widget } = await createReadyMedia(SHOW, (media) => {
        media.loop = true;
      });

      await startPlaying(media, widget);

      const events = recordEvents(media, ['pause', 'ended', 'play']);

      widget.clear();
      widget.emit('progress', DURATION, DURATION);
      widget.emit('ended');

      expect(widget.methods()).toEqual([]);

      widget.emit('pause');
      widget.emit('play');

      expect(widget.methods()).toEqual(['play']);
      expect(events).toEqual([]);
      expect(media.paused).toBe(false);
      expect(media.currentTime).toBe(0);
    });

    it('fails with the source error when the widget errors before the show plays', async () => {
      const { media, widget } = await createReadyMedia();

      await media.play();
      widget.emit('play');
      widget.emit('buffering');
      widget.emit('error');

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      expect(media.paused).toBe(true);
    });

    it('fails with a network error when the widget errors during playback', async () => {
      const { media, widget } = await createReadyMedia();

      await startPlaying(media, widget);
      widget.emit('error');

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
      expect(media.paused).toBe(true);
    });

    it('picks up playback the listener started in the widget before the host listened', async () => {
      const media = new MixcloudAdapter();
      const widget = new FakeWidget();
      const events = recordEvents(media, ['play']);

      media.src = SHOW;
      media.attach(widget.iframe);
      await flush();
      widget.start();
      widget.answer({ getIsPaused: false, getDuration: DURATION });
      await flush();

      expect(events).toEqual(['play']);
      expect(media.paused).toBe(false);
    });
  });

  describe('seeking', () => {
    it('seeks to whole seconds and settles once the widget confirms, ignoring positions before it lands', async () => {
      const { media, widget } = await createReadyMedia();

      await startPlaying(media, widget);

      const events = recordEvents(media, ['seeking', 'seeked']);

      media.currentTime = 600.4;

      expect(widget.named('seek').map(({ args }) => args)).toEqual([[600]]);
      expect(media.seeking).toBe(true);

      widget.emit('progress', 2, DURATION);

      expect(media.currentTime).toBe(600);

      widget.answer({ seek: true });
      await flush();

      expect(events).toEqual(['seeking', 'seeked']);
      expect(media.seeking).toBe(false);
      expect(media.currentTime).toBe(600);
    });

    it('goes back to where the widget is when it refuses a seek', async () => {
      const { media, widget } = await createReadyMedia();

      await startPlaying(media, widget);
      media.currentTime = 1200;
      widget.answer({ seek: false });
      await flush();
      widget.answer({ getPosition: 4 });
      await flush();

      expect(media.seeking).toBe(false);
      expect(media.currentTime).toBe(4);
    });

    it('settles a seek the widget never answers where the widget is', async () => {
      vi.useFakeTimers();

      const { media, widget } = await createReadyMedia();

      await startPlaying(media, widget);
      media.currentTime = 1200;
      await vi.advanceTimersByTimeAsync(6_000);
      widget.answer({ getPosition: 1203 });
      await flush();

      expect(media.seeking).toBe(false);
      expect(media.currentTime).toBe(1203);
    });

    it('reports a seek the listener makes in the widget, which the widget reports only as a jump', async () => {
      const { media, widget } = await createReadyMedia();

      await startPlaying(media, widget);

      const events = recordEvents(media, ['seeking', 'timeupdate', 'seeked']);

      widget.emit('progress', 2, DURATION);
      widget.emit('progress', 1800, DURATION);

      expect(events).toEqual(['timeupdate', 'seeking', 'timeupdate']);
      expect(media.seeking).toBe(true);

      // The widget repeats where it was before landing on the target.
      widget.emit('progress', 2, DURATION);
      widget.emit('progress', 1800, DURATION);

      expect(events).toEqual(['timeupdate', 'seeking', 'timeupdate', 'seeked']);
      expect(media.currentTime).toBe(1800);
      expect(media.seeking).toBe(false);

      widget.emit('progress', 1801, DURATION);

      expect(events.at(-1)).toBe('timeupdate');
    });

    it('settles a seek the listener makes in a paused widget where the widget is', async () => {
      vi.useFakeTimers();

      const { media, widget } = await createReadyMedia();

      await startPlaying(media, widget);
      widget.emit('pause');
      widget.emit('progress', 900, DURATION);
      await vi.advanceTimersByTimeAsync(1_000);
      widget.answer({ getPosition: 900 });
      await flush();

      expect(media.seeking).toBe(false);
      expect(media.currentTime).toBe(900);
      expect(media.paused).toBe(true);
    });

    it('holds a seek made before the show plays until it does, since the widget would drop it', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['seeking', 'seeked']);

      media.currentTime = 600;

      expect(events).toEqual(['seeking', 'seeked']);
      expect(widget.named('seek')).toHaveLength(0);

      await media.play();
      widget.emit('play');
      widget.emit('progress', 1, DURATION);

      expect(widget.named('seek').map(({ args }) => args)).toEqual([[600]]);
      expect(media.currentTime).toBe(600);

      widget.answer({ seek: true });
      await flush();
      widget.emit('progress', 601, DURATION);

      expect(media.currentTime).toBe(601);
    });
  });

  describe('volume', () => {
    it('sets the widget volume, holding 0 while muted, and announces each change', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['volumechange']);

      widget.clear();
      media.volume = 0.4;
      media.muted = true;
      media.volume = 0.6;
      media.muted = false;

      expect(widget.named('setVolume').map(({ args }) => args[0])).toEqual([0.4, 0, 0.6]);
      expect(events).toHaveLength(4);
    });
  });

  describe('widget parameters', () => {
    it('leaves the widget alone when controls change, since they only decide whether it shows', async () => {
      const { media, widget } = await createReadyMedia();
      const assign = vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set');

      widget.clear();
      media.controls = true;
      media.controls = false;

      expect(widget.methods()).toEqual([]);
      expect(assign).not.toHaveBeenCalled();
    });

    it('applies a layout option in place, and reloads the widget for any other', async () => {
      const { media, widget } = await createReadyMedia();
      const assign = vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set');

      media.source = { src: SHOW, engine: { mixcloud: { light: true } } };
      await flush();

      expect(widget.named('setOption').map(({ args }) => args)).toEqual([['light', true]]);
      expect(assign).not.toHaveBeenCalled();

      media.source = { src: SHOW, engine: { mixcloud: { light: true, limit: 1 } } };
      await flush();

      expect(assign).toHaveBeenCalledTimes(1);
    });

    it('reloads the widget for another show', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['emptied', 'loadstart']);

      media.src = OTHER_SHOW;
      await flush();

      expect(events).toEqual(['emptied', 'loadstart']);
      expect(widget.iframe.getAttribute('src')).toBe(buildMixcloudIframeSrc(OTHER_SHOW));
    });
  });

  it('offers volume and seeking, but not playback rate or picture-in-picture', async () => {
    const { media } = await createReadyMedia();

    expect(isMediaVolumeCapable(media)).toBe(true);
    expect(isMediaBufferCapable(media)).toBe(true);
    expect(isMediaPlaybackRateCapable(media)).toBe(false);
    expect(isMediaPictureInPictureCapable(media)).toBe(false);
  });

  it('names its engine, as the other embeds do', () => {
    expect(getMediaEngineName(new MixcloudAdapter())).toBe('mixcloud');
  });
});
