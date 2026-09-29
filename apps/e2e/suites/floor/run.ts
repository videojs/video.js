/**
 * Floor smoke test: load the packaged skins in the oldest engines the root browserslist supports and check that each
 * fallback the build adds actually renders. The current Playwright cannot drive old engines, so each engine comes from
 * the playwright-core release that shipped it, installed under an npm alias:
 *
 * - `playwright-core-1-31` (1.31.2): Chromium 111 and WebKit 16.4
 * - `playwright-core-1-41` (1.41.2): Firefox 121
 *
 * Install the engines once with `pnpm -F @videojs/e2e install:floor`, then run `pnpm -F @videojs/e2e test:floor`.
 * Playwright's WebKit is close to Safari 16.4 but not identical; treat a WebKit pass as strong evidence, not proof.
 *
 * The old engine builds crash on recent macOS. To run them in Playwright's Linux images instead, start a `playwright
 * run-server` per image and set `FLOOR_WS_CHROMIUM`, `FLOOR_WS_FIREFOX`, or `FLOOR_WS_WEBKIT` to its endpoint. The
 * engines reach the app through a tunnel back to this process; set `FLOOR_APP_HOST` only to load it by another name.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const e2eDir = resolve(import.meta.dirname, '../..');
const outputDir = resolve(e2eDir, 'test-results/floor');
const PORT = 5181;
const APP_HOST = process.env.FLOOR_APP_HOST;
// Playwright 1.31 tunnels loopback pages to `127.0.0.1`, which `localhost` may not bind on Linux, where it can resolve
// to `::1` first.
const BASE_URL = `http://${APP_HOST ?? '127.0.0.1'}:${PORT}`;

interface Engine {
  readonly name: string;
  readonly module: string;
  readonly type: 'chromium' | 'firefox' | 'webkit';
  /** The version the browserslist floor names; the run fails if the launched engine is newer. */
  readonly version: string;
}

const ENGINES: readonly Engine[] = [
  { name: 'Chromium 111', module: 'playwright-core-1-31', type: 'chromium', version: '111' },
  { name: 'Firefox 121', module: 'playwright-core-1-41', type: 'firefox', version: '121' },
  { name: 'WebKit 16.4', module: 'playwright-core-1-31', type: 'webkit', version: '16.4' },
];

interface Page {
  readonly path: string;
  readonly preset: 'video' | 'audio';
}

const PAGES: readonly Page[] = [
  { path: '/pages/html-video-mp4.html', preset: 'video' },
  { path: '/pages/react-video-mp4.html', preset: 'video' },
  { path: '/pages/html-video-minimal-mp4.html', preset: 'video' },
  { path: '/pages/react-video-minimal-mp4.html', preset: 'video' },
  { path: '/pages/html-audio-mp4.html', preset: 'audio' },
  { path: '/pages/react-audio-mp4.html', preset: 'audio' },
];

/** Computed colors serialize as `rgb()` or, in Chromium before 120 or so, in the authored `oklch()` space. */
const BLACK = ['rgb(0, 0, 0)', 'oklch(0 0 0)'];
const WHITE = ['rgb(255, 255, 255)', 'oklch(1 0 0)'];
const RED = 'rgb(255, 0, 0)';

/** Values read from the page. Each is a computed style, so an invalid or missing fallback shows as its initial value. */
interface Probe {
  readonly styled: boolean;
  readonly scrim: string | null;
  readonly primaryForeground: string;
  readonly frameBorder: string;
  readonly bufferRight: string | null;
  /** Closed popovers that still render, which happens when nothing hides them without the Popover API. */
  readonly visibleClosedPopovers: number;
  /** The controls surface's backdrop filter; Safari before 18 applies only the `-webkit-` form. */
  readonly surfaceBlur: string | null;
}

/** A popup opened from its trigger, read after its open transition. */
interface PopupProbe {
  readonly open: boolean;
  /** The popup's center hit-tests to the popup itself, so no ancestor clips or covers it. */
  readonly reachable: boolean;
  /** Pixels between the popup and its trigger; a popup placed against the wrong containing block lands far away. */
  readonly gap: number;
}

interface Result {
  readonly engine: string;
  readonly page: string;
  readonly failures: string[];
}

