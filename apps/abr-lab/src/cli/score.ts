import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

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
    json: { type: 'boolean', default: false },
    'idle-ms': { type: 'string', default: '1000' },
    recording: { type: 'string' },
  },
});

if (positionals.length === 0) {
  console.error('Usage: pnpm score <recordings.jsonl...> [--recording <prefix>] [--idle-ms 1000] [--json]');
  process.exit(1);
}

const factories: PredictorFactory[] = [createSpfDualEwma, () => createHarmonicMean(5), () => createLognormal()];
const records = positionals
  .flatMap((path) => parseRecords(readFileSync(path, 'utf8')))
  .filter((r) => values.recording === undefined || r.recording.startsWith(values.recording));
const result = scoreRecords(records, factories, { idleThresholdMs: Number(values['idle-ms']) });

console.log(values.json ? JSON.stringify(result, null, 2) : formatReport(result));
