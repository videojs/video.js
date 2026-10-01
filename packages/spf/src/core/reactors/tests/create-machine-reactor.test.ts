import { Signal } from 'signal-polyfill';
import { describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../signals/primitives';
import { createMachineReactor } from '../create-machine-reactor';

// One microtask tick — enough for the signal-polyfill watcher to flush pending effects.
const tick = () => new Promise<void>((resolve) => queueMicrotask(resolve));

// =============================================================================
// createMachineReactor — core behavior
// =============================================================================

describe('createMachineReactor', () => {
  it('starts with the initial status', () => {
    const reactor = createMachineReactor({
      initial: 'idle' as const,
      states: { idle: {} },
    });

    expect(reactor.snapshot.get().value).toBe('idle');

    reactor.destroy();
  });

  it('runs the entry effect for the initial state on creation', () => {
    const fn = vi.fn();

    createMachineReactor({
      initial: 'idle' as const,
      states: { idle: { entry: [fn] } },
    }).destroy();

    expect(fn).toHaveBeenCalledOnce();
  });

  it('runs the reaction effect for the initial state on creation', () => {
    const fn = vi.fn();

    createMachineReactor({
      initial: 'idle' as const,
      states: { idle: { effects: [fn] } },
    }).destroy();

    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not run effects for states other than the initial state', () => {
    const otherFn = vi.fn();

    createMachineReactor<'idle' | 'other'>({
      initial: 'idle',
      states: {
        idle: {},
        other: { entry: [otherFn] },
      },
    }).destroy();

    expect(otherFn).not.toHaveBeenCalled();
  });

  it('transitions status via derive', async () => {
    const src = signal(false);
    const reactor = createMachineReactor<'waiting' | 'active'>({
      initial: 'waiting',
      monitor: () => (src.get() ? 'active' : 'waiting'),
      states: {
        waiting: {},
        active: {},
      },
    });

    expect(reactor.snapshot.get().value).toBe('waiting');

    src.set(true);
    await tick();

    expect(reactor.snapshot.get().value).toBe('active');

    reactor.destroy();
  });

  it('activates the correct effects after transition', async () => {
    const src = signal(false);
    const activeFn = vi.fn();

    const reactor = createMachineReactor<'waiting' | 'active'>({
      initial: 'waiting',
      monitor: () => (src.get() ? 'active' : 'waiting'),
      states: {
        waiting: {},
        active: { entry: [activeFn] },
      },
    });

    expect(activeFn).not.toHaveBeenCalled();

    src.set(true);
    await tick();
    await tick(); // second tick: effects for 'active' now run

    expect(activeFn).toHaveBeenCalledOnce();

    reactor.destroy();
  });

  it('multiple entry effects in the same state run independently', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const fn3 = vi.fn();

    createMachineReactor({
      initial: 'idle' as const,
      states: { idle: { entry: [fn1, fn2, fn3] } },
    }).destroy();

    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();
    expect(fn3).toHaveBeenCalledOnce();
  });

  it('re-runs only the reaction whose dependency changed', async () => {
    const src1 = signal(0);
    const src2 = signal(0);
    const fn1 = vi.fn(() => {
      src1.get();
    });
    const fn2 = vi.fn(() => {
      src2.get();
    });

    const reactor = createMachineReactor({
      initial: 'idle' as const,
      states: { idle: { effects: [fn1, fn2] } },
    });

    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).toHaveBeenCalledOnce();

    src1.set(1);
    await tick();

    expect(fn1).toHaveBeenCalledTimes(2);
    expect(fn2).toHaveBeenCalledOnce(); // not re-run — no dependency on src1

    reactor.destroy();
  });

  it('entry effect does not re-run when a signal read inside it changes', async () => {
    const src = signal(0);
    const fn = vi.fn(() => {
      src.get(); // read inside entry — should NOT create a reactive dep
    });

    const reactor = createMachineReactor({
      initial: 'idle' as const,
      states: { idle: { entry: [fn] } },
    });

    expect(fn).toHaveBeenCalledOnce();

    src.set(1);
    await tick();

    expect(fn).toHaveBeenCalledOnce(); // NOT re-run

    reactor.destroy();
  });

  it('snapshot is reactive', async () => {
    const src = signal(false);
    const reactor = createMachineReactor<'waiting' | 'active'>({
      initial: 'waiting',
      monitor: () => (src.get() ? 'active' : 'waiting'),
      states: {
        waiting: {},
        active: {},
      },
    });

    const before = reactor.snapshot.get();

    src.set(true);
    await tick();
    const after = reactor.snapshot.get();

    expect(before.value).toBe('waiting');
    expect(after.value).toBe('active');

    reactor.destroy();
  });
});

// =============================================================================
// createMachineReactor — cleanup
// =============================================================================

