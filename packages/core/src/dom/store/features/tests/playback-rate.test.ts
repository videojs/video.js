import { createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import { setPlayerConfigValue } from '../../../feature';
import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { playbackRateFeature } from '../playback-rate';

const ratesConfig = playbackRateFeature.config!.playbackRates;

function createRateStore() {
  return createStore<PlayerTarget>()(playbackRateFeature);
}

describe('playbackRateFeature', () => {
  it('keeps configured rates in the author order', () => {
    const store = createRateStore();

    setPlayerConfigValue(store, ratesConfig, [2, 1, 0.5]);

    expect(store.state.playbackRates).toEqual([2, 1, 0.5]);
  });

  it('parses a space-separated attribute value', () => {
    const store = createRateStore();

    setPlayerConfigValue(store, ratesConfig, ' 0.5  1\n1.5 2 ');

    expect(store.state.playbackRates).toEqual([0.5, 1, 1.5, 2]);
  });

  it('drops invalid and repeated rates', () => {
    const store = createRateStore();

    setPlayerConfigValue(store, ratesConfig, '1 fast 0 -1 Infinity 2 1');

    expect(store.state.playbackRates).toEqual([1, 2]);
  });

  it.each([undefined, null, '', '   ', 'fast', [], [0, Number.NaN]])(
    'restores the defaults for unusable input %j',
    (value) => {
      const store = createRateStore();
      const defaults = store.state.playbackRates;

      setPlayerConfigValue(store, ratesConfig, [1, 2]);
      setPlayerConfigValue(store, ratesConfig, value);

      expect(store.state.playbackRates).toEqual(defaults);
    }
  );

  it('preserves configured rates across media detach', () => {
    const store = createRateStore();

    setPlayerConfigValue(store, ratesConfig, [1, 2]);

    const detach = store.attach({ media: createMockVideo(), container: null });

    detach();

    expect(store.state.playbackRates).toEqual([1, 2]);
  });
});
