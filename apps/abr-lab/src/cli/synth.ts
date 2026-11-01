import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

import { simulateRecording } from '../synthetic/simulate.ts';
import { PROFILES } from '../synthetic/trace.ts';

const { values } = parseArgs({
  options: {
    out: { type: 'string', default: 'recordings/synthetic.jsonl' },
    sessions: { type: 'string', default: '10' },
    minutes: { type: 'string', default: '10' },
    seed: { type: 'string', default: '1' },
  },
});

const sessions = Number(values.sessions);
const durationMs = Number(values.minutes) * 60_000;
const lines: string[] = [];

for (const profile of Object.values(PROFILES)) {
  for (let i = 0; i < sessions; i++) {
    const seed = Number(values.seed) * 1000 + i * 31 + profile.name.length;
    const records = simulateRecording({ recording: `${profile.name}-${i}`, profile, durationMs, seed });

    for (const record of records) lines.push(JSON.stringify(record));
  }
}

const out = resolve(values.out!);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${lines.join('\n')}\n`);
console.log(`Wrote ${lines.length} transfers to ${out}`);
