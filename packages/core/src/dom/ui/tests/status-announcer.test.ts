import { describe, expect, it } from 'vite-plus/test';

import { StatusAnnouncerCore } from '../../../core/ui/status-announcer/core';
import { type StatusAnnouncerStore, subscribeToStatusAnnouncer } from '../status-announcer';

describe('subscribeToStatusAnnouncer', () => {
  it('uses attach updates as the snapshot baseline', async () => {
    const core = new StatusAnnouncerCore();
    const { attach, setState, store } = createStore({ paused: true });
    const unsubscribe = subscribeToStatusAnnouncer(store, core);

    // Place a state update between the obsolete and current baseline microtasks.
    queueMicrotask(() => setState({ paused: false }));

    attach({ paused: true });
    await Promise.resolve();

    expect(core.state.current.label).toBeNull();

    setState({ paused: true });

    expect(core.state.current.label).toBe('Paused');
    unsubscribe();
  });

  it('resets the snapshot baseline when the target changes', async () => {
    const core = new StatusAnnouncerCore();
    const { attach, setState, store } = createStore({ paused: true });

    attach({});
    const unsubscribe = subscribeToStatusAnnouncer(store, core);

    await Promise.resolve();

    setState({ paused: false });
    expect(core.state.current.label).toBe('Playing');

    attach({ paused: true });
    await Promise.resolve();

    expect(core.state.current.label).toBeNull();

    setState({ paused: false });
    expect(core.state.current.label).toBe('Playing');
    unsubscribe();
  });
});

function createStore(initialState: Record<string, unknown>) {
  let state = initialState;
  let target: unknown | null = null;
  const listeners = new Set<() => void>();
  const store: StatusAnnouncerStore = {
    get state() {
      return state;
    },
    get target() {
      return target;
    },
    subscribe(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };

  const setState = (partial: Record<string, unknown>) => {
    state = { ...state, ...partial };

    for (const listener of listeners) listener();
  };

  return {
    store,
    attach(partial: Record<string, unknown>) {
      target = {};
      setState(partial);
    },
    setState,
  };
}
