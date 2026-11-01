import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium } from 'playwright-core';

import { LAB_BROWSER, LAB_ORIGIN, setLinkConditions } from '../netlab.ts';
import { seededRandom } from '../synthetic/trace.ts';

/**
 * Sweeps transfer size × RTT × rate × connection state through the network lab and logs one line per measured fetch.
 * Answers which inputs download time depends on when the link is known exactly, before any model sees it.
 */
const { values } = parseArgs({
  options: {
    name: { type: 'string', default: `probe-${new Date().toISOString().replace(/[:.]/g, '-')}` },
    rtts: { type: 'string', default: '10,40,100,200' },
    /** Link rates, kbit/s. */
    rates: { type: 'string', default: '1500,5000,20000,80000' },
    sizes: { type: 'string', default: '16000,64000,256000,1000000,4000000' },
    /** Idle gaps, ms, before a warm request. 0 is back to back. */
    idles: { type: 'string', default: '0,3000' },
    reps: { type: 'string', default: '3' },
    /** Skips cells whose ideal transfer takes longer than this, seconds. */
    maxSeconds: { type: 'string', default: '15' },
    seed: { type: 'string', default: '1' },
  },
});

export interface ProbeSample {
  rttMs: number;
  rateKbps: number;
  bytes: number;
  /** `fresh` opens a new connection; `warm` reuses one after `idleMs`, primed by a same-size transfer. */
  state: 'fresh' | 'warm';
  idleMs: number;
  rep: number;
  ms: number;
  ttfbMs: number;
  connectMs: number;
  protocol: string;
}

const list = (s: string) => s.split(',').map(Number);
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(appRoot, 'recordings', `${values.name}.jsonl`);
const random = seededRandom(Number(values.seed));
const browser = await chromium.connect(LAB_BROWSER, { timeout: 15_000 });

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, '');

try {
  const page = await (await browser.newContext()).newPage();

  // tsx wraps named functions in an `__name` helper that only exists in Node; `measure` runs in the page.
  await page.addInitScript('globalThis.__name = (fn) => fn');
  await page.goto(`${LAB_ORIGIN}/`, { timeout: 30_000 });

  for (const rttMs of list(values.rtts!)) {
    for (const rateKbps of list(values.rates!)) {
      await setLinkConditions({ rttMs, rateKbps });

      // Shuffled within a link setting, so slow drift in the host can't line up with any one variable.
      const cells = list(values.sizes!)
        .filter((bytes) => rateKbps <= 0 || (bytes * 8) / rateKbps / 1000 <= Number(values.maxSeconds))
        .flatMap((bytes) => [
          { bytes, state: 'fresh' as const, idleMs: 0 },
          ...list(values.idles!).map((idleMs) => ({ bytes, state: 'warm' as const, idleMs })),
        ])
        .flatMap((cell) => Array.from({ length: Number(values.reps) }, (_, rep) => ({ ...cell, rep })))
        .sort(() => random() - 0.5);

      console.log(`rtt ${rttMs} ms, rate ${rateKbps} kbit/s: ${cells.length} samples`);

      for (const cell of cells) {
        const measured = await page.evaluate(measure, cell);
        const sample: ProbeSample = { rttMs, rateKbps, ...cell, ...measured };

        appendFileSync(out, `${JSON.stringify(sample)}\n`);
      }
    }
  }
} finally {
  await setLinkConditions({ rttMs: 0, rateKbps: 0 });
  await browser.close();
}

console.log(`Wrote ${out}`);

/** Runs in the page. A fresh sample follows a request that closed its connection; a warm one follows a same-size fetch. */
async function measure(cell: { bytes: number; state: 'fresh' | 'warm'; idleMs: number }) {
  const fetchOnce = async (bytes: number, goaway: boolean) => {
    const url = `/bytes?n=${bytes}&r=${Math.random()}${goaway ? '&goaway' : ''}`;
    const start = performance.now();
    const response = await fetch(url, { cache: 'no-store' });

    await response.arrayBuffer();

    const ms = performance.now() - start;
    // SAFETY: entries named by a fetched URL are resource entries; timings were cleared before this fetch.
    const entry = performance.getEntriesByName(new URL(url, location.href).href).at(-1) as PerformanceResourceTiming;

    return {
      ms,
      ttfbMs: entry.responseStart - entry.requestStart,
      connectMs: entry.connectEnd - entry.connectStart,
      protocol: entry.nextHopProtocol,
    };
  };

  if (cell.state === 'fresh') {
    await fetchOnce(1000, true);
  } else {
    await fetchOnce(cell.bytes, false);
    await new Promise((resolve) => setTimeout(resolve, cell.idleMs));
  }

  performance.clearResourceTimings();
  return fetchOnce(cell.bytes, false);
}
