import { MediaError } from '@videojs/media';
import { createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { createMockVideo } from '../../../tests/test-helpers';
import { errorFeature } from '../shared';

describe('errorFeature', () => {
  it('syncs an error raised before attachment and clears it for a healthy replacement', () => {
    const media = createMockVideo();
    const error = new MediaError('Forbidden', MediaError.MEDIA_ERR_NETWORK, true);

    Object.defineProperty(media, 'error', { configurable: true, value: error });

    const store = createStore<PlayerTarget>()(errorFeature);
    const detach = store.attach({ media, container: null });

    expect(store.state.error).toBe(error);

    detach();
    store.attach({ media: createMockVideo(), container: null });

    expect(store.state.error).toBeNull();
  });

  it('updates on error, dismisses it, and clears it when a source empties', () => {
    const media = createMockVideo();
    const store = createStore<PlayerTarget>()(errorFeature);

    Object.defineProperty(media, 'error', { configurable: true, value: null });
    store.attach({ media, container: null });

    const error = new MediaError('Network failure', MediaError.MEDIA_ERR_NETWORK, true);

    Object.defineProperty(media, 'error', { configurable: true, value: error });
    media.dispatchEvent(new Event('error'));

    expect(store.state.error).toBe(error);

    store.state.dismissError();

    expect(store.state.error).toBeNull();

    media.dispatchEvent(new Event('error'));
    media.dispatchEvent(new Event('emptied'));

    expect(store.state.error).toBeNull();
  });
});
