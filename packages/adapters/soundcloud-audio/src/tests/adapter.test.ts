import {
  isMediaBufferCapable,
  isMediaPictureInPictureCapable,
  isMediaPlaybackRateCapable,
  isMediaVolumeCapable,
  MediaError,
} from '@videojs/media';
import { getMediaEngineName } from '@videojs/media/dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { buildSoundCloudIframeSrc, SoundCloudAdapter } from '..';

const TRACK = 'https://soundcloud.com/forss/flickermood';
const OTHER_TRACK = 'https://soundcloud.com/forss/journeyman';
const SET = 'https://soundcloud.com/forss/sets/soulhack';
const WIDGET_ORIGIN = 'https://w.soundcloud.com';

const TRACK_ID = 293;
const TRACK_MS = 213_890;

afterEach(() => {
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

interface Command {
  method: string;
  value?: unknown;
}

/**
 * Stands in for the widget document in a jsdom iframe: records the commands posted to it and reports back the way the
 * widget does, as JSON strings on `window` from its frame and origin, each carrying the id of the document.
 */
class FakeWidget {
  readonly iframe: HTMLIFrameElement;
  // The widget names each document after `Date.now()` when it starts, after the frame navigates to it.
  #widgetId: string | null = null;
  #answered = 0;
  #posted: string[] = [];
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

  commands(): Command[] {
    this.#watch();

    return this.#posted.map((data) => JSON.parse(data) as Command);
  }

  named(method: string): Command[] {
    return this.commands().filter((command) => command.method === method);
  }

  methods(): string[] {
    return this.commands()
      .map(({ method }) => method)
      .filter((method) => method !== 'addEventListener');
  }

  clear() {
    this.#posted = [];
    this.#answered = 0;
  }

  get widgetId(): string {
    this.#widgetId ??= widgetIdAt(Date.now());

    return this.#widgetId;
  }

  /** Swap in a new document, as a reload does. */
  reload(widgetId = widgetIdAt(Date.now())) {
    this.#widgetId = widgetId;
  }

  emit(method: string, value?: unknown, { origin = WIDGET_ORIGIN, widgetId = this.widgetId } = {}) {
    globalThis.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ widgetId, method, value: value ?? null }),
        source: this.frame,
        origin,
      })
    );
  }

  /** Answer every getter asked since the last call, in order, from `values`. */
  answer(values: Record<string, unknown>) {
    const commands = this.commands();

    for (const { method } of commands.slice(this.#answered)) {
      if (method in values) this.emit(method, values[method]);
    }

    this.#answered = commands.length;
  }

  progress(event: string, position: number, extra: Record<string, unknown> = {}) {
    this.emit(event, {
      soundId: TRACK_ID,
      currentPosition: position,
      relativePosition: 0,
      loadedProgress: 0,
      ...extra,
    });
  }
}

function widgetIdAt(time: number) {
  return `widget_${time}`;
}

const TRACK_ANSWERS = {
  getSounds: [{ id: TRACK_ID }],
  getCurrentSound: { id: TRACK_ID },
  getDuration: TRACK_MS,
  isPaused: true,
};

/** Flush the microtask a load waits on, and the getter answers that follow. */
async function flush(): Promise<void> {
  for (let i = 0; i < 6; i++) await Promise.resolve();
}

function recordEvents(media: EventTarget, types: string[]) {
  const events: string[] = [];

  for (const type of types) media.addEventListener(type, () => events.push(type));

  return events;
}

async function createReadyMedia(
  src = TRACK,
  answers: Record<string, unknown> = TRACK_ANSWERS,
  setup?: (media: SoundCloudAdapter) => void
) {
  const media = new SoundCloudAdapter();

  setup?.(media);
  media.src = src;

  const widget = new FakeWidget();

  media.attach(widget.iframe);
  await flush();
  widget.emit('ready');
  widget.answer(answers);
  await flush();

  return { media, widget };
}

