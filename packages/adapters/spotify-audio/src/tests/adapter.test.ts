import { isMediaVolumeCapable, MediaError, type Video } from '@videojs/media';
import { loadScript } from '@videojs/utils/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { buildSpotifyIframeSrc, SpotifyAdapter } from '..';
import {
  attachAndLoad,
  createIframe,
  installSpotifyApi,
  MockController,
  TRACK_URL,
  waitForEngine,
} from './spotify-api';

vi.mock(import('@videojs/utils/dom'), async (importOriginal) => {
  const mod = await importOriginal();

  return { ...mod, loadScript: vi.fn(async () => {}) };
});

const TRACK_ID = '1301WleyT98MSxVHPZCA6M';
const EPISODE_URL = 'https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5';
const OTHER_EPISODE_ID = '43cbJh4ccRD7lzM2730YK3';
const OTHER_EPISODE_URL = `https://open.spotify.com/episode/${OTHER_EPISODE_ID}`;

beforeEach(installSpotifyApi);

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

/** An iframe as React renders it before a source resolves: `src` present but empty. */
function createEmptySrcIframe(): HTMLIFrameElement {
  const iframe = createIframe();

  iframe.setAttribute('src', '');
  return iframe;
}

/** Flush the microtask the deferred embed waits on before it is built. */
async function flushDeferredEmbed(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('buildSpotifyIframeSrc', () => {
  it('builds the embed URL for a share URL', () => {
    expect(buildSpotifyIframeSrc(TRACK_URL)).toBe(`https://open.spotify.com/embed/track/${TRACK_ID}`);
  });

  it('builds the embed URL for a spotify URI', () => {
    expect(buildSpotifyIframeSrc(`spotify:show:${TRACK_ID}`)).toBe(`https://open.spotify.com/embed/show/${TRACK_ID}`);
  });

  it('embeds the start position from the t param', () => {
    expect(buildSpotifyIframeSrc(`${EPISODE_URL}?t=1200`)).toContain('?t=1200');
  });

  it('serializes Spotify embed options verbatim', () => {
    const src = buildSpotifyIframeSrc(TRACK_URL, { source: { engine: { spotify: { theme: 0 } } } });

    expect(src).toContain('theme=0');
  });

  it('carries undeclared Spotify embed options through', () => {
    const src = buildSpotifyIframeSrc(TRACK_URL, {
      source: { engine: { spotify: { utm_source: 'generator' } } },
    });

    expect(src).toContain('utm_source=generator');
  });

  it('lets embed options override the start position the src carries', () => {
    const src = buildSpotifyIframeSrc(`${EPISODE_URL}?t=1200`, { source: { engine: { spotify: { t: 30 } } } });

    expect(src).toContain('t=30');
    expect(src).not.toContain('t=1200');
  });

  it('embeds the video variant at its own path instead of as a parameter', () => {
    const src = buildSpotifyIframeSrc(EPISODE_URL, { source: { engine: { spotify: { preferVideo: true } } } });

    expect(src).toBe('https://open.spotify.com/embed/episode/7makk4oTQel546B0PZlDM5/video');
  });

  it('keeps the iframe referrer policy out of the embed URL', () => {
    const src = buildSpotifyIframeSrc(TRACK_URL, {
      source: { engine: { spotify: { referrerPolicy: 'no-referrer' } } },
    });

    expect(src).not.toContain('referrerPolicy');
  });

  it('returns empty string for invalid src', () => {
    expect(buildSpotifyIframeSrc('https://example.com/not-spotify')).toBe('');
  });
});

describe('SpotifyAdapter', () => {
  it('has expected default state before attach', () => {
    const media = new SpotifyAdapter();

    expect(media.engine).toBe(null);
    expect(media.target).toBe(null);
    expect(media.paused).toBe(true);
    expect(media.ended).toBe(false);
    expect(media.currentTime).toBe(0);
    expect(media.duration).toBeNaN();
    expect(media.src).toBe(SpotifyAdapter.defaultProps.src);
    expect(media.buffered.length).toBe(0);
    expect(media.textTracks.length).toBe(0);
    expect(media.played.length).toBeGreaterThanOrEqual(1);
  });

  it('sets the initial iframe src and creates a controller when attached', async () => {
    const media = new SpotifyAdapter();

    media.src = TRACK_URL;
    const iframe = createIframe();

    media.attach(iframe);

    expect(iframe.src).toContain(`https://open.spotify.com/embed/track/${TRACK_ID}`);
    expect(media.target).toBe(iframe);
    expect(media.currentSrc).toContain('/embed/track/');

    await waitForEngine(media);
    expect(media.engine).not.toBe(null);
    media.detach();
  });

  it('keeps the embed on the iframe it was handed', async () => {
    const media = new SpotifyAdapter();
    const { iframe, controller } = await attachAndLoad(media);

    // `createController` swaps its own iframe in for whatever it is handed, so it
    // is handed a throwaway node instead and pointed at this one. Following it
    // onto the iframe it builds would leave the host driving an element that was
    // never in the document.
    expect(controller.target).not.toBe(iframe);
    expect(controller.iframeElement).toBe(iframe);
    expect(media.target).toBe(iframe);
    expect(iframe.isConnected).toBe(true);
    media.detach();
  });

  it('does not create a second controller when handed the iframe that replaced the target', async () => {
    const media = new SpotifyAdapter();
    const { iframe } = await attachAndLoad(media);

    // What the custom element does when its shadow root changes: it re-attaches
    // whatever iframe it finds there, which is Spotify's replacement from the swap
    // on. Taking that as a new target would build a controller for every pass.
    media.attach(iframe);

    expect(MockController.instances.length).toBe(1);
    expect(media.engine).toBe(MockController.instances[0]);
    media.detach();
  });

  it('defers the controller until a source arrives', async () => {
    const media = new SpotifyAdapter();
    const loadstart = vi.fn();

    media.addEventListener('loadstart', loadstart);

    // How every framework builds the element: created first, `src` set after.
    const iframe = createIframe();

    media.attach(iframe);
    expect(iframe.getAttribute('src')).toBe(null);
    expect(media.engine).toBe(null);
    expect(loadstart).not.toHaveBeenCalled();

    media.src = TRACK_URL;
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain(`https://open.spotify.com/embed/track/${TRACK_ID}`);
    expect(loadstart).toHaveBeenCalledTimes(1);
    await waitForEngine(media);
    media.detach();
  });

  it('defers the controller for an iframe rendered with an empty src', async () => {
    const media = new SpotifyAdapter();
    // React renders `src=""` before a source resolves. The `src` property reports
    // the document URL for it, so only the attribute says there is no embed.
    const iframe = createEmptySrcIframe();

    media.attach(iframe);
    expect(media.engine).toBe(null);

    media.src = `spotify:track:${TRACK_ID}`;
    await flushDeferredEmbed();

    expect(iframe.getAttribute('src')).toContain(`https://open.spotify.com/embed/track/${TRACK_ID}`);
    await waitForEngine(media);
    media.detach();
  });

  it('builds a deferred embed once for repeated source changes in the same task', async () => {
    const media = new SpotifyAdapter();
    const iframe = createIframe();

    media.attach(iframe);

    media.src = TRACK_URL;
    media.src = EPISODE_URL;
    await waitForEngine(media);

    expect(iframe.getAttribute('src')).toContain('https://open.spotify.com/embed/episode/');
    expect(MockController.instances.length).toBe(1);
    media.detach();
  });

  it('does not leave play() waiting while the embed is deferred', async () => {
    const media = new SpotifyAdapter();

    media.attach(createIframe());

    // No embed means no controller is coming to report a load; waiting would hang.
    await expect(media.play()).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
  });

  it('waits for a deferred embed to load before playing', async () => {
    const media = new SpotifyAdapter();

    media.attach(createIframe());

    media.src = TRACK_URL;
    let played = false;
    const pending = media.play().then(() => {
      played = true;
    });

    // The controller the deferred embed creates has not reported readiness, so
    // playing now would run against a controller that cannot accept it.
    const controller = await waitForEngine(media);

    expect(played).toBe(false);

    controller.ready();
    await pending;

    expect(controller.resume).toHaveBeenCalled();
    media.detach();
  });

  it('emits loadstart on attach and loadedmetadata/loadcomplete after ready', async () => {
    const media = new SpotifyAdapter();
    const events: string[] = [];

    for (const type of ['loadstart', 'loadedmetadata', 'loadcomplete', 'volumechange'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    await attachAndLoad(media);

    expect(events).toContain('loadstart');
    expect(events).toContain('loadedmetadata');
    expect(events).toContain('loadcomplete');
    // Nothing reports a volume here, so nothing announces one changing.
    expect(events).not.toContain('volumechange');
    expect(media.readyState).toBeGreaterThanOrEqual(1);
    media.detach();
  });

  it('reports duration and position from playback updates', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const durationChange = vi.fn();
    const timeUpdate = vi.fn();

    media.addEventListener('durationchange', durationChange);
    media.addEventListener('timeupdate', timeUpdate);

    // Milliseconds on the wire, seconds on the host.
    controller.update({ duration: 90_000, position: 5_000 });

    expect(media.duration).toBe(90);
    expect(media.currentTime).toBe(5);
    expect(durationChange).toHaveBeenCalledTimes(1);
    expect(timeUpdate).toHaveBeenCalledTimes(1);
    expect(media.seekable.end(0)).toBe(90);
    expect(media.buffered.end(0)).toBe(5);
    media.detach();
  });

  it('translates playback updates into play, waiting, playing, and pause', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['play', 'waiting', 'playing', 'pause'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    // The embed reports a stall as buffering while still flagged paused.
    controller.update({ isPaused: true, isBuffering: true });
    expect(events).toEqual(['play', 'waiting']);
    expect(media.paused).toBe(false);

    controller.update({ isPaused: false, isBuffering: false });
    expect(events).toEqual(['play', 'waiting', 'playing']);
    expect(media.readyState).toBe(3);

    // Repeating the same state is not a transition.
    controller.update({ isPaused: false, isBuffering: false, position: 1_000 });
    expect(events).toEqual(['play', 'waiting', 'playing']);

    controller.update({ isPaused: true, position: 1_000 });
    expect(events).toEqual(['play', 'waiting', 'playing', 'pause']);
    expect(media.paused).toBe(true);
    media.detach();
  });

  it('reports a stall after playback started as waiting rather than as a pause', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const events: string[] = [];

    for (const type of ['play', 'waiting', 'playing', 'pause'] as const) {
      media.addEventListener(type, () => events.push(type));
    }

    controller.update({ isPaused: false, position: 1_000 });
    expect(events).toEqual(['play', 'playing']);

    // The embed reports a mid-run stall as buffering while still flagged paused.
    controller.update({ isPaused: true, isBuffering: true, position: 2_000 });
    expect(events).toEqual(['play', 'playing', 'waiting']);
    expect(media.paused).toBe(false);

    // Coming back from a stall resumes the run rather than starting a new one.
    controller.update({ isPaused: false, position: 2_000 });
    expect(events).toEqual(['play', 'playing', 'waiting', 'playing']);
    media.detach();
  });

  it('reports a pause the listener asked for even while the embed is buffering', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const pause = vi.fn();

    media.addEventListener('pause', pause);
    controller.update({ isPaused: false, position: 1_000 });

    media.pause();
    controller.update({ isPaused: true, isBuffering: true, position: 1_000 });

    expect(pause).toHaveBeenCalledTimes(1);
    expect(media.paused).toBe(true);
    media.detach();
  });

  it('forwards play() and pause() to the controller', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    await media.play();
    // `resume()` keeps the position; `play()` would restart the entity.
    expect(controller.resume).toHaveBeenCalledTimes(1);
    expect(controller.play).not.toHaveBeenCalled();

    media.pause();
    expect(controller.pause).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('starts playback on load when autoplay is set', async () => {
    const media = new SpotifyAdapter();

    media.autoplay = true;
    const { controller } = await attachAndLoad(media);

    await vi.waitFor(() => {
      if (!controller.resume.mock.calls.length) throw new Error('playback not started yet');
    });
    media.detach();
  });

  it('seeks and reports the requested position before the embed catches up', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const seeking = vi.fn();
    const seeked = vi.fn();

    media.addEventListener('seeking', seeking);
    media.addEventListener('seeked', seeked);

    media.currentTime = 30;
    expect(media.currentTime).toBe(30);
    expect(media.seeking).toBe(true);
    expect(seeking).toHaveBeenCalledTimes(1);

    // The seek defers via the loadComplete microtask — flush.
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.seek).toHaveBeenCalledWith(30);

    controller.update({ isPaused: false, position: 31_000 });
    expect(media.seeking).toBe(false);
    expect(seeked).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('keeps the requested position until the embed reports the seek landed', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const seeked = vi.fn();

    media.addEventListener('seeked', seeked);
    controller.update({ isPaused: false, position: 10_000, duration: 60_000 });

    media.currentTime = 30;

    // The embed goes on reporting where it was playing until the seek takes.
    controller.update({ isPaused: false, position: 10_000, duration: 60_000 });
    expect(media.currentTime).toBe(30);
    expect(media.seeking).toBe(true);
    expect(seeked).not.toHaveBeenCalled();

    controller.update({ isPaused: false, position: 30_000, duration: 60_000 });
    expect(media.seeking).toBe(false);
    expect(media.currentTime).toBe(30);
    expect(seeked).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('completes a seek that lands on exactly the position it asked for', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const seeked = vi.fn();

    media.addEventListener('seeked', seeked);

    // Paused, the position stops moving once the seek lands, so a snapshot at the
    // requested position is the only one that will ever report it.
    media.currentTime = 30;
    controller.update({ isPaused: true, position: 30_000, duration: 60_000 });

    expect(media.seeking).toBe(false);
    expect(seeked).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('ends playback when the position catches up with the duration', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const ended = vi.fn();

    media.addEventListener('ended', ended);

    controller.update({ isPaused: false, position: 0, duration: 60_000 });
    // Positions arrive about once a second, so the last one lands short of the end.
    controller.update({ isPaused: false, position: 59_500, duration: 60_000 });

    expect(ended).toHaveBeenCalledTimes(1);
    expect(media.ended).toBe(true);
    expect(media.paused).toBe(true);
    expect(controller.pause).toHaveBeenCalled();

    // The position stops moving there; the end is only reported once.
    controller.update({ isPaused: true, position: 59_500, duration: 60_000 });
    expect(ended).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('seeks back instead of ending when loop is set', async () => {
    const media = new SpotifyAdapter();

    media.loop = true;
    const { controller } = await attachAndLoad(media);
    const ended = vi.fn();

    media.addEventListener('ended', ended);

    controller.update({ isPaused: false, position: 0, duration: 60_000 });
    controller.update({ isPaused: false, position: 59_500, duration: 60_000 });
    await Promise.resolve();
    await Promise.resolve();

    expect(ended).not.toHaveBeenCalled();
    expect(controller.seek).toHaveBeenCalledWith(1);
    media.detach();
  });

  it('restarts instead of resuming when playback starts again after the end', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const play = vi.fn();

    media.addEventListener('play', play);

    controller.update({ isPaused: false, position: 0, duration: 60_000 });
    controller.update({ isPaused: false, position: 59_500, duration: 60_000 });
    expect(media.ended).toBe(true);
    play.mockClear();

    // The embed sits at the end, where resuming has nothing left to play, so this
    // update is spent seeking back rather than reported as playback.
    controller.update({ isPaused: false, position: 59_500, duration: 60_000 });
    expect(play).not.toHaveBeenCalled();
    await Promise.resolve();
    await Promise.resolve();
    expect(controller.seek).toHaveBeenCalledWith(1);

    controller.update({ isPaused: false, position: 1_000, duration: 60_000 });
    expect(play).toHaveBeenCalledTimes(1);
    expect(media.ended).toBe(false);
    media.detach();
  });

  it('restarts after the end even when a trailing update advances the position', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const ended = vi.fn();

    media.addEventListener('ended', ended);

    controller.update({ isPaused: false, position: 0, duration: 60_000 });
    controller.update({ isPaused: false, position: 59_500, duration: 60_000 });
    expect(ended).toHaveBeenCalledTimes(1);

    // The end is inferred a tick early, so the embed has one more position to
    // report before it stops — one that is still the end of the same run.
    controller.update({ isPaused: true, position: 60_000, duration: 60_000 });

    controller.update({ isPaused: false, position: 60_000, duration: 60_000 });
    await flushDeferredEmbed();
    expect(controller.seek).toHaveBeenCalledWith(1);
    expect(ended).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('clears ended when a seek moves back inside the entity', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    controller.update({ isPaused: false, position: 0, duration: 60_000 });
    controller.update({ isPaused: false, position: 59_500, duration: 60_000 });
    expect(media.ended).toBe(true);

    media.currentTime = 10;

    expect(media.ended).toBe(false);
    media.detach();
  });

  it('clears ended when the embed reports a position back inside the entity', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    controller.update({ isPaused: false, position: 0, duration: 60_000 });
    controller.update({ isPaused: false, position: 59_500, duration: 60_000 });
    expect(media.ended).toBe(true);

    // Scrubbing the embed's own control reports a position without a seek of ours.
    controller.update({ isPaused: true, position: 10_000, duration: 60_000 });

    expect(media.ended).toBe(false);
    media.detach();
  });

  it('does not end against a duration the embed has not resolved', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);
    const ended = vi.fn();

    media.addEventListener('ended', ended);

    // An update that carries no duration at all, then one that reports the entity
    // as still being worked out. Every position is at or past both.
    controller.update({ isPaused: false, position: 0, duration: Number.NaN });
    controller.update({ isPaused: false, position: 1_000, duration: Number.NaN });
    controller.update({ isPaused: false, position: 2_000, duration: 0 });

    expect(ended).not.toHaveBeenCalled();
    expect(media.ended).toBe(false);
    expect(media.paused).toBe(false);
    media.detach();
  });

  it('offers no volume or mute surface', () => {
    // The embed takes neither command and reports neither value. Absent members
    // read as an incapable media, where inert ones would have the player render a
    // volume slider and a mute button that do nothing.
    const media = new SpotifyAdapter() as Partial<Video>;

    expect(media.volume).toBeUndefined();
    expect(media.muted).toBeUndefined();
    expect(media.defaultMuted).toBeUndefined();
    expect(isMediaVolumeCapable(media)).toBe(false);
  });

  it('loads the new entity by URI when src changes after attach', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    media.src = EPISODE_URL;
    await Promise.resolve();

    expect(controller.loadUri).toHaveBeenCalledWith('spotify:episode:7makk4oTQel546B0PZlDM5');

    // The first playback update after a reload completes the load.
    const loadCompleteSpy = vi.fn();

    media.addEventListener('loadcomplete', loadCompleteSpy);
    controller.update();
    expect(loadCompleteSpy).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('starts the new entity where its t param says when src changes after attach', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    media.src = `${EPISODE_URL}?t=30`;
    await Promise.resolve();

    // `loadUri` names the entity and nothing else, so the start position it
    // carried is the host's to apply.
    expect(controller.loadUri).toHaveBeenCalledWith('spotify:episode:7makk4oTQel546B0PZlDM5');
    expect(media.currentTime).toBe(30);

    // The first update after the reload completes the load the seek waits on.
    controller.update();
    await flushDeferredEmbed();
    expect(controller.seek).toHaveBeenCalledWith(30);
    media.detach();
  });

  it('seeks to the start position an engine option names when the entity reloads', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    media.source = { src: TRACK_URL, engine: { spotify: { t: 30 } } };
    await Promise.resolve();

    // Only the embed URL applies `t` for itself, and this reload reuses the frame,
    // so the option has to be seeked to like the one a src carries.
    expect(controller.loadUri).toHaveBeenCalledWith(`spotify:track:${TRACK_ID}`);
    expect(controller.loadUri).toHaveBeenCalledTimes(1);
    expect(media.currentTime).toBe(30);

    controller.update();
    await flushDeferredEmbed();
    expect(controller.seek).toHaveBeenCalledWith(30);
    media.detach();
  });

  it('defers the load when src changes before the controller is ready', async () => {
    const media = new SpotifyAdapter();

    media.src = TRACK_URL;
    const iframe = createIframe();

    media.attach(iframe);
    const controller = await waitForEngine(media);

    // The controller exists but has not reported readiness; loading now is dropped.
    media.src = EPISODE_URL;
    await Promise.resolve();
    expect(controller.loadUri).not.toHaveBeenCalled();

    // The deferred load replays once the controller is ready.
    controller.ready();
    await Promise.resolve();
    expect(controller.loadUri).toHaveBeenCalledWith('spotify:episode:7makk4oTQel546B0PZlDM5');
    media.detach();
  });

  it('errors and unblocks pending play() when src is unrecognized', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    const errorSpy = vi.fn();

    media.addEventListener('error', errorSpy);

    media.src = 'https://example.com/not-a-spotify-url';
    await Promise.resolve();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(media.error).toBeInstanceOf(MediaError);
    expect(media.error?.code).toBe(MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED);
    expect(controller.loadUri).not.toHaveBeenCalled();
    await expect(media.play()).resolves.toBeUndefined();
    media.detach();
  });

  it('surfaces a failed API load', async () => {
    const media = new SpotifyAdapter();

    media.src = TRACK_URL;
    // Without the global the loader falls back to the script tag, which is what
    // fails here.
    vi.stubGlobal('SpotifyIframeApi', undefined);
    vi.mocked(loadScript).mockRejectedValueOnce(new Error('offline'));
    const errorSpy = vi.fn();

    media.addEventListener('error', errorSpy);

    media.attach(createIframe());
    await vi.waitFor(() => {
      if (!errorSpy.mock.calls.length) throw new Error('error not dispatched yet');
    });

    expect(media.engine).toBe(null);
    expect(media.error?.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    // Nothing may be left waiting on an embed that is never coming.
    await expect(media.play()).resolves.toBeUndefined();
    media.detach();
  });

  it('tracks played ranges via the played-ranges mixin', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    controller.update({ isPaused: false, position: 0 });
    controller.update({ isPaused: false, position: 400 });
    controller.update({ isPaused: true, position: 400 });

    const played = media.played;

    expect(played.length).toBe(1);
    expect(played.start(0)).toBe(0);
    expect(played.end(0)).toBe(0.4);
    media.detach();
  });

  it('destroys the controller on detach', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    media.detach();

    expect(controller.destroy).toHaveBeenCalled();
    expect(media.target).toBe(null);
    expect(media.engine).toBe(null);
  });

  it('leaves the iframe it was handed in the document on detach', async () => {
    const media = new SpotifyAdapter();
    const { iframe } = await attachAndLoad(media);

    media.detach();

    // What this host leaves behind has to be the DOM it was given: React removes
    // the node it rendered when the component unmounts, and throws if something
    // else took its place.
    expect(iframe.isConnected).toBe(true);
  });

  it('tears down a controller that arrives for an attach that is gone', async () => {
    // The live API builds the controller as `createController` is called, whether
    // or not the caller is still there to be handed it, so hand it over on demand.
    const deliveries: (() => void)[] = [];

    vi.stubGlobal('SpotifyIframeApi', {
      createController: (
        target: HTMLIFrameElement,
        options: unknown,
        callback: (controller: MockController) => void
      ) => {
        const controller = new MockController(target, options);

        deliveries.push(() => callback(controller));
      },
    });

    const media = new SpotifyAdapter();

    media.src = TRACK_URL;
    const attached = createIframe();

    media.attach(attached);
    await vi.waitFor(() => {
      if (!deliveries.length) throw new Error('controller not constructed yet');
    });

    media.detach();
    deliveries[0]!();
    await flushDeferredEmbed();

    const controller = MockController.instances[0]!;

    expect(controller.destroy).toHaveBeenCalled();
    expect(media.engine).toBe(null);
    expect(attached.isConnected).toBe(true);
    expect(controller.iframeElement.isConnected).toBe(false);
  });

  it('unblocks pending play() when detached before load completes', async () => {
    const media = new SpotifyAdapter();

    media.src = TRACK_URL;
    media.attach(createIframe());

    // Await load without the controller ever becoming ready.
    const pending = media.play();

    media.detach();

    await expect(pending).resolves.toBeUndefined();
    expect(media.engine).toBe(null);
  });

  it('does not create a controller when detached before the API resolves', async () => {
    const media = new SpotifyAdapter();

    media.src = TRACK_URL;
    media.attach(createIframe());
    media.detach();

    // Flush the async controller creation path.
    await flushDeferredEmbed();
    await Promise.resolve();

    expect(media.engine).toBe(null);
    expect(MockController.instances.length).toBe(0);
  });

  it('ignores ready and playback callbacks from a superseded controller', async () => {
    const media = new SpotifyAdapter();

    media.src = TRACK_URL;
    const { controller: stale } = await attachAndLoad(media);

    media.detach();
    const { controller: current } = await attachAndLoad(media);

    expect(current).not.toBe(stale);

    const playSpy = vi.fn();

    media.addEventListener('play', playSpy);

    // The iframe API keeps invoking callbacks it already scheduled for the
    // destroyed controller; none of them may touch the new session's state.
    stale.ready();
    stale.update({ isPaused: false, position: 5_000 });

    expect(playSpy).not.toHaveBeenCalled();
    expect(media.paused).toBe(true);
    expect(media.currentTime).toBe(0);
    media.detach();
  });

  it('unblocks waiters from a superseded load when a reload starts first', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    // Start a second load and wait on its barrier without ever completing it.
    media.src = EPISODE_URL;
    const pending = media.play();

    // A third load takes over; the waiter above must not be stranded on the
    // barrier it already captured.
    media.src = `spotify:album:${TRACK_ID}`;

    await expect(pending).resolves.toBeUndefined();
    expect(controller.loadUri).toHaveBeenLastCalledWith(`spotify:album:${TRACK_ID}`);
    media.detach();
  });
});

