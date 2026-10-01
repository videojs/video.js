import { describe, expect, it, vi } from 'vite-plus/test';

import { StoreAccessor } from '../store-accessor';
import { createCoreTestStore, createTestHost } from './test-utils';

describe('StoreAccessor', () => {
  describe('direct store source', () => {
    it('returns store immediately', () => {
      const { store } = createCoreTestStore();
      const host = createTestHost();

      const accessor = new StoreAccessor(host, store);

      expect(accessor.value).toBe(store);
    });

    it('does not call onAvailable on construction', () => {
      const { store } = createCoreTestStore();
      const host = createTestHost();
      const onAvailable = vi.fn();

      // For direct store, onAvailable is NOT called on construction
      // It's called on hostConnected instead
      const _accessor = new StoreAccessor(host, store, onAvailable);

      expect(onAvailable).not.toHaveBeenCalled();
      expect(_accessor).toBeDefined();
    });

    it('calls onAvailable on each reconnect', () => {
      const { store } = createCoreTestStore();
      const host = createTestHost();
      const onAvailable = vi.fn();

      const accessor = new StoreAccessor(host, store, onAvailable);

      // First connect
      accessor.hostConnected();
      expect(onAvailable).toHaveBeenCalledWith(store);
      expect(onAvailable).toHaveBeenCalledTimes(1);

      // Simulate reconnect
      accessor.hostConnected();
      expect(onAvailable).toHaveBeenCalledTimes(2);
    });
  });

  describe('context source', () => {
    it('returns null when context not yet provided', () => {
      const host = createTestHost();

      // Use a symbol as context (this is what createContext returns)
      const fakeContext = Symbol('test-context') as any;

      const accessor = new StoreAccessor(host, fakeContext);

      expect(accessor.value).toBeNull();
    });

    // Note: Testing actual context provider behavior requires
    // a full DOM hierarchy with a provider element, which is
    // tested in packages/html/src/player/tests/create-player.test.ts
  });
});