async function main(): Promise<void> {
  mkdirSync(outputDir, { recursive: true });

  const server = await startServer();
  const results: Result[] = [];

  try {
    for (const engine of ENGINES) results.push(...(await runEngine(engine)));
  } finally {
    server.kill();
  }

  let failed = 0;

  for (const result of results) {
    const status = result.failures.length === 0 ? 'pass' : 'FAIL';

    console.log(`${status}  ${result.engine.padEnd(13)} ${result.page}`);

    for (const failure of result.failures) console.log(`        ${failure}`);

    if (result.failures.length > 0) failed++;
  }

  console.log(`\n${results.length - failed}/${results.length} passed. Screenshots: ${outputDir}`);

  if (failed > 0) process.exitCode = 1;
}

/** Neither aliased release types both option names. */
type ConnectOptions = import('playwright-core-1-31').ConnectOptions;

async function runEngine(engine: Engine): Promise<Result[]> {
  const playwright = require(engine.module) as typeof import('playwright-core-1-31');
  let browser: import('playwright-core-1-31').Browser;

  const endpoint = process.env[`FLOOR_WS_${engine.type.toUpperCase()}`];
  // Tunnel loopback pages back to this process, which serves them, whatever network the engine's container is on.
  // Playwright 1.31 only reads the underscored name; `exposeNetwork` became public later.
  const connectOptions = { exposeNetwork: '<loopback>', _exposeNetwork: '<loopback>' } as ConnectOptions;

  try {
    browser = endpoint
      ? await playwright[engine.type].connect(endpoint, connectOptions)
      : await playwright[engine.type].launch();
  } catch (error) {
    // Old engine builds can crash on a host OS newer than they were built for; CI runs them on Ubuntu 22.04.
    const reason = error instanceof Error ? error.message.split('\n')[0]! : String(error);

    return [{ engine: engine.name, page: '(launch)', failures: [`could not launch on this host: ${reason}`] }];
  }

  const version = browser.version();
  const results: Result[] = [];

  try {
    if (!version.startsWith(engine.version)) {
      return [{ engine: engine.name, page: '(launch)', failures: [`launched ${version}, expected ${engine.version}`] }];
    }

    for (const page of PAGES) results.push(await runPage(browser, engine, page));
  } finally {
    await browser.close();
  }

  return results;
}

async function runPage(browser: import('playwright-core-1-31').Browser, engine: Engine, target: Page): Promise<Result> {
  const page = await browser.newPage({ viewport: { width: 960, height: 640 } });
  const failures: string[] = [];

  page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));

  try {
    await page.goto(`${BASE_URL}${target.path}`, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForFunction(`(${deepQuery.toString()})(document, '.media-skin') !== null`, undefined, {
      timeout: 30_000,
    });
    await page.waitForTimeout(500);

    const probe = await readProbeWhenStable(page);

    if (!probe.styled) failures.push('skin is unstyled: the base reset did not apply');

    if (target.preset === 'video') {
      if (!probe.scrim?.includes('gradient')) failures.push(`controls scrim is ${probe.scrim ?? 'missing'}`);

      // The default video accent is white, so primary text must be the dark default rather than inherited white.
      if (!BLACK.includes(probe.primaryForeground)) failures.push(`primary text is ${probe.primaryForeground}`);

      // Only the default skin blurs the control bar; the minimal skin keeps blur for popups and dialogs.
      if (!target.path.includes('minimal') && !probe.surfaceBlur?.includes('blur')) {
        failures.push(`controls surface blur is ${probe.surfaceBlur ?? 'missing'}`);
      }

      // The probe's own color is red, so a border that fell back to `currentColor` reads as red.
      if (probe.frameBorder === RED) failures.push('frame border has no color: `light-dark()` has no fallback');
    } else if (!WHITE.includes(probe.primaryForeground)) {
      // The light audio theme's primary is black, so its text is white.
      failures.push(`primary text is ${probe.primaryForeground}`);
    }

    if (probe.bufferRight === null) failures.push('slider buffer is missing');
    else if (probe.bufferRight === 'auto') failures.push('slider buffer `right` is auto: its variable has no fallback');

    if (probe.visibleClosedPopovers > 0) failures.push(`${probe.visibleClosedPopovers} closed popovers are visible`);

    const name = target.path.split('/').pop()!.replace('.html', '');

    await page.screenshot({ path: resolve(outputDir, `${engine.type}-${name}.png`) });

    // The audio pages put the bar against the top edge, where menus open above the viewport in any browser.
    if (target.preset === 'audio') await page.addStyleTag({ content: 'body { padding-top: 320px; }' });

    // Playwright's Chromium has no H.264, so its MP4 pages open the error dialog over the controls.
    const dismiss = page.locator('[role="alertdialog"] >> text=OK');

    if (await dismiss.first().isVisible()) await dismiss.first().click();

    if (target.preset === 'video') failures.push(...(await checkSeekKeepsControls(page)));

    // Tooltips open only on hover-capable devices, and headless Firefox on Linux reports none.
    if (await page.evaluate(`matchMedia('(hover: hover)').matches`)) {
      failures.push(...(await checkPopup(page, 'tooltip', '.media-play-button', 'hover', '.media-tooltip[data-open]')));
    }

    failures.push(
      ...(await checkPopup(
        page,
        'menu',
        '[aria-haspopup="menu"]',
        'click',
        '[role="menu"][data-open], [popover][data-open] [role="menu"]',
        resolve(outputDir, `${engine.type}-${name}-menu.png`)
      ))
    );
  } catch (error) {
    failures.push(error instanceof Error ? error.message.split('\n')[0]! : String(error));
  } finally {
    await page.close();
  }

  return { engine: engine.name, page: target.path, failures };
}

