import { anyAbortSignal } from '@videojs/utils/events';
import { generateId } from '@videojs/utils/string';

// =============================================================================
// DeepReadonly
// =============================================================================

/** Recursively marks all properties as readonly. */
export type DeepReadonly<T> = T extends (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

// =============================================================================
// Task
// =============================================================================

export type TaskStatus = 'pending' | 'running' | 'done' | 'error';

/** Configuration for a Task. */
export interface TaskConfig {
  /**
   * Identifier for this task. - string: used as-is - () => string: called once at construction time - undefined: a
   * unique ID is generated via generateId()
   */
  id?: string | (() => string);

  /**
   * Optional external AbortSignal to compose with the task's internal one. The task's work is aborted when either the
   * internal controller (via abort()) or this external signal fires — whichever comes first.
   */
  signal?: AbortSignal;
}

/** Minimal contract for a schedulable unit of async work. */
export interface TaskLike<TValue = void, TError = unknown> {
  readonly id: string;
  readonly status: TaskStatus;
  readonly value: DeepReadonly<TValue> | undefined;
  readonly error: DeepReadonly<TError> | undefined;
  /**
   * The last successful value carried forward from the run this was `clone()`d from — the prior cycle's result for a
   * `RecurringRunner` (undefined for an original, or until the lineage has produced a success).
   */
  readonly previous: DeepReadonly<TValue> | undefined;
  /**
   * The signal this task's work runs under (its own abort composed with any external one). Aborting the task fires it —
   * so a `reschedule` can wait on it to have its delay cancelled when the recurrence is aborted.
   */
  readonly signal: AbortSignal;
  /** Run the work, memoized: repeated calls share one execution + result. */
  run(): Promise<TValue>;
  abort(): void;
  /** A fresh, structurally identical task (same work + id) in a pending state — for re-running. */
  clone(): TaskLike<TValue, TError>;
}

/**
 * Generic reusable task that wraps an async run function.
 *
 * Owns its own AbortController so it can always be aborted independently. Optionally composes an external AbortSignal
 * so that a parent's cancellation propagates into the task's work without requiring the caller to track the task
 * separately.
 *
 * `run()` is memoized: the work runs at most once per instance, and every call returns the same promise (so observers
 * can `await run()` to read the result without re-triggering the work). To re-run the _same_ work, take a `clone()` — a
 * fresh instance with its own AbortController and a pending state.
 *
 * Ordering guarantee: `value` is written before `status` transitions to `'done'`; `error` is written before `status`
 * transitions to `'error'`. Any reader observing `status === 'done'` is guaranteed `value` is already present.
 */
export class Task<TValue = void, TError = unknown> implements TaskLike<TValue, TError> {
  readonly id: string;
  readonly #runFn: (signal: AbortSignal) => Promise<TValue>;
  readonly #externalSignal: AbortSignal | undefined;
  readonly #abortController = new AbortController();
  readonly #signal: AbortSignal;

  #status: TaskStatus = 'pending';
  #value: TValue | undefined = undefined;
  #error: TError | undefined = undefined;
  #previous: TValue | undefined = undefined;
  #promise: Promise<TValue> | undefined = undefined;

  constructor(runFn: (signal: AbortSignal) => Promise<TValue>, config?: TaskConfig) {
    this.#runFn = runFn;
    const rawId = config?.id;

    this.id = typeof rawId === 'function' ? rawId() : (rawId ?? generateId());
    this.#externalSignal = config?.signal;
    this.#signal = config?.signal
      ? anyAbortSignal([this.#abortController.signal, config.signal])
      : this.#abortController.signal;
  }

  get status(): TaskStatus {
    return this.#status;
  }

  get value(): DeepReadonly<TValue> | undefined {
    return this.#value as DeepReadonly<TValue> | undefined;
  }

  get error(): DeepReadonly<TError> | undefined {
    return this.#error as DeepReadonly<TError> | undefined;
  }

  get previous(): DeepReadonly<TValue> | undefined {
    return this.#previous as DeepReadonly<TValue> | undefined;
  }

  get signal(): AbortSignal {
    return this.#signal;
  }

  run(): Promise<TValue> {
    // Memoized: run the work once, sharing the same promise across calls. The
    // memoized promise IS what callers await, so it's always handled (no orphan
    // `Promise.resolve/reject`); a sync-throwing `#runFn` is captured as a
    // rejection rather than re-run.
    this.#promise ??= this.#execute();
    return this.#promise;
  }

  async #execute(): Promise<TValue> {
    this.#status = 'running';

    try {
      const result = await this.#runFn(this.#signal);

      this.#value = result; // value before status — ordering guarantee
      this.#status = 'done';
      return result;
    } catch (e) {
      this.#error = e as TError; // error before status — ordering guarantee
      this.#status = 'error';
      throw e;
    }
  }

  abort(): void {
    this.#abortController.abort();
  }

  /**
   * A fresh task with the same work, id, and external signal, in a pending state (its own AbortController, no memoized
   * result) — so it can be run again. Used to re-run structurally identical work (e.g. `RecurringRunner` reloads).
   *
   * The clone inherits this run's value as its `previous` (or this run's own `previous` if it never produced one — e.g.
   * it errored), so a recurrence's `previous` always tracks the last _successful_ value across the lineage with no
   * bookkeeping in the runner.
   */
  clone(): Task<TValue, TError> {
    const cloned = new Task<TValue, TError>(this.#runFn, { id: this.id, signal: this.#externalSignal });

    cloned.#previous = this.#status === 'done' ? this.#value : this.#previous;
    return cloned;
  }
}

// =============================================================================
// ConcurrentRunner
// =============================================================================

/**
 * Runs tasks concurrently, deduplicated by task id.
 *
 * If a task with a given id is already in flight, subsequent schedule() calls for that id are silently ignored until
 * the first completes. Tasks are stored so abortAll() can cancel any in-flight work (e.g. on engine cleanup).
 */
export class ConcurrentRunner {
  readonly #pending = new Map<string, { task: TaskLike<unknown, unknown>; promise: Promise<unknown> }>();
  #settled: Promise<void> = Promise.resolve();
  #resolveSettled: (() => void) | null = null;
  #destroyed = false;

  schedule<TValue = void, TError = unknown>(task: TaskLike<TValue, TError>): Promise<TValue> {
    if (this.#destroyed) return Promise.resolve() as Promise<TValue>;

    const existing = this.#pending.get(task.id);
    if (existing) return existing.promise as Promise<TValue>;

    if (this.#pending.size === 0) {
      this.#settled = new Promise((resolve) => {
        this.#resolveSettled = resolve;
      });
    }

    const promise = task.run();

    // Suppress unhandled rejection for callers that ignore the return value.
    promise.catch(() => {});
    // Cleanup: update pending and resolve settled regardless of outcome.
    const cleanup = () => {
      this.#pending.delete(task.id);

      if (this.#pending.size === 0) {
        this.#resolveSettled?.();
        this.#resolveSettled = null;
      }
    };

    promise.then(cleanup, cleanup);

    this.#pending.set(task.id, { task: task as TaskLike<unknown, unknown>, promise: promise as Promise<unknown> });
    return promise;
  }

  /**
   * Registers a callback to fire when all currently in-flight tasks settle. If the runner is already idle, the callback
   * is never called. If abortAll() is called before the batch settles, the callback is superseded and silently dropped
   * — no stale callbacks, no generation token required by the caller.
   */
  whenSettled(callback: () => void): void {
    if (this.#pending.size === 0) return;

    const captured = this.#settled;

    captured.then(
      () => {
        if (this.#settled !== captured) return;

        callback();
      },
      () => {}
    );
  }

  abortAll(): void {
    for (const { task } of this.#pending.values()) task.abort();

    this.#pending.clear();
    // Resolve the current settled promise so any .then() handlers are queued,
    // then replace the reference — whenSettled callbacks that captured the old
    // reference will see the identity mismatch and be dropped.
    this.#resolveSettled?.();
    this.#resolveSettled = null;
    this.#settled = Promise.resolve();
  }

  destroy(): void {
    this.#destroyed = true;
    this.abortAll();
  }
}

// =============================================================================
// SerialRunner
// =============================================================================

/**
 * Runs tasks one at a time in submission order.
 *
 * Each schedule() call returns a Promise that resolves or rejects with the task's result when it is eventually
 * executed. Tasks wait in queue until the prior task completes.
 *
 * Serialization is achieved by chaining each task's run() onto the tail of a shared promise chain — no explicit queue
 * or drain loop needed.
 *
 * AbortAll() aborts all pending (not yet started) tasks and the currently in-flight task. Pending tasks still run
 * briefly but receive an aborted signal and are expected to exit early.
 */
export class SerialRunner {
  #chain: Promise<unknown> = Promise.resolve();
  readonly #pending = new Set<TaskLike<unknown, unknown>>();
  #current: TaskLike<unknown, unknown> | null = null;
  #destroyed = false;

  schedule<TValue = void, TError = unknown>(task: TaskLike<TValue, TError>): Promise<TValue> {
    if (this.#destroyed) return Promise.resolve() as Promise<TValue>;

    const t = task as TaskLike<unknown, unknown>;

    this.#pending.add(t);

    const result = this.#chain
      .then(() => {
        this.#pending.delete(t);
        this.#current = t;
        return task.run();
      })
      .finally(() => {
        this.#current = null;
      });

    // Advance the chain regardless of whether this task succeeds or fails.
    this.#chain = result.then(
      () => {},
      () => {}
    );

    return result as Promise<TValue>;
  }

  /**
   * A promise that resolves when all currently-scheduled tasks have settled. Use the reference as a generation token:
   * capture it after scheduling a batch, then check identity in the resolution callback to detect whether a subsequent
   * abortAll() + new batch has superseded this one.
   */
  get settled(): Promise<void> {
    return this.#chain as Promise<void>;
  }

  /**
   * Registers a callback to fire when all currently-pending tasks settle. If the runner is already idle (no pending or
   * running tasks), the callback is never called. If new tasks are scheduled before the current batch settles, the
   * callback is superseded and silently dropped — no stale callbacks, no generation token required by the caller.
   */
  whenSettled(callback: () => void): void {
    if (this.#pending.size === 0 && this.#current === null) return;

    const currentChain = this.#chain;

    currentChain.then(
      () => {
        if (this.#chain !== currentChain) return;

        callback();
      },
      () => {}
    );
  }

  /** Aborts and clears queued tasks without touching the in-flight task. */
  abortPending(): void {
    for (const task of this.#pending) task.abort();

    this.#pending.clear();
  }

  abortAll(): void {
    this.abortPending();
    this.#current?.abort();
  }

  destroy(): void {
    this.#destroyed = true;
    this.abortAll();
  }
}

// =============================================================================
// RecurringRunner
// =============================================================================

/**
 * Decides whether — and _when_ — a {@link RecurringRunner} re-runs its task. Invoked **concurrently with the run** (so
 * the inter-run interval can be measured from when the run _started_, not when it finished) with the single
 * {@link TaskLike}, which carries everything a decision needs:
 *
 * - `task.run()` — the in-flight run, observable via this memoized call (does not re-trigger work), e.g. to read its
 *   result for a cadence/stop decision.
 * - `task.previous` — the prior successful run's value (`undefined` on the first), for decisions that compare consecutive
 *   results.
 * - `task.signal` — aborts the wait (and the recurrence) when the task is.
 *
 * Resolves `true` to re-run (after whatever delay it owns) or `false` to stop. The runner deals only in this awaitable
 * verdict — _how_ the delay is produced (a timer, a frame, an event) and _when_ it's measured from live entirely in the
 * reschedule function, so the runner itself knows nothing about time. See `delayedReschedule` for the common
 * timer-based, start-anchored implementation.
 */
export type Reschedule<TValue> = (task: TaskLike<TValue>) => PromiseLike<boolean>;

/**
 * A {@link Reschedule} that never recurs — the task runs exactly once. Pass it to a {@link RecurringRunner} for
 * non-recurring, run-once work (e.g. resolving a complete VoD playlist that can never go stale).
 */
export const runOnce: Reschedule<unknown> = () => Promise.resolve(false);

/**
 * Runs a task, then re-runs it whenever a {@link Reschedule} function says to, until it says stop (or it's aborted) —
 * the recurring sibling of {@link ConcurrentRunner} / {@link SerialRunner}, and like them it's handed a
 * {@link TaskLike} to run.
 *
 * The runner has no notion of time: it just awaits whatever `reschedule` returns (resolves `true` → re-run; `false` →
 * stop). A `reschedule` is required; pass {@link runOnce} for non-recurring, run-exactly-once work.
 *
 * Single-slot, keyed by task **id**: there is always at most one identified active task for re-running. Scheduling a
 * task whose id matches the active one is a no-op — the existing recurrence keeps running (dedup by id). Scheduling a
 * task with a _different_ id aborts the prior task's in-flight run and pending reschedule, then takes over the slot
 * (abort-and-replace) — the right shape when there's one logical unit of recurring work (e.g. reloading the _selected_
 * track's media playlist).
 *
 * Each re-run is a fresh `clone()` of the task (since `Task.run()` is memoized — the same instance won't re-execute),
 * carrying the same id so the slot's identity is stable across cycles. The clone also carries the prior cycle's value
 * forward as `task.previous`. The run function should read any inputs that change between cycles at call time rather
 * than capturing them once.
 *
 * The task is the sole cancellation channel: `abortAll()` aborts the active task, which fires `task.signal` —
 * cancelling both its in-flight run and any pending reschedule delay waiting on that signal. An aborted (or stopped)
 * recurrence frees the slot, so a later schedule of the same id starts fresh.
 */
export class RecurringRunner<TValue = unknown> {
  readonly #reschedule: Reschedule<TValue>;
  // The identified active task — the one being (re)run. Held across cycles
  // (including the inter-cycle wait); null once the recurrence stops/aborts. Also
  // serves as the ownership token: a cycle advances or frees the slot only while
  // `#active` still points at its own task (a supersede/abortAll swaps it).
  #active: TaskLike<TValue, unknown> | null = null;
  #destroyed = false;

  constructor(reschedule: Reschedule<TValue>) {
    this.#reschedule = reschedule;
  }

  /**
   * Run `task` and recur per the `reschedule` verdict, as a single promise. Resolves with the _final_ cycle's value
   * when the recurrence stops; **rejects** if a run (or reschedule) genuinely fails — the rejection propagates to the
   * caller, who owns error handling; the runner only frees its slot (no swallowing). The runner's _own_ cancellation
   * (abort/supersede/destroy) is not a failure, so an aborted recurrence settles quietly rather than rejecting —
   * callers don't have to `.catch` routine teardown.
   *
   * Each cycle runs the task and consults `reschedule` concurrently (so the delay can be measured from the run's
   * start); when both settle and this cycle still owns the slot, a `true` verdict re-schedules a `clone()` whose
   * promise is _returned_ — so the recurrence is the method calling itself, threaded into one promise, no separate
   * loop. The clone shares the id, so the slot's identity is stable across cycles; it's released just before the
   * re-schedule so the call advances rather than dedup-returning.
   *
   * Note: because each cycle's promise adopts the next, the chain retains every prior cycle for the life of the
   * recurrence — bounded for finite recurrences, an unbounded (small per-cycle) cost for a long-lived one (e.g. live
   * reload).
   */
  schedule(task: TaskLike<TValue, unknown>): Promise<TValue> {
    if (this.#destroyed) return Promise.resolve() as Promise<TValue>;

    // Dedup by id: this id is already the active re-run target, so the existing
    // recurrence continues uninterrupted (don't restart it) — hand back its
    // in-flight run.
    if (this.#active?.id === task.id) return this.#active.run();

    // Different id supersedes: abort the prior recurrence, then take over.
    this.#cancel();
    this.#active = task;

    // Drive the run (in case `reschedule` doesn't observe it — e.g. `runOnce`)
    // and the verdict together; a rejected run rejects the whole cycle.
    return Promise.all([task.run(), this.#reschedule(task)]).then(
      ([value, again]) => {
        // Only act while we still own the slot — a supersede/abortAll swapped
        // `#active`, in which case this stale cycle does nothing.
        if (this.#active === task && again && !task.signal.aborted) {
          // Release first so the same-id clone advances (isn't dedup-returned),
          // then chain the next cycle into this promise.
          this.#active = null;
          return this.schedule(task.clone());
        }

        if (this.#active === task) this.#active = null; // natural stop / superseded

        return value;
      },
      (error) => {
        // The recurrence ended on a rejection; free the slot if we still own it.
        if (this.#active === task) this.#active = null;

        // The runner's own cancellation isn't a failure — settle quietly so
        // routine teardown (abort/supersede/destroy) needs no caller `.catch`.
        // A genuine run/reschedule failure propagates to the caller.
        if (task.signal.aborted) return undefined as TValue;

        throw error;
      }
    );
  }

  #cancel(): void {
    this.#active?.abort();
    this.#active = null;
  }

  abortAll(): void {
    this.#cancel();
  }

  destroy(): void {
    this.#destroyed = true;
    this.abortAll();
  }
}
