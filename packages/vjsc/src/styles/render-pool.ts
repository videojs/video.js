import { existsSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

import type { StyleOutputFile } from './output';

/** One file whose Tailwind output the pool renders into its final CSS. */
export interface RenderJob {
  readonly id: number;
  readonly css: string;
  readonly scope: string | undefined;
  readonly file: StyleOutputFile;
}

/** An error a worker threw, in a form that crosses threads with its stack intact. */
export interface SerializedError {
  readonly name: string;
  readonly message: string;
  readonly stack?: string | undefined;
}

export type RenderResult =
  | { readonly id: number; readonly css: string }
  | { readonly id: number; readonly error: SerializedError };

export interface RenderPool {
  /** Render one file on a worker, or in process with `fallback` when the workers fail. */
  render(job: Omit<RenderJob, 'id'>, fallback: () => string): Promise<string>;
}

interface PooledWorker {
  readonly worker: Worker;
  readonly pending: Map<number, PendingJob>;
}

interface PendingJob {
  resolve(css: string): void;
  reject(error: Error): void;
  readonly fallback: () => string;
}

const WORKER_FILE = join(dirname(fileURLToPath(import.meta.url)), 'render-worker.js');

let shared: RenderPool | null | undefined;

/**
 * The process's CSS render workers, or `null` when rendering stays on the main thread. Rendering a file is pure and
 * CPU-bound, and a build renders many while its transforms wait on Tailwind, so a worker lets the main thread keep
 * transforming. One worker absorbs the skins build's rendering; more only add CPU. Workers run from the built package
 * only. `VJSC_RENDER_WORKERS` sets their number, and `0` keeps rendering on the main thread.
 */
export function renderPool(): RenderPool | null {
  shared ??= existsSync(WORKER_FILE) ? createRenderPool(workerCount(), WORKER_FILE) : null;
  return shared;
}

function workerCount(): number {
  const configured = Number(process.env.VJSC_RENDER_WORKERS);
  if (process.env.VJSC_RENDER_WORKERS && Number.isInteger(configured) && configured >= 0) return configured;

  return Math.min(1, availableParallelism() - 1);
}

/** A pool of up to `size` workers running `workerFile`, spawned as jobs arrive. */
export function createRenderPool(size: number, workerFile: string): RenderPool | null {
  if (size === 0) return null;

  const workers: PooledWorker[] = [];
  let nextId = 0;
  let failed = false;

  const spawn = (): PooledWorker => {
    const pooled: PooledWorker = { worker: new Worker(workerFile), pending: new Map() };

    pooled.worker.unref();
    pooled.worker.on('message', (result: RenderResult) => settle(pooled, result));
    // A worker that fails or exits takes no more jobs; the ones it held render on the main thread instead.
    pooled.worker.on('error', () => abandon(pooled));
    pooled.worker.on('exit', () => abandon(pooled));
    workers.push(pooled);

    return pooled;
  };

  const settle = (pooled: PooledWorker, result: RenderResult): void => {
    const job = pooled.pending.get(result.id);
    if (!job) return;

    pooled.pending.delete(result.id);

    // An idle worker must not keep the process alive; a busy one must, or its pending job never settles.
    if (pooled.pending.size === 0) pooled.worker.unref();

    if ('css' in result) job.resolve(result.css);
    else job.reject(workerError(result.error));
  };

  // A crashing worker reports both `error` and `exit`; only the first abandons it.
  const abandon = (pooled: PooledWorker): void => {
    const index = workers.indexOf(pooled);
    if (index < 0) return;

    failed = true;
    workers.splice(index, 1);
    pooled.worker.unref();
    void pooled.worker.terminate();

    for (const job of pooled.pending.values()) runInProcess(job);

    pooled.pending.clear();
  };

  const pick = (): PooledWorker =>
    workers.find((candidate) => candidate.pending.size === 0) ??
    (workers.length < size ? spawn() : workers.reduce((a, b) => (b.pending.size < a.pending.size ? b : a)));

  return {
    render(job, fallback) {
      if (failed) return Promise.resolve().then(fallback);

      return new Promise<string>((resolve, reject) => {
        const pending: PendingJob = { resolve, reject, fallback };
        let pooled: PooledWorker | undefined;

        try {
          pooled = pick();

          const id = nextId++;

          if (pooled.pending.size === 0) pooled.worker.ref();

          pooled.pending.set(id, pending);
          pooled.worker.postMessage({ id, ...job } satisfies RenderJob);
        } catch {
          // A worker that cannot start or receive a job leaves rendering on the main thread, this job included.
          failed = true;

          if (pooled) abandon(pooled);
          else runInProcess(pending);
        }
      });
    },
  };
}

function runInProcess(job: PendingJob): void {
  try {
    job.resolve(job.fallback());
  } catch (error) {
    job.reject(error instanceof Error ? error : new Error(String(error)));
  }
}

function workerError(serialized: SerializedError): Error {
  const error = new Error(serialized.message);

  error.name = serialized.name;

  if (serialized.stack) error.stack = serialized.stack;

  return error;
}
