import { act, cleanup, render, screen } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { useSyncExternalStore } from '../use-sync-external-store';

// React 16 and 17 have no `useSyncExternalStore`. Remove it so the fallback runs on the React 19 test renderer.
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  useSyncExternalStore: undefined,
}));

function createCounter() {
  let value = 0;
  const listeners = new Set<() => void>();

  return {
    listeners,
    getSnapshot: () => value,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    set(next: number) {
      value = next;

      for (const listener of listeners) listener();
    },
  };
}

function Count({ store }: { store: ReturnType<typeof createCounter> }) {
  const count = useSyncExternalStore(store.subscribe, store.getSnapshot);

  return <div data-testid="count">{count}</div>;
}

afterEach(cleanup);

describe('useSyncExternalStore', () => {
  it('re-renders when the store notifies', () => {
    const store = createCounter();

    render(<Count store={store} />);

    expect(screen.getByTestId('count').textContent).toBe('0');

    act(() => store.set(1));

    expect(screen.getByTestId('count').textContent).toBe('1');
  });

  it('picks up a change made between render and subscription', () => {
    const store = createCounter();

    function ChangeOnMount() {
      useLayoutEffect(() => store.set(5), []);
      return null;
    }

    render(
      <>
        <Count store={store} />
        <ChangeOnMount />
      </>
    );

    expect(screen.getByTestId('count').textContent).toBe('5');
  });

  it('unsubscribes on unmount', () => {
    const store = createCounter();

    const { unmount } = render(<Count store={store} />);

    expect(store.listeners.size).toBe(1);

    unmount();

    expect(store.listeners.size).toBe(0);
  });
});
