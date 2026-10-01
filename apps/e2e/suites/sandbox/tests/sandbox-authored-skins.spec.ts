import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, test } from '@playwright/test';

const SANDBOX_BASE = process.env.SANDBOX_URL ?? 'http://localhost:5299';

// Authored skins compile from `packages/skins/src`, so these cases only mean something where that package exists.
const WORKSPACE_SKINS = existsSync(resolve(import.meta.dirname, '../../../../../packages/skins/package.json'));

const CASES = [
  { platform: 'html', styling: 'css' },
  { platform: 'html', styling: 'tailwind' },
  { platform: 'react', styling: 'css' },
  { platform: 'react', styling: 'tailwind' },
] as const;

test.use({ trace: 'off' });
test.skip(!WORKSPACE_SKINS, 'The authored skins are only compiled inside the workspace.');

for (const { platform, styling } of CASES) {
  test(`${platform} compat ${styling} moves the seek thumb before pointer release`, async ({ page }) => {
    const query = new URLSearchParams({
      skins: 'authored',
      styling,
      skin: 'compat',
      source: 'mp4-1',
      preload: 'metadata',
      autoplay: '0',
    });

    await page.goto(`${SANDBOX_BASE}/${platform}-video/?${query}`, { waitUntil: 'domcontentloaded' });

    const root = page.getByRole('group', { name: 'Media player' }).first();
    const thumb = root.getByRole('slider', { name: 'Seek' });
    const slider = thumb.locator('..');

    await expect(thumb).toBeEnabled({ timeout: 30_000 });

    const box = await slider.boundingBox();
    if (!box) throw new Error('Time slider is not visible');

    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2, { steps: 5 });
    await expect(slider).toHaveAttribute('data-dragging', '');
    await expect
      .poll(async () => {
        const handle = await thumb.boundingBox();

        return handle ? (handle.x + handle.width / 2 - box.x) / box.width : 0;
      })
      .toBeCloseTo(0.6, 1);
    await page.mouse.up();
  });

  for (const skin of ['default', 'neutral', 'compat'] as const) {
    test(`${platform} ${skin} ${styling} renders the authored skin`, async ({ page }) => {
      const errors: string[] = [];

      page.on('pageerror', (error) => errors.push(error.message));

      const query = new URLSearchParams({
        skins: 'authored',
        styling,
        skin,
        source: 'mp4-1',
        autoplay: '0',
        muted: '1',
        loop: '0',
        preload: 'metadata',
      });

      await page.goto(`${SANDBOX_BASE}/${platform}-video/?${query}`, { waitUntil: 'domcontentloaded' });

      const root = page.getByRole('group', { name: 'Media player' }).first();

      await expect(root).toBeVisible({ timeout: 30_000 });
      await expect(root).toHaveAttribute('data-theme', skin);
      await expect(root.getByRole('button', { name: 'Play' }).first()).toBeVisible();

      // The compiled skin carries the theme's control sizing either way; Tailwind reaches it through the recorded
      // utilities, CSS through the module's own stylesheet.
      await expect
        .poll(() =>
          root.evaluate((element) => getComputedStyle(element).getPropertyValue('--media-control-size').trim())
        )
        .not.toBe('');

      expect(errors).toEqual([]);
    });
  }
}

test('the compat preview keeps its thumbnail fixed when the chapter title changes', async ({ page }) => {
  const query = new URLSearchParams({
    skins: 'authored',
    styling: 'css',
    skin: 'compat',
    source: 'mp4-1',
    autoplay: '0',
    muted: '1',
    loop: '0',
    preload: 'metadata',
  });

  await page.goto(`${SANDBOX_BASE}/html-video/?${query}`, { waitUntil: 'domcontentloaded' });

  const root = page.getByRole('group', { name: 'Media player' }).first();
  const slider = root.locator('media-time-slider');
  const thumb = root.getByRole('slider', { name: 'Seek' });
  const preview = slider.locator('media-slider-preview');

  await expect(root).toBeVisible({ timeout: 30_000 });
  await expect(thumb).toBeEnabled({ timeout: 30_000 });

  const sliderBox = await slider.boundingBox();
  if (!sliderBox) throw new Error('Time slider is not visible');

  await slider.hover({ position: { x: sliderBox.width * 0.2, y: sliderBox.height / 2 } });
  await expect(slider).toHaveAttribute('data-pointing', '');
  await expect(preview).toHaveCSS('opacity', '1');
  const positions = await slider.evaluate((element) => {
    const preview = element.querySelector<HTMLElement>('media-slider-preview');
    const thumbnail = element.querySelector<HTMLElement>('media-slider-thumbnail');
    const chapter = element.querySelector<HTMLElement>('media-time-slider-chapter-title');
    if (!preview || !thumbnail || !chapter) throw new Error('Preview is incomplete');

    thumbnail.style.width = '160px';
    thumbnail.style.height = '90px';
    chapter.textContent = 'A chapter title that is much longer than the preview thumbnail';
    const titledY = thumbnail.getBoundingClientRect().y;
    const previewBox = preview.getBoundingClientRect();
    const chapterBox = chapter.getBoundingClientRect();
    const truncated = chapter.scrollWidth > chapter.clientWidth;

    chapter.textContent = '';
    const untitledY = thumbnail.getBoundingClientRect().y;

    return {
      titledY,
      untitledY,
      chapterWidth: chapterBox.width,
      previewWidth: previewBox.width,
      truncated,
    };
  });

  expect(Math.abs(positions.titledY - positions.untitledY)).toBeLessThanOrEqual(1);
  expect(positions.chapterWidth).toBeLessThanOrEqual(positions.previewWidth);
  expect(positions.truncated).toBe(true);
  await page.mouse.move(0, 0);
  await expect(preview).toHaveCSS('opacity', '0');
});

test('the shell offers the authored source and the html Tailwind styling it enables', async ({ page }) => {
  await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&skins=authored&styling=tailwind&source=mp4-1`, {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('iframe[title="player demo"]')).toHaveAttribute('src', /skins=authored/);
  await expect(page.locator('iframe[title="player demo"]')).toHaveAttribute('src', /styling=tailwind/);
  await expect(page).toHaveURL(/[?&]skins=authored(?:&|$)/);

  await page.getByRole('combobox', { name: 'Skin', exact: true }).click();

  const compat = page.getByRole('option', { name: 'Compat' });

  await expect(compat).toBeEnabled();
  await compat.click();
  await expect(page).toHaveURL(/[?&]skin=compat(?:&|$)/);
  await expect(
    page.frameLocator('iframe[title="player demo"]').getByRole('group', { name: 'Media player' }).first()
  ).toHaveAttribute('data-theme', 'compat');
});
