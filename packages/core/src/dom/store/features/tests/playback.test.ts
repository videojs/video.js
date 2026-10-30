import { createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { playbackFeature } from '../playback';

describe('playbackFeature', () => {
  describe('attach', () => {
    it('syncs playback state on attach', () => {
      const video = createMockVideo({
        paused: false,
        ended: false,
        currentTime: 30,
        readyState: HTMLMediaElement.HAVE_ENOUGH_DATA,
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.paused).toBe(false);
      expect(store.state.ended).toBe(false);
      expect(store.state.started).toBe(true);
      expect(store.state.waiting).toBe(false);
    });

    it('detects waiting state when buffering', () => {
      const video = createMockVideo({
        paused: false,
        readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.waiting).toBe(true);
    });

    it('clears waiting once currentTime advances below HAVE_FUTURE_DATA', () => {
      const video = createMockVideo({
        paused: false,
        readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
        currentTime: 0,
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.waiting).toBe(true);

      // Safari holds HAVE_CURRENT_DATA for the whole of some MSE streams, so a
      // presented frame is the only evidence that playback ever recovered.
      video.currentTime = 0.5;
      video.dispatchEvent(new Event('timeupdate'));

      expect(store.state.waiting).toBe(false);
    });

    it('keeps waiting while currentTime does not advance', () => {
      const video = createMockVideo({
        paused: false,
        readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
        currentTime: 4,
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      video.dispatchEvent(new Event('timeupdate'));

      expect(store.state.waiting).toBe(true);
    });

    it('restores waiting when the browser reports starvation again', () => {
      const video = createMockVideo({
        paused: false,
        readyState: HTMLMediaElement.HAVE_CURRENT_DATA,
        currentTime: 0,
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      video.currentTime = 12;
      video.dispatchEvent(new Event('timeupdate'));
      expect(store.state.waiting).toBe(false);

      video.dispatchEvent(new Event('waiting'));
      expect(store.state.waiting).toBe(true);

      video.currentTime = 12.25;
      video.dispatchEvent(new Event('timeupdate'));
      expect(store.state.waiting).toBe(false);
    });

    it('detects started from currentTime', () => {
      const video = createMockVideo({
        paused: true,
        currentTime: 5,
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.started).toBe(true);
    });

    it('detects started from playing state', () => {
      const video = createMockVideo({
        paused: false,
        currentTime: 0,
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.started).toBe(true);
    });

    it('updates on play event', () => {
      const video = createMockVideo({ paused: true });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.paused).toBe(true);

      // Update mock to playing state
      Object.defineProperty(video, 'paused', { value: false, writable: false, configurable: true });
      video.dispatchEvent(new Event('play'));

      expect(store.state.paused).toBe(false);
    });

    it('updates on pause event', () => {
      const video = createMockVideo({ paused: false });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.paused).toBe(false);

      // Update mock to paused state
      Object.defineProperty(video, 'paused', { value: true, writable: false, configurable: true });
      video.dispatchEvent(new Event('pause'));

      expect(store.state.paused).toBe(true);
    });

    it('updates on ended event', () => {
      const video = createMockVideo({ ended: false });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.ended).toBe(false);

      // Update mock to ended state
      Object.defineProperty(video, 'ended', { value: true, writable: false, configurable: true });
      video.dispatchEvent(new Event('ended'));

      expect(store.state.ended).toBe(true);
    });

    it('clears ended state on seeked event', () => {
      const video = createMockVideo({ ended: true });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.ended).toBe(true);

      // Simulate seeking: browser clears ended when user seeks
      Object.defineProperty(video, 'ended', { value: false, writable: false, configurable: true });
      video.dispatchEvent(new Event('seeked'));

      expect(store.state.ended).toBe(false);
    });

    it('stops listening when store is destroyed', () => {
      const video = createMockVideo({});

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      store.destroy();

      // Update mock to playing state
      Object.defineProperty(video, 'paused', { value: false, writable: false, configurable: true });
      video.dispatchEvent(new Event('play'));

      // State should not update after destroy
      expect(store.state.paused).toBe(true);
    });
  });

  describe('actions', () => {
    it('play() publishes the new state without waiting for the play event', async () => {
      const video = createMockVideo({ paused: true });

      // The mock changes `paused` like the media does and fires no events, so only the action can update the store.
      video.play = vi.fn(() => {
        Object.defineProperty(video, 'paused', { value: false, configurable: true });
        return Promise.resolve();
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      const playing = store.play();

      expect(store.state.paused).toBe(false);
      expect(store.state.started).toBe(true);

      await playing;
    });

    it('play() clears ended before the media does on replay', async () => {
      const video = createMockVideo({ paused: true, ended: true });

      // `ended` stays true until the replay's seek back to the start lands.
      video.play = vi.fn(() => {
        Object.defineProperty(video, 'paused', { value: false, configurable: true });
        return Promise.resolve();
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.ended).toBe(true);

      await store.play();

      expect(store.state.ended).toBe(false);
    });

    it('pause() publishes the new state without waiting for the pause event', () => {
      const video = createMockVideo({ paused: false });

      video.pause = vi.fn(() => {
        Object.defineProperty(video, 'paused', { value: true, configurable: true });
      });

      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });
      store.pause();

      expect(store.state.paused).toBe(true);
    });
  });

  describe('autoplay', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    function attachAutoplaying(overrides: Parameters<typeof createMockVideo>[0] = {}) {
      const video = createMockVideo({ paused: true, src: 'https://example.com/a.mp4', ...overrides });
      const store = createStore<PlayerTarget>()(playbackFeature);

      video.autoplay = true;
      store.attach({ media: video, container: null });

      return { video, store };
    }

    function startPlaying(video: HTMLVideoElement) {
      Object.defineProperty(video, 'paused', { value: false, configurable: true });
      video.dispatchEvent(new Event('play'));
    }

    it('reflects the media autoplay and tracks the attempt until playback starts', () => {
      const { video, store } = attachAutoplaying();

      expect(store.state.autoplay).toBe(true);
      expect(store.state.autoplaying).toBe(true);
      expect(store.state.paused).toBe(true);

      startPlaying(video);

      expect(store.state.autoplaying).toBe(false);
      expect(store.state.started).toBe(true);
    });

    it('does not try to autoplay without autoplay or without a source', () => {
      const video = createMockVideo({ paused: true, src: 'https://example.com/a.mp4' });
      const store = createStore<PlayerTarget>()(playbackFeature);

      store.attach({ media: video, container: null });

      expect(store.state.autoplay).toBe(false);
      expect(store.state.autoplaying).toBe(false);

      const sourceless = createMockVideo({ paused: true });
      const sourcelessStore = createStore<PlayerTarget>()(playbackFeature);

      sourceless.autoplay = true;
      sourcelessStore.attach({ media: sourceless, container: null });

      expect(sourcelessStore.state.autoplay).toBe(true);
      expect(sourcelessStore.state.autoplaying).toBe(false);
    });

    it('counts autoplay as refused when the media can play through but stays paused', () => {
      vi.useFakeTimers();
      const { video, store } = attachAutoplaying();

      Object.defineProperty(video, 'readyState', { value: HTMLMediaElement.HAVE_ENOUGH_DATA, configurable: true });
      video.dispatchEvent(new Event('canplaythrough'));
      vi.advanceTimersToNextFrame();

      expect(store.state.autoplaying).toBe(true);

      vi.advanceTimersToNextFrame();

      expect(store.state.autoplaying).toBe(false);
      expect(store.state.paused).toBe(true);
    });

    it('keeps the attempt when autoplay starts shortly after the media can play through', () => {
      vi.useFakeTimers();
      const { video, store } = attachAutoplaying();

      video.dispatchEvent(new Event('canplaythrough'));
      vi.advanceTimersToNextFrame();
      startPlaying(video);
      vi.advanceTimersToNextFrame();

      expect(store.state.autoplaying).toBe(false);
      expect(store.state.started).toBe(true);
      expect(store.state.paused).toBe(false);
    });

    it('drops a pending check when a new source starts', () => {
      vi.useFakeTimers();
      const { video, store } = attachAutoplaying();

      video.dispatchEvent(new Event('canplaythrough'));
      video.dispatchEvent(new Event('loadstart'));
      vi.advanceTimersToNextFrame();
      vi.advanceTimersToNextFrame();

      expect(store.state.autoplaying).toBe(true);
    });

    it('keeps the attempt while the media loads, however long it takes', () => {
      const { video, store } = attachAutoplaying();

      for (const type of ['progress', 'loadedmetadata', 'loadeddata', 'canplay', 'waiting']) {
        video.dispatchEvent(new Event(type));
      }

      expect(store.state.autoplaying).toBe(true);
    });

    it('counts autoplay as refused when the media reports a pause, as an embed does', () => {
      const { video, store } = attachAutoplaying();

      video.dispatchEvent(new Event('pause'));

      expect(store.state.autoplaying).toBe(false);
    });

    it('counts autoplay as refused on a media error', () => {
      const { video, store } = attachAutoplaying();

      video.dispatchEvent(new Event('error'));

      expect(store.state.autoplaying).toBe(false);
    });

    it('cancels the attempt when paused', () => {
      const { video, store } = attachAutoplaying();

      video.pause = vi.fn();
      store.pause();

      expect(video.pause).toHaveBeenCalled();
      expect(store.state.autoplaying).toBe(false);
    });

    it('does not count a media that already refused autoplay before attaching', () => {
      const { store } = attachAutoplaying({ readyState: HTMLMediaElement.HAVE_ENOUGH_DATA });

      expect(store.state.autoplay).toBe(true);
      expect(store.state.autoplaying).toBe(false);
    });

    it('tries again for a new source', () => {
      const { video, store } = attachAutoplaying();

      video.pause = vi.fn();
      store.pause();
      video.dispatchEvent(new Event('loadstart'));

      expect(store.state.autoplaying).toBe(true);
    });
  });
});
