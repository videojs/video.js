// Speaks the render pool's worker protocol: echoes the job's CSS with its scope, reports a failed render for `throw`,
// and exits the worker for `crash`.
export default function renderJob(job) {
  if (job.css === 'crash') process.exit(1);

  if (job.css === 'throw') return { failed: true };

  return { css: `${job.scope ?? ''}{${job.css}}` };
}
