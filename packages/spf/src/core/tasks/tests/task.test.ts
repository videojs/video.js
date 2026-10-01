import { describe, expect, it, vi } from 'vite-plus/test';

import { ConcurrentRunner, RecurringRunner, type Reschedule, runOnce, SerialRunner, Task } from '../task';

// =============================================================================
// Task
// =============================================================================

describe('Task', () => {
  describe('status lifecycle', () => {
    it('starts in pending status', () => {
      const task = new Task(async () => {});

      expect(task.status).toBe('pending');
    });

    it('transitions to running when run() is called', async () => {
      let capturedStatus: string | undefined;

      const task = new Task(async () => {
        capturedStatus = task.status;
      });

      await task.run();

      expect(capturedStatus).toBe('running');
    });
  });

  describe('value and error', () => {
    it('sets value before transitioning to done', async () => {
      // The ordering guarantee: value is written before status changes.
      // After run() resolves, both are correct — the guarantee is structural
      // (sequential assignment with no async gap between the two writes).
      const task = new Task(async () => 99);

      await task.run();
      expect(task.value).toBe(99);
      expect(task.status).toBe('done');
    });

    it('sets error before transitioning to error status', async () => {
      const err = new Error('fail');
      const task = new Task<void, Error>(async () => {
        throw err;
      });

      await expect(task.run()).rejects.toThrow('fail');
      expect(task.error).toBe(err);
      expect(task.status).toBe('error');
    });

    it('value is undefined before completion', () => {
      const task = new Task(async () => 42);

      expect(task.value).toBeUndefined();
    });

    it('error is undefined before failure', () => {
      const task = new Task(async () => {});

      expect(task.error).toBeUndefined();
    });

    it('value is undefined for Task<void>', async () => {
      const task = new Task(async () => {});

      await task.run();
      expect(task.value).toBeUndefined();
    });
  });

  describe('abort', () => {
    it('passes signal to run function', async () => {
      let receivedSignal: AbortSignal | undefined;

      const task = new Task(async (signal) => {
        receivedSignal = signal;
      });

      await task.run();
      expect(receivedSignal).toBeInstanceOf(AbortSignal);
    });

    it('aborts the signal when abort() is called', async () => {
      let receivedSignal: AbortSignal | undefined;

      const task = new Task(async (signal) => {
        receivedSignal = signal;
        // Simulate async work
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
      });

      const runPromise = task.run();

      task.abort();
      await runPromise;

      expect(receivedSignal?.aborted).toBe(true);
    });

    it('composes external signal — external abort aborts the task signal', async () => {
      const external = new AbortController();
      let receivedSignal: AbortSignal | undefined;

      const task = new Task(
        async (signal) => {
          receivedSignal = signal;
          await new Promise<void>((resolve) => setTimeout(resolve, 10));
        },
        { signal: external.signal }
      );

      const runPromise = task.run();

      external.abort();
      await runPromise;

      expect(receivedSignal?.aborted).toBe(true);
    });

    it('internal abort still works when external signal is provided', async () => {
      const external = new AbortController();
      let receivedSignal: AbortSignal | undefined;

      const task = new Task(
        async (signal) => {
          receivedSignal = signal;
          await new Promise<void>((resolve) => setTimeout(resolve, 10));
        },
        { signal: external.signal }
      );

      const runPromise = task.run();

      task.abort();
      await runPromise;

      expect(receivedSignal?.aborted).toBe(true);
    });
  });

  describe('id', () => {
    it('uses provided string id', () => {
      const task = new Task(async () => {}, { id: 'my-task' });

      expect(task.id).toBe('my-task');
    });

    it('calls provided function id once at construction', () => {
      const idFn = vi.fn(() => 'fn-task-id');
      const task = new Task(async () => {}, { id: idFn });

      expect(task.id).toBe('fn-task-id');
      expect(idFn).toHaveBeenCalledTimes(1);
    });

    it('generates a unique id when none provided', () => {
      const t1 = new Task(async () => {});
      const t2 = new Task(async () => {});

      expect(typeof t1.id).toBe('string');
      expect(t1.id).not.toBe(t2.id);
    });
  });

  describe('memoization', () => {
    it('runs the work at most once and shares the result across run() calls', async () => {
      const work = vi.fn(async () => 42);
      const task = new Task(work);

      const [a, b] = await Promise.all([task.run(), task.run()]);
      const c = await task.run(); // after settle

      expect(work).toHaveBeenCalledTimes(1);
      expect([a, b, c]).toEqual([42, 42, 42]);
    });

    it('shares the rejection across run() calls', async () => {
      const err = new Error('boom');
      const work = vi.fn(async () => {
        throw err;
      });
      const task = new Task<void, Error>(work);

      await expect(task.run()).rejects.toBe(err);
      await expect(task.run()).rejects.toBe(err);
      expect(work).toHaveBeenCalledTimes(1);
    });
  });

  describe('clone', () => {
    it('produces a fresh, pending task with the same id and work', async () => {
      let runs = 0;
      const original = new Task<number>(async () => ++runs, { id: 'x' });

      await original.run();

      const cloned = original.clone();

      expect(cloned).not.toBe(original);
      expect(cloned.id).toBe('x');
      expect(cloned.status).toBe('pending');

      // The clone re-executes the same work (a fresh memoization).
      await expect(cloned.run()).resolves.toBe(2);
      expect(runs).toBe(2);
    });

    it('gives the clone an independent abort scope', async () => {
      const signals: AbortSignal[] = [];
      const original = new Task(async (signal) => {
        signals.push(signal);
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
      });

      const cloned = original.clone();
      const run = cloned.run();

      cloned.abort();
      await run;

      expect(cloned.signal.aborted).toBe(true);
      expect(original.signal.aborted).toBe(false);
      original.abort();
      expect(signals).toHaveLength(1);
      expect(signals[0]?.aborted).toBe(true);
    });

    it('carries the run value forward as the clone’s `previous`', async () => {
      const original = new Task<number>(async () => 1, { id: 'x' });

      expect(original.previous).toBeUndefined();
      await original.run();

      const cloned = original.clone();

      expect(cloned.previous).toBe(1);
    });

    it.each([null, undefined])('carries the latest successful nullish value as `previous`: %s', async (latest) => {
      let value: number | null | undefined = 7;
      const original = new Task(async () => value);

      await original.run();
      const cloned = original.clone();

      value = latest;
      await cloned.run();

      expect(cloned.clone().previous).toBe(latest);
    });

    it('preserves the last successful `previous` across an errored cycle', async () => {
      let n = 0;
      // Cycle 1 → 1, cycle 2 → throws, cycle 3 → 3.
      const run = async () => {
        n += 1;

        if (n === 2) throw new Error('boom');

        return n;
      };
      const c1 = new Task<number>(run, { id: 'x' });

      await c1.run();
      const c2 = c1.clone(); // previous = 1

      await c2.run().catch(() => {});
      const c3 = c2.clone(); // errored cycle keeps previous = 1

      expect(c3.previous).toBe(1);
    });
  });
});

