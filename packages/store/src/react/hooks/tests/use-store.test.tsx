import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { useStore } from '../use-store';
import { createTestStore } from './test-utils';

describe('useStore', () => {
  describe('without selector', () => {
    it('returns state and action functions', () => {
      const { store } = createTestStore();

      const { result } = renderHook(() => useStore(store));

      expect(result.current.volume).toBe(1);
      expect(result.current.muted).toBe(false);
      expect(typeof result.current.setVolume).toBe('function');
    });

    it('does not re-render on state change', async () => {
      const { store } = createTestStore();
      const subscribe = vi.spyOn(store, 'subscribe');
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useStore(store);
      });

      expect(renderCount).toBe(1);
      expect(result.current.volume).toBe(1);

      await act(async () => {
        await result.current.setVolume(0.5);
      });

      expect(subscribe).not.toHaveBeenCalled();
      expect(renderCount).toBe(1);
      expect(store.state.volume).toBe(0.5);
    });
  });

  describe('with selector', () => {
    it('re-renders when selected state changes', async () => {
      const { store } = createTestStore();
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useStore(store, (s) => s.volume);
      });

      expect(renderCount).toBe(1);
      expect(result.current).toBe(1);

      await act(async () => {
        await store.setVolume(0.5);
      });

      // Should have re-rendered
      expect(renderCount).toBe(2);
      expect(result.current).toBe(0.5);
    });

    it('does not re-render when unrelated state changes', async () => {
      const { store } = createTestStore();
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useStore(store, (s) => s.volume);
      });

      expect(renderCount).toBe(1);

      await act(async () => {
        await store.setMuted(true);
      });

      // Should NOT re-render since volume didn't change
      expect(renderCount).toBe(1);
      expect(result.current).toBe(1);
    });
  });
});
