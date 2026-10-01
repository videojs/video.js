import { describe, expect, it, vi } from 'vite-plus/test';

import { StoreError } from '../errors';
import { defineSlice } from '../slice';
import { flush } from '../state';
import { createStore, isStore } from '../store';

describe('createStore', () => {
  // Mock target that mimics HTMLVideoElement
  class MockMedia extends EventTarget {
    volume = 1;
    muted = false;
    paused = true;
    play = vi.fn();
    pause = vi.fn();
  }

  const audioSlice = defineSlice<MockMedia>()({
    state: ({ target }) => ({
      volume: 1,
      muted: false,
      setVolume(volume: number) {
        target().volume = volume;
        target().dispatchEvent(new Event('volumechange'));
      },
      setMuted(muted: boolean) {
        target().muted = muted;
        target().dispatchEvent(new Event('volumechange'));
      },
    }),

    attach({ target, signal, set }) {
      const sync = () => set({ volume: target.volume, muted: target.muted });

      sync();

      target.addEventListener('volumechange', sync);
      signal.addEventListener('abort', () => {
        target.removeEventListener('volumechange', sync);
      });
    },
  });

  it('full lifecycle: create → attach → use → detach → destroy', () => {
    const events: string[] = [];

    class Target extends EventTarget {
      value = 0;
    }

    const slice = defineSlice<Target>()({
      state: ({ target }) => ({
        count: 0,
        increment() {
          target().value++;
          target().dispatchEvent(new Event('change'));
          events.push('increment');
        },
      }),

      attach({ target: t, signal, set }) {
        events.push('attach-slice');
        set({ count: t.value });

        t.addEventListener('change', () => set({ count: t.value }), { signal });
        signal.addEventListener('abort', () => events.push('unsubscribe'));
      },
    });

    const store = createStore<Target>()(slice, {
      onSetup: () => events.push('setup'),
      onAttach: () => events.push('attach'),
    });

    expect(events).toEqual(['setup']);

    const targetInstance = new Target();

    targetInstance.value = 5;
    const detach = store.attach(targetInstance);

    expect(events).toEqual(['setup', 'attach-slice', 'attach']);
    expect(store.state.count).toBe(5);

    store.increment();
    expect(store.state.count).toBe(6);
    expect(events).toContain('increment');

    detach();
    expect(events).toContain('unsubscribe');
    expect(store.target).toBeNull();

    store.destroy();
    expect(store.destroyed).toBe(true);
  });

  describe('creation', () => {
    it('exposes $state container matching store.state', () => {
      const store = createStore<MockMedia>()(audioSlice);
      const media = new MockMedia();

      store.attach(media);

      expect(store.$state.current).toBe(store.state);

      const callback = vi.fn();

      store.$state.subscribe(callback);

      media.volume = 0.5;
      media.dispatchEvent(new Event('volumechange'));
      flush();

      expect(callback).toHaveBeenCalled();
      expect(store.$state.current.volume).toBe(0.5);
    });

    it('calls onSetup', () => {
      const onSetup = vi.fn();
      const store = createStore<MockMedia>()(audioSlice, { onSetup });

      expect(onSetup).toHaveBeenCalledWith({
        store,
        signal: expect.any(AbortSignal),
      });
    });

    it('identifies stores across package entrypoints', () => {
      const store = createStore<MockMedia>()(audioSlice);

      expect(isStore(store)).toBe(true);
      expect(Symbol.for('@videojs/store') in store).toBe(true);
    });
  });

  describe('attach', () => {
    it('syncs state from target', () => {
      const store = createStore<MockMedia>()(audioSlice);

      const media = new MockMedia();

      media.volume = 0.5;
      media.muted = true;

      store.attach(media);

      expect(store.state).toMatchObject({ volume: 0.5, muted: true });
      expect(store.target).toBe(media);
    });

    it('calls onAttach', () => {
      const onAttach = vi.fn();
      const store = createStore<MockMedia>()(audioSlice, { onAttach });

      const media = new MockMedia();

      store.attach(media);

      expect(onAttach).toHaveBeenCalledWith({
        store,
        target: media,
        signal: expect.any(AbortSignal),
      });
    });

    it('detach cleans up', () => {
      const store = createStore<MockMedia>()(audioSlice);

      const media = new MockMedia();
      const removeListenerSpy = vi.spyOn(media, 'removeEventListener');

      const detach = store.attach(media);

      detach();

      expect(store.target).toBeNull();
      expect(removeListenerSpy).toHaveBeenCalled();
    });

    it('reattach cleans up previous', () => {
      const store = createStore<MockMedia>()(audioSlice);

      const media1 = new MockMedia();
      const m1RemoveListenerSpy = vi.spyOn(media1, 'removeEventListener');

      const media2 = new MockMedia();

      media2.volume = 0.3;

      store.attach(media1);
      store.attach(media2);

      expect(store.target).toBe(media2);
      expect(store.state.volume).toBe(0.3);
      expect(m1RemoveListenerSpy).toHaveBeenCalled();
    });
  });

  describe('actions', () => {
    it('executes action on target', () => {
      const store = createStore<MockMedia>()(audioSlice);

      const media = new MockMedia();

      store.attach(media);

      store.setVolume(0.5);

      expect(media.volume).toBe(0.5);
    });

    it('throws NO_TARGET when an action needs an unattached target', () => {
      const store = createStore<MockMedia>()(audioSlice, { onError: () => {} });

      expect(() => store.setVolume(0.5)).toThrow(StoreError);
      expect(() => store.setVolume(0.5)).toThrow(expect.objectContaining({ code: 'NO_TARGET' }));
    });
  });

  describe('subscribe', () => {
    it('notifies on state change', () => {
      const store = createStore<MockMedia>()(audioSlice);

      const media = new MockMedia();

      store.attach(media);

      const listener = vi.fn();

      store.subscribe(listener);

      store.setVolume(0.5);
      flush();

      expect(listener).toHaveBeenCalled();
      expect(store.state.volume).toBe(0.5);
    });

    it('unsubscribe stops notifications', () => {
      const store = createStore<MockMedia>()(audioSlice);

      const media = new MockMedia();

      store.attach(media);

      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();

      store.setVolume(0.5);
      flush();

      expect(listener).not.toHaveBeenCalled();
    });

    it('respects abort signal', () => {
      const store = createStore<MockMedia>()(audioSlice);

      const media = new MockMedia();

      store.attach(media);

      const listener = vi.fn();
      const controller = new AbortController();

      store.subscribe(listener, { signal: controller.signal });

      controller.abort();
      store.setVolume(0.5);
      flush();

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('persistent and derived state', () => {
    const INTERNAL_VALUE = Symbol('internalValue');
    const USER_VALUE = Symbol('userValue');
    const SET_USER_VALUE = Symbol('setUserValue');

    interface TestSourceState {
      [INTERNAL_VALUE]: string | undefined;
      [USER_VALUE]: string | null | undefined;
      [SET_USER_VALUE](value: string | null | undefined): void;
      setInternal(value: string | undefined): void;
      setValue(value: string | null): void;
    }

    const responsiveSlice = defineSlice<MockMedia>()({
      preserve: [USER_VALUE],
      state: ({ set }): TestSourceState => {
        const setUserValue = (value: string | null | undefined) => set({ [USER_VALUE]: value });

        return {
          [INTERNAL_VALUE]: undefined,
          [USER_VALUE]: undefined,
          [SET_USER_VALUE]: setUserValue,
          setInternal: (value) => set({ [INTERNAL_VALUE]: value }),
          setValue: setUserValue,
        };
      },
      derived: {
        resolved: ({ get }) => get()[USER_VALUE] ?? get()[INTERNAL_VALUE] ?? 'fallback',
      },
    });

    it('makes private symbol actions available without publishing their state', () => {
      const store = createStore<MockMedia>()(responsiveSlice);
      const setUserValue = (store as unknown as Record<PropertyKey, unknown>)[SET_USER_VALUE];

      expect(setUserValue).toBeInstanceOf(Function);
      expect(INTERNAL_VALUE in store).toBe(false);
      expect(USER_VALUE in store).toBe(false);
      expect(Object.getOwnPropertySymbols(store.state)).toEqual([]);

      (setUserValue as (value: string | undefined) => void)('initial');
      expect(store.resolved).toBe('initial');

      (setUserValue as (value: string | undefined) => void)(undefined);
      expect(store.resolved).toBe('fallback');
    });

    it('publishes source and derived changes atomically while keeping symbols internal', () => {
      const store = createStore<MockMedia>()(responsiveSlice);

      expect(Object.getOwnPropertySymbols(store.state)).toEqual([]);

      store.setInternal('media');

      expect(store.resolved).toBe('media');
      expect(Object.getOwnPropertySymbols(store.state)).toEqual([]);
    });

    it('keeps lower-precedence source state live without publishing an unchanged public snapshot', () => {
      const store = createStore<MockMedia>()(responsiveSlice);

      store.setValue('user');
      flush();
      const listener = vi.fn();

      store.subscribe(listener);
      const publicSnapshot = store.state;

      store.setInternal('latest media');
      flush();

      expect(store.resolved).toBe('user');
      expect(store.state).toBe(publicSnapshot);
      expect(listener).not.toHaveBeenCalled();

      store.setValue(null);
      flush();

      expect(store.resolved).toBe('latest media');
      expect(listener).toHaveBeenCalledOnce();
    });

    it('resets attachment state on detach while preserving declared source keys', () => {
      const store = createStore<MockMedia>()(responsiveSlice);

      store.setValue('user');
      const detach = store.attach(new MockMedia());

      store.setInternal('media');
      expect(store.resolved).toBe('user');

      detach();

      expect(store.resolved).toBe('user');

      store.setValue(null);
      expect(store.resolved).toBe('fallback');
    });

    it('does not commit source state when a derived formula throws', () => {
      const throwingSlice = defineSlice<MockMedia>()({
        state: ({ set, get }) => ({
          value: 1,
          readSourceValue: () => get().value,
          setValue: (value: number) => set({ value }),
        }),
        derived: {
          doubled: ({ get }) => {
            const { value } = get();
            if (value < 0) throw new Error('invalid value');

            return value * 2;
          },
        },
      });
      const store = createStore<MockMedia>()(throwingSlice);
      const listener = vi.fn();

      store.subscribe(listener);

      expect(() => store.setValue(-1)).toThrow('invalid value');
      flush();

      expect(store.doubled).toBe(2);
      expect(store.state.value).toBe(1);
      expect(store.readSourceValue()).toBe(1);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('cleans up everything', () => {
      const store = createStore<MockMedia>()(audioSlice);

      const media = new MockMedia();

      store.attach(media);
      store.destroy();

      expect(store.destroyed).toBe(true);
      expect(store.target).toBeNull();
    });

    it('throws on attach after destroy', () => {
      const store = createStore<MockMedia>()(audioSlice);

      store.destroy();

      expect(() => store.attach(new MockMedia())).toThrow(StoreError);
      expect(() => store.attach(new MockMedia())).toThrow(expect.objectContaining({ code: 'DESTROYED' }));
    });
  });

  describe('error handling', () => {
    it('reports event-driven derived errors without committing the update', () => {
      const onError = vi.fn();
      const listener = vi.fn();
      const invalidValueError = new Error('invalid value');
      const slice = defineSlice<MockMedia>()({
        state: () => ({ value: 1 }),
        derived: {
          doubled: ({ get }) => {
            const { value } = get();
            if (value < 0) throw invalidValueError;

            return value * 2;
          },
        },
        attach({ target, signal, set }) {
          const sync = () => set({ value: target.volume });

          target.addEventListener('volumechange', sync);
          signal.addEventListener('abort', () => target.removeEventListener('volumechange', sync));
        },
      });
      const store = createStore<MockMedia>()(slice, { onError });
      const media = new MockMedia();

      store.attach(media);
      store.subscribe(listener);
      const snapshot = store.state;

      media.volume = -1;
      media.dispatchEvent(new Event('volumechange'));
      flush();

      expect(onError).toHaveBeenCalledOnce();
      expect(onError).toHaveBeenCalledWith({ store, error: invalidValueError });
      expect(store.state).toBe(snapshot);
      expect(store.state).toMatchObject({ value: 1, doubled: 2 });
      expect(listener).not.toHaveBeenCalled();
    });

    it('reports synchronous action errors to onError and rethrows', () => {
      const error = new Error('action failed');
      const onError = vi.fn();
      const failingSlice = defineSlice<MockMedia>()({
        state: () => ({
          fail() {
            throw error;
          },
        }),
      });
      const store = createStore<MockMedia>()(failingSlice, { onError });

      try {
        expect(() => store.fail()).toThrow(error);
        expect(onError).toHaveBeenCalledOnce();
        expect(onError).toHaveBeenCalledWith({ store, error });
      } finally {
        store.destroy();
      }
    });

    it('reports rejected async actions to onError once and still rejects', async () => {
      const error = new Error('play failed');
      const onError = vi.fn();
      const failingSlice = defineSlice<MockMedia>()({
        state: () => ({
          async play() {
            throw error;
          },
        }),
      });
      const store = createStore<MockMedia>()(failingSlice, { onError });

      try {
        await expect(store.play()).rejects.toBe(error);
        expect(onError).toHaveBeenCalledOnce();
        expect(onError).toHaveBeenCalledWith({ store, error });
      } finally {
        store.destroy();
      }
    });

    it('leaves action failures to the caller without onError', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failingSlice = defineSlice<MockMedia>()({
        state: () => ({
          fail() {
            throw new Error('sync');
          },
          async play() {
            throw new Error('async');
          },
        }),
      });
      const store = createStore<MockMedia>()(failingSlice);

      try {
        expect(() => store.fail()).toThrow('sync');
        await expect(store.play()).rejects.toThrow('async');
        expect(consoleError).not.toHaveBeenCalled();
      } finally {
        store.destroy();
        consoleError.mockRestore();
      }
    });

    it.each(['onSetup', 'onAttach'] as const)('reports an action error thrown inside %s once', (callback) => {
      const error = new Error('action failed');
      const onError = vi.fn();
      const failingSlice = defineSlice<MockMedia>()({
        state: () => ({
          fail() {
            throw error;
          },
        }),
      });
      const store = createStore<MockMedia>()(failingSlice, {
        onError,
        [callback]: ({ store }: { store: { fail: () => void } }) => store.fail(),
      });

      try {
        if (callback === 'onAttach') store.attach(new MockMedia());

        expect(onError).toHaveBeenCalledOnce();
        expect(onError).toHaveBeenCalledWith({ store, error });
      } finally {
        store.destroy();
      }
    });
  });

  describe('signals', () => {
    it('signals.base aborts on detach', () => {
      const slice = defineSlice<MockMedia>()({
        state: ({ signals }) => ({
          getBase: () => signals.base,
        }),
      });

      const store = createStore<MockMedia>()(slice);
      const detach = store.attach(new MockMedia());

      const sig = store.getBase();

      expect(sig.aborted).toBe(false);

      detach();

      expect(sig.aborted).toBe(true);
    });

    it('signals.base aborts on reattach', () => {
      const slice = defineSlice<MockMedia>()({
        state: ({ signals }) => ({
          getBase: () => signals.base,
        }),
      });

      const store = createStore<MockMedia>()(slice);

      store.attach(new MockMedia());

      const sig = store.getBase();

      expect(sig.aborted).toBe(false);

      store.attach(new MockMedia()); // Reattach

      expect(sig.aborted).toBe(true);
    });

    it('signals.supersede() aborts on detach', () => {
      const slice = defineSlice<MockMedia>()({
        state: ({ signals }) => ({
          supersede: (key: string) => signals.supersede(key),
        }),
      });

      const store = createStore<MockMedia>()(slice);
      const detach = store.attach(new MockMedia());

      const sig = store.supersede('test');

      expect(sig.aborted).toBe(false);

      detach();

      expect(sig.aborted).toBe(true);
    });
  });
});