// =============================================================================
// ConcurrentRunner
// =============================================================================

describe('ConcurrentRunner', () => {
  it('executes a scheduled task', async () => {
    const runner = new ConcurrentRunner();
    const ran = vi.fn();
    const task = new Task(async () => {
      ran();
    });

    runner.schedule(task);
    await vi.waitFor(() => expect(ran).toHaveBeenCalledTimes(1));
  });

  it('deduplicates: ignores second schedule for same id while first is in flight', async () => {
    const runner = new ConcurrentRunner();
    const ran = vi.fn();

    let resolveFirst!: () => void;
    const first = new Task(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
      { id: 'track-1' }
    );
    const second = new Task(
      async () => {
        ran();
      },
      { id: 'track-1' }
    );

    const p1 = runner.schedule(first);
    const p2 = runner.schedule(second); // same id — should return existing promise

    expect(p2).toBe(p1); // deduplicated: same promise returned

    resolveFirst();
    await vi.waitFor(() => expect(first.status).toBe('done'));

    // second was never run
    expect(ran).not.toHaveBeenCalled();
    expect(second.status).toBe('pending');
  });

  it('whenSettled fires after all tasks complete', async () => {
    const runner = new ConcurrentRunner();
    const cb = vi.fn();

    let resolveA!: () => void;
    let resolveB!: () => void;
    const a = new Task(
      () =>
        new Promise<void>((r) => {
          resolveA = r;
        }),
      { id: 'a' }
    );
    const b = new Task(
      () =>
        new Promise<void>((r) => {
          resolveB = r;
        }),
      { id: 'b' }
    );

    runner.schedule(a);
    runner.schedule(b);
    await vi.waitFor(() => expect(resolveA).toBeDefined());
    await vi.waitFor(() => expect(resolveB).toBeDefined());

    runner.whenSettled(cb);
    expect(cb).not.toHaveBeenCalled();

    resolveA();
    await vi.waitFor(() => expect(a.status).toBe('done'));
    expect(cb).not.toHaveBeenCalled(); // b still in flight

    resolveB();
    await vi.waitFor(() => expect(cb).toHaveBeenCalledOnce());
  });

  it('whenSettled does not fire when runner is already idle', async () => {
    const runner = new ConcurrentRunner();
    const cb = vi.fn();

    runner.whenSettled(cb);
    await Promise.resolve();

    expect(cb).not.toHaveBeenCalled();
  });

  it('whenSettled is superseded by abortAll()', async () => {
    const runner = new ConcurrentRunner();
    const cb = vi.fn();
    let release!: () => void;
    const task = new Task(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
      { id: 'x' }
    );
    const scheduled = runner.schedule(task);

    runner.whenSettled(cb);

    try {
      runner.abortAll();
      expect(task.signal.aborted).toBe(true);
    } finally {
      release();
      await scheduled;
      await Promise.resolve();
      runner.destroy();
    }

    expect(cb).not.toHaveBeenCalled();
  });

  it('whenSettled fires for a new batch registered after abortAll()', async () => {
    const runner = new ConcurrentRunner();
    const cb = vi.fn();

    runner.schedule(new Task(async () => {}, { id: 'first' }));
    runner.abortAll();

    runner.schedule(new Task(async () => {}, { id: 'second' }));
    runner.whenSettled(cb);

    await vi.waitFor(() => expect(cb).toHaveBeenCalledOnce());
  });

  it('destroy() aborts all in-flight tasks', async () => {
    const runner = new ConcurrentRunner();
    let signal: AbortSignal | undefined;
    const task = new Task(
      async (s) => {
        signal = s;
        await new Promise(() => {});
      },
      { id: 'x' }
    );

    runner.schedule(task);
    await vi.waitFor(() => expect(signal).toBeDefined());

    runner.destroy();
    expect(signal!.aborted).toBe(true);
  });

  it('abortAll() cancels all in-flight tasks', async () => {
    const runner = new ConcurrentRunner();
    let signal1: AbortSignal | undefined;
    let signal2: AbortSignal | undefined;

    const t1 = new Task(
      async (s) => {
        signal1 = s;
        await new Promise(() => {});
      },
      { id: 'a' }
    );
    const t2 = new Task(
      async (s) => {
        signal2 = s;
        await new Promise(() => {});
      },
      { id: 'b' }
    );

    runner.schedule(t1);
    runner.schedule(t2);

    await vi.waitFor(() => expect(signal1).toBeDefined());
    await vi.waitFor(() => expect(signal2).toBeDefined());

    runner.abortAll();

    expect(signal1!.aborted).toBe(true);
    expect(signal2!.aborted).toBe(true);
  });
});

