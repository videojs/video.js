import { createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { playbackRateFeature } from '../playback-rate';

describe('playbackRateFeature', () => {
  it('offers the default rates for media that has a playback rate', () => {
    const store = createStore<PlayerTarget>()(playbackRateFeature);

    store.attach({ media: createMockVideo(), container: null });

    expect(store.state.playbackRates.length).toBeGreaterThan(0);
  });

  it('offers no rates for media without a playback rate, such as an audio embed', () => {
    const media = { addEventListener() {}, removeEventListener() {} };
    const store = createStore<PlayerTarget>()(playbackRateFeature);

    store.attach({ media: media as unknown as HTMLVideoElement, container: null });

    expect(store.state.playbackRates).toEqual([]);
  });

  it('offers the rates again once media with a playback rate replaces one without', () => {
    const media = { addEventListener() {}, removeEventListener() {} };
    const store = createStore<PlayerTarget>()(playbackRateFeature);

    const detach = store.attach({ media: media as unknown as HTMLVideoElement, container: null });

    detach();
    store.attach({ media: createMockVideo({}), container: null });

    expect(store.state.playbackRates.length).toBeGreaterThan(0);
  });
});
