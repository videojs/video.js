import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../../core/signals/primitives';
import type { MaybeResolvedPresentation, Presentation } from '../../../media/types';
import { setupFailoverMonitor } from '../setup-failover-monitor';

const resolved = (): Presentation =>
  ({ id: 'pres-1', url: 'https://cdn-a.example.com/master.m3u8', startTime: 0, selectionSets: [] }) as Presentation;

const makeState = (presentation?: MaybeResolvedPresentation) => ({
  presentation: signal<MaybeResolvedPresentation | undefined>(presentation),
  failedCdns: signal<string[] | undefined>(undefined),
});

const flush = () => Promise.resolve().then(() => Promise.resolve());

const A = 'https://cdn-a.example.com';
const B = 'https://cdn-b.example.com';

describe('setupFailoverMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('removes a failed CDN once its cooldown lapses', async () => {
    const state = makeState(resolved());
    const reactor = setupFailoverMonitor.setup({ state, config: { failover: { cooldownMs: 1000 } } });

    await flush();

    state.failedCdns.set([A]); // a fetch site tripped cdn-a
    await flush();
    expect(state.failedCdns.get()).toEqual([A]);

    await vi.advanceTimersByTimeAsync(999);
    expect(state.failedCdns.get()).toEqual([A]);
    await vi.advanceTimersByTimeAsync(1);
    expect(state.failedCdns.get()).toEqual([]);

    reactor.destroy();
  });

  it('expires each CDN on its own cooldown', async () => {
    const state = makeState(resolved());
    const reactor = setupFailoverMonitor.setup({ state, config: { failover: { cooldownMs: 1000 } } });

    await flush();

    state.failedCdns.set([A]);
    await flush();
    await vi.advanceTimersByTimeAsync(600);

    state.failedCdns.set([A, B]); // cdn-b tripped 600ms after cdn-a
    await flush();

    await vi.advanceTimersByTimeAsync(400); // cdn-a's cooldown lapses (t=1000); cdn-b's (t=1600) not yet
    expect(state.failedCdns.get()).toEqual([B]);

    await vi.advanceTimersByTimeAsync(600); // cdn-b's cooldown lapses (t=1600)
    expect(state.failedCdns.get()).toEqual([]);

    reactor.destroy();
  });

  it('clears failedCdns and pending timers on src unload', async () => {
    const state = makeState(resolved());
    const reactor = setupFailoverMonitor.setup({ state, config: { failover: { cooldownMs: 1000 } } });

    await flush();

    state.failedCdns.set([A]);
    await flush();
    expect(state.failedCdns.get()).toEqual([A]);

    state.presentation.set(undefined);
    await flush();
    expect(state.failedCdns.get()).toBeUndefined();

    state.presentation.set(resolved());
    await flush();
    await vi.advanceTimersByTimeAsync(500);
    state.failedCdns.set([A]);
    await flush();

    await vi.advanceTimersByTimeAsync(500);
    expect(state.failedCdns.get()).toEqual([A]);
    await vi.advanceTimersByTimeAsync(500);
    expect(state.failedCdns.get()).toEqual([]);

    reactor.destroy();
  });

  it('expires a failed CDN after five minutes when config is omitted', async () => {
    const state = makeState(resolved());
    const reactor = setupFailoverMonitor.setup({ state });

    state.failedCdns.set([A]);
    await flush();
    await vi.advanceTimersByTimeAsync(299_999);
    expect(state.failedCdns.get()).toEqual([A]);
    await vi.advanceTimersByTimeAsync(1);
    expect(state.failedCdns.get()).toEqual([]);

    reactor.destroy();
  });
});
