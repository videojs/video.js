import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { type BrowserContext, chromium } from 'playwright-core';
import { createServer } from 'vite-plus';

import type { TransferRecord } from '../record.ts';

const { values } = parseArgs({
  options: {
    src: { type: 'string' },
    minutes: { type: 'string', default: '10' },
    name: { type: 'string', default: `run-${new Date().toISOString().replace(/[:.]/g, '-')}` },
    audio: { type: 'boolean', default: true },
    headed: { type: 'boolean', default: false },
    channel: { type: 'string' },
    /** Seeds the schedule; with `--repeat`, every pass re-requests the first pass's exact sequence. */
    seed: { type: 'string' },
    repeat: { type: 'string', default: '1' },
    /** Seconds to wait between passes. */
    gap: { type: 'string', default: '5' },
    /** Persistent browser profile directory, so the HTTP disk cache survives between runs. */
    profile: { type: 'string' },
  },
});

type Truth = NonNullable<TransferRecord['truth']>;

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const durationMs = Number(values.minutes) * 60_000;
const passes = Number(values.repeat);
const seed = values.seed === undefined ? (passes > 1 ? Date.now() % 1_000_000 : undefined) : Number(values.seed);
const launchOptions = { headless: !values.headed, ...(values.channel ? { channel: values.channel } : {}) };
const server = await createServer({
  configFile: resolve(appRoot, 'vite.config.ts'),
  root: resolve(appRoot, 'src/logger'),
});

await server.listen();

const browser = values.profile ? undefined : await chromium.launch(launchOptions);
const context: BrowserContext = values.profile
  ? await chromium.launchPersistentContext(resolve(values.profile), launchOptions)
  : await browser!.newContext();

try {
  const page = context.pages()[0] ?? (await context.newPage());
  const cdp = await context.newCDPSession(page);

  // Ground truth per request, in request order per URL, so it can be zipped onto the logger's records.
  const truthByRequest = new Map<string, Truth>();
  const requestsByUrl = new Map<string, string[]>();
  const nextIndex = new Map<string, number>();

  cdp.on('Network.requestWillBeSent', ({ requestId, request }) => {
    requestsByUrl.set(request.url, [...(requestsByUrl.get(request.url) ?? []), requestId]);
  });
  cdp.on('Network.requestServedFromCache', ({ requestId }) => {
    truthByRequest.set(requestId, { ...truthByRequest.get(requestId), fromMemoryCache: true });
  });
  cdp.on('Network.responseReceived', ({ requestId, response }) => {
    truthByRequest.set(requestId, {
      ...truthByRequest.get(requestId),
      fromDiskCache: response.fromDiskCache ?? false,
      fromServiceWorker: response.fromServiceWorker ?? false,
    });
  });
  await cdp.send('Network.enable');

  const url = server.resolvedUrls!.local[0]!;
  const all: TransferRecord[] = [];
  let maxSegments: number | undefined;

  await page.goto(url);

  for (let pass = 1; pass <= passes; pass++) {
    const recording = passes > 1 ? `${values.name}-pass${pass}` : values.name!;

    console.log(`Recording ${recording} (seed ${seed ?? 'random'}) for up to ${values.minutes} min ...`);
    await page.evaluate((options) => window.abrLab.start(options), {
      ...(values.src ? { src: values.src } : {}),
      durationMs,
      audio: values.audio,
      recording,
      seed,
      maxSegments,
    });
    // Bounded: a long random pause can overrun the deadline, but never by more than a few minutes.
    await page.waitForFunction(() => window.abrLab.done, undefined, { timeout: durationMs + 180_000, polling: 1000 });

    const records = await page.evaluate(() => window.abrLab.records);

    for (const record of records) {
      const i = nextIndex.get(record.url) ?? 0;
      const requestId = requestsByUrl.get(record.url)?.[i];

      nextIndex.set(record.url, i + 1);

      if (requestId !== undefined) record.truth = truthByRequest.get(requestId) ?? {};
    }

    maxSegments ??= records.filter((r) => r.kind === 'segment' && r.trackType === 'video').length;
    all.push(...records);
    console.log(`  ${records.length} transfers`);

    if (pass < passes) await page.waitForTimeout(Number(values.gap) * 1000);
  }

  const out = resolve(appRoot, 'recordings', `${values.name}.jsonl`);

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${all.map((r) => JSON.stringify(r)).join('\n')}\n`);
  console.log(`Wrote ${all.length} transfers to ${out}`);
} finally {
  await context.close();
  await browser?.close();
  await server.close();
}
