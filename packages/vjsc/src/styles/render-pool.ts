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

/**
 * A worker's answer: the file's CSS, or `failed` when rendering it threw. Workers report render errors rather than
 * throw them, so a rejected job always means a failed worker.
 */
export type RenderResult = { readonly css: string } | { readonly failed: true };

export interface RenderPool {
  /**
   * Render one file on a worker. `renderInProcess` renders it on the main thread instead: every job once the workers
   * fail, and a job whose render failed, so its error is thrown there with its own class and fields.
   */
  render(job: RenderJob, renderInProcess: () => string): Promise<string>;
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

  // Piscina rejects the jobs of a worker that exits, but a worker that fails to load or exits before it is ready leaves
  // them pending, so either aborts every job in flight.
  const failure = new AbortController();
  let pool: Piscina<RenderJob, RenderResult> | undefined;

  const stop = (): void => {
    if (failure.signal.aborted) return;

    failure.abort();
    pool?.destroy().catch(() => undefined);
  };

  return {
    async render(job, renderInProcess) {
      if (failure.signal.aborted) return renderInProcess();

      let result: RenderResult;

      try {
        pool ??= createPiscina(size, workerFile, stop);
        result = await pool.run(job, { signal: failure.signal });
      } catch {
        stop();
        return renderInProcess();
      }

      // Rendering is pure, so the main thread fails the same way and throws the error itself.
      return 'css' in result ? result.css : renderInProcess();
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

  let ready = 0;
  let removed = 0;

  // Piscina announces each worker once it is ready and every worker it removes, so removing more than it announced
  // means one was lost before it was ready.
  pool.on('workerCreate', () => {
    ready += 1;
  });
  pool.on('workerDestroy', () => {
    removed += 1;

    if (removed > ready) stop();
  });
  pool.on('error', stop);

  return pool;
}
