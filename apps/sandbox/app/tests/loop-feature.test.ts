import type { PlayerTarget } from '@videojs/core/dom';
import { combine, createStore } from '@videojs/store';
import { describe, expect, it } from 'vite-plus/test';

import { loopFeature } from '../usecases/features';
import { GifAdapter } from '../usecases/gif-video';

describe('loopFeature', () => {
  it('reads loop off the media and writes it back', () => {
    const media = new GifAdapter();
    const store = createStore<PlayerTarget>()(combine(loopFeature));

    media.loop = true;
    store.attach({ media, container: null });
    expect(store.loop).toBe(true);

    store.setLoop(false);
    expect(media.loop).toBe(false);
    expect(store.loop).toBe(false);

    store.setLoop(true);
    expect(media.loop).toBe(true);
    expect(store.loop).toBe(true);
  });

  it('picks up a loop the markup changed along with a new source', () => {
    const media = new GifAdapter();
    const store = createStore<PlayerTarget>()(combine(loopFeature));

    store.attach({ media, container: null });
    media.loop = true;
    media.dispatchEvent(new Event('loadstart'));

    expect(store.loop).toBe(true);
  });

  it('keeps its own state for a media without loop', () => {
    const store = createStore<PlayerTarget>()(combine(loopFeature));

    store.attach({ media: Object.assign(new EventTarget(), { play: async () => undefined }), container: null });
    expect(store.loop).toBe(false);

    store.setLoop(true);
    expect(store.loop).toBe(true);
  });
});
