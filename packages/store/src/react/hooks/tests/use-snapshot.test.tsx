import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vite-plus/test';

import { createState, flush } from '../../../core/state';
import { useSnapshot } from '../use-snapshot';

describe('useSnapshot', () => {
  describe('without selector', () => {
    it('returns the full state', () => {
      const state = createState({ volume: 0.8, muted: false });

      const { result } = renderHook(() => useSnapshot(state));

      expect(result.current.volume).toBe(0.8);
      expect(result.current.muted).toBe(false);
    });

    it('re-renders when state changes', async () => {
      const state = createState({ volume: 1, muted: false });
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useSnapshot(state);
      });

      expect(renderCount).toBe(1);
      expect(result.current.volume).toBe(1);

      await act(async () => {
        state.patch({ volume: 0.5 });
        flush();
      });

      expect(renderCount).toBe(2);
      expect(result.current.volume).toBe(0.5);
    });
  });

  describe('with selector', () => {
    it('returns the selected value', () => {
      const state = createState({ volume: 0.7, muted: true });

      const { result } = renderHook(() => useSnapshot(state, (s) => s.volume));

      expect(result.current).toBe(0.7);
    });

    it('re-renders only when selected value changes', async () => {
      const state = createState({ volume: 1, muted: false });
      let renderCount = 0;

      const { result } = renderHook(() => {
        renderCount++;
        return useSnapshot(state, (s) => s.volume);
      });

      expect(renderCount).toBe(1);
      expect(result.current).toBe(1);

      // Change unrelated state — should NOT re-render
      await act(async () => {
        state.patch({ muted: true });
        flush();
      });

      expect(renderCount).toBe(1);

      // Change selected state — should re-render
      await act(async () => {
        state.patch({ volume: 0.3 });
        flush();
      });

      expect(renderCount).toBe(2);
      expect(result.current).toBe(0.3);
    });
  });

  describe('with custom comparator', () => {
    it('uses custom equality to suppress re-renders', async () => {
      const state = createState({ volume: 1, muted: false });
      let renderCount = 0;

      const alwaysEqual = () => true;

      const { result } = renderHook(() => {
        renderCount++;
        return useSnapshot(state, (s) => s.volume, alwaysEqual);
      });

      expect(renderCount).toBe(1);
      expect(result.current).toBe(1);

      await act(async () => {
        state.patch({ volume: 0.5 });
        flush();
      });

      // Should NOT re-render because custom comparator says values are equal
      expect(renderCount).toBe(1);
      expect(result.current).toBe(1);
    });
  });
});
