import type { MediaContentData, MediaContentValue } from '@videojs/media';
import { HTMLVideoAdapter } from '@videojs/media/dom';
import { createStore } from '@videojs/store';
import { describe, expect, it, vi } from 'vite-plus/test';

import { setPlayerConfigValue } from '../../../feature';
import type { PlayerTarget } from '../../../player';
import { selectMetadata } from '../../selectors';
import { metadataFeature } from '../metadata';

const titleConfig = metadataFeature.config!.title;
const posterConfig = metadataFeature.config!.poster;

/** Set a user override the way a provider does, through the feature's own config. */
function setUserTitle(store: object, value: MediaContentValue): void {
  setPlayerConfigValue(store, titleConfig, value);
}

function setUserPoster(store: object, value: MediaContentValue): void {
  setPlayerConfigValue(store, posterConfig, value);
}

class ContentDataMedia extends EventTarget {
  contentData: MediaContentData | undefined;

  constructor(contentData: MediaContentData | undefined) {
    super();
    this.contentData = contentData;
  }

  setTitle(value: MediaContentValue): void {
    this.#setKey('title', value);
  }

  setPoster(value: MediaContentValue): void {
    this.#setKey('poster', value);
  }

  #setKey(key: 'title' | 'poster', value: MediaContentValue): void {
    if (!this.contentData || Object.is(this.contentData[key], value)) return;

    const contentData = { ...this.contentData };

    if (value === undefined) delete contentData[key];
    else contentData[key] = value;

    this.contentData = contentData;
    this.dispatchEvent(new Event('contentdatachange'));
  }
}

const target = (media: EventTarget): PlayerTarget => ({
  media: media as PlayerTarget['media'],
  container: null,
});

describe('metadataFeature', () => {
  it('resolves user, media, and feature default in order', () => {
    const store = createStore<PlayerTarget>()(metadataFeature);

    expect(store.title).toBe('');

    const media = new ContentDataMedia({ title: 'media' });

    store.attach(target(media));
    expect(store.title).toBe('media');

    setUserTitle(store, 'user');
    expect(store.title).toBe('user');

    media.setTitle('latest media');
    expect(store.title).toBe('user');

    setUserTitle(store, null);
    expect(store.title).toBe('latest media');
  });

  it('treats empty and whitespace-only strings as literal values', () => {
    const store = createStore<PlayerTarget>()(metadataFeature);

    store.attach(target(new ContentDataMedia({ title: 'media' })));

    setUserTitle(store, '');
    expect(store.title).toBe('');

    setUserTitle(store, '   ');
    expect(store.title).toBe('   ');
  });

  it.each([{}, { poster: 'poster.jpg' }])(
    'subscribes to content data before an asynchronous title arrives (%j)',
    (initial) => {
      const store = createStore<PlayerTarget>()(metadataFeature);
      const media = new ContentDataMedia(initial);
      const addEventListener = vi.spyOn(media, 'addEventListener');

      store.attach(target(media));

      expect(store.title).toBe('');
      expect(addEventListener).toHaveBeenCalledWith('contentdatachange', expect.any(Function), expect.anything());

      media.setTitle('loaded title');
      expect(store.title).toBe('loaded title');

      media.setTitle(null);
      expect(store.title).toBe('');

      media.setTitle('replacement title');
      expect(store.title).toBe('replacement title');

      media.setTitle(undefined);
      expect(store.title).toBe('');
    }
  );

  it('observes metadata when an adapter receives its target after store attachment', () => {
    const store = createStore<PlayerTarget>()(metadataFeature);
    const media = new HTMLVideoAdapter();

    try {
      store.attach(target(media));
      expect([store.title, store.poster]).toEqual(['', '']);

      const video = Object.assign(document.createElement('video'), {
        contentData: { title: 'loaded title', poster: 'loaded.jpg' },
      });

      media.attach(video);
      video.dispatchEvent(new Event('loadstart'));
      expect([store.title, store.poster]).toEqual(['loaded title', 'loaded.jpg']);

      video.contentData = { title: 'updated title', poster: 'updated.jpg' };
      video.dispatchEvent(new Event('contentdatachange'));
      expect([store.title, store.poster]).toEqual(['updated title', 'updated.jpg']);
    } finally {
      store.destroy();
      media.destroy();
    }
  });

  it('does not listen to unsupported media', () => {
    const store = createStore<PlayerTarget>()(metadataFeature);
    const unsupported = new ContentDataMedia(undefined);
    const addEventListener = vi.spyOn(unsupported, 'addEventListener');

    store.attach(target(unsupported));

    expect(store.title).toBe('');
    expect(addEventListener.mock.calls.map(([type]) => type)).not.toContain('contentdatachange');
  });

  it('resolves the content poster through the same order as the title', () => {
    const store = createStore<PlayerTarget>()(metadataFeature);

    expect(store.poster).toBe('');

    const media = new ContentDataMedia({ poster: 'media.jpg' });

    store.attach(target(media));
    expect(store.poster).toBe('media.jpg');

    setUserPoster(store, 'user.jpg');
    expect(store.poster).toBe('user.jpg');

    media.setPoster('latest-media.jpg');
    expect(store.poster).toBe('user.jpg');

    setUserPoster(store, null);
    expect(store.poster).toBe('latest-media.jpg');

    media.setPoster(undefined);
    expect(store.poster).toBe('');
  });

  it('resolves title and poster independently from one bag', () => {
    const store = createStore<PlayerTarget>()(metadataFeature);
    const media = new ContentDataMedia({ title: 'media title' });

    store.attach(target(media));

    expect(store.title).toBe('media title');
    expect(store.poster).toBe('');

    media.setPoster('media.jpg');

    expect(store.title).toBe('media title');
    expect(store.poster).toBe('media.jpg');
  });

  it('resets both media-owned values on detach while preserving user-owned state', () => {
    const store = createStore<PlayerTarget>()(metadataFeature);

    setUserPoster(store, 'user.jpg');
    const detach = store.attach(target(new ContentDataMedia({ title: 'media', poster: 'media.jpg' })));

    detach();

    expect(store.title).toBe('');
    expect(store.poster).toBe('user.jpg');
  });

  it('selects the resolved metadata and nothing that writes it', () => {
    const store = createStore<PlayerTarget>()(metadataFeature);

    expect(selectMetadata(store.state)).toEqual({ title: '', poster: '' });
    expect(store.state).not.toHaveProperty('setTitle');
    expect(store.state).not.toHaveProperty('setPoster');
    expect(store.state).not.toHaveProperty('defaultPoster');
    expect(store.state).not.toHaveProperty('defaultTitle');
  });
});
