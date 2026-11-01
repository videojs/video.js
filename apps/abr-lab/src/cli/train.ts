import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { createLearned, trainModel } from '../learned/model.ts';
import { createHarmonicMean } from '../predictors/harmonic-mean.ts';
import { createLognormal } from '../predictors/lognormal.ts';
import type { PredictorFactory } from '../predictors/predictor.ts';
import { createSpfDualEwma } from '../predictors/spf-dual-ewma.ts';
import { parseRecords } from '../record.ts';
import { formatReport } from '../scorer/report.ts';
import { scoreRecords } from '../scorer/score.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: 'string', default: 'recordings/model.json' },
    /** Hold out one recording at a time (by name prefix match on each recording) and score on it. */
    'leave-one-out': { type: 'boolean', default: true },
  },
});

if (positionals.length === 0) {
  console.error('Usage: pnpm train <recordings.jsonl...> [--out recordings/model.json] [--no-leave-one-out]');
  process.exit(1);
}

const records = positionals.flatMap((path) => parseRecords(readFileSync(path, 'utf8')));
const recordings = [...new Set(records.map((r) => r.recording))];
const baselines: PredictorFactory[] = [createSpfDualEwma, () => createHarmonicMean(5), () => createLognormal()];

if (values['leave-one-out'] && recordings.length > 1) {
  for (const heldOut of recordings) {
    const model = trainModel(records.filter((r) => r.recording !== heldOut));
    const result = scoreRecords(
      records.filter((r) => r.recording === heldOut),
      [...baselines, () => createLearned(model)]
    );

    console.log(
      `\n=== Held out: ${heldOut} (trained on ${model.samples.latency} latency / ${model.samples.rate} rate rows)`
    );
    console.log(onlyAll(formatReport(result)));
  }
}

const model = trainModel(records);
const out = resolve(values.out!);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(model, null, 2)}\n`);
console.log(`\nTrained on all ${recordings.length} recordings; wrote ${out}`);
console.log(describeWeights('latency', model.latency));
console.log(describeWeights('rate', model.rate));

/** Keep the header and the `all` rows; per-bucket rows are too thin to read at this sample size. */
function onlyAll(report: string): string {
  return report
    .split('\n')
    .filter((line) => !/^\S+\s{2,}(back-to-back|after-idle|solo|concurrent|edge-hit|cdn-miss|origin)\s/.test(line))
    .join('\n');
}

function describeWeights(label: string, regression: ReturnType<typeof trainModel>['latency']): string {
  const terms = regression.featureNames.map(
    (name, j) =>
      `  ${name.padEnd(20)} mean ${fmt(regression.meanWeights[j + 1]!)}  spread ${fmt(regression.logSigmaWeights[j + 1]!)}`
  );

  return [
    `${label}: intercept mean ${fmt(regression.meanWeights[0]!)}, spread ${fmt(regression.logSigmaWeights[0]!)} (per standardized unit)`,
    ...terms,
  ].join('\n');
}

function fmt(value: number): string {
  return (value >= 0 ? '+' : '') + value.toFixed(3);
}
