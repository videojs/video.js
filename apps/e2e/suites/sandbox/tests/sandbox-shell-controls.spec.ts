import { expect, type Frame, type Page, test } from '@playwright/test';

const SANDBOX_BASE = process.env.SANDBOX_URL ?? 'http://localhost:5299';

const QUERY = 'styling=css&skin=default&source=mp4-1&autoplay=0&muted=1&loop=0&preload=metadata';

test.use({ trace: 'off' });

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

/** The width control lives in the options panel, which opens closed. */
async function openOptions(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Options', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Options' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close options', exact: true })).toBeFocused();
}

async function playerWidth(scope: Page | Frame): Promise<number> {
  const root = scope.getByRole('group', { name: 'Media player' }).first();

  await expect(root).toBeVisible({ timeout: 15_000 });

  const box = await root.boundingBox();
  if (!box) throw new Error('Expected the media player to have a rendered box.');

  return Math.round(box.width);
}

test.describe('Sandbox shell controls', () => {
  for (const width of [320, 1280]) {
    test(`select menus keep option labels within the popup at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&${QUERY}`);

      for (const name of ['Media', 'Source']) {
        await page.getByRole('combobox', { name, exact: true }).click();
        const popup = page.locator('[data-slot="select-content"][data-open]');

        await expect(popup).toBeVisible();
        await expect(async () => {
          const bounds = await popup.boundingBox();

          expect(bounds).not.toBeNull();
          expect(bounds!.x).toBeGreaterThanOrEqual(0);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
          const clipped = await popup
            .getByRole('option')
            .evaluateAll((options) => options.some((option) => option.scrollWidth > option.clientWidth));

          expect(clipped).toBe(false);
        }).toPass();
        await page.keyboard.press('Escape');
      }
    });
  }

  test('the width control sizes the player in the preview', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&width=480&${QUERY}`, {
      waitUntil: 'domcontentloaded',
    });

    const frame = await getPreviewFrame(page, '/html-video/');

    await openOptions(page);

    const slider = page.getByRole('slider', { name: 'Width' });

    await expect(slider).toHaveAttribute('aria-valuenow', '480');
    await expect.poll(() => playerWidth(frame)).toBe(480);

    await slider.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuetext', '481 pixels');
    await page.getByRole('spinbutton', { name: 'Width in pixels' }).fill('640');
    await page.getByRole('spinbutton', { name: 'Width in pixels' }).press('Enter');

    await expect(page).toHaveURL(/[?&]width=640(?:&|$)/);
    await expect.poll(() => playerWidth(frame)).toBe(640);
  });

  test('a preview opens at its skin width until the control is touched', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=react&media=audio&${QUERY}`, { waitUntil: 'domcontentloaded' });

    const frame = await getPreviewFrame(page, '/react-audio/');

    await openOptions(page);
    await expect(page.getByRole('slider', { name: 'Width' })).toHaveAttribute('aria-valuenow', '576');
    await expect.poll(() => playerWidth(frame)).toBe(576);
    await expect(page).not.toHaveURL(/[?&]width=/);
  });

  test('a direct page takes width, scheme, and direction from its query', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/react-video/?width=400&scheme=dark&dir=rtl&${QUERY}`, {
      waitUntil: 'domcontentloaded',
    });

    const html = page.locator('html');
    const root = page.getByRole('group', { name: 'Media player' }).first();

    await expect.poll(() => playerWidth(page)).toBe(400);
    await expect(html).toHaveAttribute('data-color-scheme', 'dark');
    await expect(html).toHaveCSS('color-scheme', 'dark');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(root).toHaveCSS('direction', 'rtl');
  });

  test('a pinned direction outlives the locale', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/html-video/?locale=ar&dir=ltr&${QUERY}`, { waitUntil: 'domcontentloaded' });

    const html = page.locator('html');

    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'ltr');
  });

  test('direction stays inside the preview while the scheme also reaches the shell', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&${QUERY}`, { waitUntil: 'domcontentloaded' });

    const frame = await getPreviewFrame(page, '/html-video/');
    const root = frame.getByRole('group', { name: 'Media player' }).first();

    await expect(root).toBeVisible({ timeout: 15_000 });
    await expect(root).toHaveCSS('direction', 'ltr');

    await openOptions(page);
    await page.getByRole('combobox', { name: 'Direction', exact: true }).click();
    await page.getByRole('option', { name: 'Right to left', exact: true }).click();

    await expect(frame.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(root).toHaveCSS('direction', 'rtl');
    await expect(page.locator('html')).toHaveCSS('direction', 'ltr');
    await expect(page).toHaveURL(/[?&]dir=rtl(?:&|$)/);

    await page.getByRole('combobox', { name: 'Color scheme', exact: true }).click();
    await page.getByRole('option', { name: 'Light', exact: true }).click();

    await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
    await expect(frame.locator('html')).toHaveAttribute('data-color-scheme', 'light');
    await expect(frame.locator('html')).toHaveCSS('color-scheme', 'light');
    await expect(page).toHaveURL(/[?&]scheme=light(?:&|$)/);

    await page.reload({ waitUntil: 'domcontentloaded' });

    const reloaded = await getPreviewFrame(page, '/html-video/');

    await expect(reloaded.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveCSS('direction', 'ltr');
  });

  test('switches and grouped language options retain their settings', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&${QUERY}`);
    await openOptions(page);
    const loop = page.getByRole('switch', { name: 'Loop', exact: true });

    await loop.press('Space');
    await expect(loop).toBeChecked();
    await expect(page).toHaveURL(/[?&]loop=1(?:&|$)/);
    await page.getByRole('combobox', { name: 'Language', exact: true }).click();
    await expect(page.getByRole('group', { name: 'Built-in packs', exact: true })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Browser API only', exact: true })).toBeAttached();
    await page.getByRole('option', { name: 'French', exact: true }).click();
    await expect(page).toHaveURL(/[?&]locale=fr(?:&|$)/);
  });

  test('closing the sidebar restores focus and excludes its controls from tab order', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&${QUERY}`);
    await openOptions(page);
    await page.getByRole('button', { name: 'Close options', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Options', exact: true })).toBeFocused();
    await expect(page.getByRole('slider', { name: 'Width', exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Options', exact: true })).toHaveAttribute('aria-expanded', 'false');
  });

  test('mobile options use a dialog that returns focus on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&${QUERY}`);
    const trigger = page.getByRole('button', { name: 'Options', exact: true });

    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Options', exact: true });

    await expect(dialog).toBeVisible();
    await dialog.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('pointer changes snap at breakpoints without trapping keyboard adjustments', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&width=800&${QUERY}`);
    await openOptions(page);
    const slider = page.getByRole('slider', { name: 'Width', exact: true });
    const track = await page.locator('[data-slot="slider"]').boundingBox();
    if (!track) throw new Error('Expected a width slider track.');

    await page.locator('[data-slot="slider"]').click({
      position: { x: track.width * ((516 - 240) / (1360 - 240)), y: track.height / 2 },
    });
    await expect(slider).toHaveAttribute('aria-valuenow', '512');
    await slider.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuenow', '513');
  });
});
