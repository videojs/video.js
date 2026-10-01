import { describe, expect, it, vi } from 'vite-plus/test';

import { SerialRunner, Task } from '../../tasks/task';
import { createMachineActor } from '../create-machine-actor';

// =============================================================================
// Helpers
// =============================================================================

function makeCounter() {
  return createMachineActor<
    'idle' | 'running',
    { count: number },
    { type: 'increment' } | { type: 'start' } | { type: 'stop' }
  >({
    initial: 'idle',
    context: { count: 0 },
    states: {
      idle: {
        on: {
          increment: (_, { context, setContext }) => setContext({ count: context.count + 1 }),
          start: (_, { transition }) => transition('running'),
        },
      },
      running: {
        on: {
          stop: (_, { transition }) => transition('idle'),
        },
      },
    },
  });
}

// =============================================================================
// createMachineActor — core behavior
// =============================================================================

describe('createMachineActor', () => {
  it('starts with the initial status and context', () => {
    const actor = makeCounter();

    expect(actor.snapshot.get().value).toBe('idle');
    expect(actor.snapshot.get().context).toEqual({ count: 0 });

    actor.destroy();
  });

  it('dispatches messages to the correct state handler', () => {
    const handler = vi.fn();
    const actor = createMachineActor({
      initial: 'idle' as const,
      context: {},
      states: {
        idle: { on: { ping: handler } },
      },
    });

    actor.send({ type: 'ping' });
    expect(handler).toHaveBeenCalledOnce();

    actor.destroy();
  });

  it('passes message, context, transition, and setContext to handlers', () => {
    let captured: { msg: unknown; ctx: unknown } | undefined;
    const actor = createMachineActor({
      initial: 'idle' as const,
      context: { value: 42 },
      states: {
        idle: {
          on: {
            go: (msg, ctx) => {
              captured = { msg, ctx };
            },
          },
        },
      },
    });

    actor.send({ type: 'go' });

    expect(captured).toBeDefined();
    expect((captured!.msg as { type: string }).type).toBe('go');
    expect((captured!.ctx as { context: unknown }).context).toEqual({ value: 42 });
    expect(typeof (captured!.ctx as { transition: unknown }).transition).toBe('function');
    expect(typeof (captured!.ctx as { setContext: unknown }).setContext).toBe('function');

    actor.destroy();
  });

  it('transitions status via transition()', () => {
    const actor = makeCounter();

    actor.send({ type: 'start' });

    expect(actor.snapshot.get().value).toBe('running');

    actor.destroy();
  });

  it('updates context via setContext()', () => {
    const actor = makeCounter();

    actor.send({ type: 'increment' });
    actor.send({ type: 'increment' });

    expect(actor.snapshot.get().context.count).toBe(2);

    actor.destroy();
  });

  it('handler receives context value at dispatch time', () => {
    const observed: number[] = [];
    const actor = createMachineActor({
      initial: 'idle' as const,
      context: { count: 0 },
      states: {
        idle: {
          on: {
            read: (_, { context }) => {
              observed.push(context.count);
            },
            set: (_, { setContext }) => setContext({ count: 99 }),
          },
        },
      },
    });

    actor.send({ type: 'read' }); // sees 0
    actor.send({ type: 'set' });
    actor.send({ type: 'read' }); // sees 99

    expect(observed).toEqual([0, 99]);

    actor.destroy();
  });

  it('drops messages with no handler in the current state', () => {
    const actor = makeCounter();

    actor.send({ type: 'start' }); // → running
    // 'increment' has no handler in 'running'
    expect(() => actor.send({ type: 'increment' })).not.toThrow();
    expect(actor.snapshot.get().context.count).toBe(0);

    actor.destroy();
  });

  it('drops messages when the state has no on map', () => {
    const actor = createMachineActor({
      initial: 'idle' as const,
      context: {},
      states: {
        idle: {},
      },
    });

    expect(() => actor.send({ type: 'anything' } as never)).not.toThrow();

    actor.destroy();
  });

  it('snapshot is reactive — status and context changes are tracked', () => {
    const actor = makeCounter();

    const before = actor.snapshot.get();

    actor.send({ type: 'increment' });
    actor.send({ type: 'start' });
    const after = actor.snapshot.get();

    expect(before.value).toBe('idle');
    expect(before.context.count).toBe(0);
    expect(after.value).toBe('running');
    expect(after.context.count).toBe(1);

    actor.destroy();
  });
});

// =============================================================================
// createMachineActor — destroy
// =============================================================================

