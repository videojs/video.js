// Speaks the render pool's worker protocol: echoes the job's CSS with its scope, reports an error for `throw`, and exits
// the worker for `crash`.
export default function renderJob(job) {
  if (job.css === 'crash') process.exit(1);

  if (job.css === 'throw') {
    const error = new TypeError('Tailwind did not emit the semantic style.');

    return { error: { name: error.name, message: error.message, stack: error.stack } };
  }

  return { css: `${job.scope ?? ''}{${job.css}}` };
}
