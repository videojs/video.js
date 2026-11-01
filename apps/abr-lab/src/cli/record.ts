import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { type BrowserContext, chromium } from 'playwright-core';
import { createServer } from 'vite-plus';

import { LAB_BROWSER, LAB_ORIGIN, setLinkConditions } from '../netlab.ts';
import type { TransferRecord } from '../record.ts';
import { generateTrace, PROFILES, seededRandom } from '../synthetic/trace.ts';

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
    /** Log every transfer's start and end from inside the page. */
    debug: { type: 'boolean', default: false },
    /** Throttle following a synthetic profile (see synthetic/trace.ts): DevTools emulation, or netem with `--lab`. */
    throttle: { type: 'string' },
    /** Record in the Docker network lab (`pnpm lab:up`): Chrome and the media origin in containers, shaped by netem. */
    lab: { type: 'boolean', default: false },
  },
});

type Truth = NonNullable<TransferRecord['truth']>;

/** How long a throttle capacity is held before the next change. */
const STEP_HOLD_MS = 5000;

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const durationMs = Number(values.minutes) * 60_000;
const passes = Number(values.repeat);
const seed = values.seed === undefined ? (passes > 1 ? Date.now() % 1_000_000 : undefined) : Number(values.seed);
const launchOptions = { headless: !values.headed, ...(values.channel ? { channel: values.channel } : {}) };

if (values.lab && (values.profile || values.headed || values.channel)) {
  throw new Error('--lab drives the lab container Chrome; --profile, --headed and --channel do not apply');
}

const server = await createServer({
  configFile: resolve(appRoot, 'vite.config.ts'),
  root: resolve(appRoot, 'src/logger'),
  // A hot reload mid-recording would wipe the page's session state and leave the recorder waiting forever. The lab's
  // Chrome reaches the page from its container, through Docker's host gateway.
  server: values.lab ? { hmr: false, watch: null, host: '0.0.0.0', allowedHosts: true } : { hmr: false, watch: null },
});

await server.listen();

const browser = values.lab
  ? await chromium.connect(LAB_BROWSER, { timeout: 15_000 })
  : values.profile
    ? undefined
    : await chromium.launch(launchOptions);
const context: BrowserContext = values.profile
  ? await chromium.launchPersistentContext(resolve(values.profile), launchOptions)
  : await browser!.newContext();

try {
  const page = context.pages()[0] ?? (await context.newPage());

  // Surface the page's own failures; a session that silently stops otherwise just times out.
  page.on('pageerror', (error) => console.error(`[page error] ${error.message}`));
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) console.error(`[page] navigated to ${frame.url()}`);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().startsWith('[abr-lab]')) {
      console.error(`[page ${(performance.now() / 1000).toFixed(1)}s] ${message.text()}`);
    }
  });
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

  const url = values.lab ? `http://host.docker.internal:${server.config.server.port}/` : server.resolvedUrls!.local[0]!;
  const src = values.src ?? (values.lab ? `${LAB_ORIGIN}/mux-bbb/master.m3u8` : undefined);
  const all: TransferRecord[] = [];
  let maxSegments: number | undefined;

  await page.goto(values.debug ? `${url}?debug` : url);

  const throttle = values.throttle ? await startThrottle(values.throttle) : undefined;

  for (let pass = 1; pass <= passes; pass++) {
    const recording = passes > 1 ? `${values.name}-pass${pass}` : values.name!;

    console.log(`Recording ${recording} (seed ${seed ?? 'random'}) for up to ${values.minutes} min ...`);
    await page.evaluate((options) => window.abrLab.start(options), {
      ...(src ? { src } : {}),
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
      record.throttle = throttle?.at(record.t.start);

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

  await throttle?.stop();

  const out = resolve(appRoot, 'recordings', `${values.name}.jsonl`);

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${all.map((r) => JSON.stringify(r)).join('\n')}\n`);
  console.log(`Wrote ${all.length} transfers to ${out}`);
  /**
   * Follows the profile's capacity, holding each value for STEP_HOLD_MS, and keeps the applied schedule in page time as
   * ground truth. DevTools emulation paces data inside Chrome rather than on the wire (no TCP dynamics), so those
   * recordings test dynamics, never calibration. In the lab, netem shapes the origin's egress: real TCP and TLS, with
   * the profile's latency as the added round trip.
   */
  async function startThrottle(name: string) {
    const profile = PROFILES[name];
    if (!profile) throw new Error(`Unknown throttle profile ${name}; one of ${Object.keys(PROFILES).join(', ')}`);

    const trace = generateTrace(profile, passes * (durationMs + 180_000), seededRandom(seed ?? 1));
    const schedule: Array<{ at: number; capacityBps: number; latencyMs: number }> = [];
    const started = performance.now();
    const pageOffset = (await page.evaluate(() => performance.now())) - performance.now();

    // Re-sending conditions resets Chrome's pacing and lets a burst through (measured: a 4 Mbps cap re-sent every
    // 500 ms delivered 13.9 Mbps), so capacity is held for STEP_HOLD_MS and only sent when it changes.
    let lastSent: number | undefined;

    const apply = async () => {
      const elapsed = performance.now() - started;
      const holdStart = Math.floor(elapsed / STEP_HOLD_MS) * STEP_HOLD_MS;
      const steps = trace.bitsPerMs.slice(holdStart / trace.stepMs, (holdStart + STEP_HOLD_MS) / trace.stepMs);
      const capacityBps = Math.round((steps.reduce((sum, v) => sum + v, 0) / Math.max(1, steps.length)) * 1000);
      if (capacityBps === lastSent) return;

      lastSent = capacityBps;
      schedule.push({ at: performance.now() + pageOffset, capacityBps, latencyMs: profile.latencyMs });

      if (values.lab) {
        await setLinkConditions({ rttMs: profile.latencyMs, rateKbps: Math.round(capacityBps / 1000) });
        return;
      }

      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: profile.latencyMs,
        downloadThroughput: capacityBps / 8,
        uploadThroughput: capacityBps / 8,
      });
    };

    await apply();
    const timer = setInterval(() => void apply(), 250);

    return {
      at(pageTime: number) {
        const entry = schedule.findLast((s) => s.at <= pageTime) ?? schedule[0];

        return (
          entry && {
            profile: values.lab ? `lab:${name}` : name,
            capacityBps: entry.capacityBps,
            latencyMs: entry.latencyMs,
          }
        );
      },
      async stop() {
        clearInterval(timer);

        if (values.lab) await setLinkConditions({ rttMs: 0, rateKbps: 0 });
      },
    };
  }
} finally {
  await context.close();
  await browser?.close();
  await server.close();
}
