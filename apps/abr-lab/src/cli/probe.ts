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
 *
 * With `--url`, probes a real, cache-warm resource from a local Chrome instead: byte ranges of it stand in for sizes,
 * the link is whatever the host has, and only warm states run (a CDN can't be told to close the connection).
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
    url: { type: 'string' },
    channel: { type: 'string' },
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
  /** Until `fetch()` resolved with headers; the only TTFB a cross-origin resource without Timing-Allow-Origin gives. */
  headersMs: number;
  /** The real resource's host, when probing with `--url`. */
  target?: string | undefined;
  /** The response's CDN cache status headers, when present. */
  cache?: string | undefined;
}

const list = (s: string) => s.split(',').map(Number);
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const out = resolve(appRoot, 'recordings', `${values.name}.jsonl`);
const random = seededRandom(Number(values.seed));
const target = values.url;
const browser = target
  ? await chromium.launch(values.channel ? { channel: values.channel } : {})
  : await chromium.connect(LAB_BROWSER, { timeout: 15_000 });

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, '');

try {
  const page = await (await browser.newContext()).newPage();

  // tsx wraps named functions in an `__name` helper that only exists in Node; `measure` runs in the page.
  await page.addInitScript('globalThis.__name = (fn) => fn');

  if (!target) await page.goto(`${LAB_ORIGIN}/`, { timeout: 30_000 });

  // The init script only runs on navigation; a real target probes from the initial blank page.
  await page.evaluate('globalThis.__name = (fn) => fn');

  // A real target has one link, the host's own; 0 marks it unshaped.
  for (const rttMs of target ? [0] : list(values.rtts!)) {
    for (const rateKbps of target ? [0] : list(values.rates!)) {
      if (!target) await setLinkConditions({ rttMs, rateKbps });

      // Shuffled within a link setting, so slow drift in the host can't line up with any one variable.
      const cells = list(values.sizes!)
        .filter((bytes) => rateKbps <= 0 || (bytes * 8) / rateKbps / 1000 <= Number(values.maxSeconds))
        .flatMap((bytes) => [
          ...(target ? [] : [{ bytes, state: 'fresh' as const, idleMs: 0 }]),
          ...list(values.idles!).map((idleMs) => ({ bytes, state: 'warm' as const, idleMs })),
        ])
        .flatMap((cell) => Array.from({ length: Number(values.reps) }, (_, rep) => ({ ...cell, rep })))
        .sort(() => random() - 0.5);

      console.log(`rtt ${rttMs} ms, rate ${rateKbps} kbit/s: ${cells.length} samples`);

      for (const cell of cells) {
        const measured = await page.evaluate(measure, { ...cell, url: target });
        const sample: ProbeSample = { rttMs, rateKbps, ...cell, ...measured, target: target && new URL(target).host };

        appendFileSync(out, `${JSON.stringify(sample)}\n`);
      }
    }
  }
} finally {
  if (!target) await setLinkConditions({ rttMs: 0, rateKbps: 0 });

  await browser.close();
}

console.log(`Wrote ${out}`);

/** Runs in the page. A fresh sample follows a request that closed its connection; a warm one follows a same-size fetch. */
async function measure(cell: { bytes: number; state: 'fresh' | 'warm'; idleMs: number; url: string | undefined }) {
  const fetchOnce = async (bytes: number, goaway: boolean) => {
    // A real resource keeps its exact URL so the CDN serves it from cache; a range stands in for the size.
    const url = cell.url ?? `/bytes?n=${bytes}&r=${Math.random()}${goaway ? '&goaway' : ''}`;
    const init: RequestInit = { cache: 'no-store' };

    if (cell.url) init.headers = { range: `bytes=0-${bytes - 1}` };

    const start = performance.now();
    const response = await fetch(url, init);
    const headersMs = performance.now() - start;

    await response.arrayBuffer();

    const ms = performance.now() - start;
    // SAFETY: entries named by a fetched URL are resource entries; timings were cleared before this fetch.
    const entry = performance.getEntriesByName(new URL(url, location.href).href).at(-1) as PerformanceResourceTiming;
    const cache = ['x-edge-cache-status', 'x-cache']
      .map((name) => response.headers.get(name))
      .filter((value) => value !== null)
      .join(' ');

    return {
      ms,
      headersMs,
      ttfbMs: entry.responseStart > 0 ? entry.responseStart - entry.requestStart : headersMs,
      connectMs: entry.connectEnd - entry.connectStart,
      protocol: entry.nextHopProtocol,
      cache: cache || undefined,
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