describe('buildSoundCloudIframeSrc', () => {
  it('builds the widget URL with the social chrome hidden', () => {
    const url = new URL(buildSoundCloudIframeSrc(`${TRACK}?utm_source=clipboard`));

    expect(url.origin + url.pathname).toBe(`${WIDGET_ORIGIN}/player/`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      url: TRACK,
      visual: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_reposts: 'false',
      show_teaser: 'false',
      buying: 'false',
      sharing: 'false',
      download: 'false',
    });
  });

  it('keeps the parameters of a widget embed URL and lets engine options win over them', () => {
    const src = `${WIDGET_ORIGIN}/player/?url=${encodeURIComponent(SET)}&color=%23ff5500&sharing=true&start_track=2`;
    const url = new URL(
      buildSoundCloudIframeSrc(src, {
        source: { engine: { soundcloud: { color: '#00cc66', visual: true, show_user: false } } },
      })
    );

    expect(url.searchParams.get('url')).toBe(SET);
    expect(url.searchParams.get('color')).toBe('#00cc66');
    expect(url.searchParams.get('sharing')).toBe('true');
    expect(url.searchParams.get('start_track')).toBe('2');
    expect(url.searchParams.get('visual')).toBe('true');
    expect(url.searchParams.get('show_user')).toBe('false');
  });

  it('removes a default set to null and keeps auto_play and referrerPolicy off the URL', () => {
    const url = new URL(
      buildSoundCloudIframeSrc(TRACK, {
        source: { engine: { soundcloud: { hide_related: null, auto_play: true, referrerPolicy: 'no-referrer' } } },
      })
    );

    expect(url.searchParams.has('hide_related')).toBe(false);
    expect(url.searchParams.has('auto_play')).toBe(false);
    expect(url.searchParams.has('referrerPolicy')).toBe(false);
  });

  it('builds nothing for a source that is not a SoundCloud sound', () => {
    expect(buildSoundCloudIframeSrc('https://on.soundcloud.com/9zRpu')).toBe('');
    expect(buildSoundCloudIframeSrc('https://example.com/forss/flickermood')).toBe('');
  });
});

