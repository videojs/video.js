import { ReactiveElement } from '@videojs/element';
import { noop } from '@videojs/utils/function';

import { defineSlice } from '../../core/slice';
import type { Store } from '../../core/store';
import { createStore as createCoreStore } from '../../core/store';

/** Test host element that extends ReactiveElement. Tracks update calls for assertions. */
class TestHostElement extends ReactiveElement {
  updateCount = 0;

  requestUpdate(): void {
    this.updateCount++;
    super.requestUpdate();
  }
}

class MockMedia extends EventTarget {
  volume = 1;
  muted = false;
}

const audioSlice = defineSlice<MockMedia>()({
  state: ({ target }) => ({
    volume: 1,
    muted: false,
    setVolume(volume: number) {
      target().volume = volume;
      target().dispatchEvent(new Event('volumechange'));
      return volume;
    },
    setMuted(muted: boolean) {
      target().muted = muted;
      target().dispatchEvent(new Event('volumechange'));
      return muted;
    },
  }),

  attach({ target, signal, set }) {
    const sync = () => set({ volume: target.volume, muted: target.muted });

    sync();

    target.addEventListener('volumechange', sync);
    signal.addEventListener('abort', () => {
      target.removeEventListener('volumechange', sync);
    });
  },
});

type AudioSliceState = {
  volume: number;
  muted: boolean;
  setVolume: (volume: number) => number;
  setMuted: (muted: boolean) => boolean;
};

type TestStore = Store<MockMedia, AudioSliceState>;

// For controller tests - creates core store with attached target
export function createCoreTestStore(): { store: TestStore; target: MockMedia } {
  const store = createCoreStore<MockMedia>()(audioSlice, { onError: noop });

  const target = new MockMedia();

  store.attach(target);

  return { store, target };
}

/** Type alias for test host. */
type TestHost = TestHostElement;

let testHostCounter = 0;

/** Creates a test host element for controller tests. */
export function createTestHost(): TestHost {
  const tagName = `test-host-${testHostCounter++}`;

  if (!customElements.get(tagName)) {
    customElements.define(tagName, class extends TestHostElement {});
  }

  return document.createElement(tagName) as TestHost;
}
