import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { createLearnedMixture, trainMixtureModel } from '../learned/mixture.ts';
import { createLearned, trainModel } from '../learned/model.ts';
import { BASELINES } from '../predictors/roster.ts';
import { parseRecords, type TransferRecord } from '../record.ts';
import { formatReport } from '../scorer/report.ts';
import { type BucketScore, scoreRecords } from '../scorer/score.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string', default: 'recordings/model.json' },
    /** Print each fold's full report, not just the side-by-side summary. */
    verbose: { type: 'boolean', default: false },
    /** Hold out one `recording` at a time, or every recording served by one `cdn`. */
    by: { type: 'string', default: 'recording' },
  },
});

if (positionals.length === 0) {
  console.error('Usage: pnpm train <recordings.jsonl...> [--out recordings/model.json] [--verbose]');
  process.exit(1);
}

const records = positionals.flatMap((path) => parseRecords(readFileSync(path, 'utf8')));
const recordings = [...new Set(records.map((r) => r.recording))];
const groupOf = groupingFor(values.by!, records);
const groups = [...new Set(recordings.map(groupOf))];
const folds: Array<{ heldOut: string; scores: Record<string, BucketScore> }> = [];

// Leave one group out: train on the rest, score every predictor on the held-out group.
for (const heldOut of groups) {
  const training = records.filter((r) => groupOf(r.recording) !== heldOut);
  const model = trainModel(training);
  const mixture = trainMixtureModel(training);
  const result = scoreRecords(
    records.filter((r) => groupOf(r.recording) === heldOut),
    [...BASELINES, () => createLearned(model), () => createLearnedMixture(mixture)]
  );
  const scores = Object.fromEntries(
    Object.entries(result.predictors).flatMap(([name, buckets]) => (buckets.all ? [[name, buckets.all]] : []))
  );
  if (Object.keys(scores).length === 0) continue;

  folds.push({ heldOut, scores });

  if (values.verbose) console.log(`\n=== Held out: ${heldOut}\n${formatReport(result)}`);
}

console.log(`\nLeave-one-${values.by}-out over ${folds.length} held-out groups with network transfers.`);
console.log(pooledTable());
console.log(`\nRelative pinball per held-out recording (lower is better; * = best in that recording):`);
console.log(foldMatrix());

const out = resolve(values.out!);
const mixtureOut = out.replace(/\.json$/, '-mix.json');

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(trainModel(records), null, 2)}\n`);
writeFileSync(mixtureOut, `${JSON.stringify(trainMixtureModel(records), null, 2)}\n`);
console.log(`\nFinal models trained on all ${recordings.length} recordings: ${out}, ${mixtureOut}`);

/** Maps a recording to its fold: itself, or the CDN serving most of its segments. */
function groupingFor(by: string, all: readonly TransferRecord[]): (recording: string) => string {
  if (by === 'recording') return (recording) => recording;

  if (by !== 'cdn') throw new Error(`--by must be recording or cdn, not ${by}`);

  const cdnByRecording = new Map<string, string>();

  for (const recording of new Set(all.map((r) => r.recording))) {
    const counts = new Map<string, number>();

    for (const r of all) {
      if (r.recording !== recording || r.kind !== 'segment') continue;

      const cdn = r.origin.cdn ?? r.origin.host;

      counts.set(cdn, (counts.get(cdn) ?? 0) + 1);
    }

    cdnByRecording.set(recording, [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown');
  }

  return (recording) => cdnByRecording.get(recording) ?? 'unknown';
}

/** Scores pooled across folds, weighted by each fold's target count. Median log error is a weighted mean of medians. */
function pooledTable(): string {
  const names = Object.keys(folds[0]?.scores ?? {});
  const header = ['predictor', 'n', 'cov p10', 'cov p50', 'cov p90', '~med |ln err|', 'rel pinball', 'best in'];
  const rows = names.map((name) => {
    const entries = folds.map((f) => f.scores[name]).filter((s): s is BucketScore => s !== undefined);
    const n = entries.reduce((sum, s) => sum + s.n, 0);
    const weighted = (pick: (s: BucketScore) => number) => entries.reduce((sum, s) => sum + pick(s) * s.n, 0) / n;
    const wins = folds.filter((f) => bestIn(f.scores) === name).length;

    return [
      name,
      String(n),
      ...[0, 1, 2].map((i) => weighted((s) => s.coverage[i]!).toFixed(2)),
      weighted((s) => s.medianAbsLogError).toFixed(3),
      weighted((s) => s.relativePinball).toFixed(3),
      `${wins}/${folds.length}`,
    ];
  });

  return table(header, rows);
}

function foldMatrix(): string {
  const names = Object.keys(folds[0]?.scores ?? {});
  const header = ['predictor', ...folds.map((f) => f.heldOut.replace(/^asset-/, ''))];
  const rows = names.map((name) => [
    name,
    ...folds.map((f) => {
      const score = f.scores[name];

      return score ? `${score.relativePinball.toFixed(3)}${bestIn(f.scores) === name ? '*' : ''}` : '-';
    }),
  ]);

  return table(header, rows);
}

function bestIn(scores: Record<string, BucketScore>): string | undefined {
  return Object.entries(scores).sort((a, b) => a[1].relativePinball - b[1].relativePinball)[0]?.[0];
}

function table(header: string[], rows: string[][]): string {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i]!)).join('  ');

  return [line(header), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}
