// Summarizes runs, one summary per label, and compares them with each other or with recorded releases.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';

import { loadRecorded, loadResults, renderMarkdown, type RunSummary, saveToHistory, summarize } from '../report.ts';
import { EVALS_ROOT, fromInvocation } from '../tasks.ts';

const HELP = `Usage: pnpm evals:report <label | run dir>... [options]

  Positional arguments are run directories, or labels meaning every run under results/<label>. Runs are grouped by
  their label; with several labels, each is compared with the first.

  --label <name>      Label for the combined summary of a single group (default: the runs' label)
  --compare <ref>     Compare each label with a label in history/, or latest for the newest other recorded one
  --save              Record each summary in history/
`;

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    label: { type: 'string' },
    compare: { type: 'string' },
    save: { type: 'boolean', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
});

if (options.help || positionals.length === 0) {
  console.log(HELP);
  process.exit(options.help ? 0 : 1);
}

const groups = new Map<string, string[]>();

for (const dir of positionals.flatMap(resolveRuns)) {
  const label = labelFor(dir);

  groups.set(label, [...(groups.get(label) ?? []), dir]);
}

if (options.label && groups.size > 1) throw new Error('--label applies when every run has the same label.');

const summaries: RunSummary[] = [...groups].map(([label, dirs]) =>
  summarize(
    options.label ?? label,
    dirs.map((dir) => relative(EVALS_ROOT, dir)),
    dirs.flatMap(loadResults)
  )
);

summaries.forEach((summary, index) => {
  const baseline = options.compare
    ? loadRecorded(options.compare, summary.label)
    : index > 0
      ? summaries[0]
      : undefined;

  if (options.save) saveToHistory(summary, renderMarkdown(summary));

  console.log(renderMarkdown(summary, baseline));
});

function resolveRuns(ref: string): string[] {
  const dir = fromInvocation(ref);
  if (existsSync(join(dir, 'trials'))) return [dir];

  const labelDir = join(EVALS_ROOT, 'results', ref);
  if (!existsSync(labelDir)) throw new Error(`${ref} is neither a run directory nor a label under results/.`);

  return readdirSync(labelDir)
    .map((name) => join(labelDir, name))
    .filter((candidate) => existsSync(join(candidate, 'trials')));
}

function labelFor(dir: string): string {
  const runJson = join(dir, 'run.json');

  return existsSync(runJson) ? (JSON.parse(readFileSync(runJson, 'utf8')) as { label: string }).label : dir;
}