// =============================================================================
// SerialRunner
// =============================================================================

describe('SerialRunner', () => {
  it('executes tasks in submission order', async () => {
    const runner = new SerialRunner();
    const order: number[] = [];

    let resolveFirst!: () => void;
    const first = new Task(
      () =>
        new Promise<void>((resolve) => {
          order.push(1); // recorded when first starts
          resolveFirst = resolve;
        }),
      { id: '1' }
    );
    const second = new Task(
      async () => {
        order.push(2);
      },
      { id: '2' }
    );

    const p1 = runner.schedule(first);
    const p2 = runner.schedule(second);

    await vi.waitFor(() => expect(first.status).toBe('running'));
    resolveFirst();
    await Promise.all([p1, p2]);

    expect(order).toEqual([1, 2]);
  });

  it('second task does not start until first completes', async () => {
    const runner = new SerialRunner();
    let secondStarted = false;

    let resolveFirst!: () => void;
    const first = new Task(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
      { id: '1' }
    );
    const second = new Task(
      async () => {
        secondStarted = true;
      },
      { id: '2' }
    );

    runner.schedule(first);
    runner.schedule(second);

    // Before first resolves, second should not have started
    await Promise.resolve();
    expect(secondStarted).toBe(false);
    expect(second.status).toBe('pending');

    resolveFirst();
    await vi.waitFor(() => expect(second.status).toBe('done'));
    expect(secondStarted).toBe(true);
  });

  it('schedule() resolves with the task return value', async () => {
    const runner = new SerialRunner();
    const task = new Task(async () => 'result');
    const value = await runner.schedule(task);

    expect(value).toBe('result');
  });

  it('schedule() rejects when the task throws', async () => {
    const runner = new SerialRunner();
    const task = new Task(async () => {
      throw new Error('task failed');
    });

    await expect(runner.schedule(task)).rejects.toThrow('task failed');
  });

  it('continues processing after a task error', async () => {
    const runner = new SerialRunner();
    const failing = new Task(
      async () => {
        throw new Error('fail');
      },
      { id: 'bad' }
    );
    const succeeding = new Task(async () => 'ok', { id: 'good' });

    await expect(runner.schedule(failing)).rejects.toThrow('fail');
    await expect(runner.schedule(succeeding)).resolves.toBe('ok');
  });

  it('abortAll() aborts queued tasks before they start', async () => {
    const runner = new SerialRunner();

    let resolveFirst!: () => void;
    const first = new Task(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        }),
      { id: '1' }
    );

    let receivedSignal: AbortSignal | undefined;
    const second = new Task(
      async (signal) => {
        receivedSignal = signal;
      },
      { id: '2' }
    );

    runner.schedule(first);
    const p2 = runner.schedule(second);

    await vi.waitFor(() => expect(first.status).toBe('running'));

    // Abort while second is still queued
    runner.abortAll();
    resolveFirst();

    // second runs but receives an already-aborted signal
    await p2;
    expect(receivedSignal?.aborted).toBe(true);
  });

  it('abortPending() aborts queued tasks but not the in-flight task', async () => {
    const runner = new SerialRunner();

    let resolveFirst!: () => void;
    let firstSignal: AbortSignal | undefined;
    const first = new Task(
      async (signal) => {
        firstSignal = signal;
        await new Promise<void>((resolve) => {
          resolveFirst = resolve;
        });
      },
      { id: '1' }
    );

    let secondSignal: AbortSignal | undefined;
    const second = new Task(
      async (signal) => {
        secondSignal = signal;
      },
      { id: '2' }
    );

    runner.schedule(first);
    const p2 = runner.schedule(second);

    await vi.waitFor(() => expect(first.status).toBe('running'));

    runner.abortPending();

    // In-flight task is unaffected
    expect(firstSignal?.aborted).toBe(false);

    // Queued task receives aborted signal when it runs
    resolveFirst();
    await p2;
    expect(secondSignal?.aborted).toBe(true);
  });

  it('abortAll() aborts the in-flight task', async () => {
    const runner = new SerialRunner();
    let taskSignal: AbortSignal | undefined;

    const task = new Task(
      async (signal) => {
        taskSignal = signal;
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
      },
      { id: '1' }
    );

    runner.schedule(task);
    await vi.waitFor(() => expect(task.status).toBe('running'));

    runner.abortAll();

    expect(taskSignal?.aborted).toBe(true);
  });
});

