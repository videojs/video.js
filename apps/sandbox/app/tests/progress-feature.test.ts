import type { PlayerTarget } from '@videojs/core/dom';
import { combine, createStore } from '@videojs/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createMemoryStorage, createProgressFeature } from '../usecases/audiobook/features';
import { FakeAudio } from './helpers/fake-audio';

/** Store subscribers hear about a change on the next microtask. */
const flush = () => Promise.resolve();

function setup(key: string | null = 'book-1') {
  const storage = createMemoryStorage();
  const media = new FakeAudio();
  const store = createStore<PlayerTarget>()(combine(createProgressFeature(storage)));

  store.setProgressKey(key);

  return { storage, media, store };
}

describe('progressFeature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts listened time only while playing and only for ordinary steps', () => {
    const { media, store } = setup();

    store.attach({ media, container: null });
    media.loadMetadata(600);

    media.tick(0.25);
    expect(store.listenedSeconds).toBe(0);

    void media.play();
    media.tick(0.25);
    media.tick(0.25);
    media.tick(30);
    media.pause();

    expect(store.listenedSeconds).toBeCloseTo(0.5);
    expect(store.resumeTime).toBeCloseTo(30.75);
    expect(store.firstListenedAt).not.toBeNull();
  });

  it('persists the position and restores it for the same key once metadata is known', () => {
    const { storage, media, store } = setup();

    store.attach({ media, container: null });
    media.loadMetadata(600);
    void media.play();
    media.tick(1);
    media.tick(1);
    media.pause();
    store.destroy();

    const next = new FakeAudio();
    const again = createStore<PlayerTarget>()(combine(createProgressFeature(storage)));

    again.setProgressKey('book-1');
    again.attach({ media: next, container: null });
    expect(again.resumeTime).toBe(2);
    expect(next.currentTime).toBe(0);

    next.loadMetadata(600);
    expect(next.currentTime).toBe(2);
  });

  it('remembers where a long jump started, most recent first, and never a short one', () => {
    const { media, store } = setup();

    store.attach({ media, container: null });
    media.loadMetadata(3600);
    void media.play();
    media.tick(1);
    media.seekTo(5);
    expect(store.recentPlaces).toEqual([]);

    media.seekTo(500);
    expect(store.recentPlaces.map((place) => place.time)).toEqual([5]);

    media.tick(1);
    media.seekTo(1200);
    expect(store.recentPlaces.map((place) => place.time)).toEqual([501, 5]);

    store.clearRecentPlaces();
    expect(store.recentPlaces).toEqual([]);
  });

  it('switches records when the key changes and keeps nothing without a key', async () => {
    const { storage, media, store } = setup();

    store.attach({ media, container: null });
    media.loadMetadata(600);
    void media.play();
    media.tick(1);
    media.pause();

    store.setProgressKey('book-2');
    await flush();
    expect(store.resumeTime).toBe(0);
    expect(store.listenedSeconds).toBe(0);

    store.setProgressKey('book-1');
    await flush();
    expect(store.resumeTime).toBe(1);

    store.setProgressKey(null);
    await flush();
    void media.play();
    media.tick(1);
    media.pause();
    expect(storage.size).toBe(1);
  });
});
