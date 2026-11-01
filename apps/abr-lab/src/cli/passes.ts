import { readFileSync } from 'node:fs';

import { bodyRateBps, durationMs, latencyMs, parseRecords, type TransferRecord } from '../record.ts';

/** Side-by-side delivery summary per recording, e.g. the passes of one `record --repeat` run. */
const paths = process.argv.slice(2);

if (paths.length === 0) {
  console.error('Usage: pnpm passes <recordings.jsonl...>');
  process.exit(1);
}

const records = paths.flatMap((path) => parseRecords(readFileSync(path, 'utf8')));
const recordings = [...new Set(records.map((r) => r.recording))];
const header = [
  'recording',
  'segments',
  'local',
  'edge hit',
  'shield hit',
  'both miss',
  'ttfb p50',
  'total p50',
  'body Mbps p50',
];
const rows = recordings.map((name) => {
  const segments = records.filter((r) => r.recording === name && r.kind === 'segment' && r.t.end !== undefined);
  const local = segments.filter(isLocal);
  const network = segments.filter((r) => !isLocal(r));
  const tiers = (r: TransferRecord) => r.cache?.tiers ?? [];

  return [
    name,
    String(segments.length),
    String(local.length),
    String(network.filter((r) => tiers(r).at(-1) === 'HIT').length),
    String(network.filter((r) => tiers(r).at(-1) !== 'HIT' && tiers(r)[0] === 'HIT').length),
    String(network.filter((r) => tiers(r).length > 0 && tiers(r).every((t) => t.startsWith('MISS'))).length),
    `${median(network.map(latencyMs)).toFixed(0)} ms`,
    `${median(network.map(durationMs)).toFixed(0)} ms`,
    (median(network.map(bodyRateBps)) / 1e6).toFixed(0),
  ];
});
const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i]!)).join('  ');

console.log(
  ['Video and audio segments. "local" is DevTools ground truth; tiers come from response headers.', '']
    .concat(line(header), line(widths.map((w) => '-'.repeat(w))), rows.map(line))
    .join('\n')
);

function isLocal(record: TransferRecord): boolean {
  return !!(record.truth?.fromDiskCache || record.truth?.fromMemoryCache || record.truth?.fromServiceWorker);
}

function median(values: Array<number | undefined>): number {
  const sorted = values.filter((v): v is number => v !== undefined && Number.isFinite(v)).sort((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
}
