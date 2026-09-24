import { renderCompiledFile } from './render';
import type { RenderJob, RenderResult } from './render-pool';

/** Render pool worker: turns one file's Tailwind output into its final CSS, reporting a failure instead of throwing it. */
export default function renderJob(job: RenderJob): RenderResult {
  try {
    return { css: renderCompiledFile(job.css, job.scope, job.file) };
  } catch (error) {
    const failure = error instanceof Error ? error : new Error(String(error));

    return { error: { name: failure.name, message: failure.message, stack: failure.stack } };
  }
}
