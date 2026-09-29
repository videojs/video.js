import { createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { sourceFeature } from '../source';

describe('sourceFeature', () => {
  describe('attach', () => {
    it('syncs source state on attach', () => {
      const video = createMockVideo({
        currentSrc: 'https://example.com/video.mp4',
        src: 'https://example.com/video.mp4',
        readyState: HTMLMediaElement.HAVE_ENOUGH_DATA,
      });

      const store = createStore<PlayerTarget>()(sourceFeature);

      store.attach({ media: video, container: null });

      expect(store.state.currentSrc).toBe('https://example.com/video.mp4');

      expect(store.state.canPlay).toBe(true);
    });

    it('returns an empty currentSrc when no source set', () => {
      // Note: Don't set src at all - setting src="" resolves to page URL
      const video = document.createElement('video');

      Object.defineProperty(video, 'currentSrc', { value: '', writable: false });
      Object.defineProperty(video, 'readyState', { value: HTMLMediaElement.HAVE_NOTHING, writable: false });

      const store = createStore<PlayerTarget>()(sourceFeature);

      store.attach({ media: video, container: null });

      expect(store.state.currentSrc).toBe('');
      expect(store.state.canPlay).toBe(false);
    });

    it('updates on canplay event', () => {
      const video = createMockVideo({
        currentSrc: '',
        readyState: HTMLMediaElement.HAVE_NOTHING,
      });

      const store = createStore<PlayerTarget>()(sourceFeature);

      store.attach({ media: video, container: null });

      expect(store.state.canPlay).toBe(false);

      // Update mock to ready state
      Object.defineProperty(video, 'readyState', {
        value: HTMLMediaElement.HAVE_FUTURE_DATA,
        writable: false,
        configurable: true,
      });
      video.dispatchEvent(new Event('canplay'));

      expect(store.state.canPlay).toBe(true);
    });

    it('updates on loadstart event', () => {
      const video = createMockVideo({
        currentSrc: 'https://example.com/video.mp4',
      });

      const store = createStore<PlayerTarget>()(sourceFeature);

      store.attach({ media: video, container: null });

      expect(store.state.currentSrc).toBe('https://example.com/video.mp4');

      // Update mock with new source
      Object.defineProperty(video, 'currentSrc', {
        value: 'https://example.com/new.mp4',
        writable: false,
        configurable: true,
      });
      video.dispatchEvent(new Event('loadstart'));

      expect(store.state.currentSrc).toBe('https://example.com/new.mp4');
    });

    it('updates on emptied event', () => {
      const video = createMockVideo({
        currentSrc: 'https://example.com/video.mp4',
        readyState: HTMLMediaElement.HAVE_ENOUGH_DATA,
      });

      const store = createStore<PlayerTarget>()(sourceFeature);

      store.attach({ media: video, container: null });

      expect(store.state.canPlay).toBe(true);

      // Update mock to empty state
      Object.defineProperty(video, 'currentSrc', { value: '', writable: false, configurable: true });
      Object.defineProperty(video, 'readyState', {
        value: HTMLMediaElement.HAVE_NOTHING,
        writable: false,
        configurable: true,
      });
      video.dispatchEvent(new Event('emptied'));

      expect(store.state.currentSrc).toBe('');
      expect(store.state.canPlay).toBe(false);
    });
  });
});
