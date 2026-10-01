import { describe, expect, it, vi } from 'vite-plus/test';

import { createTransition } from '../transition';

describe('createTransition', () => {
  it('starts with idle state', () => {
    const handler = createTransition();

    expect(handler.state.current).toEqual({ active: false, status: 'idle' });
  });

  describe('open', () => {
    it('patches open and starting status synchronously', () => {
      const handler = createTransition();

      handler.open();

      expect(handler.state.current).toEqual({ active: true, status: 'starting' });
    });

    it('transitions to idle after a double-RAF', async () => {
      vi.useFakeTimers();
      const handler = createTransition();

      const promise = handler.open();

      expect(handler.state.current.status).toBe('starting');

      try {
        vi.advanceTimersToNextFrame();
        expect(handler.state.current.status).toBe('starting');

        vi.advanceTimersToNextFrame();
        expect(handler.state.current.status).toBe('idle');

        vi.advanceTimersToNextFrame();
        await promise;
      } finally {
        handler.destroy();
        vi.useRealTimers();
      }

      expect(handler.state.current).toEqual({ active: true, status: 'idle' });
    });

    it('resolves after the opening animation finishes', async () => {
      const handler = createTransition();
      const el = document.createElement('div');
      let finishAnimation!: () => void;
      const finished = new Promise<void>((resolve) => {
        finishAnimation = resolve;
      });
      const getAnimations = vi.fn(() => [{ finished }] as unknown as Animation[]);

      Object.defineProperty(el, 'getAnimations', { value: getAnimations });

      let resolved = false;
      const promise = handler.open(el).then(() => {
        resolved = true;
      });

      await vi.waitFor(() => expect(getAnimations).toHaveBeenCalled());
      expect(handler.state.current.status).toBe('idle');
      expect(resolved).toBe(false);

      finishAnimation();
      await promise;

      expect(resolved).toBe(true);
    });

    it('cancels active animations and flushes styles when restarting an active transition', async () => {
      const handler = createTransition();
      const el = document.createElement('div');
      const getOffsetHeight = vi.spyOn(el, 'offsetHeight', 'get');
      const cancel = vi.fn();

      Object.defineProperty(el, 'getAnimations', {
        value: vi.fn(() => [{ cancel }]),
      });

      await handler.open();
      await vi.waitFor(() => {
        expect(handler.state.current.status).toBe('idle');
      });

      handler.open(el);

      await vi.waitFor(() => {
        expect(cancel).toHaveBeenCalled();
      });
      expect(getOffsetHeight).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('patches ending status synchronously', () => {
      const handler = createTransition();
      const el = document.createElement('div');

      // Open first
      handler.open();

      handler.close(el);

      expect(handler.state.current).toEqual({ active: true, status: 'ending' });
    });

    it('handles null element gracefully', async () => {
      const handler = createTransition();

      handler.open();
      const promise = handler.close(null);

      expect(handler.state.current.status).toBe('ending');

      await vi.waitFor(() => {
        expect(handler.state.current.active).toBe(false);
      });

      await promise;
      expect(handler.state.current).toEqual({ active: false, status: 'idle' });
    });
  });

  describe('cancel', () => {
    it('preserves open state', () => {
      const handler = createTransition();

      handler.open();
      expect(handler.state.current.status).toBe('starting');

      handler.cancel();

      expect(handler.state.current.active).toBe(true);
      expect(handler.state.current.status).toBe('idle');
    });
  });

  describe('destroy', () => {
    it('prevents further open calls from updating state', () => {
      const handler = createTransition();

      handler.destroy();
      handler.open();

      expect(handler.state.current).toEqual({ active: false, status: 'idle' });
    });
  });
});
