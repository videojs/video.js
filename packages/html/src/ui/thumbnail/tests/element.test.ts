import type { AnyPlayerStore } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaTextTrackState, MediaThumbnailsTrack } from '@videojs/media';
import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { ThumbnailElement } from '../element';

function createTextTrackStore(crossOrigin: MediaThumbnailsTrack['crossOrigin']): AnyPlayerStore {
  return createStore<unknown>()<MediaTextTrackState>({
    name: 'textTrack',
    state: () => ({
      chaptersCues: [],
      thumbnailsTrack: { cues: [], src: null, crossOrigin },
      textTrackList: [],
      subtitlesShowing: false,
      toggleSubtitles: vi.fn(),
      selectSubtitlesTrack: vi.fn(),
    }),
  }) as unknown as AnyPlayerStore;
}

class TestPlayerProviderElement extends UIElement {
  readonly #provider = new ContextProvider(this, { context: playerContext });

  setStore(store: AnyPlayerStore): void {
    this.#provider.setValue(store);
  }
}

if (!customElements.get(ThumbnailElement.tagName)) {
  customElements.define(ThumbnailElement.tagName, ThumbnailElement);
}

if (!customElements.get('test-thumbnail-player')) {
  customElements.define('test-thumbnail-player', TestPlayerProviderElement);
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * Mount a thumbnail inside a player reporting the given media CORS mode and return the `crossorigin` attribute its
 * inner `<img>` settles on. The player context resolves a frame after connect, so settle across a few updates rather
 * than reading the first one.
 */
async function renderCrossOrigin(
  mediaCrossOrigin: MediaThumbnailsTrack['crossOrigin'],
  configure?: (el: ThumbnailElement) => void
): Promise<string | null> {
  const provider = document.createElement('test-thumbnail-player') as TestPlayerProviderElement;
  const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
  const img = document.createElement('img');

  configure?.(thumbnail);
  provider.setStore(createTextTrackStore(mediaCrossOrigin));
  thumbnail.append(img);
  provider.append(thumbnail);
  document.body.append(provider);

  for (let index = 0; index < 5; index++) {
    await thumbnail.updateComplete;
    await nextFrame();
  }

  return img.getAttribute('crossorigin');
}

describe('ThumbnailElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('draws a fallback image in its shadow root when none is supplied', async () => {
    const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;

    thumbnail.thumbnails = [{ url: 'thumb.jpg', startTime: 0 }];
    document.body.append(thumbnail);
    await thumbnail.updateComplete;

    const fallback = thumbnail.shadowRoot!.querySelector('img');

    expect(fallback!.getAttribute('part')).toBe('image');
    expect(fallback!.getAttribute('aria-hidden')).toBe('true');
    expect(fallback!.getAttribute('src')).toBe('thumb.jpg');
    expect(thumbnail.querySelector('img')).toBeNull();
  });

  it('uses a supplied light-DOM image in place of the fallback', async () => {
    const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
    const img = document.createElement('img');

    Object.defineProperty(img, 'complete', { value: false, configurable: true });
    thumbnail.thumbnails = [{ url: 'thumb.jpg', startTime: 0 }];
    thumbnail.append(img);
    document.body.append(thumbnail);
    await thumbnail.updateComplete;

    expect(img.getAttribute('src')).toBe('thumb.jpg');
    expect(thumbnail.shadowRoot!.querySelector('img')).toBeNull();
  });

  it('owns src and srcset on the supplied image', async () => {
    const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
    const img = document.createElement('img');

    Object.defineProperty(img, 'complete', { value: false, configurable: true });
    img.setAttribute('src', 'authored.jpg');
    img.setAttribute('srcset', 'authored-2x.jpg 2x');
    thumbnail.thumbnails = [{ url: 'thumb.jpg', startTime: 0 }];
    thumbnail.append(img);
    document.body.append(thumbnail);
    await thumbnail.updateComplete;

    expect(img.getAttribute('src')).toBe('thumb.jpg');
    expect(img.hasAttribute('srcset')).toBe(false);

    img.setAttribute('srcset', 'late-authored-2x.jpg 2x');
    await vi.waitFor(() => expect(img.hasAttribute('srcset')).toBe(false));

    thumbnail.thumbnails = [];
    await thumbnail.updateComplete;

    expect(img.hasAttribute('src')).toBe(false);
    expect(img.hasAttribute('srcset')).toBe(false);
  });

  it('adopts an image added after mount', async () => {
    const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;

    thumbnail.thumbnails = [{ url: 'thumb.jpg', startTime: 0 }];
    document.body.append(thumbnail);
    await thumbnail.updateComplete;

    const fallback = thumbnail.shadowRoot!.querySelector('img')!;

    expect(fallback.getAttribute('src')).toBe('thumb.jpg');

    const img = document.createElement('img');

    Object.defineProperty(img, 'complete', { value: false, configurable: true });
    thumbnail.append(img);

    await vi.waitFor(() => expect(img.getAttribute('src')).toBe('thumb.jpg'));
    expect(fallback.isConnected).toBe(false);
    expect(fallback.hasAttribute('src')).toBe(false);
  });

  it('adopts an image assigned to a forwarding slot after mount', async () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
    const slot = document.createElement('slot');

    slot.name = 'image';
    thumbnail.thumbnails = [{ url: 'thumb.jpg', startTime: 0 }];
    thumbnail.append(slot);
    shadow.append(thumbnail);
    document.body.append(host);
    await thumbnail.updateComplete;

    const fallback = thumbnail.shadowRoot!.querySelector('img')!;

    expect(fallback.getAttribute('src')).toBe('thumb.jpg');

    const img = document.createElement('img');

    Object.defineProperty(img, 'complete', { value: false, configurable: true });
    img.slot = 'image';
    host.append(img);

    await vi.waitFor(() => expect(img.getAttribute('src')).toBe('thumb.jpg'));
    expect(fallback.isConnected).toBe(false);

    // The image is outside the thumbnail's subtree, so its attributes are watched directly.
    img.setAttribute('srcset', 'late-authored-2x.jpg 2x');
    await vi.waitFor(() => expect(img.hasAttribute('srcset')).toBe(false));
  });

  it('binds its image again after being moved in the document', async () => {
    const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;

    thumbnail.thumbnails = [{ url: 'thumb.jpg', startTime: 0 }];
    document.body.append(thumbnail);
    await thumbnail.updateComplete;

    const fallback = thumbnail.shadowRoot!.querySelector('img')!;
    const host = document.createElement('div');

    document.body.append(host);
    host.append(thumbnail);

    // Disconnecting let go of the image; nothing but the reconnect itself brings the source back.
    expect(fallback.hasAttribute('src')).toBe(false);
    await vi.waitFor(() => expect(fallback.getAttribute('src')).toBe('thumb.jpg'));
  });

  it('draws the fallback again when the supplied image is removed', async () => {
    const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
    const img = document.createElement('img');

    Object.defineProperty(img, 'complete', { value: false, configurable: true });
    thumbnail.thumbnails = [{ url: 'thumb.jpg', startTime: 0 }];
    thumbnail.append(img);
    document.body.append(thumbnail);
    await thumbnail.updateComplete;

    img.remove();

    await vi.waitFor(() => expect(thumbnail.shadowRoot!.querySelector('img')?.getAttribute('src')).toBe('thumb.jpg'));
    expect(img.hasAttribute('src')).toBe(false);
  });

  it('moves source ownership to a replacement image', async () => {
    const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
    const first = document.createElement('img');

    Object.defineProperty(first, 'complete', { value: false, configurable: true });
    thumbnail.thumbnails = [{ url: 'thumb.jpg', startTime: 0 }];
    thumbnail.append(first);
    document.body.append(thumbnail);
    await thumbnail.updateComplete;

    const second = document.createElement('img');

    Object.defineProperty(second, 'complete', { value: false, configurable: true });
    first.replaceWith(second);

    await vi.waitFor(() => expect(second.getAttribute('src')).toBe('thumb.jpg'));
    expect(first.hasAttribute('src')).toBe(false);
  });

  describe('image attributes', () => {
    it('fills loading and fetchpriority in from its own properties', async () => {
      const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
      const img = document.createElement('img');

      Object.defineProperty(img, 'complete', { value: false, configurable: true });
      thumbnail.setAttribute('loading', 'lazy');
      thumbnail.setAttribute('fetchpriority', 'low');
      thumbnail.append(img);
      document.body.append(thumbnail);
      await thumbnail.updateComplete;

      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('fetchpriority')).toBe('low');
    });

    it('leaves attributes the supplied image already carries alone', async () => {
      const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
      const img = document.createElement('img');

      Object.defineProperty(img, 'complete', { value: false, configurable: true });
      img.setAttribute('crossorigin', 'use-credentials');
      img.setAttribute('loading', 'lazy');
      img.setAttribute('fetchpriority', 'low');
      thumbnail.setAttribute('crossorigin', 'anonymous');
      thumbnail.append(img);
      document.body.append(thumbnail);
      await thumbnail.updateComplete;

      expect(img.getAttribute('crossorigin')).toBe('use-credentials');
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('fetchpriority')).toBe('low');

      // Ownership is settled at adoption, so a later property change still yields to the author.
      thumbnail.loading = 'eager';
      await thumbnail.updateComplete;

      expect(img.getAttribute('loading')).toBe('lazy');
    });

    it('removes only the attributes it set when an image steps aside', async () => {
      const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
      const first = document.createElement('img');

      Object.defineProperty(first, 'complete', { value: false, configurable: true });
      first.setAttribute('loading', 'lazy');
      thumbnail.setAttribute('fetchpriority', 'low');
      thumbnail.append(first);
      document.body.append(thumbnail);
      await thumbnail.updateComplete;

      expect(first.getAttribute('fetchpriority')).toBe('low');

      const second = document.createElement('img');

      Object.defineProperty(second, 'complete', { value: false, configurable: true });
      first.replaceWith(second);

      await vi.waitFor(() => expect(second.getAttribute('fetchpriority')).toBe('low'));
      expect(first.hasAttribute('fetchpriority')).toBe(false);
      expect(first.getAttribute('loading')).toBe('lazy');
    });
  });

  describe('crossorigin', () => {
    it('inherits the media element CORS mode when unset', async () => {
      await expect(renderCrossOrigin('anonymous')).resolves.toBe('anonymous');
      await expect(renderCrossOrigin('use-credentials')).resolves.toBe('use-credentials');
    });

    it('sets nothing when the media element is not in CORS mode', async () => {
      await expect(renderCrossOrigin(null)).resolves.toBeNull();
    });

    it('prefers an explicit value over the inherited one', async () => {
      const attribute = await renderCrossOrigin('use-credentials', (el) => {
        el.setAttribute('crossorigin', 'anonymous');
      });

      expect(attribute).toBe('anonymous');

      const property = await renderCrossOrigin('use-credentials', (el) => {
        el.crossOrigin = 'anonymous';
      });

      expect(property).toBe('anonymous');
    });

    it('opts out of inheritance for an explicit null', async () => {
      await expect(renderCrossOrigin('anonymous', (el) => (el.crossOrigin = null))).resolves.toBeNull();
    });

    it('passes a bare crossorigin through rather than opting out', async () => {
      // The CORS-settings attribute reads an empty value as Anonymous, so it is
      // a value like any other and must not be mistaken for "no CORS".
      const attribute = await renderCrossOrigin('use-credentials', (el) => {
        el.setAttribute('crossorigin', '');
      });

      expect(attribute).toBe('');
    });

    it('prefers a value the supplied image carries over the inherited one', async () => {
      const provider = document.createElement('test-thumbnail-player') as TestPlayerProviderElement;
      const thumbnail = document.createElement(ThumbnailElement.tagName) as ThumbnailElement;
      const img = document.createElement('img');

      img.setAttribute('crossorigin', 'use-credentials');
      provider.setStore(createTextTrackStore('anonymous'));
      thumbnail.append(img);
      provider.append(thumbnail);
      document.body.append(provider);

      for (let index = 0; index < 5; index++) {
        await thumbnail.updateComplete;
        await nextFrame();
      }

      expect(img.getAttribute('crossorigin')).toBe('use-credentials');
    });

    it('does not inherit for thumbnails supplied directly', async () => {
      // Images set through the property may live anywhere, so they carry no
      // relationship to the media element's CORS mode.
      const attribute = await renderCrossOrigin('anonymous', (el) => {
        el.thumbnails = [{ url: 'https://images.example.com/sprite.jpg', startTime: 0 }];
      });

      expect(attribute).toBeNull();
    });
  });
});
