import { createStore } from '@videojs/store';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { PlayerTarget } from '../../../player';
import { collectUncaughtExceptions, createMockVideo } from '../../../tests/test-helpers';
import { remotePlaybackFeature } from '../remote-playback';

function createRemote(overrides: Partial<RemotePlaybackLike> = {}) {
  const target = new EventTarget();

  return Object.assign(target, {
    state: 'disconnected',
    watchAvailability: vi.fn().mockResolvedValue(1),
    cancelWatchAvailability: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

interface RemotePlaybackLike {
  state: string;
  watchAvailability: (callback: (available: boolean) => void) => Promise<number>;
  cancelWatchAvailability?: (id?: number) => Promise<void> | void;
}

describe('remotePlaybackFeature', () => {
  it('cancels availability watching on abort (W3C path)', () => {
    const remote = createRemote();
    const media = Object.assign(createMockVideo(), { remote });
    const store = createStore<PlayerTarget>()(remotePlaybackFeature);

    const detach = store.attach({ media, container: null });

    detach();

    expect(remote.cancelWatchAvailability).toHaveBeenCalledOnce();
  });

  it('does not throw on abort when cancelWatchAvailability becomes unavailable', async () => {
    // Simulate a custom element whose `remote` resolves to a partial object at
    // detach time — the captured reference must guard the method call.
    const remote = createRemote();
    const media = Object.assign(createMockVideo(), { remote });
    const store = createStore<PlayerTarget>()(remotePlaybackFeature);

    const detach = store.attach({ media, container: null });

    // The W3C RemotePlayback object loses its method (e.g. inner video torn down).
    (remote as { cancelWatchAvailability?: unknown }).cancelWatchAvailability = undefined;

    expect(await collectUncaughtExceptions(detach)).toEqual([]);
  });

  it('does not throw on abort when cancelWatchAvailability returns void', async () => {
    const remote = createRemote({ cancelWatchAvailability: vi.fn().mockReturnValue(undefined) });
    const media = Object.assign(createMockVideo(), { remote });
    const store = createStore<PlayerTarget>()(remotePlaybackFeature);

    const detach = store.attach({ media, container: null });

    expect(await collectUncaughtExceptions(detach)).toEqual([]);
    expect(remote.cancelWatchAvailability).toHaveBeenCalledOnce();
  });

  it('handles a rejected cancelWatchAvailability promise on abort', async () => {
    const remote = createRemote({ cancelWatchAvailability: vi.fn().mockRejectedValue(new Error('cancel failed')) });
    const media = Object.assign(createMockVideo(), { remote });
    const store = createStore<PlayerTarget>()(remotePlaybackFeature);

    const detach = store.attach({ media, container: null });

    expect(await collectUncaughtExceptions(detach)).toEqual([]);
  });
});
