import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium } from 'playwright-core';
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
  },
});

type Truth = NonNullable<TransferRecord['truth']>;

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const durationMs = Number(values.minutes) * 60_000;
const server = await createServer({
  configFile: resolve(appRoot, 'vite.config.ts'),
  root: resolve(appRoot, 'src/logger'),
});

await server.listen();

const browser = await chromium.launch({
  headless: !values.headed,
  ...(values.channel ? { channel: values.channel } : {}),
});

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  // Ground truth per request, in request order per URL, so it can be zipped onto the logger's records.
  const urlByRequest = new Map<string, string>();
  const truthByRequest = new Map<string, Truth>();
  const requestsByUrl = new Map<string, string[]>();

  cdp.on('Network.requestWillBeSent', ({ requestId, request }) => {
    urlByRequest.set(requestId, request.url);
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

  await page.goto(url);
  await page.evaluate(
    ({ src, durationMs, audio, recording }) =>
      window.abrLab.start({ ...(src ? { src } : {}), durationMs, audio, recording }),
    { src: values.src, durationMs, audio: values.audio, recording: values.name! }
  );

  console.log(`Recording ${values.name} for ${values.minutes} min from ${url} ...`);
  // Bounded: a long random pause can overrun the deadline, but never by more than a few minutes.
  await page.waitForFunction(() => window.abrLab.done, undefined, { timeout: durationMs + 180_000, polling: 1000 });

  const records = await page.evaluate(() => window.abrLab.records);
  const nextIndex = new Map<string, number>();

  for (const record of records) {
    const i = nextIndex.get(record.url) ?? 0;
    const requestId = requestsByUrl.get(record.url)?.[i];

    nextIndex.set(record.url, i + 1);

    if (requestId !== undefined) record.truth = truthByRequest.get(requestId) ?? {};
  }

  const out = resolve(appRoot, 'recordings', `${values.name}.jsonl`);

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${records.map((r) => JSON.stringify(r)).join('\n')}\n`);
  console.log(`Wrote ${records.length} transfers to ${out}`);
} finally {
  await browser.close();
  await server.close();
}