describe('SpotifyAdapter source', () => {
  it('derives src from a structured source and announces the change', () => {
    const media = new SpotifyAdapter();
    const sourceChange = vi.fn();

    media.addEventListener('sourcechange', sourceChange);

    media.source = { src: TRACK_URL };

    expect(media.src).toBe(TRACK_URL);
    expect(sourceChange).toHaveBeenCalledTimes(1);
  });

  it('re-derives source from src, carrying Spotify embed options over', () => {
    const media = new SpotifyAdapter();

    media.source = { src: TRACK_URL, engine: { spotify: { theme: 0 } } };

    media.src = EPISODE_URL;

    expect(media.source).toEqual({ engine: { spotify: { theme: 0 } }, src: EPISODE_URL });
  });

  it('rebuilds the embed when only Spotify embed options change', async () => {
    const media = new SpotifyAdapter();
    const { iframe, controller } = await attachAndLoad(media);

    media.source = { src: TRACK_URL, engine: { spotify: { theme: 0 } } };
    await Promise.resolve();

    // The theme is only ever read off the embed URL, so the controller has no way
    // to apply it and the frame has to be rebuilt.
    expect(iframe.getAttribute('src')).toContain('theme=0');
    expect(media.currentSrc).toContain('theme=0');
    expect(controller.loadUri).not.toHaveBeenCalled();
    media.detach();
  });

  it('rebuilds the embed at the video path when the source prefers video', async () => {
    const media = new SpotifyAdapter();
    const { iframe } = await attachAndLoad(media);

    media.source = { src: EPISODE_URL, engine: { spotify: { preferVideo: true } } };
    await Promise.resolve();

    // The video variant lives at its own path rather than in a parameter.
    expect(iframe.getAttribute('src')).toContain('/embed/episode/7makk4oTQel546B0PZlDM5/video');
    media.detach();
  });

  it('rebuilds the embed for a new entity while the source prefers video', async () => {
    const media = new SpotifyAdapter();

    media.source = { src: EPISODE_URL, engine: { spotify: { preferVideo: true } } };
    const { iframe, controller } = await attachAndLoad(media);

    media.source = { src: OTHER_EPISODE_URL, engine: { spotify: { preferVideo: true } } };
    await Promise.resolve();

    // `loadUri` names an entity and nothing else, so reusing the frame would leave
    // the video embed playing the audio variant of the new episode.
    expect(iframe.getAttribute('src')).toBe(`https://open.spotify.com/embed/episode/${OTHER_EPISODE_ID}/video`);
    expect(controller.loadUri).not.toHaveBeenCalled();
    media.detach();
  });

  it('serializes Spotify embed options onto the initial iframe src', () => {
    const media = new SpotifyAdapter();

    media.source = { src: TRACK_URL, engine: { spotify: { theme: 0 } } };
    const iframe = createIframe();

    media.attach(iframe);

    expect(iframe.src).toContain('theme=0');
    media.detach();
  });

  it('clears src when the source is set to null', () => {
    const media = new SpotifyAdapter();

    media.source = { src: TRACK_URL };

    media.source = null;

    expect(media.src).toBe('');
    expect(media.source).toBe(null);
  });

  it('stops the embed and resets state when the source is cleared', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    controller.update({ isPaused: false, position: 5_000, duration: 60_000 });
    expect(media.duration).toBe(60);

    media.source = null;
    await Promise.resolve();

    // Left running, the embed keeps playing and its updates write state back.
    expect(controller.pause).toHaveBeenCalled();
    expect(media.duration).toBeNaN();
    expect(media.currentTime).toBe(0);
    expect(media.paused).toBe(true);
    await expect(media.play()).resolves.toBeUndefined();
    media.detach();
  });

  it('announces the reset when the source is cleared', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    controller.update({ isPaused: false, position: 5_000, duration: 60_000 });

    const emptied = vi.fn();

    media.addEventListener('emptied', emptied);
    media.source = null;
    await Promise.resolve();

    // The embed is paused and its updates are ignored from here, so nothing else
    // is coming to say the last entity's duration and buffer are gone.
    expect(emptied).toHaveBeenCalledTimes(1);
    media.detach();
  });

  it('does not play a source that was cleared', async () => {
    const media = new SpotifyAdapter();
    const { controller } = await attachAndLoad(media);

    media.source = null;
    await Promise.resolve();
    controller.resume.mockClear();
    await media.play();

    expect(controller.resume).not.toHaveBeenCalled();
    media.detach();
  });

  it('unblocks pending play() when the source is cleared before the controller is ready', async () => {
    const media = new SpotifyAdapter();

    media.src = TRACK_URL;
    const iframe = createIframe();

    media.attach(iframe);
    const controller = await waitForEngine(media);

    // Setting src while the controller is still loading defers the load, so the
    // clear below is what the replay on ready has to cope with. Nothing else
    // settles the barrier `attach()` opened.
    media.src = EPISODE_URL;
    media.source = null;
    const pending = media.play();

    controller.ready();

    await expect(pending).resolves.toBeUndefined();
    media.detach();
  });
});

