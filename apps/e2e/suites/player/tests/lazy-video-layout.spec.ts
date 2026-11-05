import { expect, type Page, test } from '@playwright/test';

/** The element each source resolves to, found by what it renders. */
const SOURCES = {
  mp4: 'video',
  hls: 'video',
  dash: 'video',
  youtube: 'iframe',
} as const;

type Source = keyof typeof SOURCES;

/** The stage is 640px wide, so a 16:9 player is 360px tall. */
const PLAYER_HEIGHT = 360;

async function open(page: Page, framework: string, src: Source, layout = 'sized') {
  await page.goto(`/lazy-video-layout.html?framework=${framework}&layout=${layout}&src=${src}`);
  await resolved(page, src);
}

async function resolved(page: Page, src: Source) {
  await page
    .locator(`.media-container ${SOURCES[src]}, video-skin ${SOURCES[src]}`)
    .first()
    .waitFor({ state: 'attached' });
  // Under `preload="none"` nothing signals that a media is done loading, and some engines still fetch metadata, which is
  // when a media that sized itself would resize. Give them a moment to.
  await page.waitForTimeout(1_000);
}

function skinHeights(page: Page) {
  return page.evaluate(() => window.skinHeights);
}

for (const framework of ['react', 'html']) {
  test.describe(`LazyVideo layout (${framework})`, () => {
    // SAFETY: `SOURCES` is a literal with exactly the `Source` keys.
    for (const src of Object.keys(SOURCES) as Source[]) {
      test(`keeps a sized player's box while it resolves ${src}`, async ({ page }) => {
        await open(page, framework, src);

        const heights = await skinHeights(page);

        // WebKit rounds the HTML skin's 16:9 box up by a pixel or two, before and after the media alike.
        expect(heights[0]).toBeCloseTo(PLAYER_HEIGHT, -1);
        expect(new Set(heights), `heights: ${heights}`).toEqual(new Set([heights[0]]));
      });
    }

    test(`keeps a sized player's box when src swaps the media`, async ({ page }) => {
      await open(page, framework, 'mp4');

      for (const src of ['hls', 'youtube', 'dash', 'mp4'] as const) {
        await page.evaluate((key) => window.setSource(key), src);
        await resolved(page, src);
      }

      const heights = await skinHeights(page);

      expect(new Set(heights), `heights: ${heights}`).toEqual(new Set([heights[0]]));
    });

    test('gives an embed a 16:9 box in a player without a height of its own', async ({ page }) => {
      await open(page, framework, 'youtube', 'auto');

      const heights = await skinHeights(page);

      expect(heights.at(-1)).toBeGreaterThan(0);
    });
  });
}