/** Skins can re-render their root while upgrading, so retry until the root holds still. */
async function readProbeWhenStable(page: import('playwright-core-1-31').Page): Promise<Probe> {
  for (let attempt = 0; ; attempt++) {
    const probe = (await page.evaluate(`(${readProbe.toString()})(${deepQuery.toString()})`)) as Probe | null;
    if (probe) return probe;

    if (attempt === 4) throw new Error('the skin root never settled');

    await page.waitForTimeout(500);
  }
}

/** Find the first match in the document or any open shadow root below it. */
function deepQuery(root: Document | ShadowRoot | Element, selector: string): Element | null {
  const found = root.querySelector(selector);
  if (found) return found;

  for (const element of root.querySelectorAll('*')) {
    const nested = element.shadowRoot ? deepQuery(element.shadowRoot, selector) : null;
    if (nested) return nested;
  }

  return null;
}

/** Runs in the page, so it takes `deepQuery` as an argument instead of closing over it. */
function readProbe(query: typeof deepQuery): Probe | null {
  const skin = query(document, '.media-skin');
  if (!skin) return null;

  const backdrop = query(document, '.video-controls-backdrop');
  const buffer = query(document, '.media-slider-buffer');
  const surfaces: Element[] = [];
  const blurRoots: (Document | ShadowRoot)[] = [document];

  // The default skin blurs the whole bar and the minimal skin its control groups, so accept any controls surface.
  for (let index = 0; index < blurRoots.length; index++) {
    for (const element of blurRoots[index]!.querySelectorAll('*')) {
      if (element.shadowRoot) blurRoots.push(element.shadowRoot);

      if (/\bvideo-controls/.test(String(element.className))) surfaces.push(element);
    }
  }

  // Inline rather than a named helper: tsx wraps named functions in a `__name()` call the page does not define.
  const blur = surfaces
    .map((element) =>
      ['backdrop-filter', '-webkit-backdrop-filter']
        .map((property) => getComputedStyle(element).getPropertyValue(property))
        .filter((value) => value && value !== 'none')
        .join(' ')
    )
    .find(Boolean);
  const probe = document.createElement('span');

  probe.style.color = 'red';
  probe.style.border = '1px solid var(--media-frame-border)';
  skin.append(probe);

  const colorProbe = document.createElement('span');

  colorProbe.style.color = 'var(--media-primary-foreground)';
  skin.append(colorProbe);

  const result: Probe = {
    styled: getComputedStyle(skin).boxSizing === 'border-box',
    scrim: backdrop ? getComputedStyle(backdrop).backgroundImage : null,
    primaryForeground: getComputedStyle(colorProbe).color,
    frameBorder: getComputedStyle(probe).borderTopColor,
    bufferRight: buffer ? getComputedStyle(buffer).right : null,
    visibleClosedPopovers: 0,
    surfaceBlur: surfaces.length > 0 ? (blur ?? 'none') : null,
  };
  const roots: (Document | ShadowRoot)[] = [document];

  for (let index = 0; index < roots.length; index++) {
    for (const element of roots[index]!.querySelectorAll('*')) {
      if (element.shadowRoot) roots.push(element.shadowRoot);

      const closed = element.hasAttribute('popover') && !element.hasAttribute('data-open');
      const rect = element.getBoundingClientRect();

      if (closed && getComputedStyle(element).display !== 'none' && rect.width > 0 && rect.height > 0) {
        (result as { visibleClosedPopovers: number }).visibleClosedPopovers++;
      }
    }
  }

  probe.remove();
  colorProbe.remove();

  return result;
}