describe('SoundCloudAdapter', () => {
  describe('loading', () => {
    it('points an empty iframe at the widget and reports it ready to play once the duration arrives', async () => {
      const media = new SoundCloudAdapter();
      const events = recordEvents(media, ['loadstart', 'loadedmetadata', 'durationchange', 'loadeddata', 'canplay']);
      const widget = new FakeWidget();

      media.src = TRACK;
      media.attach(widget.iframe);
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(buildSoundCloudIframeSrc(TRACK));
      expect(media.readyState).toBe(0);

      widget.emit('ready');
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(events).toEqual(['loadstart', 'durationchange', 'loadedmetadata', 'loadeddata', 'canplay']);
      expect(media.duration).toBe(TRACK_MS / 1000);
      expect(media.readyState).toBe(4);
      expect(media.paused).toBe(true);
    });

    it('subscribes to the widget events once it is ready', async () => {
      const { widget } = await createReadyMedia();

      expect(widget.named('addEventListener').map(({ value }) => value)).toEqual([
        'play',
        'pause',
        'finish',
        'seek',
        'playProgress',
        'loadProgress',
        'error',
      ]);
    });

    it('keeps a widget rendered from the same source instead of reloading it', async () => {
      const iframe = document.createElement('iframe');

      iframe.setAttribute('src', buildSoundCloudIframeSrc(TRACK));
      document.body.append(iframe);

      const widget = new FakeWidget(iframe);
      const media = new SoundCloudAdapter();
      const events = recordEvents(media, ['emptied', 'loadstart']);
      const assign = vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set');

      media.attach(iframe);
      media.src = TRACK;
      await flush();

      expect(assign).not.toHaveBeenCalled();
      expect(events).toEqual(['loadstart']);
      // Jsdom never loads the widget, so its document stays same-origin until the frame reports one.
      expect(widget.named('getCurrentSoundIndex')).toHaveLength(0);

      vi.spyOn(iframe, 'contentDocument', 'get').mockReturnValue(null);
      iframe.dispatchEvent(new Event('load'));

      // A frame that loaded before anything listened answers this instead of its missed `ready`.
      expect(widget.named('getCurrentSoundIndex')).toHaveLength(1);

      widget.emit('getCurrentSoundIndex', 0);
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(media.readyState).toBe(4);
    });

    it('applies the referrerPolicy option to the iframe before it loads the widget', async () => {
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();
      const assign = vi.spyOn(HTMLIFrameElement.prototype, 'src', 'set');
      let policyAtLoad = '';

      assign.mockImplementation(function (this: HTMLIFrameElement, value: string) {
        policyAtLoad = this.referrerPolicy;
        this.setAttribute('src', value);
      });

      media.source = { src: TRACK, engine: { soundcloud: { referrerPolicy: 'no-referrer' } } };
      media.attach(widget.iframe);
      await flush();

      expect(policyAtLoad).toBe('no-referrer');
      expect(widget.iframe.referrerPolicy).toBe('no-referrer');
    });

    it('reloads a widget rendered without the referrerPolicy option asks for', async () => {
      const iframe = document.createElement('iframe');

      iframe.setAttribute('src', buildSoundCloudIframeSrc(TRACK));
      document.body.append(iframe);

      const widget = new FakeWidget(iframe);
      const media = new SoundCloudAdapter();
      const events = recordEvents(media, ['emptied', 'loadstart']);

      media.attach(iframe);
      media.source = { src: TRACK, engine: { soundcloud: { referrerPolicy: 'no-referrer' } } };
      await flush();

      expect(events).toEqual(['loadstart', 'emptied', 'loadstart']);
      expect(widget.iframe.referrerPolicy).toBe('no-referrer');
    });

    it('autoplays and starts at the start time of a widget rendered from the same source', async () => {
      const iframe = document.createElement('iframe');

      iframe.setAttribute('src', buildSoundCloudIframeSrc(TRACK));
      document.body.append(iframe);

      const widget = new FakeWidget(iframe);
      const media = new SoundCloudAdapter();

      media.attach(iframe);
      media.autoplay = true;
      media.src = `${TRACK}#t=30`;
      await flush();
      widget.emit('ready');
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(widget.methods().filter((method) => method === 'seekTo' || method === 'play')).toEqual(['seekTo', 'play']);
    });

    it.each([
      ['a profile', 'https://soundcloud.com/forss'],
      ['a short link', 'https://on.soundcloud.com/9zRpu'],
    ])('reports %s as unsupported without building a widget', async (_, src) => {
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();
      const events = recordEvents(media, ['loadstart', 'error']);

      media.attach(widget.iframe);
      media.src = src;
      await flush();

      expect(events).toEqual(['loadstart', 'error']);
      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      expect(widget.iframe.hasAttribute('src')).toBe(false);
    });

    it('reports a sound the widget cannot play as unsupported', async () => {
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();
      const errors = recordEvents(media, ['error', 'canplay']);

      media.src = TRACK;
      media.attach(widget.iframe);
      await flush();
      // The widget replays the error it shows to a new `error` listener, ahead of the getter answers.
      widget.emit('ready');
      widget.emit('error');
      widget.answer({ getSounds: [], getCurrentSound: null, getDuration: null });
      await flush();

      expect(errors).toEqual(['error']);
      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
      expect(media.readyState).toBe(0);
    });

    it('waits for the duration of a set opened on a later track instead of failing', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();
      const events = recordEvents(media, ['canplay', 'error']);

      media.source = { src: SET, engine: { soundcloud: { start_track: 10 } } };
      media.attach(widget.iframe);
      await flush();
      widget.emit('ready');
      widget.answer({ getSounds: [{ id: 290 }, { id: 300 }], getCurrentSound: null, getDuration: null });
      await flush();
      vi.advanceTimersByTime(250);
      widget.answer({ getDuration: null });
      await flush();
      vi.advanceTimersByTime(250);
      widget.answer({ getDuration: 358_373 });
      await flush();

      expect(events).toEqual(['canplay']);
      expect(media.duration).toBe(358.373);
    });

    it('reports a network error, not an unplayable sound, when the duration never arrives', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();

      media.src = TRACK;
      media.attach(widget.iframe);
      await flush();
      widget.emit('ready');

      for (let attempt = 0; attempt < 20; attempt++) {
        widget.answer({ getSounds: [], getCurrentSound: null, getDuration: null });
        await flush();
        vi.advanceTimersByTime(250);
      }

      expect(media.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    });

    it('clears a failed source and announces the next one', async () => {
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();

      media.src = TRACK;
      media.attach(widget.iframe);
      await flush();
      widget.emit('ready');
      widget.emit('error');
      widget.answer({ getSounds: [], getCurrentSound: null, getDuration: null });
      await flush();
      expect(media.error).not.toBe(null);

      const events = recordEvents(media, ['emptied', 'loadstart', 'canplay']);

      media.src = OTHER_TRACK;
      await flush();

      expect(media.error).toBe(null);
      expect(events).toEqual(['emptied', 'loadstart']);
      expect(new URL(widget.iframe.src).searchParams.get('url')).toBe(OTHER_TRACK);

      widget.reload();
      widget.emit('ready');
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(events).toEqual(['emptied', 'loadstart', 'canplay']);
    });

    it('ignores messages from another origin, another frame, or the document it replaced', async () => {
      const { media, widget } = await createReadyMedia();
      const other = new FakeWidget();

      widget.emit('play', { soundId: TRACK_ID, currentPosition: 0 }, { origin: 'https://evil.example.com' });
      other.emit('play', { soundId: TRACK_ID, currentPosition: 0 });
      expect(media.paused).toBe(true);

      media.src = OTHER_TRACK;
      await flush();
      // The old document still posts until the frame navigates away from it.
      widget.emit('ready', null, { widgetId: widgetIdAt(Date.now() - 1_000) });
      expect(widget.named('getDuration')).toHaveLength(1);

      widget.reload();
      widget.emit('ready');
      expect(widget.named('getDuration')).toHaveLength(2);
    });

    it('ignores a document that a newer source replaced before it was ready', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(1_000);

      const { media, widget } = await createReadyMedia();

      vi.setSystemTime(2_000);
      media.src = OTHER_TRACK;
      await flush();
      vi.setSystemTime(3_000);
      media.src = SET;
      await flush();

      // The second source's document reports late, through its broadcast and through the probe its `load` triggers.
      widget.emit('ready', null, { widgetId: widgetIdAt(2_500) });
      widget.emit('getCurrentSoundIndex', 0, { widgetId: widgetIdAt(2_500) });
      expect(widget.named('getDuration')).toHaveLength(1);

      widget.reload(widgetIdAt(3_500));
      widget.emit('ready');
      widget.answer({ ...TRACK_ANSWERS, getDuration: 142_236 });
      await flush();

      expect(media.duration).toBe(142.236);
      expect(media.readyState).toBe(4);
    });

    it('starts over when the frame reloads by itself, as moving it in the page does', async () => {
      const { media, widget } = await createReadyMedia(`${TRACK}#t=30`);
      const events = recordEvents(media, ['emptied', 'loadstart', 'canplay']);

      widget.progress('play', 30_000);
      widget.clear();
      widget.reload(widgetIdAt(Date.now() + 1));
      widget.emit('ready');
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(events).toEqual(['emptied', 'loadstart', 'canplay']);
      expect(media.paused).toBe(true);
      expect(widget.named('addEventListener')).toHaveLength(7);
      expect(widget.named('seekTo')).toEqual([{ method: 'seekTo', value: 30_000 }]);
    });

    it('becomes ready again when attached again to the same widget', async () => {
      const { media, widget } = await createReadyMedia();

      media.detach();
      vi.spyOn(widget.iframe, 'contentDocument', 'get').mockReturnValue(null);
      media.attach(widget.iframe);
      await flush();

      // The probe is answered by the same document as before.
      widget.emit('getCurrentSoundIndex', 0);
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(media.readyState).toBe(4);
      expect(widget.iframe.getAttribute('src')).toBe(buildSoundCloudIframeSrc(TRACK));
    });
  });

  describe('preload', () => {
    it('loads no widget under preload="none" until play(), then plays once it is ready', async () => {
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();

      media.preload = 'none';
      media.src = TRACK;
      media.attach(widget.iframe);
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(null);

      await media.play();

      expect(widget.iframe.getAttribute('src')).toBe(buildSoundCloudIframeSrc(TRACK));

      widget.emit('ready');
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(widget.named('play')).toHaveLength(1);
    });

    it('loads no widget for a source set after preload="none" in the same task, as lazy-audio sets them', async () => {
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();

      media.attach(widget.iframe);
      media.src = TRACK;
      media.preload = 'none';
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(null);
    });

    it('holds a new target back again after detach', async () => {
      const media = new SoundCloudAdapter();

      media.preload = 'none';
      media.src = TRACK;
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
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();

      media.preload = 'none';
      media.src = TRACK;
      media.attach(widget.iframe);
      await flush();
      media.preload = 'metadata';

      expect(widget.iframe.getAttribute('src')).toBe(buildSoundCloudIframeSrc(TRACK));
    });

    it.each<[string, (media: SoundCloudAdapter) => void]>([
      ['autoplay', (media) => (media.autoplay = true)],
      ['the auto_play parameter', (media) => (media.source = { engine: { soundcloud: { auto_play: true } } })],
      // The widget's own play button is then the way to start it, and it needs a widget to show.
      ['controls', (media) => (media.controls = true)],
    ])('loads the widget at once under preload="none" for %s', async (_, setup) => {
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();

      media.preload = 'none';
      setup(media);
      media.src = TRACK;
      media.attach(widget.iframe);
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(buildSoundCloudIframeSrc(TRACK));
    });

    it('clears a widget left from an earlier source when the next one is held back', async () => {
      const { media, widget } = await createReadyMedia();

      media.preload = 'none';
      media.src = OTHER_TRACK;
      await flush();

      expect(widget.iframe.getAttribute('src')).toBe(null);
    });
  });

  describe('playback', () => {
    it('plays, pauses, and seeks through the widget commands', async () => {
      const { media, widget } = await createReadyMedia();

      widget.clear();
      await media.play();
      media.pause();
      media.currentTime = 60;

      expect(widget.commands()).toEqual([{ method: 'play' }, { method: 'pause' }, { method: 'seekTo', value: 60_000 }]);
    });

    it('stores a time set without a source, or after one failed to load, without seeking', async () => {
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();
      const events = recordEvents(media, ['seeking', 'seeked', 'timeupdate']);

      media.attach(widget.iframe);
      media.currentTime = 30;

      expect(media.seeking).toBe(false);
      expect(media.currentTime).toBe(30);

      media.src = 'https://soundcloud.com/forss';
      await flush();
      media.currentTime = 45;

      expect(media.seeking).toBe(false);
      expect(media.currentTime).toBe(45);
      expect(events).toEqual([]);
    });

    it('holds a play asked for before the widget is ready', async () => {
      const media = new SoundCloudAdapter();
      const widget = new FakeWidget();

      media.src = TRACK;
      media.attach(widget.iframe);
      await media.play();

      expect(widget.named('play')).toHaveLength(0);

      widget.emit('ready');
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(widget.named('play')).toHaveLength(1);
    });

    it('waits for the first position after play when nothing is loaded yet', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['play', 'waiting', 'playing']);

      widget.progress('play', 0);
      expect(events).toEqual(['play', 'waiting']);
      expect(media.readyState).toBeLessThan(3);

      widget.progress('playProgress', 0);
      expect(events).toEqual(['play', 'waiting']);

      widget.progress('playProgress', 180, { loadedProgress: 0.05 });
      expect(events).toEqual(['play', 'waiting', 'playing']);
      expect(media.readyState).toBe(4);
    });

    it('plays straight away when the widget already has what follows the position', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['play', 'waiting', 'playing']);

      widget.progress('play', 10_000, { loadedProgress: 0.5 });

      expect(events).toEqual(['play', 'playing']);
    });

    it('reports a pause from the widget', async () => {
      const { media, widget } = await createReadyMedia();

      widget.progress('play', 0);
      widget.progress('pause', 20_000);

      expect(media.paused).toBe(true);
    });

    it('keeps reporting a seek it asked for until the widget lands, then reports where', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['seeking', 'seeked']);

      media.currentTime = 60;
      widget.progress('playProgress', 10_000);

      expect(media.currentTime).toBe(60);
      expect(media.seeking).toBe(true);

      widget.progress('seek', 60_000);

      expect(events).toEqual(['seeking', 'seeked']);
      expect(media.seeking).toBe(false);
    });

    it('reports a seek made in the widget, but not the position it repeats when it pauses', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['seeking', 'seeked']);

      widget.progress('seek', 30_000);
      expect(events).toEqual(['seeking', 'seeked']);
      expect(media.currentTime).toBe(30);

      widget.progress('seek', 30_010);
      expect(events).toEqual(['seeking', 'seeked']);
    });

    it('never reports a position past the duration', async () => {
      const { media, widget } = await createReadyMedia();

      media.currentTime = 999;
      expect(media.currentTime).toBe(TRACK_MS / 1000);
      expect(widget.named('seekTo').at(-1)?.value).toBe(TRACK_MS);

      widget.progress('seek', TRACK_MS);
      widget.progress('playProgress', TRACK_MS + 500);
      expect(media.currentTime).toBe(TRACK_MS / 1000);
    });

    it('paces timeupdate like a media element rather than at every widget report', async () => {
      const { media, widget } = await createReadyMedia();
      const updates = recordEvents(media, ['timeupdate']);

      for (let position = 20; position <= 1000; position += 20) widget.progress('playProgress', position);

      expect(updates.length).toBeLessThanOrEqual(4);
      expect(media.currentTime).toBe(1);
    });
  });

  describe('start time', () => {
    it('starts from the time in the URL fragment', async () => {
      const { media, widget } = await createReadyMedia(`${TRACK}#t=1m30s`);

      expect(widget.named('seekTo')).toEqual([{ method: 'seekTo', value: 90_000 }]);
      expect(media.currentTime).toBe(90);
    });

    it('starts from the time in the URL fragment of the next source too', async () => {
      const { media, widget } = await createReadyMedia();

      media.src = `${OTHER_TRACK}#t=0:45`;
      await flush();
      widget.reload();
      widget.emit('ready');
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(widget.named('seekTo')).toEqual([{ method: 'seekTo', value: 45_000 }]);
    });

    it('seeks before it plays, so autoplay starts at the start time', async () => {
      const { widget } = await createReadyMedia(`${TRACK}#t=30`, TRACK_ANSWERS, (media) => {
        media.autoplay = true;
      });

      expect(widget.methods().filter((method) => method === 'seekTo' || method === 'play')).toEqual(['seekTo', 'play']);
    });
  });

  describe('volume', () => {
    it('applies a muted autoplay before playing', async () => {
      const { widget } = await createReadyMedia(TRACK, TRACK_ANSWERS, (media) => {
        media.autoplay = true;
        media.defaultMuted = true;
      });
      const commands = widget.commands().filter(({ method }) => method === 'setVolume' || method === 'play');

      expect(commands).toEqual([{ method: 'setVolume', value: 0 }, { method: 'play' }]);
    });

    it('autoplays for the widget auto_play parameter too, never from the URL', async () => {
      const { widget } = await createReadyMedia(TRACK, TRACK_ANSWERS, (media) => {
        media.source = { engine: { soundcloud: { auto_play: true } } };
      });

      expect(widget.named('play')).toHaveLength(1);
      expect(new URL(widget.iframe.src).searchParams.has('auto_play')).toBe(false);
    });

    it('mutes through a volume of zero and restores the level on unmute', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['volumechange']);

      widget.clear();
      media.volume = 0.4;
      media.muted = true;
      media.volume = 0.6;
      media.muted = false;

      expect(widget.named('setVolume').map(({ value }) => value)).toEqual([40, 0, 60]);
      expect(events).toHaveLength(4);
      expect(media.volume).toBe(0.6);
    });

    it('keeps the volume and mute across a source change', async () => {
      const { media, widget } = await createReadyMedia();

      media.muted = true;
      media.src = OTHER_TRACK;
      await flush();
      widget.clear();
      widget.reload();
      widget.emit('ready');
      widget.answer(TRACK_ANSWERS);
      await flush();

      expect(media.muted).toBe(true);
      expect(widget.named('setVolume')).toEqual([{ method: 'setVolume', value: 0 }]);
    });
  });

  describe('end of playback', () => {
    it('ends at the duration when the track finishes, ignoring the rewind that follows', async () => {
      const { media, widget } = await createReadyMedia();
      const events = recordEvents(media, ['pause', 'ended']);

      widget.progress('play', 0);
      widget.progress('pause', TRACK_MS - 3);
      widget.progress('finish', TRACK_MS - 3);
      widget.progress('seek', 0);

      expect(events).toEqual(['pause', 'ended']);
      expect(media.ended).toBe(true);
      expect(media.currentTime).toBe(TRACK_MS / 1000);
    });

    it('restarts with loop and reports no end once the widget plays again', async () => {
      vi.useFakeTimers();

      const { media, widget } = await createReadyMedia(TRACK, TRACK_ANSWERS, (m) => {
        m.loop = true;
      });
      const events = recordEvents(media, ['pause', 'ended']);

      widget.progress('play', 0);
      widget.clear();
      widget.progress('pause', TRACK_MS - 3);
      widget.progress('finish', TRACK_MS - 3);

      expect(widget.named('play')).toHaveLength(1);

      widget.progress('play', 0);
      vi.advanceTimersByTime(5_000);

      expect(events).toEqual([]);
      expect(media.paused).toBe(false);
      expect(media.currentTime).toBe(0);
    });

    it('ends with loop when the widget does not play again', async () => {
      vi.useFakeTimers();

      const { media, widget } = await createReadyMedia(TRACK, TRACK_ANSWERS, (m) => {
        m.loop = true;
      });
      const events = recordEvents(media, ['pause', 'ended']);

      widget.progress('play', 0);
      widget.progress('pause', TRACK_MS - 3);
      widget.progress('finish', TRACK_MS - 3);
      vi.advanceTimersByTime(5_000);

      expect(events).toEqual(['pause', 'ended']);
    });

    it('pauses after a while if a pause at the end is not followed by a finish', async () => {
      vi.useFakeTimers();

      const { media, widget } = await createReadyMedia();

      widget.progress('play', 0);
      widget.progress('pause', TRACK_MS - 100);
      expect(media.paused).toBe(false);

      vi.advanceTimersByTime(5_000);
      expect(media.paused).toBe(true);
      expect(media.ended).toBe(false);
    });
  });

  describe('sets', () => {
    const SET_ANSWERS = {
      getSounds: [{ id: 290 }, { id: 291 }, { id: 292 }],
      getCurrentSound: { id: 290 },
      getDuration: 142_236,
      isPaused: true,
    };

    function progress(widget: FakeWidget, event: string, soundId: number, position: number) {
      widget.emit(event, { soundId, currentPosition: position, relativePosition: 0, loadedProgress: 0 });
    }

    it('moves on to the next track as one source, reporting its duration and no end', async () => {
      const { media, widget } = await createReadyMedia(SET, SET_ANSWERS);
      const events = recordEvents(media, ['pause', 'ended', 'play', 'durationchange']);

      progress(widget, 'play', 290, 0);
      media.currentTime = 100;
      progress(widget, 'seek', 290, 100_000);
      progress(widget, 'pause', 290, 142_233);
      progress(widget, 'finish', 290, 142_233);
      progress(widget, 'play', 291, 0);
      widget.answer({ getDuration: 274_442 });
      await flush();

      expect(events).toEqual(['play', 'durationchange']);
      expect(media.duration).toBe(274.442);
      expect(media.currentTime).toBe(0);
      expect(media.paused).toBe(false);
    });

    it('follows a track picked in the widget', async () => {
      const { media, widget } = await createReadyMedia(SET, SET_ANSWERS);

      progress(widget, 'play', 290, 0);
      progress(widget, 'playProgress', 290, 50_000);
      progress(widget, 'pause', 290, 50_000);
      progress(widget, 'play', 292, 0);
      widget.answer({ getDuration: 463_908 });
      await flush();

      expect(media.duration).toBe(463.908);
      expect(media.currentTime).toBe(0);
      expect(media.paused).toBe(false);
    });

    it('announces an error in the middle of a set without keeping it, and follows the widget to the next track', async () => {
      const { media, widget } = await createReadyMedia(SET, SET_ANSWERS);

      // Settle the `isPaused` the media asks once it is ready, so the next answer is for the error.
      widget.answer(SET_ANSWERS);
      const errors: (MediaError | undefined)[] = [];

      media.addEventListener('error', (event) => errors.push((event as ErrorEvent).error));
      progress(widget, 'play', 290, 0);
      widget.clear();
      widget.emit('error');
      widget.answer({ isPaused: false });
      await flush();

      expect(errors).toHaveLength(1);
      expect(errors[0]?.fatal).toBe(false);
      expect(media.error).toBe(null);
      expect(media.paused).toBe(false);

      progress(widget, 'play', 291, 0);
      widget.answer({ getDuration: 274_442 });
      await flush();

      expect(media.duration).toBe(274.442);
      expect(media.paused).toBe(false);

      widget.clear();
      media.pause();
      await media.play();

      expect(widget.methods()).toEqual(['pause', 'play']);
    });

    it('reports a pause when the widget stops after an error in the middle of playback', async () => {
      const { media, widget } = await createReadyMedia(SET, SET_ANSWERS);

      // Settle the `isPaused` the media asks once it is ready, so the next answer is for the error.
      widget.answer(SET_ANSWERS);

      progress(widget, 'play', 290, 0);
      widget.clear();
      widget.emit('error');
      widget.answer({ isPaused: true });
      await flush();

      expect(media.paused).toBe(true);
      expect(media.error).toBe(null);
    });

    it('ends after the last track and plays again from the first', async () => {
      const { media, widget } = await createReadyMedia(SET, { ...SET_ANSWERS, getCurrentSound: { id: 292 } });
      const events = recordEvents(media, ['ended']);

      progress(widget, 'play', 292, 0);
      progress(widget, 'pause', 292, 142_233);
      progress(widget, 'finish', 292, 142_233);

      expect(events).toEqual(['ended']);

      widget.clear();
      await media.play();

      expect(widget.commands()).toEqual([{ method: 'skip', value: 0 }]);
    });
  });

  describe('content data', () => {
    const SOUND = {
      id: TRACK_ID,
      title: 'Flickermood',
      artwork_url: 'https://i1.sndcdn.com/artworks-000067273316-smsiqx-large.jpg',
      user: { username: 'Forss', avatar_url: 'https://i1.sndcdn.com/avatars-000000000001-aaaaaa-large.jpg' },
    };

    it('reports the title and a large artwork of the sound once the widget is ready', async () => {
      const media = new SoundCloudAdapter();
      const events = recordEvents(media, ['contentdatachange']);

      expect(media.contentData).toEqual({});

      media.src = TRACK;

      const widget = new FakeWidget();

      media.attach(widget.iframe);
      await flush();
      widget.emit('ready');
      widget.answer({ ...TRACK_ANSWERS, getCurrentSound: SOUND });
      await flush();

      expect(events).toEqual(['contentdatachange']);
      expect(media.contentData).toEqual({
        title: 'Flickermood',
        poster: 'https://i1.sndcdn.com/artworks-000067273316-smsiqx-t500x500.jpg',
      });
    });

    it('falls back to the avatar of the uploader and leaves out an empty title', async () => {
      const { media } = await createReadyMedia(TRACK, {
        ...TRACK_ANSWERS,
        getCurrentSound: { ...SOUND, title: '', artwork_url: null },
      });

      expect(media.contentData).toEqual({
        poster: 'https://i1.sndcdn.com/avatars-000000000001-aaaaaa-t500x500.jpg',
      });
    });

    it('follows each track of a set', async () => {
      const { media, widget } = await createReadyMedia(SET, {
        getSounds: [{ id: 290 }, { id: 291 }],
        getCurrentSound: { ...SOUND, id: 290, title: 'City Ports' },
        getDuration: 142_236,
        isPaused: true,
      });
      const events = recordEvents(media, ['contentdatachange']);

      widget.emit('play', { soundId: 290, currentPosition: 0, loadedProgress: 0 });
      widget.emit('play', { soundId: 291, currentPosition: 0, loadedProgress: 0 });
      widget.answer({
        isPaused: false,
        getDuration: 274_442,
        getCurrentSound: { ...SOUND, id: 291, title: 'Soulhack' },
      });
      await flush();

      expect(events).toEqual(['contentdatachange']);
      expect(media.contentData.title).toBe('Soulhack');
    });

    it('clears what it reported when the source changes', async () => {
      const { media } = await createReadyMedia(TRACK, { ...TRACK_ANSWERS, getCurrentSound: SOUND });
      const events = recordEvents(media, ['contentdatachange', 'emptied']);

      media.src = OTHER_TRACK;
      await flush();

      expect(events).toEqual(['contentdatachange', 'emptied']);
      expect(media.contentData).toEqual({});
    });
  });

  describe('buffered', () => {
    it('is empty until the widget reports what it loaded, while still telling the player it reports ranges', () => {
      const media = new SoundCloudAdapter();

      expect(media.buffered.length).toBe(0);
      expect(media.seekable.length).toBe(0);
      expect(isMediaBufferCapable(media)).toBe(true);
    });

    it('spans what the widget loaded, from where playback last landed', async () => {
      const { media, widget } = await createReadyMedia();
      const duration = TRACK_MS / 1000;

      widget.progress('playProgress', 1000, { loadedProgress: 0.1 });
      expect(media.buffered.start(0)).toBe(0);
      expect(media.buffered.end(0)).toBeCloseTo(duration * 0.1);

      media.currentTime = 60;
      widget.progress('seek', 60_000);
      expect(media.buffered.length).toBe(0);

      widget.progress('playProgress', 61_000, { loadedProgress: 0.5 });
      expect(media.buffered.start(0)).toBe(60);
      expect(media.buffered.end(0)).toBeCloseTo(duration * 0.5);
    });
  });

  describe('capabilities', () => {
    it('offers volume but no playback rate, picture-in-picture, fullscreen, or text tracks', () => {
      const media = new SoundCloudAdapter();

      expect(isMediaVolumeCapable(media)).toBe(true);
      expect(isMediaPlaybackRateCapable(media)).toBe(false);
      expect(isMediaPictureInPictureCapable(media)).toBe(false);
      expect('requestFullscreen' in media).toBe(false);
      expect(media.textTracks.length).toBe(0);
    });

    it('names its engine, as the other embeds do', () => {
      expect(getMediaEngineName(new SoundCloudAdapter())).toBe('soundcloud');
    });
  });
});