describe('RecurringRunner', () => {
  /**
   * A reschedule that parks forever, rejecting only when its signal aborts — so a recurrence stays "live" (awaiting)
   * until superseded or aborted.
   */
  const parkUntilAborted: Reschedule<number> = (task) =>
    new Promise<boolean>((_resolve, reject) => {
      task.signal.addEventListener('abort', () => reject(task.signal.reason), { once: true });
    });

  /** Flush pending macrotasks so "did NOT happen" assertions are meaningful. */
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('runs the task exactly once with the runOnce reschedule', async () => {
    let runs = 0;
    const task = new Task<number>(async () => ++runs, { id: 'x' });
    const runner = new RecurringRunner<number>(runOnce);

    runner.schedule(task);
    await vi.waitFor(() => expect(runs).toBe(1));

    await flush();
    expect(runs).toBe(1);
  });

  it('re-runs (a clone of) the task while reschedule resolves true, stops on false', async () => {
    let runs = 0;
    // The runner clones per cycle; the clones share this run fn's `runs` counter.
    const task = new Task<number>(async () => ++runs, { id: 'x' });
    const runner = new RecurringRunner<number>(async (t) => (await t.run()) < 3); // continue while < 3

    runner.schedule(task);
    await vi.waitFor(() => expect(runs).toBe(3));

    await flush();
    expect(runs).toBe(3);
  });

  it('observes the run and receives the previous successful value', async () => {
    let n = 0;
    const task = new Task<number>(async () => ++n, { id: 'x' });
    const seen: Array<[number, number | undefined]> = [];
    const runner = new RecurringRunner<number>(async (t) => {
      const current = await t.run(); // observe via the memoized run

      seen.push([current, t.previous]); // `previous` carried forward by the clone
      return current < 2;
    });

    runner.schedule(task);
    await vi.waitFor(() => expect(seen.length).toBe(2));

    expect(seen).toEqual([
      [1, undefined],
      [2, 1],
    ]);
  });

  it('rejects and stops the recurrence when a run errors (no swallowing/retry)', async () => {
    let n = 0;
    const task = new Task<number>(async () => {
      n += 1;

      if (n === 1) throw new Error('boom');

      return n;
    });
    // A reschedule that would otherwise keep going — but a run error ends it.
    const runner = new RecurringRunner<number>(async () => true);

    // The first cycle's error propagates out of schedule(); the recurrence stops.
    await expect(runner.schedule(task)).rejects.toThrow('boom');

    await flush();
    expect(n).toBe(1); // no retry — the errored run was terminal

    runner.destroy();
  });

  it('aborts an in-flight run when superseded by a new id', async () => {
    let aborted = false;
    const slow = new Task<number>(
      (signal) =>
        new Promise<number>((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
      { id: 'a' }
    );
    let ranB = false;
    const taskB = new Task<number>(
      async () => {
        ranB = true;
        return 1;
      },
      { id: 'b' }
    );
    const runner = new RecurringRunner<number>(parkUntilAborted);

    runner.schedule(slow); // parks mid-run, listening for abort
    runner.schedule(taskB); // new id → abort slow's in-flight run, run B
    expect(aborted).toBe(true);

    await vi.waitFor(() => expect(ranB).toBe(true));
    runner.destroy();
  });

  it('ignores a schedule with the same id — the existing recurrence keeps running', async () => {
    let runsA = 0;
    const taskA = new Task<number>(async () => ++runsA, { id: 'x' });
    let runsB = 0;
    const taskB = new Task<number>(async () => ++runsB, { id: 'x' }); // same id
    const runner = new RecurringRunner<number>(parkUntilAborted);

    runner.schedule(taskA);
    await vi.waitFor(() => expect(runsA).toBe(1)); // A ran once, parked

    runner.schedule(taskB); // same id while A is live → ignored
    await flush();
    expect(runsB).toBe(0);
    expect(runsA).toBe(1);

    runner.destroy();
  });

  it('a new id aborts the prior recurrence and takes over the slot', async () => {
    let runsA = 0;
    const taskA = new Task<number>(async () => ++runsA, { id: 'a' });
    let runsB = 0;
    const taskB = new Task<number>(async () => ++runsB, { id: 'b' });
    const runner = new RecurringRunner<number>(parkUntilAborted);

    runner.schedule(taskA);
    await vi.waitFor(() => expect(runsA).toBe(1)); // A parked

    runner.schedule(taskB); // new id → abort A, run B
    await vi.waitFor(() => expect(runsB).toBe(1));

    await flush();
    expect(runsA).toBe(1); // A did not re-run

    runner.destroy();
  });

  it('frees the slot when a recurrence stops, so the same id can start fresh', async () => {
    let runs = 0;
    // Fresh instances per schedule (the real pattern — callers build a new task
    // each time); a shared counter observes runs across both.
    const make = () => new Task<number>(async () => ++runs, { id: 'x' });
    const runner = new RecurringRunner<number>(async () => false); // stop after first run

    runner.schedule(make());
    await vi.waitFor(() => expect(runs).toBe(1));
    await flush(); // let the loop run reschedule → false → free the slot

    runner.schedule(make()); // not deduped (recurrence ended) → runs fresh
    await vi.waitFor(() => expect(runs).toBe(2));

    runner.destroy();
  });

  it('abortAll stops the recurrence; no re-run', async () => {
    let runs = 0;
    const task = new Task<number>(async () => ++runs, { id: 'x' });
    const runner = new RecurringRunner<number>(parkUntilAborted);

    const scheduled = runner.schedule(task);

    await vi.waitFor(() => expect(runs).toBe(1));

    try {
      runner.abortAll();
      expect(task.signal.aborted).toBe(true);
      await expect(scheduled).resolves.toBeUndefined();
      await flush();
      expect(runs).toBe(1);
    } finally {
      task.abort();
      await scheduled;
      runner.destroy();
    }
  });

  it('does not run after destroy', async () => {
    let runs = 0;
    const task = new Task<number>(async () => ++runs, { id: 'x' });
    const runner = new RecurringRunner<number>(async () => true);

    runner.destroy();
    runner.schedule(task);
    await flush();
    expect(runs).toBe(0);
  });
});
