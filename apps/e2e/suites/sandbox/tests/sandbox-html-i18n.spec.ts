import { expect, type Frame, type Page, test } from '@playwright/test';

import { SELECTORS } from '../../../shared/fixtures/selectors';

const SANDBOX_BASE = process.env.SANDBOX_URL ?? 'http://localhost:5299';

const QUERY = 'locale=es&styling=css&skin=default&source=hls-1&autoplay=0&muted=0&loop=0&preload=metadata';
const RTL_QUERY = 'locale=ar&styling=css&skin=default&source=hls-1&autoplay=0&muted=0&loop=0&preload=metadata';

test.use({ trace: 'off' });

async function expectSpanishPlayLabel(scope: Page | Frame): Promise<void> {
  const playButton = scope.locator(SELECTORS.playButton).first();

  await expect(playButton).toHaveAttribute('aria-label', 'Reproducir', { timeout: 15_000 });
}

function getPlayer(page: Page) {
  return page
    .locator('[role="group"]')
    .filter({ has: page.locator('[role="slider"]') })
    .first();
}

async function getControlOrder(page: Page): Promise<string[]> {
  const player = getPlayer(page);

  await expect(player).toBeVisible({ timeout: 15_000 });
  const controls = player.locator('button, [role="button"], [role="slider"], time');
  const visible = await Promise.all(
    (await controls.all()).map(async (control, index) => {
      if (!(await control.isVisible())) return;

      const box = await control.boundingBox();

      return box ? { index, x: box.x } : undefined;
    })
  );

  return visible
    .filter((control) => control !== undefined)
    .sort((a, b) => a.x - b.x)
    .map((control) => String(control.index));
}

async function getPreviewFrame(page: Page, path: string): Promise<Frame> {
  await expect(page.locator('iframe[title="player demo"]')).toHaveAttribute('src', new RegExp(`^${path}`));
  await expect
    .poll(() =>
      page
        .frames()
        .find((frame) => frame.url().includes(path))
        ?.url()
    )
    .toContain(path);

  const frame = page.frames().find((frame) => frame.url().includes(path));
  if (!frame) throw new Error(`Preview frame not found: ${path}`);

  return frame;
}

test.describe('Sandbox HTML i18n', () => {
  test('direct HTML page shows Spanish play label', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/html-video/?${QUERY}`, { waitUntil: 'domcontentloaded' });
    await expectSpanishPlayLabel(page);
  });

  test('shell iframe shows Spanish play label', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&${QUERY}`, {
      waitUntil: 'domcontentloaded',
    });
    const frame = await getPreviewFrame(page, '/html-video/');

    await expectSpanishPlayLabel(frame);
  });

  test('direct HTML page applies RTL locale to the player boundary', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/html-video/?${RTL_QUERY}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const provider = page.locator('media-i18n');

    await expect(provider.locator('video-skin')).toHaveCSS('direction', 'rtl');
  });
});

test.describe('Sandbox React i18n', () => {
  test('direct React page shows Spanish play label', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/react-video/?${QUERY}`, { waitUntil: 'domcontentloaded' });
    await expectSpanishPlayLabel(page);
  });

  test('shell iframe shows Spanish play label', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=react&media=video&${QUERY}`, {
      waitUntil: 'domcontentloaded',
    });
    const frame = await getPreviewFrame(page, '/react-video/');

    await expectSpanishPlayLabel(frame);
  });

  test('direct React page applies RTL direction to the document and player', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/react-video/?${RTL_QUERY}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('.media-skin[data-theme="default"][data-preset="video"]')).toHaveCSS('direction', 'rtl');
  });
});

// VJSC preserves locale direction but intentionally defers legacy physical control order; see vjsc/gaps.md.
test.describe.skip('Sandbox RTL playback control order', () => {
  const cases = [
    { name: 'HTML Default CSS video', path: 'html-video', skin: 'default', styling: 'css', source: 'hls-1' },
    {
      name: 'React Default Tailwind video',
      path: 'react-video',
      skin: 'default',
      styling: 'tailwind',
      source: 'hls-1',
    },
    {
      name: 'HTML Neutral CSS video at small width',
      path: 'html-video',
      skin: 'neutral',
      styling: 'css',
      source: 'hls-1',
      width: 480,
    },
    {
      name: 'HTML Neutral CSS video at large width',
      path: 'html-video',
      skin: 'neutral',
      styling: 'css',
      source: 'hls-1',
      width: 1280,
    },
    {
      name: 'React Neutral Tailwind video at small width',
      path: 'react-video',
      skin: 'neutral',
      styling: 'tailwind',
      source: 'hls-1',
      width: 480,
    },
    {
      name: 'React Neutral Tailwind video at large width',
      path: 'react-video',
      skin: 'neutral',
      styling: 'tailwind',
      source: 'hls-1',
      width: 1280,
    },
    // The audio sandbox pages hand their source to a native media element, and
    // Chromium's HLS demuxer crashes the renderer on the audio-only CMAF asset
    // (reproducible with a bare `<audio src>`, no player involved). The MPEG-TS
    // audio-only asset gives the same audio-player coverage without the crash.
    {
      name: 'HTML Default CSS audio',
      path: 'html-audio',
      skin: 'default',
      styling: 'css',
      source: 'hls-audio-only-ts',
    },
    {
      name: 'React Neutral Tailwind audio',
      path: 'react-audio',
      skin: 'neutral',
      styling: 'tailwind',
      source: 'hls-audio-only-ts',
    },
  ] as const;

  for (const controlCase of cases) {
    test(`${controlCase.name} matches its LTR baseline`, async ({ page }) => {
      if ('width' in controlCase) {
        await page.setViewportSize({ width: controlCase.width, height: 720 });
      }

      const query = `styling=${controlCase.styling}&skin=${controlCase.skin}&source=${controlCase.source}&autoplay=0&muted=0&loop=0&preload=metadata`;

      await page.goto(`${SANDBOX_BASE}/${controlCase.path}/?locale=en&${query}`, {
        waitUntil: 'domcontentloaded',
      });
      const ltrOrder = await getControlOrder(page);

      await page.goto(`${SANDBOX_BASE}/${controlCase.path}/?locale=ar&${query}`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(getPlayer(page)).toHaveCSS('direction', 'rtl');
      expect(await getControlOrder(page)).toEqual(ltrOrder);
    });
  }

  test('Explicit LTR Tailwind player in an RTL document keeps LTR controls', async ({ page }) => {
    const query = 'styling=tailwind&skin=default&source=hls-1&autoplay=0&muted=0&loop=0&preload=metadata';

    await page.goto(`${SANDBOX_BASE}/react-video/?locale=en&${query}`, {
      waitUntil: 'domcontentloaded',
    });
    const ltrOrder = await getControlOrder(page);

    await page.goto(`${SANDBOX_BASE}/react-video/?locale=ar&${query}`, {
      waitUntil: 'domcontentloaded',
    });

    const player = getPlayer(page);

    await expect(player).toBeVisible({ timeout: 15_000 });
    await player.evaluate((element) => element.setAttribute('dir', 'ltr'));
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(player).toHaveCSS('direction', 'ltr');
    expect(await getControlOrder(page)).toEqual(ltrOrder);
  });
});
