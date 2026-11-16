import { expect, type Page, test } from '@playwright/test';

import { MEDIA } from '../../../shared/fixtures/resources';

/**
 * The SPF background-video composition end to end: a real manifest through the engine, onto the Media's `error`, and
 * out to whichever surface the platform gives a consumer.
 *
 * What only a browser can establish, and so what this file is for: **nothing about an unplayable source reaches the
 * media element here.** The unit tests write `state.errors` directly and assert the promotion; they cannot show that
 * the engine derives that sequence from a real playlist, and they cannot show that `HTMLMediaElement.error` stays null
 * while it does. That claim is the premise the whole surface rests on — if a browser ever starts reporting these
 * itself, this is where we find out.
 *
 * The pinned variant's own shape is the other thing pinned down here. Only the _selected_ rendition's playlist is ever
 * resolved. Once that pick is identified as unplayable, capability pruning re-evaluates selection and reports the
 * per-rendition cause followed by the terminal no-supported-track verdict. A source offering no video at all reports
 * only the verdict. Both are fatal, and asserting the sequence (not just the surfaced code) catches a selection
 * refactor quietly changing which conditions reach consumers.
 *
 * @see internal/design/spf/features/errors.md
 * @see internal/design/spf/features/rendition-selection-caps.md
 */

/** SVTA 99 [Custom] 001 — the engine has no pipeline for what the source needs. */
const SVTA_UNSUPPORTED_PLAYBACK_FEATURE = 99001;

/** SVTA 2 [Playback] 011 — no video track this environment can play. */
const SVTA_NO_SUPPORTED_VIDEO_TRACK = 2011;

/** SVTA 1 [Media Content] 004 — the per-rendition container cause. */
const SVTA_UNSUPPORTED_VIDEO_FORMAT = 1004;

/** SVTA 4 [Content Protection] 008 — encrypted, with no decryption pipeline. */
const SVTA_UNSUPPORTED_DRM_SYSTEM = 4008;

declare global {
  interface Window {
    __srcAtPause?: string;
  }
}

const HTML_PAGE = '/pages/html-hls-background-video.html';
const REACT_PAGE = '/pages/react-hls-background-video.html';

const pageFor = (base: string, url: string) => `${base}?src=${encodeURIComponent(url)}`;

interface SurfacedError {
  code: number;
  message: string;
}

type BackgroundVideoElement = HTMLElement & {
  error?: SurfacedError | null;
  video?: HTMLVideoElement | null;
  src?: string;
  getMediaTarget?(): { engine?: { state?: { errors?: { get(): Array<{ code: number }> | undefined } } } };
};

// Each of these runs in the page, where `page.evaluate` serializes the function
// without its module scope — so every one looks the element up for itself rather
// than sharing a helper.

/** The error the Media surfaces, or null while none has. */
function readSurfacedError(): SurfacedError | null {
  const media = document.querySelector('hls-background-video') as BackgroundVideoElement | null;

  return media?.error ?? null;
}

/** Every SVTA code in the engine's reported sequence, causes included. */
function readReportedCodes(): number[] {
  const media = document.querySelector('hls-background-video') as BackgroundVideoElement | null;
  const errors = media?.getMediaTarget?.()?.engine?.state?.errors?.get() ?? [];

  return errors.map((error) => error.code);
}

/** What the inner `<video>` itself knows about the failure. Expected: nothing. */
function readInnerVideoState(): { error: number | null; readyState: number } | null {
  const media = document.querySelector('hls-background-video') as BackgroundVideoElement | null;
  const video = media?.video;

  return video ? { error: video.error?.code ?? null, readyState: video.readyState } : null;
}

function readPlaybackState(): { readyState: number; currentTime: number; width: number; height: number } | null {
  const media = document.querySelector('hls-background-video') as BackgroundVideoElement | null;
  const video = media?.video;

  return video
    ? {
        readyState: video.readyState,
        currentTime: video.currentTime,
        width: video.videoWidth,
        height: video.videoHeight,
      }
    : null;
}

