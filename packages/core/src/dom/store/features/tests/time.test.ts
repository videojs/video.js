import { createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo, createTimeRanges } from '../../../tests/test-helpers';
import { timeFeature } from '../time';

describe('timeFeature', () => {
  describe('attach', () => {
    it('syncs time state on attach', () => {
      const video = createMockVideo({
        currentTime: 30,
        duration: 120,
      });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.currentTime).toBe(30);
      expect(store.state.duration).toBe(120);
    });

    it('handles NaN duration', () => {
      const video = createMockVideo({
        currentTime: 0,
        duration: Number.NaN,
      });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.duration).toBe(0);
    });

    it('updates on timeupdate event', () => {
      const video = createMockVideo({ currentTime: 0 });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.currentTime).toBe(0);

      // Update mock currentTime
      video.currentTime = 42;
      video.dispatchEvent(new Event('timeupdate'));

      expect(store.state.currentTime).toBe(42);
    });

    it('updates on durationchange event', () => {
      const video = createMockVideo({ duration: 0 });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.duration).toBe(0);

      // Update mock duration
      Object.defineProperty(video, 'duration', { value: 100, writable: false, configurable: true });
      video.dispatchEvent(new Event('durationchange'));

      expect(store.state.duration).toBe(100);
    });

    it('updates on seeked event', () => {
      const video = createMockVideo({ currentTime: 0 });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      // Update mock currentTime
      video.currentTime = 50;
      video.dispatchEvent(new Event('seeked'));

      expect(store.state.currentTime).toBe(50);
    });

    it('uses seekable end as duration for live streams (Infinity)', () => {
      const video = createMockVideo({
        currentTime: 0,
        duration: Number.POSITIVE_INFINITY,
        seekable: createTimeRanges([[0, 300]]),
      });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.duration).toBe(300);
    });

    it('returns 0 duration for live streams with no seekable range', () => {
      const video = createMockVideo({
        duration: Number.POSITIVE_INFINITY,
        seekable: createTimeRanges([]),
      });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.duration).toBe(0);
    });

    it('updates live duration as seekable range grows on progress', () => {
      const video = createMockVideo({
        duration: Number.POSITIVE_INFINITY,
        seekable: createTimeRanges([[0, 300]]),
      });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.duration).toBe(300);

      Object.defineProperty(video, 'seekable', {
        value: createTimeRanges([[10, 320]]),
        configurable: true,
      });
      video.dispatchEvent(new Event('progress'));

      expect(store.state.duration).toBe(320);
    });

    it('uses end of last seekable range when multiple ranges exist', () => {
      const video = createMockVideo({
        duration: Number.POSITIVE_INFINITY,
        seekable: createTimeRanges([
          [0, 100],
          [150, 300],
        ]),
      });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      expect(store.state.duration).toBe(300);
    });

    it('updates on emptied event', () => {
      const video = createMockVideo({
        currentTime: 30,
        duration: 120,
      });

      const store = createStore<PlayerTarget>()(timeFeature);

      store.attach({ media: video, container: null });

      // Update mock to empty state
      video.currentTime = 0;
      Object.defineProperty(video, 'duration', { value: Number.NaN, writable: false, configurable: true });
      video.dispatchEvent(new Event('emptied'));

      expect(store.state.currentTime).toBe(0);
      expect(store.state.duration).toBe(0);
    });
  });

  describe('actions', () => {
    describe('seek', () => {
      it('sets currentTime on target and waits for seeked event', async () => {
        const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        const resultPromise = store.seek(45);

        expect(video.currentTime).toBe(45);

        // Simulate browser firing seeked event
        video.dispatchEvent(new Event('seeked'));

        const result = await resultPromise;

        expect(result).toBe(45);
      });

      it('aborts pending seek on detach', async () => {
        const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
        const store = createStore<PlayerTarget>()(timeFeature);
        const detach = store.attach({ media: video, container: null });

        const resultPromise = store.seek(45);

        expect(video.currentTime).toBe(45);

        // Detach before seeked event fires
        detach();

        // Should resolve with current time (seek was aborted)
        const result = await resultPromise;

        expect(result).toBe(45);
      });

      it('settles a pending seek when the source is emptied', async () => {
        const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        const resultPromise = store.seek(30);

        // A new source never fires `seeked` for the abandoned seek.
        video.dispatchEvent(new Event('emptied'));

        expect(await resultPromise).toBe(30);
      });

      it('abandons a seek waiting for metadata when the source is emptied', async () => {
        const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_NOTHING });
        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        const resultPromise = store.seek(30);

        video.dispatchEvent(new Event('emptied'));

        expect(await resultPromise).toBe(0);

        // The new source's metadata must not receive the old target time.
        Object.defineProperty(video, 'readyState', { value: HTMLMediaElement.HAVE_METADATA, configurable: true });
        video.dispatchEvent(new Event('loadedmetadata'));

        expect(video.currentTime).toBe(0);
        expect(store.state.seeking).toBe(false);
      });

      it('supersedes previous seek when new seek starts', async () => {
        const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        // Start first seek
        const seek1Promise = store.seek(10);

        // Start second seek before first completes (supersedes)
        const seek2Promise = store.seek(20);

        expect(video.currentTime).toBe(20);

        // First seek should resolve immediately (aborted)
        const result1 = await seek1Promise;

        expect(result1).toBe(20); // Returns current position

        // Fire seeked for second seek
        video.dispatchEvent(new Event('seeked'));

        const result2 = await seek2Promise;

        expect(result2).toBe(20);
      });

      it('optimistically updates currentTime before seeked event fires', () => {
        const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        expect(store.state.currentTime).toBe(0);

        // Start seek but don't fire any DOM events.
        store.seek(45);

        // Store should reflect target time immediately (no waiting for seeked).
        expect(store.state.currentTime).toBe(45);
      });

      it('optimistically sets seeking to true before seeking event fires', () => {
        const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        expect(store.state.seeking).toBe(false);

        store.seek(45);

        expect(store.state.seeking).toBe(true);
      });

      it('optimistic seeking is corrected by seeked event', async () => {
        const video = createMockVideo({ readyState: HTMLMediaElement.HAVE_METADATA });
        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        const resultPromise = store.seek(45);

        expect(store.state.seeking).toBe(true);

        // Simulate browser completing seek.
        Object.defineProperty(video, 'seeking', { value: false, configurable: true });
        video.dispatchEvent(new Event('seeked'));

        await resultPromise;

        expect(store.state.seeking).toBe(false);
        expect(store.state.currentTime).toBe(45);
      });

      it('timeupdate during seek does not overwrite optimistic currentTime', () => {
        const video = createMockVideo({
          currentTime: 10,
          duration: 120,
          readyState: HTMLMediaElement.HAVE_METADATA,
        });

        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        expect(store.state.currentTime).toBe(10);

        // Start a seek — optimistic update sets currentTime to 60.
        store.seek(60);
        expect(store.state.currentTime).toBe(60);
        expect(store.state.seeking).toBe(true);

        // Browser fires timeupdate with a stale currentTime while still seeking.
        video.currentTime = 12;
        video.dispatchEvent(new Event('timeupdate'));

        // Optimistic value must be preserved — not overwritten by the stale timeupdate.
        expect(store.state.currentTime).toBe(60);
        expect(store.state.seeking).toBe(true);
      });

      it('progress during seek does not overwrite optimistic currentTime', () => {
        const video = createMockVideo({
          currentTime: 10,
          duration: 120,
          readyState: HTMLMediaElement.HAVE_METADATA,
        });

        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        store.seek(60);
        expect(store.state.currentTime).toBe(60);
        expect(store.state.seeking).toBe(true);

        // Browser fires progress (buffering at the seek target) with a stale
        // currentTime still reflecting the pre-seek position.
        video.currentTime = 12;
        video.dispatchEvent(new Event('progress'));

        expect(store.state.currentTime).toBe(60);
        expect(store.state.seeking).toBe(true);
      });

      it('timeupdate resumes syncing after seeked', async () => {
        const video = createMockVideo({
          currentTime: 10,
          duration: 120,
          readyState: HTMLMediaElement.HAVE_METADATA,
        });

        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        const resultPromise = store.seek(60);

        // Complete the seek.
        video.currentTime = 60;
        Object.defineProperty(video, 'seeking', { value: false, configurable: true });
        video.dispatchEvent(new Event('seeked'));

        await resultPromise;

        expect(store.state.seeking).toBe(false);
        expect(store.state.currentTime).toBe(60);

        // Playback advances — timeupdate should sync normally again.
        video.currentTime = 62;
        video.dispatchEvent(new Event('timeupdate'));

        expect(store.state.currentTime).toBe(62);
      });

      it('rapid seeks during drag preserve latest optimistic value', () => {
        const video = createMockVideo({
          currentTime: 10,
          duration: 120,
          readyState: HTMLMediaElement.HAVE_METADATA,
        });

        const store = createStore<PlayerTarget>()(timeFeature);

        store.attach({ media: video, container: null });

        // Simulate rapid drag: multiple seeks without waiting for seeked.
        store.seek(30);
        expect(store.state.currentTime).toBe(30);

        store.seek(50);
        expect(store.state.currentTime).toBe(50);

        store.seek(70);
        expect(store.state.currentTime).toBe(70);

        // Stale timeupdate fires — should not snap back.
        video.currentTime = 15;
        video.dispatchEvent(new Event('timeupdate'));

        expect(store.state.currentTime).toBe(70);
      });
    });
  });
});
