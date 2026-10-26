import type { PlayerTarget } from '@videojs/core/dom';
import { combine, createStore } from '@videojs/store';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { snapshotFeature } from '../usecases/features';
import { GifAdapter } from '../usecases/gif-video';

class FakeClipboardItem {
  constructor(readonly items: Record<string, Blob>) {}
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('snapshotFeature', () => {
  it('is unsupported until the media has something to read back from', () => {
    const media = new GifAdapter();
    const store = createStore<PlayerTarget>()(combine(snapshotFeature));

    store.attach({ media, container: null });
    expect(store.snapshotAvailability).toBe('unsupported');

    media.attach(
      Object.assign(new EventTarget(), { width: 0, height: 0, getContext: () => null, toBlob: () => undefined })
    );
    media.dispatchEvent(new Event('loadstart'));
    expect(store.snapshotAvailability).toBe('available');
  });

  it('copies the canvas as a PNG when a clipboard exists', async () => {
    const media = new GifAdapter();
    const store = createStore<PlayerTarget>()(combine(snapshotFeature));
    const blob = new Blob(['png'], { type: 'image/png' });
    const write = vi.fn<(items: unknown[]) => Promise<void>>(async () => undefined);

    vi.stubGlobal('ClipboardItem', FakeClipboardItem);
    vi.stubGlobal('navigator', { clipboard: { write } });
    store.attach({ media, container: null });
    media.attach(
      Object.assign(new EventTarget(), {
        width: 0,
        height: 0,
        getContext: () => null,
        toBlob: (callback: (result: Blob) => void) => callback(blob),
      })
    );

    await expect(store.copySnapshot()).resolves.toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0]?.[0]).toEqual([new FakeClipboardItem({ 'image/png': blob })]);
  });

  it('reports false without a surface, a clipboard, or an encodable picture', async () => {
    const media = new GifAdapter();
    const store = createStore<PlayerTarget>()(combine(snapshotFeature));

    store.attach({ media, container: null });
    await expect(store.copySnapshot()).resolves.toBe(false);

    media.attach(
      Object.assign(new EventTarget(), {
        width: 0,
        height: 0,
        getContext: () => null,
        toBlob: (callback: (result: Blob | null) => void) => callback(null),
      })
    );
    vi.stubGlobal('navigator', {});
    await expect(store.copySnapshot()).resolves.toBe(false);

    vi.stubGlobal('ClipboardItem', FakeClipboardItem);
    vi.stubGlobal('navigator', { clipboard: { write: vi.fn() } });
    await expect(store.copySnapshot()).resolves.toBe(false);
  });
});
