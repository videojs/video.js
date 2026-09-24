import { parentPort } from 'node:worker_threads';

import { renderCompiledFile } from './render';
import type { RenderJob, RenderResult } from './render-pool';

/** Render pool worker: turns one file's Tailwind output into its final CSS. */
parentPort?.on('message', (job: RenderJob) => {
  let result: RenderResult;

  try {
    result = { id: job.id, css: renderCompiledFile(job.css, job.scope, job.file) };
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));

    result = { id: job.id, error: { name: failure.name, message: failure.message, stack: failure.stack } };
  }

  parentPort?.postMessage(result);
});
