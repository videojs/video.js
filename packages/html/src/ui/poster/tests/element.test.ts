import type { AnyPlayerStore, PlayerTarget } from '@videojs/core/dom';
import { metadataFeature, playbackFeature, setPlayerConfigValue } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import { combine, createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { PosterElement } from '../element';

function ensureDefined(ctor: CustomElementConstructor & { readonly tagName: string }): void {
  if (!customElements.get(ctor.tagName)) customElements.define(ctor.tagName, ctor);
}

/** Set the user poster the way a provider element does, through the feature's config. */
function setUserPoster(store: object, value: string | null): void {
  setPlayerConfigValue(store, metadataFeature.config!.poster, value);
}

class TestProviderElement extends UIElement {
  static readonly tagName = 'test-poster-provider';

  readonly store = createStore<PlayerTarget>()(combine(playbackFeature, metadataFeature)) as unknown as AnyPlayerStore;

  readonly #provider = new ContextProvider(this, { context: playerContext, initialValue: this.store });

  override connectedCallback(): void {
    super.connectedCallback();
    this.#provider.setValue(this.store);
  }
}

interface Harness {
  poster: PosterElement;
  /** The image the skin supplies as its poster slot's fallback content. */
  skinImage: HTMLImageElement;
  /** Whatever the author slotted, if anything. */
  authorImage: HTMLImageElement | null;
  host: HTMLElement;
  setPoster(value: string | null): Promise<void>;
  start(): Promise<void>;
  settle(): Promise<void>;
}

/**
 * Mounts the poster the way a skin does: inside a shadow root that forwards its own `<slot name="poster">` into the
 * element, carrying a plain image as that slot's fallback content.
 */
async function mount(options: { authorMarkup?: string } = {}): Promise<Harness> {
  ensureDefined(TestProviderElement);
  ensureDefined(PosterElement);

  const provider = document.createElement(TestProviderElement.tagName) as TestProviderElement;

  document.body.appendChild(provider);

  const skin = provider.attachShadow({ mode: 'open' });
  const tag = PosterElement.tagName;

  skin.innerHTML = `<${tag}><slot name="poster"><img alt="" decoding="async"></slot></${tag}>`;
  const poster = skin.querySelector(tag) as PosterElement;

  if (options.authorMarkup) {
    provider.innerHTML = options.authorMarkup;

    // happy-dom never fetches, so it calls an image carrying a source `complete`
    // with nothing decoded — what a browser reports for one that failed. These
    // are mid-fetch, and say so before the element reads them. An image sourced
    // by a `<picture>` is left as it is: a browser calls that one complete too.
    for (const img of provider.querySelectorAll('img[src], img[srcset]')) {
      Object.defineProperty(img, 'complete', { value: false, configurable: true });
    }
  }

  const video = document.createElement('video');

  provider.store.attach({ media: video, container: null });

  await poster.updateComplete;

  const settle = async () => {
    poster.requestUpdate();
    await poster.updateComplete;
  };

  return {
    poster,
    host: provider,
    skinImage: skin.querySelector('img') as HTMLImageElement,
    authorImage: provider.querySelector('img'),
    settle,
    async setPoster(value) {
      setUserPoster(provider.store, value);
      await settle();
    },
    async start() {
      Object.defineProperty(video, 'paused', { value: false, configurable: true });
      video.dispatchEvent(new Event('play'));
      await settle();
    },
  };
}

/** Stand in for a fetch happy-dom never performs. */
function reportLoad(img: HTMLImageElement): void {
  img.dispatchEvent(new Event('load'));
}

function reportError(img: HTMLImageElement): void {
  img.dispatchEvent(new Event('error'));
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('PosterElement', () => {
  it('sets its fallback image aside while a skin supplies one', async () => {
    const { poster, skinImage, setPoster } = await mount();

    await setPoster('poster.jpg');

    expect(poster.shadowRoot!.querySelector('img')).toBeNull();
    expect(skinImage.getAttribute('src')).toBe('poster.jpg');
  });

  it('fills a fallback image of its own when none is supplied', async () => {
    ensureDefined(TestProviderElement);
    ensureDefined(PosterElement);

    const provider = document.createElement(TestProviderElement.tagName) as TestProviderElement;

    provider.innerHTML = `<${PosterElement.tagName}></${PosterElement.tagName}>`;
    document.body.appendChild(provider);

    const poster = provider.querySelector(PosterElement.tagName) as PosterElement;

    provider.store.attach({ media: document.createElement('video'), container: null });
    setUserPoster(provider.store, 'poster.jpg');

    const fallback = poster.shadowRoot!.querySelector('img')!;

    // The player context resolves a tick after connect.
    await vi.waitFor(() => expect(fallback.getAttribute('src')).toBe('poster.jpg'));

    expect(fallback.getAttribute('part')).toBe('image');
    expect(fallback.getAttribute('alt')).toBe('');
    expect(poster.hasAttribute('data-loading')).toBe(true);
  });

  it('picks up a plain child image, including one added after mount', async () => {
    ensureDefined(TestProviderElement);
    ensureDefined(PosterElement);

    const provider = document.createElement(TestProviderElement.tagName) as TestProviderElement;

    provider.innerHTML = `<${PosterElement.tagName}></${PosterElement.tagName}>`;
    document.body.appendChild(provider);

    const poster = provider.querySelector(PosterElement.tagName) as PosterElement;

    provider.store.attach({ media: document.createElement('video'), container: null });
    setUserPoster(provider.store, 'poster.jpg');
    await poster.updateComplete;
    // Settle every update the mount itself scheduled, so the only one left to
    // observe is the image's arrival.
    await new Promise((resolve) => setTimeout(resolve, 0));
    await poster.updateComplete;

    const fallback = poster.shadowRoot!.querySelector('img')!;

    expect(fallback.getAttribute('src')).toBe('poster.jpg');

    // No slot is involved here, so nothing announces the image arriving.
    const image = document.createElement('img');

    image.alt = '';
    poster.appendChild(image);

    await vi.waitFor(() => expect(image.getAttribute('src')).toBe('poster.jpg'));

    // The fallback steps out of the tree rather than sitting hidden beside
    // the supplied image, and stops downloading what it was pointed at.
    expect(fallback.isConnected).toBe(false);
    expect(fallback.hasAttribute('src')).toBe(false);
  });

  it('withholds the src until one resolves, so nothing is fetched', async () => {
    const { skinImage } = await mount();

    expect(skinImage.hasAttribute('src')).toBe(false);
  });

  it('clears the src when the poster goes away', async () => {
    const { skinImage, setPoster } = await mount();

    await setPoster('poster.jpg');
    await setPoster(null);

    expect(skinImage.hasAttribute('src')).toBe(false);
  });

  it('leaves an image that came with its own src alone', async () => {
    const { authorImage, setPoster } = await mount({
      authorMarkup: '<img slot="poster" src="author.jpg" alt="Keynote speaker">',
    });

    await setPoster('poster.jpg');

    expect(authorImage!.getAttribute('src')).toBe('author.jpg');
  });

  it('leaves an image described only by srcset alone', async () => {
    const { authorImage, setPoster } = await mount({
      authorMarkup: '<img slot="poster" srcset="author-480.jpg 480w" sizes="100vw" alt="">',
    });

    await setPoster('poster.jpg');

    expect(authorImage!.hasAttribute('src')).toBe(false);
  });

  it('fills an image the author supplied bare, so a hand-authored layout can lean on the store', async () => {
    const { authorImage, setPoster } = await mount({ authorMarkup: '<img slot="poster" alt="">' });

    await setPoster('poster.jpg');

    expect(authorImage!.getAttribute('src')).toBe('poster.jpg');
  });

  it('finds the image inside a picture and leaves it to its own candidates', async () => {
    const { host, setPoster } = await mount({
      authorMarkup: `
        <picture slot="poster">
          <source srcset="author.webp" type="image/webp">
          <img alt="">
        </picture>`,
    });

    await setPoster('poster.jpg');

    expect(host.querySelector('picture img')!.hasAttribute('src')).toBe(false);
  });

  it('releases the src it set when the author takes the image over', async () => {
    const { host, skinImage, setPoster, settle } = await mount();

    await setPoster('poster.jpg');
    expect(skinImage.getAttribute('src')).toBe('poster.jpg');

    // Slotting an image displaces the skin's fallback, which must not keep
    // downloading what we pointed it at.
    host.innerHTML = '<img slot="poster" src="author.jpg" alt="">';
    await settle();

    expect(skinImage.hasAttribute('src')).toBe(false);
  });

  it('takes back over when the author removes their image', async () => {
    const { host, skinImage, setPoster, settle } = await mount({
      authorMarkup: '<img slot="poster" src="author.jpg" alt="">',
    });

    await setPoster('poster.jpg');
    expect(skinImage.hasAttribute('src')).toBe(false);

    host.replaceChildren();
    await settle();

    expect(skinImage.getAttribute('src')).toBe('poster.jpg');
  });

  it('hides once playback starts', async () => {
    const { poster, setPoster, start } = await mount();

    await setPoster('poster.jpg');
    expect(poster.hasAttribute('data-visible')).toBe(true);

    await start();

    expect(poster.hasAttribute('data-visible')).toBe(false);
  });

  it('reports the image lifecycle on the host, where a selector can reach it', async () => {
    const { poster, skinImage, setPoster } = await mount();

    expect(poster.hasAttribute('data-loading')).toBe(false);

    await setPoster('poster.jpg');
    expect(poster.hasAttribute('data-loading')).toBe(true);
    expect(poster.hasAttribute('data-loaded')).toBe(false);

    reportLoad(skinImage);
    await poster.updateComplete;

    expect(poster.hasAttribute('data-loaded')).toBe(true);
    expect(poster.hasAttribute('data-loading')).toBe(false);
  });

  it('reports an image that failed', async () => {
    const { poster, skinImage, setPoster } = await mount();

    await setPoster('missing.jpg');
    reportError(skinImage);
    await poster.updateComplete;

    expect(poster.hasAttribute('data-error')).toBe(true);
    expect(poster.hasAttribute('data-loaded')).toBe(false);
  });

  it("reports a picture whose candidate had already loaded, which `complete` can't tell it", async () => {
    const { poster, host, settle } = await mount();

    const picture = document.createElement('picture');

    picture.setAttribute('slot', 'poster');
    const source = document.createElement('source');

    source.setAttribute('srcset', 'author.webp');
    const img = document.createElement('img');

    // Decoded before we started listening, so no `load` is coming.
    Object.defineProperty(img, 'naturalWidth', { value: 1280 });
    picture.append(source, img);
    host.appendChild(picture);
    await settle();

    expect(poster.hasAttribute('data-loaded')).toBe(true);
    expect(poster.hasAttribute('data-loading')).toBe(false);
  });

  it('reports an image that had already failed before it was adopted', async () => {
    const { poster, host, settle } = await mount();

    // A cached failure: complete, nothing decoded, and `error` already spent.
    const failed = document.createElement('img');

    failed.setAttribute('slot', 'poster');
    failed.setAttribute('src', 'missing.jpg');
    Object.defineProperty(failed, 'complete', { value: true });
    Object.defineProperty(failed, 'naturalWidth', { value: 0 });
    host.appendChild(failed);
    await settle();

    expect(poster.hasAttribute('data-error')).toBe(true);
    expect(poster.hasAttribute('data-loading')).toBe(false);
  });

  it('reports the lifecycle of an image it does not own, so the blur-up covers it too', async () => {
    const { poster, authorImage } = await mount({
      authorMarkup: '<img slot="poster" src="author.jpg" alt="">',
    });

    expect(poster.hasAttribute('data-loading')).toBe(true);

    reportLoad(authorImage!);
    await poster.updateComplete;

    expect(poster.hasAttribute('data-loaded')).toBe(true);
  });

  it("reports a picture's candidates as a download to wait for", async () => {
    const { poster, host } = await mount({
      authorMarkup: `
        <picture slot="poster">
          <source srcset="author.webp" type="image/webp">
          <img alt="">
        </picture>`,
    });

    const img = host.querySelector('picture img') as HTMLImageElement;

    // Omitting both `src` and `srcset` makes an image `complete` on its own
    // terms, mid-fetch or not, so its state says nothing about the candidate.
    expect(img.complete).toBe(true);
    expect(img.naturalWidth).toBe(0);

    // Nothing is on the `<img>` itself, but the `<source>` still loads one.
    expect(poster.hasAttribute('data-loading')).toBe(true);
    expect(poster.hasAttribute('data-error')).toBe(false);

    reportLoad(img);
    await poster.updateComplete;

    expect(poster.hasAttribute('data-loaded')).toBe(true);
  });

  it('drops the load report when the poster changes', async () => {
    const { poster, skinImage, setPoster } = await mount();

    await setPoster('poster.jpg');
    reportLoad(skinImage);
    await poster.updateComplete;
    expect(poster.hasAttribute('data-loaded')).toBe(true);

    await setPoster('next.jpg');

    expect(poster.hasAttribute('data-loaded')).toBe(false);
    expect(poster.hasAttribute('data-loading')).toBe(true);
  });
});
