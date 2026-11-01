import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import type { ProbeSample } from './probe.ts';

/**
 * Summarizes a probe sweep as the time each transfer cost beyond serializing its bytes at the link rate, in round
 * trips. A warm, back-to-back request on an ideal link costs 1; everything above that is connection setup, slow start,
 * or slow start restarting after idle.
 */
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { ms: { type: 'boolean', default: false } },
});

const all = positionals.flatMap((path) => readFileSync(path, 'utf8').trim().split('\n').map(parseSample));
const samples = all.filter((s) => s.target === undefined);

// Real targets have no known link, so they are shown as size × idle gap: median headers time / median total time, ms.
for (const target of unique(all.flatMap((s) => (s.target === undefined ? [] : [s.target])))) {
  const own = all.filter((s) => s.target === target);
  const idles = unique(own.map((s) => s.idleMs)).sort((a, b) => a - b);
  const rows = unique(own.map((s) => s.bytes))
    .sort((a, b) => a - b)
    .map((bytes) => [
      formatBytes(bytes),
      ...idles.map((idleMs) => {
        const cell = own.filter((s) => s.bytes === bytes && s.idleMs === idleMs);

        return cell.length === 0
          ? '-'
          : `${median(cell.map((s) => s.headersMs)).toFixed(0)} / ${median(cell.map((s) => s.ms)).toFixed(0)}`;
      }),
    ]);

  console.log(`\n${target}: median headers ms / total ms, by idle gap before the request (ms)`);
  console.log(table(['bytes', ...idles.map(String)], rows));
}

if (samples.length === 0) process.exit(0);

const links = unique(samples.map((s) => `${s.rttMs}/${s.rateKbps}`)).map((key) => key.split('/').map(Number));
const sizes = unique(samples.map((s) => s.bytes)).sort((a, b) => a - b);
const states = unique(samples.map((s) => `${s.state}${s.state === 'warm' ? ` idle ${s.idleMs} ms` : ''}`));

console.log(
  values.ms
    ? 'Median transfer time, ms.'
    : 'Median cost beyond serialization, in RTTs: (time - bytes / rate) / RTT. Columns are RTT ms / rate Mbit/s.'
);

for (const state of states) {
  const header = ['bytes', ...links.map(([rtt, rate]) => `${rtt}/${rate! / 1000}`)];
  const rows = sizes.map((bytes) => [
    formatBytes(bytes),
    ...links.map(([rttMs, rateKbps]) => {
      const cell = samples.filter(
        (s) =>
          s.bytes === bytes &&
          s.rttMs === rttMs &&
          s.rateKbps === rateKbps &&
          `${s.state}${s.state === 'warm' ? ` idle ${s.idleMs} ms` : ''}` === state
      );
      if (cell.length === 0) return '-';

      const ms = median(cell.map((s) => s.ms));
      const serializationMs = rateKbps! > 0 ? (bytes * 8) / rateKbps! : 0;

      return values.ms ? ms.toFixed(0) : rttMs! > 0 ? ((ms - serializationMs) / rttMs!).toFixed(1) : '-';
    }),
  ]);

  console.log(`\n${state}\n${table(header, rows)}`);
}

function parseSample(line: string): ProbeSample {
  // SAFETY: probe files are written only by `probe`, one ProbeSample per line.
  return JSON.parse(line) as ProbeSample;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)]!;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function formatBytes(bytes: number): string {
  return bytes >= 1e6 ? `${bytes / 1e6} MB` : `${bytes / 1e3} kB`;
}

function table(header: string[], rows: string[][]): string {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const line = (cells: string[]) => cells.map((cell, i) => cell.padStart(widths[i]!)).join('  ');

  return [line(header), line(widths.map((w) => '-'.repeat(w))), ...rows.map(line)].join('\n');
}