describe('createMachineActor — destroy', () => {
  it('transitions to destroyed on destroy()', () => {
    const actor = makeCounter();

    actor.destroy();

    expect(actor.snapshot.get().value).toBe('destroyed');
  });

  it('destroy() is idempotent', () => {
    const actor = makeCounter();

    actor.destroy();
    expect(() => actor.destroy()).not.toThrow();
    expect(actor.snapshot.get().value).toBe('destroyed');
  });

  it('drops send() after destroy()', () => {
    const handler = vi.fn();
    const actor = createMachineActor({
      initial: 'idle' as const,
      context: {},
      states: { idle: { on: { ping: handler } } },
    });

    actor.destroy();
    actor.send({ type: 'ping' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('destroys the runner on destroy()', () => {
    const runner = new SerialRunner();
    const destroySpy = vi.spyOn(runner, 'destroy');

    const actor = createMachineActor({
      runner: () => runner,
      initial: 'idle' as const,
      context: {},
      states: { idle: {} },
    });

    actor.destroy();

    expect(destroySpy).toHaveBeenCalledOnce();
  });
});

// =============================================================================
// createMachineActor — runner and onSettled
// =============================================================================

describe('createMachineActor — runner', () => {
  it('provides the runner to handlers when a runner factory is given', () => {
    let capturedRunner: unknown;
    const actor = createMachineActor({
      runner: () => new SerialRunner(),
      initial: 'idle' as const,
      context: {},
      states: {
        idle: {
          on: {
            go: (_, ctx) => {
              capturedRunner = ctx.runner;
            },
          },
        },
      },
    });

    actor.send({ type: 'go' });

    expect(capturedRunner).toBeDefined();
    expect(typeof (capturedRunner as { schedule: unknown }).schedule).toBe('function');
    expect(typeof (capturedRunner as { abortAll: unknown }).abortAll).toBe('function');

    actor.destroy();
  });

  it('omits runner from handler context when no runner factory is given', () => {
    let capturedCtx: Record<string, unknown> | undefined;
    const actor = createMachineActor({
      initial: 'idle' as const,
      context: {},
      states: {
        idle: {
          on: {
            go: (_, ctx) => {
              capturedCtx = ctx as Record<string, unknown>;
            },
          },
        },
      },
    });

    actor.send({ type: 'go' });

    expect(capturedCtx).toBeDefined();
    expect(capturedCtx).not.toHaveProperty('runner');

    actor.destroy();
  });

  it('transitions to onSettled state when the runner settles', async () => {
    const actor = createMachineActor<'idle' | 'loading', Record<string, never>, { type: 'load' }, () => SerialRunner>({
      runner: () => new SerialRunner(),
      initial: 'idle',
      context: {},
      states: {
        idle: {
          on: {
            load: (_, { transition, runner }) => {
              runner.schedule(new Task(async () => {}));
              transition('loading');
            },
          },
        },
        loading: {
          onSettled: 'idle',
        },
      },
    });

    actor.send({ type: 'load' });
    expect(actor.snapshot.get().value).toBe('loading');

    await vi.waitFor(() => {
      expect(actor.snapshot.get().value).toBe('idle');
    });

    actor.destroy();
  });

  it('onSettled is a no-op when the state changes before the runner settles', async () => {
    let resolveTask!: () => void;
    const actor = createMachineActor<
      'idle' | 'loading' | 'cancelled',
      Record<string, never>,
      { type: 'load' } | { type: 'cancel' },
      () => SerialRunner
    >({
      runner: () => new SerialRunner(),
      initial: 'idle',
      context: {},
      states: {
        idle: {
          on: {
            load: (_, { transition, runner }) => {
              runner.schedule(
                new Task(async () => {
                  await new Promise<void>((r) => {
                    resolveTask = r;
                  });
                })
              );
              transition('loading');
            },
          },
        },
        loading: {
          onSettled: 'idle',
          on: {
            cancel: (_, { transition }) => transition('cancelled'),
          },
        },
        cancelled: {},
      },
    });

    actor.send({ type: 'load' });
    // Wait for the task to actually start running so resolveTask is assigned
    await vi.waitFor(() => expect(resolveTask).toBeDefined());

    actor.send({ type: 'cancel' });
    expect(actor.snapshot.get().value).toBe('cancelled');

    // Unblock the task — the settled callback fires but the state check prevents transition
    resolveTask();
    await new Promise((r) => setTimeout(r, 10));

    expect(actor.snapshot.get().value).toBe('cancelled'); // not 'idle'

    actor.destroy();
  });

  it('onSettled generation-token: rescheduling supersedes the stale callback', async () => {
    let resolveFirst!: () => void;
    let resolveReplacement!: () => void;

    const actor = createMachineActor<'idle' | 'loading', Record<string, never>, { type: 'load' }, () => SerialRunner>({
      runner: () => new SerialRunner(),
      initial: 'idle',
      context: {},
      states: {
        idle: {
          on: {
            load: (_, { transition, runner }) => {
              runner.schedule(
                new Task(async () => {
                  await new Promise<void>((r) => {
                    resolveFirst = r;
                  });
                })
              );
              transition('loading');
            },
          },
        },
        loading: {
          onSettled: 'idle',
          on: {
            load: (_, { runner }) => {
              runner.abortAll();
              runner.schedule(
                new Task(
                  () =>
                    new Promise<void>((resolve) => {
                      resolveReplacement = resolve;
                    })
                )
              );
            },
          },
        },
      },
    });

    try {
      actor.send({ type: 'load' });
      await vi.waitFor(() => expect(resolveFirst).toBeDefined());
      actor.send({ type: 'load' });
      resolveFirst();

      await vi.waitFor(() => expect(resolveReplacement).toBeDefined());
      expect(actor.snapshot.get().value).toBe('loading');

      resolveReplacement();
      await vi.waitFor(() => expect(actor.snapshot.get().value).toBe('idle'));
    } finally {
      resolveFirst?.();
      resolveReplacement?.();
      actor.destroy();
    }
  });
});
