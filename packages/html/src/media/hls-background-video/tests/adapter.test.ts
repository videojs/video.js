import type { HlsBackgroundVideoAdapter } from '@videojs/spf/adapters/hls-background-video';
import { HlsBackgroundVideoMpegTsAdapter } from '@videojs/spf/adapters/hls-background-video-mpeg-ts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { MuxBackgroundVideo } from '../../mux-background-video';
import { HlsBackgroundVideo } from '../index';

/** SVTA 2011 — no video track this environment can play. */
const NO_SUPPORTED_VIDEO_TRACK = 2011;

beforeEach(() => {
  // The engine seeds `loadActivated: true`, so assigning `src` starts fetching
  // the manifest at once. Stubbed so these stay offline and leave no request
  // pending at teardown.
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('offline')))
  );
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

let tagCounter = 0;

function defineElement() {
  const tag = `test-hls-background-video-${++tagCounter}`;

  customElements.define(tag, class extends HlsBackgroundVideo {});
  return tag;
}

// innerHTML on a connected container so attributes are present when the constructor runs.
function create(tag: string, attrs: Record<string, string> = {}): HlsBackgroundVideo {
  const container = document.createElement('div');

  document.body.appendChild(container);
  const attrStr = Object.entries(attrs)
    .map(([k, v]) => ` ${k}="${v.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
    .join('');

  container.innerHTML = `<${tag}${attrStr}></${tag}>`;
  return container.querySelector(tag) as HlsBackgroundVideo;
}

// Attributes set after construction, as on an element created by script. happy-dom also constructs parsed elements
// before setting their attributes, so this is how opt-outs reach these tests either way.
function createWith<T extends HTMLElement>(Base: new () => T, attrs: Record<string, string>): T {
  const tag = `test-created-${++tagCounter}`;

  customElements.define(tag, class extends (Base as new () => HTMLElement) {});

  const element = document.createElement(tag) as T;

  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);

  document.body.appendChild(element);

  return element;
}

/** The Media the element registers, which is what the engine hangs off. */
function mediaOf(element: HlsBackgroundVideo) {
  return element.getMediaTarget() as unknown as HlsBackgroundVideoAdapter;
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('HlsBackgroundVideo', () => {
  it('renders a video into its shadow root', () => {
    const element = create(defineElement());

    expect(element.video).toBeInstanceOf(HTMLVideoElement);
  });

  it('exposes the inner video as target', () => {
    const element = create(defineElement());

    expect(element.target).toBe(element.shadowRoot!.querySelector('video'));
    expect(element.video).toBe(element.target);
  });

  it('forces the ambient playback attributes onto the inner video', () => {
    // The whole point of the element: no nomuted/noloop/noautoplay opt-outs.
    const { video } = create(defineElement());

    expect(video?.hasAttribute('muted')).toBe(true);
    expect(video?.hasAttribute('loop')).toBe(true);
    expect(video?.hasAttribute('autoplay')).toBe(true);
    expect(video?.hasAttribute('playsinline')).toBe(true);
    // Set as a property too — an attribute set post-createElement doesn't take,
    // and without it autoplay is refused.
    expect(video?.muted).toBe(true);
  });

  it('turns autoplay off with noautoplay, keeping muted and loop', () => {
    const { target } = createWith(HlsBackgroundVideo, { noautoplay: '' });

    expect(target?.autoplay).toBe(false);
    expect(target?.hasAttribute('autoplay')).toBe(false);
    expect(target?.muted).toBe(true);
    expect(target?.loop).toBe(true);
  });

  it('turns looping off with noloop', () => {
    const { target } = createWith(HlsBackgroundVideo, { noloop: '' });

    expect(target?.loop).toBe(false);
    expect(target?.autoplay).toBe(true);
  });

  it('ignores nomuted', () => {
    const { target } = createWith(HlsBackgroundVideo, { nomuted: '' });

    expect(target?.muted).toBe(true);
  });

  it('mirrors crossorigin onto the inner video as it changes, but not preload', () => {
    const element = create(defineElement());

    element.setAttribute('crossorigin', 'use-credentials');
    element.setAttribute('preload', 'none');

    expect(element.target?.getAttribute('crossorigin')).toBe('use-credentials');
    expect(element.target?.preload).toBe('auto');

    element.removeAttribute('crossorigin');

    expect(element.target?.hasAttribute('crossorigin')).toBe(false);
  });

  it('reads src from the attribute', () => {
    const element = create(defineElement(), { src: 'https://example.com/v.m3u8' });

    expect(element.src).toBe('https://example.com/v.m3u8');
  });

  it('tracks src when the attribute changes', () => {
    const element = create(defineElement(), { src: 'https://example.com/v.m3u8' });

    element.setAttribute('src', 'https://example.com/v2.m3u8');

    expect(element.src).toBe('https://example.com/v2.m3u8');
  });

  it('clears src when the attribute is removed', () => {
    const element = create(defineElement(), { src: 'https://example.com/v.m3u8' });

    element.removeAttribute('src');

    expect(element.src).toBe('');
  });

  it('keeps the params that narrow the manifest', () => {
    // Capping is a query param rather than an attribute, so it has to survive
    // the round trip through the element untouched.
    const src = 'https://stream.mux.com/PLAYBACK_ID.m3u8?max_resolution=720p';
    const element = create(defineElement(), { src });

    expect(element.src).toBe(src);
  });

  it('observes src, the playback defaults, the noloop / noautoplay opt-outs, and the passthrough attributes', () => {
    // `max-resolution` is a URL param, `preload` means nothing to an engine that
    // loads immediately, and `audio` / `debug` from the package this replaces are
    // gone for good.
    expect(HlsBackgroundVideo.observedAttributes).toEqual([
      'src',
      'loop',
      'autoplay',
      'noloop',
      'noautoplay',
      'controls',
      'controlslist',
      'crossorigin',
    ]);
  });

  // The engine's reported sequence is the only failure signal this composition
  // has: an unplayable source leaves the inner <video> at readyState 0 with
  // `error` null, so nothing here can be read off the element it renders into.
  describe('error surface', () => {
    it('exposes no error before anything is reported', () => {
      expect(create(defineElement()).error).toBeNull();
    });

    it('re-fires the Media error as its own, and exposes the condition', async () => {
      const element = create(defineElement());
      const fired: Event[] = [];

      element.addEventListener('error', (event) => fired.push(event));

      mediaOf(element).engine.state.errors.set([{ code: NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      expect(fired).toHaveLength(1);
      expect(fired[0]?.target).toBe(element);
      expect(element.error?.code).toBe(NO_SUPPORTED_VIDEO_TRACK);
      // The condition never reached the inner video, which is why the element
      // has a surface of its own.
      expect(element.video?.error).toBeFalsy();
    });

    it('follows a cleared media error', async () => {
      const element = create(defineElement());

      mediaOf(element).engine.state.errors.set([{ code: NO_SUPPORTED_VIDEO_TRACK }]);
      await flush();

      expect(element.error?.code).toBe(NO_SUPPORTED_VIDEO_TRACK);

      mediaOf(element).engine.state.errors.set(undefined);
      await flush();

      expect(element.error).toBeNull();
    });
  });

  describe('teardown', () => {
    it('releases its engine a microtask after it is removed', async () => {
      const element = create(defineElement());
      const destroy = vi.spyOn(mediaOf(element).engine, 'destroy');

      element.remove();
      await flush();

      expect(destroy).toHaveBeenCalledOnce();
    });

    it('releases its engine when only an ancestor has keep-alive', async () => {
      const player = document.createElement('div');
      const element = document.createElement(defineElement()) as HlsBackgroundVideo;
      const destroy = vi.spyOn(mediaOf(element).engine, 'destroy');

      player.setAttribute('keep-alive', '');
      player.append(element);
      document.body.append(player);
      player.remove();
      await flush();

      expect(destroy).toHaveBeenCalledOnce();
    });

    it('keeps its engine with keep-alive until adapter.destroy()', async () => {
      const element = create(defineElement(), { 'keep-alive': '' });
      const destroy = vi.spyOn(mediaOf(element).engine, 'destroy');

      element.remove();
      await flush();

      expect(destroy).not.toHaveBeenCalled();

      element.adapter.destroy();

      expect(element.adapter).toBe(mediaOf(element));
      expect(destroy).toHaveBeenCalledOnce();
    });
  });

  it('is what <mux-background-video> extends, with the MPEG-TS Media in place of the HLS one', () => {
    // A subclass over the MPEG-TS Media, so there is one element implementation to test rather than two.
    expect(Object.getPrototypeOf(MuxBackgroundVideo)).toBe(HlsBackgroundVideo);
    expect(MuxBackgroundVideo.Adapter).toBe(HlsBackgroundVideoMpegTsAdapter);
    expect(MuxBackgroundVideo.Adapter).not.toBe(HlsBackgroundVideo.Adapter);
  });
});
