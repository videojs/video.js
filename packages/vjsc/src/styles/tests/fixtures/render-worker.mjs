// Speaks the render pool's worker protocol: echoes the job's CSS with its scope, throws for `throw`, exits for `crash`.
import { parentPort } from 'node:worker_threads';

parentPort.on('message', (job) => {
  if (job.css === 'crash') process.exit(1);

  if (job.css === 'throw') {
    const error = new TypeError('Tailwind did not emit the semantic style.');

    parentPort.postMessage({ id: job.id, error: { name: error.name, message: error.message, stack: error.stack } });
    return;
  }

  parentPort.postMessage({ id: job.id, css: `${job.scope ?? ''}{${job.css}}` });
});