describe('createMachineReactor — cleanup', () => {
  it('calls the entry effect cleanup on state exit', async () => {
    const src = signal(false);
    const cleanup = vi.fn();

    const reactor = createMachineReactor<'active' | 'done'>({
      initial: 'active',
      monitor: () => (src.get() ? 'done' : 'active'),
      states: {
        active: {
          // entry: cleanup fires on exit regardless of whether fn is tracked
          entry: [
            () => {
              return cleanup;
            },
          ],
        },
        done: {},
      },
    });

    expect(cleanup).not.toHaveBeenCalled();

    src.set(true);
    await tick();

    expect(cleanup).toHaveBeenCalledOnce();

    reactor.destroy();
  });

  it('calls the reaction cleanup before re-running when a dependency changes', async () => {
    const src = signal(0);
    const cleanup = vi.fn();

    const reactor = createMachineReactor({
      initial: 'idle' as const,
      states: {
        idle: {
          effects: [
            () => {
              src.get();
              return cleanup;
            },
          ],
        },
      },
    });

    expect(cleanup).not.toHaveBeenCalled();

    src.set(1);
    await tick();

    expect(cleanup).toHaveBeenCalledOnce();

    reactor.destroy();
  });

  it('calls effect cleanups on destroy()', () => {
    const entryCleanup = vi.fn();
    const reactionCleanup = vi.fn();

    const reactor = createMachineReactor({
      initial: 'idle' as const,
      states: {
        idle: {
          entry: [() => entryCleanup],
          effects: [() => reactionCleanup],
        },
      },
    });

    reactor.destroy();

    expect(entryCleanup).toHaveBeenCalledOnce();
    expect(reactionCleanup).toHaveBeenCalledOnce();
  });

  it('does not call cleanup for inactive state effects on destroy()', () => {
    const activeCleanup = vi.fn();
    const inactiveCleanup = vi.fn();

    createMachineReactor<'idle' | 'other'>({
      initial: 'idle',
      states: {
        idle: { entry: [() => activeCleanup] },
        other: { entry: [() => inactiveCleanup] },
      },
    }).destroy();

    expect(activeCleanup).toHaveBeenCalledOnce();
    expect(inactiveCleanup).not.toHaveBeenCalled();
  });
});

// =============================================================================
// createMachineReactor — derive
// =============================================================================

describe('createMachineReactor — derive', () => {
  it('does not transition when the derive fn returns the current status', async () => {
    const trigger = signal(0);
    const entry = vi.fn();
    const cleanup = vi.fn();
    const reactor = createMachineReactor({
      initial: 'idle' as const,
      monitor: () => {
        trigger.get();
        return 'idle';
      },
      states: {
        idle: {
          entry: () => {
            entry();
            return cleanup;
          },
        },
      },
    });

    try {
      expect(entry).toHaveBeenCalledOnce();
      trigger.set(1);
      await tick();
      await tick();

      expect(reactor.snapshot.get().value).toBe('idle');
      expect(entry).toHaveBeenCalledOnce();
      expect(cleanup).not.toHaveBeenCalled();
    } finally {
      reactor.destroy();
    }
  });

  it('re-runs when reactive dependencies change', async () => {
    const src = signal<'waiting' | 'active'>('waiting');
    const deriveFn = vi.fn(() => src.get());

    const reactor = createMachineReactor<'waiting' | 'active'>({
      initial: 'waiting',
      monitor: deriveFn,
      states: { waiting: {}, active: {} },
    });

    expect(deriveFn).toHaveBeenCalledOnce();

    src.set('active');
    await tick();

    expect(deriveFn).toHaveBeenCalledTimes(2);

    reactor.destroy();
  });

  it('does not run during destroying or destroyed', async () => {
    const deriveFn = vi.fn(() => 'idle' as const);
    const reactor = createMachineReactor({
      initial: 'idle' as const,
      monitor: deriveFn,
      states: { idle: {} },
    });

    deriveFn.mockClear();
    reactor.destroy();
    await tick();

    expect(deriveFn).not.toHaveBeenCalled();
  });

  it('runs before per-state effects so its transitions take effect first', async () => {
    const src = signal<'waiting' | 'active'>('waiting');
    const order: string[] = [];

    const reactor = createMachineReactor<'waiting' | 'active'>({
      initial: 'waiting',
      monitor: () => {
        order.push('derive');
        return src.get();
      },
      states: {
        waiting: {
          entry: () => {
            order.push('waiting-entry');
          },
        },
        active: {
          entry: () => {
            order.push('active-entry');
          },
        },
      },
    });

    order.length = 0;
    src.set('active');
    await tick();
    await tick();

    expect(order[0]).toBe('derive');
    expect(order).toContain('active-entry');
    expect(order).not.toContain('waiting-entry');

    reactor.destroy();
  });
});

// =============================================================================
// createMachineReactor — destroy
// =============================================================================

describe('createMachineReactor — destroy', () => {
  it('transitions to destroyed on destroy()', () => {
    const reactor = createMachineReactor({
      initial: 'idle' as const,
      states: { idle: {} },
    });

    reactor.destroy();

    expect(reactor.snapshot.get().value).toBe('destroyed');
  });

  it('destroy() is idempotent', () => {
    const reactor = createMachineReactor({
      initial: 'idle' as const,
      states: { idle: {} },
    });

    reactor.destroy();
    expect(() => reactor.destroy()).not.toThrow();
    expect(reactor.snapshot.get().value).toBe('destroyed');
  });

  it('does not run effects after destroy()', async () => {
    const src = signal(0);
    const fn = vi.fn(() => {
      src.get();
    });

    const reactor = createMachineReactor({
      initial: 'idle' as const,
      states: { idle: { effects: [fn] } },
    });

    expect(fn).toHaveBeenCalledOnce();
    const [computation] = Signal.subtle.introspectSinks(src);

    expect(computation).toBeInstanceOf(Signal.Computed);
    // SAFETY: the isolated source is read by this reactor effect only.
    const watched = computation as Signal.Computed<void>;

    expect(Signal.subtle.hasSinks(watched)).toBe(true);
    reactor.destroy();
    expect(Signal.subtle.hasSinks(watched)).toBe(false);
    fn.mockClear();

    src.set(1);
    await tick();

    expect(fn).not.toHaveBeenCalled();
  });
});
