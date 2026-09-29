// Exits while it loads, before Piscina marks the worker ready, which leaves Piscina's queued jobs pending.
process.exit(0);

export default function renderJob() {
  return { css: '' };
}
