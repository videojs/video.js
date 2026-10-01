import { defineSlice } from '../../../core/slice';
import { createStore as createCoreStore } from '../../../core/store';

// Shared mock target for synchronous tests
class MockMedia extends EventTarget {
  volume = 1;
  muted = false;
}

// Shared slice for synchronous tests
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

export function createTestStore() {
  const store = createCoreStore<MockMedia>()(audioSlice);
  const target = new MockMedia();

  store.attach(target);
  return { store, target };
}
