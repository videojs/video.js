import { assertType, describe, expect, it, vi } from 'vite-plus/test';

import { combine } from '../combine';
import { defineSlice, type InferSliceTarget } from '../slice';
import { createStore } from '../store';

class MockTarget extends EventTarget {
  value = 7;
  label = 'attached';
}

const slice = defineSlice<MockTarget>();

describe('combine', () => {
  it('merges state from multiple slices', () => {
    const a = slice({ state: () => ({ count: 0 }) });
    const b = slice({ state: () => ({ label: 'hello' }) });

    const store = createStore<MockTarget>()(combine(a, b));

    expect(store.state).toMatchObject({ count: 0, label: 'hello' });
  });

  it('calls attach for each slice', () => {
    const attachA = vi.fn(({ target, set }) => set({ count: target.value }));
    const attachB = vi.fn(({ target, set }) => set({ label: target.label }));

    const a = slice({ state: () => ({ count: 0 }), attach: attachA });
    const b = slice({ state: () => ({ label: '' }), attach: attachB });

    const store = createStore<MockTarget>()(combine(a, b));

    store.attach(new MockTarget());

    expect(attachA).toHaveBeenCalledOnce();
    expect(attachB).toHaveBeenCalledOnce();
    expect(store.state).toMatchObject({ count: 7, label: 'attached' });
  });

  it('requires a target that satisfies every slice', () => {
    const needsNumber = defineSlice<{ value: number }>()({ state: () => ({}) });
    const needsLabel = defineSlice<{ label: string }>()({ state: () => ({}) });
    const combined = combine(needsNumber, needsLabel);

    assertType<InferSliceTarget<typeof combined>>({ value: 1, label: 'ready' });
    // @ts-expect-error A combined target must satisfy both slices.
    assertType<InferSliceTarget<typeof combined>>({ value: 1 });
  });

  it('catches and reports attach errors via onError callback', () => {
    const error = new Error('attach failed');
    const onError = vi.fn();
    const attachB = vi.fn();

    const a = slice({
      state: () => ({ count: 0 }),
      attach: () => {
        throw error;
      },
    });
    const b = slice({ state: () => ({ label: '' }), attach: attachB });

    const store = createStore<MockTarget>()(combine(a, b), { onError });

    store.attach(new MockTarget());

    expect(attachB).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith({ store, error });
  });

  it('warns on duplicate state keys in __DEV__ mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const a = slice({ state: () => ({ count: 0 }) });
    const b = slice({ state: () => ({ count: 1 }) });

    createStore<MockTarget>()(combine(a, b));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('duplicate state key "count"'));

    warn.mockRestore();
  });

  it('combines keys preserved on detach', () => {
    const a = slice({
      preserve: ['label'],
      state: ({ set }) => ({ label: 'initial', setLabel: (label: string) => set({ label }) }),
    });
    const b = slice({ state: ({ set }) => ({ count: 0, setCount: (count: number) => set({ count }) }) });
    const store = createStore<MockTarget>()(combine(a, b));
    const detach = store.attach(new MockTarget());

    store.setLabel('configured');
    store.setCount(1);
    detach();

    expect(store.label).toBe('configured');
    expect(store.count).toBe(0);
  });

  it('warns on state/derived overlap and publishes the derived value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const overlapping = defineSlice<MockTarget>()({
      state: () => ({ count: 1 }),
      derived: { count: () => 2 },
    });

    const store = createStore<MockTarget>()(combine(overlapping));

    expect(store.count).toBe(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('state and derived key "count" overlap'));
    warn.mockRestore();
  });

  it('warns on duplicate derived keys and uses the later formula', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = slice({ state: () => ({}), derived: { label: () => 'first' } });
    const b = slice({ state: () => ({}), derived: { label: () => 'second' } });

    const store = createStore<MockTarget>()(combine(a, b));

    expect(store.label).toBe('second');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('duplicate derived key "label"'));
    warn.mockRestore();
  });
});
