import type { PlayerTarget } from '@videojs/core/dom';
import { combine, createStore } from '@videojs/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { sleepTimerFeature } from '../usecases/audiobook/features';
import { FakeAudio } from './helpers/fake-audio';

describe('sleepTimerFeature', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts real minutes down and pauses when they run out', () => {
    const media = new FakeAudio();
    const store = createStore<PlayerTarget>()(combine(sleepTimerFeature));

    store.attach({ media, container: null });
    void media.play();
    store.setSleepTimer({ minutes: 1 });
    expect(store.sleepRemaining).toBe(60);

    vi.advanceTimersByTime(30_000);
    expect(store.sleepRemaining).toBe(30);
    expect(media.paused).toBe(false);

    vi.advanceTimersByTime(30_000);
    expect(media.paused).toBe(true);
    expect(store.sleepTimer).toEqual({ mode: 'off' });
    expect(store.sleepRemaining).toBe(0);
  });

  it('waits for a media position regardless of rate, and lets a seek past it cancel', () => {
    const media = new FakeAudio();
    const store = createStore<PlayerTarget>()(combine(sleepTimerFeature));

    store.attach({ media, container: null });
    void media.play();
    store.setSleepTimer({ until: 100 });

    media.tick(90);
    expect(store.sleepRemaining).toBe(10);
    expect(media.paused).toBe(false);

    media.tick(10);
    expect(media.paused).toBe(true);
    expect(store.sleepTimer).toEqual({ mode: 'off' });

    void media.play();
    store.setSleepTimer({ until: 300 });
    media.seekTo(400);
    expect(media.paused).toBe(false);
    expect(store.sleepTimer).toEqual({ mode: 'off' });
  });

  it('cancels on request and stops ticking once detached', () => {
    const media = new FakeAudio();
    const store = createStore<PlayerTarget>()(combine(sleepTimerFeature));

    store.attach({ media, container: null });
    store.setSleepTimer({ minutes: 5 });
    store.setSleepTimer(null);
    expect(store.sleepRemaining).toBe(0);

    void media.play();
    store.setSleepTimer({ minutes: 5 });
    store.destroy();
    vi.advanceTimersByTime(10 * 60_000);
    expect(media.paused).toBe(false);
  });
});