async function waitForSurfacedError(page: Page): Promise<SurfacedError> {
  await page.waitForFunction(
    () => !!(document.querySelector('hls-background-video') as (HTMLElement & { error?: unknown }) | null)?.error,
    undefined,
    { timeout: 20_000 }
  );

  const error = await page.evaluate(readSurfacedError);

  expect(error).not.toBeNull();
  return error as SurfacedError;
}

/** Wait for frames to exist and the clock to move — playing, not merely loaded. */
async function waitForPlayback(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const video = (document.querySelector('hls-background-video') as { video?: HTMLVideoElement | null } | null)
        ?.video;

      return !!video && video.readyState >= 3 && video.currentTime > 0;
    },
    undefined,
    { timeout: 30_000 }
  );
}

test.describe('SPF background video', () => {
  test('a playable fMP4 source plays and surfaces no error', async ({ page }) => {
    await page.goto(pageFor(HTML_PAGE, MEDIA.hlsFmp4.url));
    await waitForPlayback(page);

    // The control. Without it, a spec that always reported fatal would pass —
    // and autoplay is the composition's own contract, since nothing here offers
    // a play button to fall back on.
    expect(await page.evaluate(readSurfacedError)).toBeNull();
    expect(await page.evaluate(readReportedCodes)).toEqual([]);
  });

  test('an MPEG-TS source surfaces a fatal unsupported-playback-feature error', async ({ page }) => {
    await page.goto(pageFor(HTML_PAGE, MEDIA.hlsTs.url));

    const error = await waitForSurfacedError(page);

    expect(error.code).toBe(SVTA_UNSUPPORTED_PLAYBACK_FEATURE);
    // Deliberately empty: viewer-facing copy is the consumer's to localize from
    // the code, and the engine's own explanation goes to the console.
    expect(error.message).toBe('');
  });

  test('the MPEG-TS sequence retains the cause before the terminal verdict', async ({ page }) => {
    await page.goto(pageFor(HTML_PAGE, MEDIA.hlsTs.url));
    await waitForSurfacedError(page);

    const codes = await page.evaluate(readReportedCodes);

    // Resolution reports why the selected rendition is unusable, then the
    // capability constraint removes it and the selector reports the terminal
    // absence of a playable video track.
    expect(codes).toEqual([SVTA_UNSUPPORTED_VIDEO_FORMAT, SVTA_NO_SUPPORTED_VIDEO_TRACK]);
  });

  test('the inner video learns nothing — no error, still at readyState 0', async ({ page }) => {
    await page.goto(pageFor(HTML_PAGE, MEDIA.hlsTs.url));
    await waitForSurfacedError(page);

    // The measured premise this whole surface exists for. Nothing in MSE reports
    // an unplayable source here: Chromium accepts MPEG-TS appends into a
    // `video/mp4` SourceBuffer and buffers nothing, WebKit demuxes the TS
    // outright, and neither produces a SourceBuffer, MediaSource, or element
    // error. If this assertion ever fails, the browser started doing the work
    // itself and the composition should be reconsidered — that is a finding, not
    // a flake.
    expect(await page.evaluate(readInnerVideoState)).toEqual({ error: null, readyState: 0 });
  });

  test('an encrypted source with no license path surfaces the same fatal code', async ({ page }) => {
    await page.goto(pageFor(HTML_PAGE, MEDIA.hlsDrm.url));

    const error = await waitForSurfacedError(page);
    const codes = await page.evaluate(readReportedCodes);

    // One surfaced code for both failures, because the consumer's situation is
    // identical: this player cannot play this source, and no retry or CDN helps.
    // The sequence is where the two stay distinguishable.
    expect(error.code).toBe(SVTA_UNSUPPORTED_PLAYBACK_FEATURE);
    expect(codes).toContain(SVTA_UNSUPPORTED_DRM_SYSTEM);
  });

  test('a source with no video renditions surfaces the verdict itself', async ({ page }) => {
    await page.goto(pageFor(HTML_PAGE, MEDIA.hlsAudioOnly.url));

    const error = await waitForSurfacedError(page);
    const codes = await page.evaluate(readReportedCodes);

    // The mirror of the MPEG-TS case: nothing resolves, so no cause exists to be
    // more specific than the verdict, and with nothing unsupported in the
    // sequence the code is not substituted. This is `reportAbsentTrackType`
    // firing from the head of the constraint chain, where an empty input still
    // means "the source offers none" rather than "the constraints pruned them".
    expect(error.code).toBe(SVTA_NO_SUPPORTED_VIDEO_TRACK);
    expect(codes).toEqual([SVTA_NO_SUPPORTED_VIDEO_TRACK]);
  });

  test('changing to a playable source clears the error and plays', async ({ page }) => {
    await page.goto(pageFor(HTML_PAGE, MEDIA.hlsTs.url));
    await waitForSurfacedError(page);

    await page.evaluate((url) => {
      const media = document.querySelector('hls-background-video') as (HTMLElement & { src?: string }) | null;

      if (media) media.src = url;
    }, MEDIA.hlsFmp4.url);

    // Per-source reset through the whole chain: `collectErrors` clears the
    // sequence on source change and the adapter's `error` follows, with no
    // source-change hook of its own. Recovery, not just a cleared flag over a
    // dead engine — so playback is asserted too.
    await page.waitForFunction(
      () => {
        const media = document.querySelector('hls-background-video') as (HTMLElement & { error?: unknown }) | null;

        return !!media && !media.error;
      },
      undefined,
      { timeout: 20_000 }
    );
    await waitForPlayback(page);
  });

  test("React's onError fires for a source the <video> never learns about", async ({ page }) => {
    await page.goto(pageFor(REACT_PAGE, MEDIA.hlsTs.url));

    // The component exposes no Media, so the prop firing at all is the contract.
    // It can only fire because the component re-dispatches on the `<video>`,
    // whose own `error` stays null throughout.
    await page.waitForFunction(
      () => ((window as Window & { __backgroundVideoErrors?: number }).__backgroundVideoErrors ?? 0) > 0,
      undefined,
      { timeout: 20_000 }
    );

    const videoError = await page.evaluate(() => document.querySelector('video')?.error?.code ?? null);

    expect(videoError).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Pausing before the stream attaches
  // ---------------------------------------------------------------------------
  // The engine assigns its MediaSource to the <video> asynchronously, and that
  // assignment runs the media load algorithm, which resets `paused`. With
  // `autoplay` still on, a pause made before it — the reduced-motion check on page
  // load — would be undone. The pages pause in the same task the element is
  // created and record the video's `src` at that moment, so each test can confirm
  // the pause really came first.
  test.describe('pausing before the stream attaches', () => {
    async function expectStaysPaused(page: Page, selector: string) {
      await page.waitForFunction(
        (sel) => {
          const element = document.querySelector(sel) as (HTMLElement & { target?: HTMLVideoElement }) | null;
          const video = (element?.target ?? element) as HTMLVideoElement | null;

          return !!video && video.readyState >= 2;
        },
        selector,
        { timeout: 30_000 }
      );

      // The pause preceded the attach, or the test proves nothing.
      expect(await page.evaluate(() => window.__srcAtPause)).toBe('');

      // Long enough for autoplay to have kicked in had it survived.
      await page.waitForTimeout(1_000);

      const state = await page.evaluate((sel) => {
        const element = document.querySelector(sel) as (HTMLElement & { target?: HTMLVideoElement }) | null;
        const video = (element?.target ?? element) as HTMLVideoElement | null;

        return video ? { paused: video.paused, currentTime: video.currentTime } : null;
      }, selector);

      expect(state).toEqual({ paused: true, currentTime: 0 });
    }

    async function expectPlaysOnRequest(page: Page, selector: string) {
      await page.evaluate((sel) => {
        const element = document.querySelector(sel) as (HTMLElement & { target?: HTMLVideoElement }) | null;
        const video = (element?.target ?? element) as HTMLVideoElement | null;

        return video?.play();
      }, selector);

      await page.waitForFunction(
        (sel) => {
          const element = document.querySelector(sel) as (HTMLElement & { target?: HTMLVideoElement }) | null;
          const video = (element?.target ?? element) as HTMLVideoElement | null;

          return !!video && !video.paused && video.currentTime > 0;
        },
        selector,
        { timeout: 20_000 }
      );
    }

    test('without noautoplay, the attach undoes an earlier pause', async ({ page }) => {
      // The control, and the reason the opt-out exists. Before the stream attaches
      // the video is already paused, so `pause()` is a no-op the element can't
      // observe; the load the attach runs then lets autoplay start it. If this ever
      // stays paused, the browser stopped resetting on load and the tests below no
      // longer exercise anything.
      await page.goto(`${HTML_PAGE}?pause`);
      await waitForPlayback(page);

      expect(await page.evaluate(() => window.__srcAtPause)).toBe('');
    });

    test('stays paused with noautoplay, then plays on request', async ({ page }) => {
      await page.goto(`${HTML_PAGE}?noautoplay&pause`);
      await expectStaysPaused(page, 'hls-background-video');
      await expectPlaysOnRequest(page, 'hls-background-video');
    });

    test('React: stays paused with autoPlay={false}, then plays on request', async ({ page }) => {
      await page.goto(`${REACT_PAGE}?noautoplay&pause`);
      await expectStaysPaused(page, 'video');
      await expectPlaysOnRequest(page, 'video');
    });
  });

  // ---------------------------------------------------------------------------
  // Screen-size rendition cap
  // ---------------------------------------------------------------------------
  // `getScreenResolution` reads `screen.width/height × devicePixelRatio`. Measured
  // in both projects: `window.screen` follows the *emulated viewport* rather than
  // the `screen` context option, so the reading is driven here through viewport
  // and `deviceScaleFactor`, which are emulated reliably. That makes the pick
  // deterministic; it also means this file can't distinguish "reads the screen"
  // from "reads the window", which stays a unit-level concern.
  //
  // Assertions are about *fit* rather than exact rungs, so a ladder change at the
  // source doesn't break them.
  test.describe('screen-size cap', () => {
    const readPickedSize = async (page: Page) => {
      await waitForPlayback(page);
      const state = await page.evaluate(readPlaybackState);

      expect(state).not.toBeNull();
      return state as NonNullable<typeof state>;
    };

    test.describe('on a small screen', () => {
      test.use({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });

      test('caps the pinned rendition to what the screen can show', async ({ page }) => {
        await page.goto(pageFor(HTML_PAGE, MEDIA.hls4k.url));
        const { width, height } = await readPickedSize(page);

        // The cap's whole claim: a 4K ladder on an 800x600 screen must not pin a
        // rendition the screen cannot show. Area rather than per-axis, matching
        // the rule — an anamorphic rendition isn't measured by matching tiers.
        expect(width * height).toBeLessThanOrEqual(800 * 600);
        expect(width).toBeGreaterThan(0);
      });
    });

    test.describe('on a 4K screen', () => {
      // 1920x1080 at 2x — a 4K budget reached through the device pixel ratio, so
      // this also covers `useDevicePixelRatio`: in CSS pixels alone the same
      // viewport could never justify a 2160-line rendition.
      test.use({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });

      test('takes the largest rendition when the screen can show it', async ({ page }) => {
        await page.goto(pageFor(HTML_PAGE, MEDIA.hls4k.url));
        const { width, height } = await readPickedSize(page);

        // The other half of the rule, and what stops the cap from being a
        // constant: the same source on a screen with room pins something the
        // small-screen case could not. Bounded rather than pinned to an exact
        // rung, so the assertions survive a ladder change at the source.
        expect(height).toBeGreaterThan(1080);
        expect(width * height).toBeLessThanOrEqual(3840 * 2160);
      });
    });
  });
});
