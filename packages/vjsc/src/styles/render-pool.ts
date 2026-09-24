import { existsSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { Piscina } from 'piscina';

import type { StyleOutputFile } from './output';

/** One file whose Tailwind output the pool renders into its final CSS. */
export interface RenderJob {
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

/** A worker's answer. Workers report render errors rather than throw them, so a failed job always means a failed worker. */
export type RenderResult = { readonly css: string } | { readonly error: SerializedError };

export interface RenderPool {
  /** Render one file on a worker, or in process with `fallback` when the workers fail. */
  render(job: RenderJob, fallback: () => string): Promise<string>;
}

const WORKER_FILE = join(dirname(fileURLToPath(import.meta.url)), 'render-worker.js');

/** Long enough to keep a worker between a build's bursts of renders, short enough to free it in an idle dev server. */
const IDLE_TIMEOUT = 10_000;

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

/**
 * A pool of up to `size` workers running `workerFile`, which Piscina starts as jobs arrive and lets idle ones exit with
 * the process. The first job whose worker cannot start, receive it, or stay alive renders on the main thread, and so
 * does every job after it.
 */
export function createRenderPool(size: number, workerFile: string): RenderPool | null {
  if (size === 0) return null;

  // Piscina rejects the jobs of a worker that exits, but a worker that fails to load leaves them pending, so a pool
  // error aborts every job in flight.
  const failure = new AbortController();
  let pool: Piscina<RenderJob, RenderResult> | undefined;

  const stop = (): void => {
    if (failure.signal.aborted) return;

    failure.abort();
    pool?.destroy().catch(() => undefined);
  };

  return {
    async render(job, fallback) {
      if (failure.signal.aborted) return fallback();

      let result: RenderResult;

      try {
        pool ??= createPiscina(size, workerFile, stop);
        result = await pool.run(job, { signal: failure.signal });
      } catch {
        stop();
        return fallback();
      }

      if ('css' in result) return result.css;

      throw workerError(result.error);
    },
  };
}

function createPiscina(size: number, workerFile: string, stop: () => void): Piscina<RenderJob, RenderResult> {
  const pool = new Piscina<RenderJob, RenderResult>({
    filename: pathToFileURL(workerFile).href,
    minThreads: 0,
    maxThreads: size,
    idleTimeout: IDLE_TIMEOUT,
  });

  pool.on('error', stop);

  return pool;
}

function workerError(serialized: SerializedError): Error {
  const error = new Error(serialized.message);

  error.name = serialized.name;

  if (serialized.stack) error.stack = serialized.stack;

  return error;
}
