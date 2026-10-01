/**
 * Shared test helpers for `@videojs/react`.
 *
 * Provides factory functions for common mock objects used across component tests. `vi.mock()` blocks must still live in
 * each test file (Vitest hoists them before imports), but non-mock helpers like store and wrapper factories can be
 * shared here.
 */

import { PlayerExtensionCoordinator } from '@videojs/core/dom';
import type { ReactNode } from 'react';
import type { Mock } from 'vite-plus/test';
import { vi } from 'vite-plus/test';

import { I18nProvider } from '../i18n';
import { PlayerContextProvider, type PlayerContextValue } from '../player/context';

interface MockStore {
  state: Record<string, unknown>;
  attach: Mock<() => Mock>;
  subscribe: Mock<() => Mock>;
  destroy: Mock;
}

/**
 * Create a minimal mock store compatible with `PlayerContextValue`.
 *
 * Pass optional `state` to seed the store's state snapshot.
 */
export function createMockStore(state: Record<string, unknown> = {}): MockStore {
  return {
    state,
    attach: vi.fn(() => vi.fn()),
    subscribe: vi.fn(() => vi.fn()),
    destroy: vi.fn(),
  };
}

/**
 * Create a React wrapper that provides `PlayerContextProvider`.
 *
 * Accepts an optional store state seed. Returns the wrapper component, the mock store, a real extension coordinator
 * backing `registerExtension`, and the context value for assertions.
 */
export function createPlayerWrapper(storeState: Record<string, unknown> = {}): {
  store: MockStore;
  extensions: PlayerExtensionCoordinator;
  value: PlayerContextValue;
  Wrapper: ({ children }: { children: ReactNode }) => ReactNode;
} {
  const store = createMockStore(storeState);
  const extensions = new PlayerExtensionCoordinator(() => {});
  const value: PlayerContextValue = {
    store: store as any,
    media: null,
    setMedia: vi.fn(),
    container: null,
    setContainer: vi.fn(),
    registerExtension: (extension) => extensions.register(extension),
  };

  return {
    store,
    extensions,
    value,
    Wrapper({ children }: { children: ReactNode }) {
      return (
        <PlayerContextProvider value={value}>
          <I18nProvider>{children}</I18nProvider>
        </PlayerContextProvider>
      );
    },
  };
}
