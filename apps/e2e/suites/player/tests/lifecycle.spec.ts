import { expect, type Page, type Request, test } from '@playwright/test';

import { MEDIA } from '../../../shared/fixtures/resources';

/**
 * Lifecycle churn against real engines: rapid source changes, unmounting mid-load and mid-playback, mount/unmount
 * cycles, and reparenting. Each engine runs every phase in one page load, as steps of one test, so the suite pays for a
 * single navigation and engine boot per engine instead of one per scenario.
 *
 * The page is `lifecycle.html`; React renders under `StrictMode`.
 */

interface Engine {
  media: string;
  /** Source the churn starts from and keeps returning to; never the one that should win. */
  decoy: string;
  final: string;
  /** Duration of `final`, when it differs enough from `decoy` to prove which source the engine ended up attached to. */
  finalDuration?: number;
}

const ENGINES: Engine[] = [
  { media: 'hlsjs-video', decoy: MEDIA.hlsTs.url, final: MEDIA.hlsFmp4.url, finalDuration: 25 },
  { media: 'hls-video', decoy: MEDIA.hls4k.url, final: MEDIA.hlsFmp4.url, finalDuration: 25 },
  { media: 'shaka-video', decoy: MEDIA.dash.url, final: MEDIA.hlsFmp4.url, finalDuration: 25 },
  // One DASH asset, so the swap proves survival rather than which source won.
  { media: 'dash-video', decoy: `${MEDIA.dash.url}?decoy`, final: MEDIA.dash.url },
];

/** Requests that only a live engine makes: manifests and segments, not posters or storyboards. */
function isMediaRequest(request: Request): boolean {
  const { hostname } = new URL(request.url());

  return (hostname.endsWith('mux.com') && hostname !== 'image.mux.com') || hostname.endsWith('akamaized.net');
}

async function waitForReady(page: Page): Promise<void> {
  await page.waitForFunction(() => (window.lifecycle.media()?.readyState ?? 0) >= 1, undefined, { timeout: 20_000 });
}

function readDuration(page: Page): Promise<number> {
  return page.evaluate(() => window.lifecycle.media()?.duration ?? Number.NaN);
}

async function expectPlays(page: Page): Promise<void> {
  const start = await page.evaluate(async () => {
    const media = window.lifecycle.media()!;

    media.muted = true;
    await media.play();
    return media.currentTime;
  });

  await page.waitForFunction((t) => (window.lifecycle.media()?.currentTime ?? 0) > t + 0.25, start, {
    timeout: 10_000,
  });
}

const QUIET_WINDOW = 1_000;
const QUIET_DEADLINE = 4_000;

/**
 * Require that media requests stop soon after a teardown and stay stopped. Async teardowns (Shaka's lock, for one) can
 * let an in-flight manifest load issue its follow-up requests first, so a short burst is fine; an engine that outlived
 * its element keeps fetching segments and never goes quiet for a whole window.
 */
async function expectNetworkQuiet(page: Page): Promise<void> {
  const start = Date.now();
  const late: string[] = [];
  let lastRequest = start;

  const onRequest = (request: Request) => {
    if (!isMediaRequest(request)) return;

    late.push(request.url());
    lastRequest = Date.now();
  };

  page.on('request', onRequest);

  while (Date.now() - lastRequest < QUIET_WINDOW && Date.now() - start < QUIET_DEADLINE) {
    await page.waitForTimeout(100);
  }

  page.off('request', onRequest);

  expect(Date.now() - lastRequest, `media requests after teardown:\n${late.join('\n')}`).toBeGreaterThanOrEqual(
    QUIET_WINDOW
  );
}

for (const framework of ['html', 'react'] as const) {
  test.describe(`${framework} player lifecycle`, () => {
    for (const engine of ENGINES) {
      test(engine.media, async ({ page }) => {
        const errors: Error[] = [];

        page.on('pageerror', (error) => errors.push(error));
        await page.goto(`/lifecycle.html?framework=${framework}&media=${engine.media}`);
        await page.waitForFunction(() => 'lifecycle' in window);

        await test.step('rapid source changes resolve to the last source', async () => {
          await page.evaluate(async ({ decoy, final }) => {
            const { lifecycle } = window;
            const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

            // Synchronous swaps, then swaps landing mid-manifest and mid-segment, ending on `final`.
            lifecycle.mount(decoy);
            lifecycle.setSource(final);
            lifecycle.setSource(decoy);
            await wait(50);
            lifecycle.setSource(final);
            await wait(250);
            lifecycle.setSource(decoy);
            await wait(600);
            lifecycle.setSource(final);
          }, engine);

          await waitForReady(page);

          if (engine.finalDuration !== undefined) {
            await expect.poll(() => readDuration(page)).toBeCloseTo(engine.finalDuration, 0);

            // A superseded load must not attach late and replace the winner.
            await page.waitForTimeout(1_000);
            expect(await readDuration(page)).toBeCloseTo(engine.finalDuration, 0);
          }

          await expectPlays(page);
        });

        await test.step('unmounting mid-load stops all media requests', async () => {
          await page.evaluate(() => window.lifecycle.unmount());
          await expectNetworkQuiet(page);

          const firstRequest = page.waitForRequest(isMediaRequest);

          await page.evaluate((src) => window.lifecycle.mount(src), engine.final);
          await firstRequest;
          await page.evaluate(() => window.lifecycle.unmount());
          await expectNetworkQuiet(page);
        });

        await test.step('mount/unmount cycles end in a working player', async () => {
          await page.evaluate(async (src) => {
            const { lifecycle } = window;

            // From same-task teardown, through mid-boot, to mid-load.
            for (const ms of [0, 16, 100, 300, 800]) {
              lifecycle.mount(src);
              await new Promise((resolve) => setTimeout(resolve, ms));
              lifecycle.unmount();
            }

            lifecycle.mount(src);
          }, engine.final);

          await waitForReady(page);
          await expectPlays(page);
        });

        if (framework === 'html') {
          await test.step('reparenting while playing keeps the same engine playing', async () => {
            const kept = await page.evaluate(async () => {
              const { lifecycle } = window;
              const before = lifecycle.media();

              lifecycle.reparent();
              // Past the microtask a disconnected host tears down on, and the two frames a player waits.
              await new Promise((resolve) => setTimeout(resolve, 100));

              return lifecycle.media() === before && before?.isConnected === true && !before.paused;
            });

            expect(kept).toBe(true);
            await expectPlays(page);
          });
        }

        await test.step('unmounting while playing stops all media requests', async () => {
          await page.evaluate(() => window.lifecycle.unmount());
          await expectNetworkQuiet(page);
        });

        expect(errors).toEqual([]);
      });
    }
  });
}
