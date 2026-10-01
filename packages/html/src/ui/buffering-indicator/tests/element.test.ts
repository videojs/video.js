import type { PlayerTarget } from '@videojs/core/dom';
import { ContextProvider } from '@videojs/element/context';
import type { MediaPlaybackState } from '@videojs/media';
import { createStore } from '@videojs/store';
import { describe, expect, it, vi } from 'vite-plus/test';

import { playerContext } from '../../../player/context';
import { UIElement } from '../../ui-element';
import { BufferingIndicatorElement } from '../element';

class TestBufferingProvider extends UIElement {
  readonly store = createStore<PlayerTarget>()<MediaPlaybackState>({
    name: 'playback',
    state: () => ({
      paused: false,
      ended: false,
      started: true,
      waiting: true,
      play: vi.fn(async () => {}),
      pause: vi.fn(),
    }),
  });
  readonly playerProvider = new ContextProvider(this, {
    context: playerContext,
    initialValue: this.store,
  });
}

customElements.define('test-buffering-provider', TestBufferingProvider);
customElements.define(BufferingIndicatorElement.tagName, BufferingIndicatorElement);

describe('BufferingIndicatorElement', () => {
  it('cancels the pending buffering delay on destruction', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const provider = new TestBufferingProvider();
    const indicator = new BufferingIndicatorElement();

    try {
      provider.append(indicator);
      document.body.append(provider);
      await indicator.updateComplete;

      expect(vi.getTimerCount()).toBe(1);

      indicator.destroy();

      expect(vi.getTimerCount()).toBe(0);
    } finally {
      indicator.destroy();
      provider.destroy();
      provider.remove();
      provider.store.destroy();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
