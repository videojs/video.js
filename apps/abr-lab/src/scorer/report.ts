import { type Bucket, QUANTILES, type ScoreResult } from './score.ts';

const BUCKET_ORDER: readonly Bucket[] = [
  'all',
  'back-to-back',
  'after-idle',
  'solo',
  'concurrent',
  'edge-hit',
  'cdn-miss',
  'origin',
];

/** A plain-text table of a score result, for the terminal. */
export function formatReport(result: ScoreResult): string {
  const header = [
    'predictor',
    'bucket',
    'n',
    ...QUANTILES.map((q) => `cov p${q * 100}`),
    'med |ln err|',
    'rel pinball',
  ];
  const rows: string[][] = [];

  for (const [name, buckets] of Object.entries(result.predictors)) {
    for (const bucket of BUCKET_ORDER) {
      const score = buckets[bucket];
      if (!score) continue;

      rows.push([
        name,
        bucket,
        String(score.n),
        ...score.coverage.map((c) => c.toFixed(2)),
        score.medianAbsLogError.toFixed(3),
        score.relativePinball.toFixed(3),
      ]);
    }
  }

  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i]!)).join('  ');
  const regimes = Object.entries(result.regimes)
    .map(([regime, count]) => `${regime}=${count}`)
    .join(' ');
  const { truePositive, falsePositive, falseNegative, trueNegative } = result.localCheck;
  const checked = truePositive + falsePositive + falseNegative + trueNegative;

  return [
    `Scored ${result.targets} segment transfers that went over the network. Segment regimes: ${regimes}`,
    checked > 0
      ? `Local-cache heuristic vs CDP truth (${checked}): TP=${truePositive} FP=${falsePositive} FN=${falseNegative} TN=${trueNegative}`
      : 'No CDP ground truth in these records.',
    'Calibrated coverage reads 0.10 / 0.50 / 0.90. A point estimate has one value at every quantile, so its three coverages match.',
    '',
    line(header),
    line(widths.map((w) => '-'.repeat(w))),
    ...rows.map(line),
  ].join('\n');
}
