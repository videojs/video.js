import { describe, expect, it, vi } from 'vite-plus/test';

import { createState, flush, isState } from '../state';

describe('createState', () => {
  interface TestState {
    volume: number;
    muted: boolean;
    currentTime: number;
  }

  const createTestState = () =>
    createState<TestState>({
      volume: 1,
      muted: false,
      currentTime: 0,
    });

  describe('current', () => {
    it('returns the current state', () => {
      const state = createTestState();

      expect(state.current.volume).toBe(1);
      expect(state.current.muted).toBe(false);
    });
  });

  describe('patch', () => {
    it('updates multiple keys', () => {
      const state = createTestState();

      state.patch({ volume: 0.5, muted: true });
      expect(state.current.volume).toBe(0.5);
      expect(state.current.muted).toBe(true);
      expect(state.current.currentTime).toBe(0); // unchanged
    });

    it('does not notify if no values changed', () => {
      const state = createTestState();
      const listener = vi.fn();

      state.subscribe(listener);

      state.patch({ volume: 1, muted: false }); // same as initial
      flush();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('notifies on change after microtask', async () => {
      const state = createTestState();
      const listener = vi.fn();

      state.subscribe(listener);

      state.patch({ volume: 0.5 });

      expect(listener).not.toHaveBeenCalled();
      await Promise.resolve();
      expect(listener).toHaveBeenCalledOnce();
    });

    it('can force immediate notification with flush()', () => {
      const state = createTestState();
      const listener = vi.fn();

      state.subscribe(listener);

      state.patch({ volume: 0.5 });
      expect(listener).not.toHaveBeenCalled();

      flush();
      expect(listener).toHaveBeenCalledOnce();
    });

    it('batches multiple patches into one notification', () => {
      const state = createTestState();
      const listener = vi.fn();

      state.subscribe(listener);

      state.patch({ volume: 0.5 });
      state.patch({ muted: true });
      state.patch({ currentTime: 10 });

      flush();
      expect(listener).toHaveBeenCalledOnce();
    });

    it('returns unsubscribe function', () => {
      const state = createTestState();
      const listener = vi.fn();

      const unsub = state.subscribe(listener);

      state.patch({ volume: 0.5 });
      flush();
      expect(listener).toHaveBeenCalledOnce();

      unsub();
      state.patch({ volume: 0.3 });
      flush();
      expect(listener).toHaveBeenCalledOnce(); // still 1
    });

    it('respects abort signal', () => {
      const state = createTestState();
      const listener = vi.fn();
      const controller = new AbortController();

      state.subscribe(listener, { signal: controller.signal });
      controller.abort();

      state.patch({ volume: 0.5 });
      flush();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('isState', () => {
    it('returns true for state created by createState', () => {
      const state = createTestState();

      expect(isState(state)).toBe(true);
    });

    it('returns false for plain objects', () => {
      expect(isState({})).toBe(false);
      expect(isState({ current: {} })).toBe(false);
    });

    it('returns false for primitives', () => {
      expect(isState(null)).toBe(false);
      expect(isState(undefined)).toBe(false);
      expect(isState(42)).toBe(false);
      expect(isState('string')).toBe(false);
    });
  });
});
