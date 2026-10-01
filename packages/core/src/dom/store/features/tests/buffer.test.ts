import { getTimeRangeEnd, hasTimeRange } from '@videojs/media';
import { combine, createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo, createTimeRanges } from '../../../tests/test-helpers';
import { bufferFeature } from '../buffer';
import { timeFeature } from '../time';

describe('bufferFeature', () => {
  describe('attach', () => {
    it('syncs buffered and seekable ranges on attach', () => {
      const video = createMockVideo({
        buffered: createTimeRanges([
          [0, 30],
          [60, 90],
        ]),
        seekable: createTimeRanges([[0, 120]]),
      });

      const store = createStore<PlayerTarget>()(bufferFeature);

      store.attach({ media: video, container: null });

      expect(store.state.buffered).toEqual([
        [0, 30],
        [60, 90],
      ]);
      expect(store.state.seekable).toEqual([[0, 120]]);
    });

    it('updates on progress event', () => {
      const video = createMockVideo({
        buffered: createTimeRanges([[0, 50]]),
        seekable: createTimeRanges([[0, 100]]),
      });

      const store = createStore<PlayerTarget>()(bufferFeature);

      store.attach({ media: video, container: null });

      // Update the mock video's buffered range
      Object.defineProperty(video, 'buffered', {
        value: createTimeRanges([[0, 75]]),
        writable: false,
        configurable: true,
      });

      video.dispatchEvent(new Event('progress'));

      expect(store.state.buffered).toEqual([[0, 75]]);
    });

    it.each(['loadedmetadata', 'durationchange'])('syncs an initial seekable range on %s without progress', (event) => {
      const video = createMockVideo({
        duration: 0,
        buffered: createTimeRanges([]),
        seekable: createTimeRanges([]),
      });
      const store = createStore<PlayerTarget>()(combine(timeFeature, bufferFeature));

      store.attach({ media: video, container: null });

      expect(hasTimeRange(store.state)).toBe(false);

      Object.defineProperty(video, 'seekable', {
        value: createTimeRanges([[30, 120]]),
        configurable: true,
      });
      video.dispatchEvent(new Event(event));

      expect(store.state.duration).toBe(0);
      expect(store.state.seekable).toEqual([[30, 120]]);
      expect(hasTimeRange(store.state)).toBe(true);
      expect(getTimeRangeEnd(store.state)).toBe(120);
    });

    it('updates on emptied event', () => {
      const video = createMockVideo({
        buffered: createTimeRanges([[0, 50]]),
        seekable: createTimeRanges([[0, 100]]),
      });

      const store = createStore<PlayerTarget>()(bufferFeature);

      store.attach({ media: video, container: null });

      // Update the mock video to have no buffered content
      Object.defineProperty(video, 'buffered', {
        value: createTimeRanges([]),
        writable: false,
        configurable: true,
      });
      Object.defineProperty(video, 'seekable', {
        value: createTimeRanges([]),
        writable: false,
        configurable: true,
      });

      video.dispatchEvent(new Event('emptied'));

      expect(store.state.buffered).toEqual([]);
      expect(store.state.seekable).toEqual([]);
    });
  });
});
