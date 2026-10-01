import { createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { liveFeature } from '../live';

interface LiveCapableMedia extends EventTarget {
  liveEdgeStart: number;
  targetLiveWindow: number;
}

function createLiveMedia(initial: Partial<LiveCapableMedia> = {}): LiveCapableMedia {
  const target = new EventTarget() as LiveCapableMedia;

  target.liveEdgeStart = initial.liveEdgeStart ?? Number.NaN;
  target.targetLiveWindow = initial.targetLiveWindow ?? Number.NaN;
  return target;
}

describe('liveFeature', () => {
  describe('fallback (media without live-edge properties)', () => {
    it('stays at `NaN` / `NaN` when the media is not live-edge capable', () => {
      const video = createMockVideo({ duration: 120 });

      const store = createStore<PlayerTarget>()(liveFeature);

      store.attach({ media: video, container: null });

      expect(store.state.liveEdgeStart).toBeNaN();
      expect(store.state.targetLiveWindow).toBeNaN();
    });
  });

  describe('capable media', () => {
    it('reads initial values on attach', () => {
      const media = createLiveMedia({ liveEdgeStart: 42, targetLiveWindow: 0 });

      const store = createStore<PlayerTarget>()(liveFeature);

      store.attach({ media: media as unknown as PlayerTarget['media'], container: null });

      expect(store.state.liveEdgeStart).toBe(42);
      expect(store.state.targetLiveWindow).toBe(0);
    });

    it('re-reads both on `targetlivewindowchange`', () => {
      const media = createLiveMedia({ liveEdgeStart: 42, targetLiveWindow: 0 });

      const store = createStore<PlayerTarget>()(liveFeature);

      store.attach({ media: media as unknown as PlayerTarget['media'], container: null });

      media.liveEdgeStart = 102;
      media.targetLiveWindow = Number.POSITIVE_INFINITY;
      media.dispatchEvent(new Event('targetlivewindowchange'));

      expect(store.state.liveEdgeStart).toBe(102);
      expect(store.state.targetLiveWindow).toBe(Number.POSITIVE_INFINITY);
    });

    it.each([
      ['progress', 42, 100, 0],
      ['durationchange', 42, 200, 0],
      ['loadedmetadata', Number.NaN, 50, 0],
      ['canplay', Number.NaN, 40, 0],
      ['streamtypechange', 42, Number.NaN, 0],
      ['emptied', 42, Number.NaN, Number.NaN],
    ] as const)('re-reads live state on %s', (event, initial, liveEdgeStart, targetLiveWindow) => {
      const media = createLiveMedia({ liveEdgeStart: initial, targetLiveWindow: 0 });
      const store = createStore<PlayerTarget>()(liveFeature);

      store.attach({ media: media as unknown as PlayerTarget['media'], container: null });

      media.liveEdgeStart = liveEdgeStart;
      media.targetLiveWindow = targetLiveWindow;
      media.dispatchEvent(new Event(event));

      expect(store.state.liveEdgeStart).toBe(liveEdgeStart);
      expect(store.state.targetLiveWindow).toBe(targetLiveWindow);
    });

    it('re-reads `liveEdgeStart` on `timeupdate` (tracks moving live edge)', () => {
      const media = createLiveMedia({ liveEdgeStart: 42, targetLiveWindow: 0 });

      const store = createStore<PlayerTarget>()(liveFeature);

      store.attach({ media: media as unknown as PlayerTarget['media'], container: null });

      media.liveEdgeStart = 43;
      media.dispatchEvent(new Event('timeupdate'));
      expect(store.state.liveEdgeStart).toBe(43);

      media.liveEdgeStart = 44;
      media.dispatchEvent(new Event('timeupdate'));
      expect(store.state.liveEdgeStart).toBe(44);
    });
  });
});
