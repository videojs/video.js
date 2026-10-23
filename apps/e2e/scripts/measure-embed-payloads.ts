/**
 * Measures what each embed in the lazy-video sandbox downloads from its service: the iframe, everything it loads, and
 * any SDK it loads into the page. The page can't see this itself (cross-origin frames keep their requests private), so
 * the sandbox shows the result as a measured estimate.
 *
 * Writes `apps/sandbox/app/shared/embed-payloads.json`.
 *
 * Run: `pnpm --dir apps/e2e measure-embed-payloads [sandbox origin]`, against a running or deployed sandbox (defaults
 * to http://localhost:5173).
 */

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Request } from 'playwright-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = resolve(__dirname, '../../sandbox/app/shared/embed-payloads.json');

// The `?source=` names of the lazy-video sandbox's embeds.
const SOURCES = ['youtube', 'vimeo', 'wistia', 'cloudflare', 'tiktok', 'twitch', 'player-js'];
const RUNS = 3;
// Long enough for each embed to finish loading its player without playing.
const SETTLE_MS = 10_000;
// The page's own posters, fonts, and styles aren't the embed's.
const PAGE_ASSETS: ReadonlySet<string> = new Set(['image', 'font', 'stylesheet']);

interface Payload {
  scripts: number;
  total: number;
  requests: number;
}

const origin = new URL(process.argv[2] ?? 'http://localhost:5173').origin;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)]!;
}

async function measure(source: string): Promise<Payload> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const sizes: Promise<{ script: boolean; bytes: number } | null>[] = [];

  function onRequest(request: Request) {
    if (request.url().startsWith(origin)) return;

    // Service worker requests have no frame; they come from an embed's own worker.
    const inPage = !request.serviceWorker() && request.frame() === page.mainFrame();
    if (inPage && PAGE_ASSETS.has(request.resourceType())) return;

    sizes.push(
      request
        .sizes()
        .then(({ responseBodySize, responseHeadersSize }) => ({
          script: request.resourceType() === 'script',
          bytes: responseBodySize + responseHeadersSize,
        }))
        .catch(() => null)
    );
  }

  context.on('requestfinished', onRequest);
  await page.goto(`${origin}/lazy-video-html/?source=${source}`, { waitUntil: 'load' });
  await page.waitForTimeout(SETTLE_MS);

  const results = (await Promise.all(sizes)).filter((result) => result !== null);

  await browser.close();

  return {
    scripts: results.filter(({ script }) => script).reduce((sum, { bytes }) => sum + bytes, 0),
    total: results.reduce((sum, { bytes }) => sum + bytes, 0),
    requests: results.length,
  };
}

const embeds: Record<string, Payload> = {};

for (const source of SOURCES) {
  const runs: Payload[] = [];

  for (let run = 0; run < RUNS; run++) runs.push(await measure(source));

  embeds[source] = {
    scripts: median(runs.map(({ scripts }) => scripts)),
    total: median(runs.map(({ total }) => total)),
    requests: median(runs.map(({ requests }) => requests)),
  };
  console.log(source, embeds[source]);
}

const browser = await chromium.launch();
const measured = {
  measuredAt: new Date().toISOString().slice(0, 10),
  browser: `Chromium ${browser.version()}`,
  embeds,
};

await browser.close();
writeFileSync(OUT_FILE, `${JSON.stringify(measured, null, 2)}\n`);
console.log(`Wrote ${OUT_FILE}`);
