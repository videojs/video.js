import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';

import AxeBuilder from '@axe-core/playwright';
import { firefox, type Locator, type Page, webkit } from 'playwright';

import type { TaskExpectation } from '../tasks.ts';

// Cross-renderer selectors from apps/e2e: HTML custom elements, React part classes, and source-owned skins that keep
// the play button's keyboard shortcut.
const PLAY_BUTTON =
  'media-play-button, .media-play-button, button[aria-keyshortcuts~="Space"], button[aria-label="Play" i]';
// A generic task accepts any player, so its play button can be Video.js 8's, Plyr's, or any control labelled Play.
const ANY_PLAY_BUTTON = `${PLAY_BUTTON}, .vjs-big-play-button, .plyr__control--overlaid, button[title="Play" i]`;
// The minimal skin, under its names before and after 10.0.0-rc.5 renamed it neutral.
const MINIMAL_SKIN = ['minimal', 'neutral'].map((name) => `${skinElements(name)}, [data-theme="${name}"]`).join(', ');
// Packaged skins, skin source, and hand-built containers all put `media-skin` or `media-container` on the player box.
const PLAYER_BOX = '.media-skin, media-container, .media-container';
// Elements only Video.js 10 renders: players, skins, the container, and its controls, as custom elements or React parts.
const PLAYERS = 'video-player, audio-player, live-video-player, live-audio-player, background-video-player';
const VIDEOJS_10 = [
  PLAYER_BOX,
  PLAYERS,
  'video-skin, audio-skin, live-video-skin, live-audio-skin, background-video-skin, .media-background-skin',
  ...['minimal', 'neutral', 'compat', 'scaffold'].map(skinElements),
  'media-play-button, .media-play-button, media-time-slider, .media-time-slider',
].join(', ');
// Axe cannot see into shadow roots from a selector, so it starts from the light-DOM player or React container.
const A11Y_SCOPE = `${PLAYERS}, .media-skin, .media-container`;
// Requests that carry media: playlists, segments, and progressive files.
const MEDIA_REQUEST = /\.(?:m3u8|mpd|mp4|m4a|m4s|m4v|mp3|webm|ts|aac|ogg|mov)(?:[?#]|$)|\bstream\.mux\.com\//i;
const HYDRATION = /hydrat|did not match|server rendered HTML|Minified React error #(?:418|423|425)/i;
const CDN_URL = /^https:\/\/(?:cdn\.jsdelivr\.net\/npm|unpkg\.com)\/(@videojs\/[\w-]+)(?:@([^/]+))?\/([^?#]+)/;
const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
};

/**
 * Redirects a package file requested from a CDN: to a local file from a packed build, to another URL such as the pinned
 * release, or `null` to let the request through.
 */
export type CdnRoute = (
  name: string,
  version: string | null,
  path: string
) => { file: string } | { url: string } | null;

export type BrowserEngine = 'firefox' | 'webkit';

export interface TaskAssertion {
  name: string;
  ok: boolean;
  detail?: string;
}

/** What a task's `check.ts` receives: the page and the player's parts, found the same way as for every task. */
export interface TaskCheckContext {
  page: Page;
  media: Locator;
  player: Locator;
  playButton: Locator;
}

/** What a task's `project` hook receives: the finished project, and what the agent changed in it. */
export interface ProjectCheckContext {
  appDir: string;
  /** Every project file, relative to `appDir`. */
  files: string[];
  /** Files the agent added, changed, or deleted, relative to the workspace. */
  changedFiles: string[];
}

/**
 * A task's `check.ts`. `path` is the page to load instead of the home page. `beforeLoad` prepares the page before
 * navigation, such as faking a browser feature the player hides controls without, and `afterLoad` can move to the page
 * the player is on. The other hooks return assertions; `afterPlayback` runs only once playback has started, and
 * `project` reads the files, such as a dependency that must be gone or a page that must stay untouched.
 */
export interface TaskCheck {
  path?: string;
  beforeLoad?: (page: Page) => Promise<void>;
  /** Runs once the page loads, before the grader looks for the player, such as opening the page a site plays on. */
  afterLoad?: (page: Page) => Promise<void>;
  beforePlayback?: (context: TaskCheckContext) => Promise<TaskAssertion[]>;
  afterPlayback?: (context: TaskCheckContext) => Promise<TaskAssertion[]>;
  project?: (context: ProjectCheckContext) => TaskAssertion[] | Promise<TaskAssertion[]>;
}

export interface BrowserReport {
  engine: BrowserEngine;
  status: number | null;
  navigationError: string | null;
  pageErrors: string[];
  consoleErrors: string[];
  /** Page and console errors that mean server-rendered markup did not match the client. */
  hydrationErrors?: string[];
  mediaAttached: boolean;
  /** The first media element's tag, `video` or `audio`. */
  mediaTag?: 'video' | 'audio' | null;
  /** Media URLs the page requested, first 50. */
  mediaRequests?: string[];
  /** `src`, `currentSrc`, and `playback-id` values on media elements and custom media hosts. */
  mediaSources?: string[];
  /** Whether elements only Video.js 10 renders are on the page. */
  runtimeV10?: boolean;
  /** Where the player sits relative to the text the task names in `expect.after`. */
  placement?: { anchorFound: boolean; below: boolean; detail: string } | null;
  /** Size of the player box, or of the media element when there is no skin or container. */
  playerSize: { width: number; height: number } | null;
  controlsVisible: boolean | null;
  runtimeV8: boolean;
  runtimeMinimal: boolean;
  /** CDN requests served from packed builds or redirected to the pinned release. */
  cdnRequestsRouted: number;
  playback: { ok: boolean; detail: string; currentTime: number | null; mediaError: number | null };
  /** Results of the task's `check.ts`, or `null` when the task has none. */
  taskAssertions: TaskAssertion[] | null;
  /** Serious and critical axe findings in the player and its controls. */
  a11y: { serious: number; critical: number; rules: string[]; targets?: string[] } | null;
  /** The same for the whole page, which includes the fixture's own markup. */
  a11yPage?: { serious: number; critical: number; rules: string[]; targets?: string[] } | null;
}

interface MediaState {
  paused: boolean;
  currentTime: number;
  error: number | null;
  readyState: number;
}

/**
 * Loads the built site in Firefox, which decodes the H.264 demo video on both arm64 and x64 Linux where Playwright's
 * Chromium does not. Firefox fails to decode some AAC audio, so a media decode error gets a second look in WebKit.
 */
export async function checkInBrowser(
  url: string,
  expect: TaskExpectation,
  screenshotPath: string,
  cdnRoute?: CdnRoute,
  checkModule?: string
): Promise<BrowserReport> {
  const taskCheck = checkModule ? ((await import(pathToFileURL(checkModule).href)) as TaskCheck) : null;
  const report = await checkInEngine('firefox', url, expect, screenshotPath, cdnRoute, taskCheck);
  const decodeError = report.playback.mediaError === 3 || report.playback.mediaError === 4;
  if (report.playback.ok || !decodeError) return report;

  const retry = await checkInEngine('webkit', url, expect, screenshotPath, cdnRoute, taskCheck);

  return retry.playback.ok ? retry : report;
}

async function checkInEngine(
  engine: BrowserEngine,
  url: string,
  expect: TaskExpectation,
  screenshotPath: string,
  cdnRoute: CdnRoute | undefined,
  taskCheck: TaskCheck | null
): Promise<BrowserReport> {
  const browser = await (engine === 'firefox' ? firefox : webkit).launch();

  try {
    // Axe needs a page from an explicit context.
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    let cdnRequestsRouted = 0;

    if (cdnRoute) {
      await context.route(CDN_URL, async (route) => {
        const [, name = '', version, path = ''] = CDN_URL.exec(route.request().url()) ?? [];
        const target = cdnRoute(name, version ?? null, decodeURIComponent(path));
        if (!target) return route.continue();

        cdnRequestsRouted += 1;

        if ('url' in target) return route.continue({ url: target.url });

        // Module scripts load cross-origin, so the stand-in needs the CDN's CORS header too.
        return route.fulfill({
          path: target.file,
          headers: {
            'access-control-allow-origin': '*',
            'content-type': CONTENT_TYPES[extname(target.file)] ?? 'application/octet-stream',
          },
        });
      });
    }

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const mediaRequests = new Set<string>();
    let navigationError: string | null = null;

    await taskCheck?.beforeLoad?.(page);

    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('request', (request) => {
      const requestUrl = request.url();

      if (mediaRequests.size < 50 && (request.resourceType() === 'media' || MEDIA_REQUEST.test(requestUrl))) {
        mediaRequests.add(requestUrl);
      }
    });

    const response = await page
      .goto(new URL(taskCheck?.path ?? '/', url).href, { waitUntil: 'load', timeout: 60_000 })
      .catch((error: Error) => {
        navigationError = error.message;
        return null;
      });

    await taskCheck?.afterLoad?.(page).catch(() => {});

    const media = page.locator('video, audio').first();
    const mediaAttached = await media.waitFor({ state: 'attached', timeout: 20_000 }).then(
      () => true,
      () => false
    );
    const anyPlayer = expect.library === 'any';
    const playButton = anyPlayer
      ? page
          .getByRole('button', { name: /^play\b/i })
          .or(page.locator(ANY_PLAY_BUTTON))
          .first()
      : page.locator(PLAY_BUTTON).first();
    // Native controls have no button in the DOM, so a generic task's player waits less and needs none.
    const controlsVisible =
      expect.playback === 'click'
        ? await playButton.waitFor({ state: 'visible', timeout: anyPlayer ? 5_000 : 15_000 }).then(
            () => true,
            () => false
          )
        : null;
    const box = page.locator(PLAYER_BOX).first();
    const sized = (await box.count()) > 0 ? box : media;
    const playerSize = await sized
      .boundingBox({ timeout: 5_000 })
      .then((rect) => (rect ? { width: Math.round(rect.width), height: Math.round(rect.height) } : null))
      .catch(() => null);
    const runtimeV8 = await page.evaluate(() => 'videojs' in window || document.querySelector('.video-js') !== null);
    const runtimeMinimal = (await page.locator(MINIMAL_SKIN).count()) > 0;
    const runtimeV10 = (await page.locator(VIDEOJS_10).count()) > 0;
    const mediaTag = mediaAttached
      ? await media.evaluate((element) => element.localName as 'video' | 'audio').catch(() => null)
      : null;
    const placement = expect.after ? await placedBelow(page, sized, expect.after) : null;
    const checkContext: TaskCheckContext = { page, media, player: sized, playButton };
    const taskAssertions: TaskAssertion[] | null = taskCheck ? [] : null;

    if (taskCheck?.beforePlayback)
      taskAssertions!.push(...(await runTaskHook('before playback', taskCheck.beforePlayback, checkContext)));

    const playback = mediaAttached
      ? await checkPlayback(
          media,
          expect.playback === 'click' ? playButton : null,
          controlsVisible !== false,
          anyPlayer
        )
      : { ok: false, detail: 'No video or audio element on the page.', currentTime: null, mediaError: null };

    if (taskCheck?.afterPlayback) {
      taskAssertions!.push(
        ...(playback.ok
          ? await runTaskHook('after playback', taskCheck.afterPlayback, checkContext)
          : [{ name: 'after playback', ok: false, detail: 'Playback never started.' }])
      );
    }

    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

    const mediaSources = await collectMediaSources(page);
    // The page's own markup, such as a fixture without a lang attribute, is not the player's doing.
    const a11y = (await page.locator(A11Y_SCOPE).count()) > 0 ? await axe(page, A11Y_SCOPE) : null;
    const a11yPage = await axe(page);
    const errors = [...pageErrors, ...consoleErrors];

    return {
      engine,
      status: response?.status() ?? null,
      navigationError,
      pageErrors,
      consoleErrors: consoleErrors.slice(0, 20),
      hydrationErrors: errors.filter((error) => HYDRATION.test(error)).slice(0, 5),
      mediaAttached,
      mediaTag,
      mediaRequests: [...mediaRequests],
      mediaSources,
      runtimeV10,
      placement,
      playerSize,
      controlsVisible,
      runtimeV8,
      runtimeMinimal,
      cdnRequestsRouted,
      playback,
      taskAssertions,
      a11y,
      a11yPage,
    };
  } finally {
    await browser.close();
  }
}

async function axe(page: Page, include?: string): Promise<NonNullable<BrowserReport['a11y']> | null> {
  const builder = new AxeBuilder({ page });

  if (include) builder.include(include);

  return builder
    .analyze()
    .then(({ violations }) => {
      const found = violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');

      return {
        serious: found.filter(({ impact }) => impact === 'serious').length,
        critical: found.filter(({ impact }) => impact === 'critical').length,
        rules: found.map(({ id }) => id),
        targets: found.flatMap(({ id, nodes }) => nodes.slice(0, 3).map(({ target }) => `${id} ${target.join(' ')}`)),
      };
    })
    .catch(() => null);
}

/** Media sources as markup states them, including custom media hosts such as `<mux-video playback-id>`. */
function collectMediaSources(page: Page): Promise<string[]> {
  return page
    .evaluate(() => {
      const values = new Set<string>();
      const visit = (root: Document | ShadowRoot) => {
        for (const element of root.querySelectorAll('*')) {
          const name = element.localName;
          const media = name === 'video' || name === 'audio' || name === 'source' || /-(?:video|audio)$/.test(name);

          if (media) {
            for (const attribute of ['src', 'playback-id', 'playbackid']) {
              const value = element.getAttribute(attribute);

              if (value) values.add(value);
            }

            if (element instanceof HTMLMediaElement && element.currentSrc) values.add(element.currentSrc);
          }

          if (element.shadowRoot) visit(element.shadowRoot);
        }
      };

      visit(document);

      return [...values].slice(0, 20);
    })
    .catch(() => []);
}

/** Whether the player's top edge sits at or below the bottom of the first element showing `text`. */
async function placedBelow(
  page: Page,
  player: Locator,
  text: string
): Promise<NonNullable<BrowserReport['placement']>> {
  const anchor = page.getByText(text, { exact: false }).first();
  const anchorBox = await anchor.boundingBox({ timeout: 2_000 }).catch(() => null);
  const playerBox = await player.boundingBox({ timeout: 2_000 }).catch(() => null);

  if (!anchorBox) return { anchorFound: false, below: false, detail: `"${text}" is not on the page.` };

  if (!playerBox) return { anchorFound: true, below: false, detail: 'No player box.' };

  const anchorBottom = anchorBox.y + anchorBox.height;
  // A player laid out behind the text, such as a background video, starts above it.
  const below = playerBox.y >= anchorBottom - 2;

  return {
    anchorFound: true,
    below,
    detail: `player top ${Math.round(playerBox.y)} px, text bottom ${Math.round(anchorBottom)} px`,
  };
}

/** A throwing check counts as one failed assertion, so a broken grader shows up in the result rather than crashing it. */
async function runTaskHook(
  name: string,
  hook: (context: TaskCheckContext) => Promise<TaskAssertion[]>,
  context: TaskCheckContext
): Promise<TaskAssertion[]> {
  try {
    return await hook(context);
  } catch (error) {
    return [{ name, ok: false, detail: error instanceof Error ? error.message : String(error) }];
  }
}

async function checkPlayback(
  media: Locator,
  playButton: Locator | null,
  canClick: boolean,
  anyPlayer: boolean
): Promise<BrowserReport['playback']> {
  let detail = '';

  // With native controls there is no button to press, so a generic task's player starts from script, muted as
  // autoplay rules require.
  if (playButton && anyPlayer && !(await playButton.isVisible().catch(() => false))) {
    detail = 'No play button; started from script. ';
    await media.evaluate((element) => {
      const target = element as HTMLMediaElement;

      target.muted = true;
      void target.play().catch(() => {});
    });
  } else if (playButton) {
    if (!canClick) return { ok: false, detail: 'No visible play button.', currentTime: null, mediaError: null };

    // Skins can layer a gesture surface over the controls; a forced click still reaches the button.
    await playButton.click({ timeout: 10_000 }).catch(async () => {
      detail = 'Play button needed a forced click. ';
      await playButton.click({ force: true, timeout: 5_000 }).catch(() => {});
    });
  }

  const deadline = Date.now() + 25_000;
  let state: MediaState | null = null;

  while (Date.now() < deadline) {
    state = await media
      .evaluate((element) => {
        const target = element as HTMLMediaElement;

        return {
          paused: target.paused,
          currentTime: target.currentTime,
          error: target.error?.code ?? null,
          readyState: target.readyState,
        };
      })
      .catch(() => null);

    if (state && !state.paused && state.currentTime > 0.5) {
      return {
        ok: true,
        detail: `${detail}Playing at ${state.currentTime.toFixed(1)} s.`,
        currentTime: state.currentTime,
        mediaError: null,
      };
    }

    if (state?.error) break;

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const reason = state
    ? `paused=${state.paused} currentTime=${state.currentTime.toFixed(2)} readyState=${state.readyState} error=${state.error}`
    : 'media state unavailable';

  return {
    ok: false,
    detail: `${detail}Playback did not advance (${reason}).`,
    currentTime: state?.currentTime ?? null,
    mediaError: state?.error ?? null,
  };
}

/** A skin's custom elements for every preset, such as `video-neutral-skin`. */
function skinElements(skin: string): string {
  return ['video', 'audio', 'live-video', 'live-audio'].map((preset) => `${preset}-${skin}-skin`).join(', ');
}