/**
 * Runs last: it settles the module-level API promise that every test above bypasses through the `SpotifyIframeApi`
 * global, and nothing can unsettle it.
 */
describe('loadSpotifyIframeApi', () => {
  it('passes the API on to a ready callback the host page installed', async () => {
    // Without the global the loader goes through the script tag and the callback
    // Spotify's own tutorial tells pages to define.
    vi.stubGlobal('SpotifyIframeApi', undefined);
    const hostReady = vi.fn();

    vi.stubGlobal('onSpotifyIframeApiReady', hostReady);

    const media = new SpotifyAdapter();

    media.src = TRACK_URL;
    media.attach(createIframe());

    const globals = globalThis as { onSpotifyIframeApiReady?: (api: unknown) => void };
    const ready = globals.onSpotifyIframeApiReady;

    expect(ready).not.toBe(hostReady);
    const api = {
      createController: (target: HTMLIFrameElement, options: unknown, callback: (controller: MockController) => void) =>
        callback(new MockController(target, options)),
    };

    ready?.(api);

    await waitForEngine(media);
    // The loader script fires the global once and a second tag does nothing, so a
    // page that defined it first would never hear about the API again.
    expect(hostReady).toHaveBeenCalledTimes(1);
    expect(hostReady.mock.calls[0]?.[0]).toBe(api);
    media.detach();
  });
});