/** Seeking while playing must not hide the controls, and leaving the player still must. */
async function checkSeekKeepsControls(page: import('playwright-core-1-31').Page): Promise<string[]> {
  const played = await page.evaluate(
    `(async () => { const video = (${deepQuery.toString()})(document, 'video'); video.muted = true; try { await video.play(); } catch { return false; } return !video.paused; })()`
  );
  // Playwright's Chromium has no H.264, so its MP4 pages cannot play.
  if (!played) return [];

  const visible = () =>
    page.evaluate(`(${deepQuery.toString()})(document, '.media-skin').hasAttribute('data-controls-visible')`);
  const slider = await page.locator('.media-time-slider').first().boundingBox();
  if (!slider) return ['the time slider is missing'];

  const failures: string[] = [];
  const y = slider.y + slider.height / 2;

  await page.mouse.move(slider.x + slider.width * 0.3, y, { steps: 3 });
  await page.mouse.click(slider.x + slider.width * 0.6, y);
  await page.waitForTimeout(600);

  if (!(await visible())) failures.push('seeking while playing hid the controls');

  await page.mouse.move(2, 630, { steps: 5 });
  await page.waitForTimeout(400);

  if (await visible()) failures.push('leaving the player while playing did not hide the controls');

  await page.evaluate(`(${deepQuery.toString()})(document, 'video').pause()`);
  await page.waitForTimeout(300);

  return failures;
}

async function checkPopup(
  page: import('playwright-core-1-31').Page,
  label: string,
  trigger: string,
  action: 'hover' | 'click',
  popup: string,
  /** Where to save a screenshot of the page with the popup open. */
  screenshot?: string
): Promise<string[]> {
  const target = page.locator(trigger).first();

  if (action === 'hover') await target.hover();
  else await target.click();

  await page.waitForTimeout(900);

  const probe = (await page.evaluate(
    `(${readPopup.toString()})(${deepQuery.toString()}, ${JSON.stringify(trigger)}, ${JSON.stringify(popup)})`
  )) as PopupProbe;
  if (!probe.open) return [`the ${label} did not open`];

  const failures: string[] = [];

  if (!probe.reachable) failures.push(`the open ${label} is clipped or covered`);

  if (probe.gap > 48) failures.push(`the open ${label} is ${Math.round(probe.gap)}px from its trigger`);

  if (screenshot) await page.screenshot({ path: screenshot });

  await page.keyboard.press('Escape');
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);

  return failures;
}

/** Runs in the page, so it takes `deepQuery` as an argument instead of closing over it. */
function readPopup(query: typeof deepQuery, triggerSelector: string, popupSelector: string): PopupProbe {
  const trigger = query(document, triggerSelector);
  const popup = query(document, popupSelector);
  if (!trigger || !popup) return { open: false, reachable: false, gap: 0 };

  const rect = popup.getBoundingClientRect();
  const anchor = trigger.getBoundingClientRect();
  const root = popup.getRootNode() as Document | ShadowRoot;
  const hit = root.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  const dx = Math.max(anchor.left - rect.right, rect.left - anchor.right, 0);
  const dy = Math.max(anchor.top - rect.bottom, rect.top - anchor.bottom, 0);

  return { open: true, reachable: hit !== null && (hit === popup || popup.contains(hit)), gap: Math.hypot(dx, dy) };
}

async function startServer(): Promise<ChildProcess> {
  const args = ['exec', 'vp', '-C', 'suites/player/app', 'dev', '--port', String(PORT), '--strictPort'];
  const server = spawn('pnpm', [...args, '--host', APP_HOST ? '0.0.0.0' : '127.0.0.1'], {
    cwd: e2eDir,
    // Vite rejects requests whose Host header it does not recognize, such as the containers' name for this machine.
    env: APP_HOST ? { ...process.env, __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS: APP_HOST } : process.env,
    stdio: 'ignore',
  });

  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/pages/html-video-mp4.html`);
      if (response.ok) return server;
    } catch {
      // Not listening yet.
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
  }

  server.kill();
  throw new Error(`The e2e app did not start on port ${PORT}.`);
}

await main();
