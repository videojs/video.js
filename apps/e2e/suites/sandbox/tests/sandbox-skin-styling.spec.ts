import { expect, test } from '@playwright/test';

import { DATA_ATTRS, SELECTORS } from '../../../shared/fixtures/selectors';

const SANDBOX_BASE = process.env.SANDBOX_URL ?? 'http://localhost:5299';

// Every skin source the sandbox can load without the workspace: the framework packages (CSS), the registry's html
// install (CSS), and the registry's two React catalogs.
const CASES = [
  { platform: 'html', skin: 'default', styling: 'css', skins: 'package' },
  { platform: 'html', skin: 'neutral', styling: 'css', skins: 'package' },
  { platform: 'html', skin: 'default', styling: 'css', skins: 'registry' },
  { platform: 'html', skin: 'neutral', styling: 'css', skins: 'registry' },
  { platform: 'react', skin: 'default', styling: 'css', skins: 'package' },
  { platform: 'react', skin: 'neutral', styling: 'css', skins: 'package' },
  { platform: 'react', skin: 'default', styling: 'css', skins: 'registry' },
  { platform: 'react', skin: 'neutral', styling: 'css', skins: 'registry' },
  { platform: 'react', skin: 'default', styling: 'tailwind', skins: 'registry' },
  { platform: 'react', skin: 'neutral', styling: 'tailwind', skins: 'registry' },
] as const;
const HTML_REGISTRY_ERROR_CASES = [
  { media: 'video', skin: 'default' },
  { media: 'video', skin: 'neutral' },
  { media: 'audio', skin: 'default' },
  { media: 'audio', skin: 'neutral' },
] as const;

test.use({ trace: 'off' });
test.describe.configure({ mode: 'serial' });

for (const { platform, skin, styling, skins } of CASES) {
  test(`${platform} ${skin} ${styling} from ${skins} uses public skin properties`, async ({ page }) => {
    const query = new URLSearchParams({
      styling,
      skins,
      skin,
      source: 'mp4-1',
      autoplay: '0',
      muted: '1',
      loop: '0',
      preload: 'metadata',
    });

    await page.goto(`${SANDBOX_BASE}/${platform}-video/?${query}`, { waitUntil: 'domcontentloaded' });

    const root = page.getByRole('group', { name: 'Media player' }).first();

    await expect(root).toBeVisible({ timeout: 15_000 });

    // The package's element hosts the skin's custom properties; every other install puts them on the container.
    const host =
      platform === 'html' && skins === 'package' ? page.locator('video-skin, video-neutral-skin').first() : root;

    await host.evaluate((element) => {
      element.style.setProperty('--media-accent-color', '#123456');
      element.style.setProperty('--media-accent-text-color', '#abcdef');
      element.style.setProperty('--media-border-color', '#fe0102');
      element.style.setProperty('--media-border-radius', '18px');
      element.style.setProperty('--media-font-family', 'Courier New');
    });

    const settingsButton = page.getByRole('button', { name: 'Settings' }).first();

    await settingsButton.click();
    await expect(settingsButton).toHaveAttribute('aria-expanded', 'true');
    await expect(settingsButton).toHaveCSS('color', 'rgb(171, 205, 239)');

    const styles = await root.evaluate((element) => {
      const accent = 'rgb(18, 52, 86)';
      const fillUsesAccent = [...element.querySelectorAll<HTMLElement>('[data-orientation]')].some(
        (part) => getComputedStyle(part, '::before').backgroundColor === accent
      );
      const style = getComputedStyle(element);

      return {
        borderRadius: style.borderRadius,
        border: getComputedStyle(element, '::after').border,
        fillUsesAccent,
        fontFamily: style.fontFamily,
        videoBorderRadius: style.getPropertyValue('--media-video-border-radius').trim(),
      };
    });

    expect(styles).toEqual({
      borderRadius: '18px',
      border: '1px solid rgb(254, 1, 2)',
      fillUsesAccent: true,
      fontFamily: '"Courier New"',
      videoBorderRadius: '18px',
    });
  });

  test(`${platform} ${skin} ${styling} from ${skins} scales thumbnails in fullscreen`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    const query = new URLSearchParams({
      styling,
      skins,
      skin,
      source: 'hls-1',
      autoplay: '0',
      muted: '1',
      loop: '0',
      preload: 'metadata',
    });

    await page.goto(`${SANDBOX_BASE}/${platform}-video/?${query}`, { waitUntil: 'domcontentloaded' });

    const root = page.getByRole('group', { name: 'Media player' }).first();
    const slider = page.getByRole('slider', { name: 'Seek' }).first().locator('..');
    const thumbnail = root.locator(SELECTORS.thumbnail).first();

    await expect(root).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('slider', { name: 'Seek' }).first()).toBeEnabled();
    await slider.hover();
    await expect(thumbnail).toBeAttached({ timeout: 15_000 });
    await expect(thumbnail).not.toHaveAttribute(DATA_ATTRS.loading, { timeout: 15_000 });

    // Layout sizes, not bounding rects: the preview scales in over 150ms and a transform would skew the comparison.
    const measure = () =>
      thumbnail.evaluate((element) => {
        const image = element.shadowRoot?.querySelector('img') ?? element.querySelector('img');

        if (!(element instanceof HTMLElement) || !(image instanceof HTMLImageElement)) {
          throw new Error('Expected the thumbnail host and image to be HTML elements.');
        }

        const rect = element.getBoundingClientRect();
        const imageRect = image.getBoundingClientRect();

        return {
          loaded: image.complete && image.naturalWidth > 0,
          width: element.offsetWidth,
          height: element.offsetHeight,
          maxWidth: parseFloat(getComputedStyle(element).maxWidth),
          rightGap: rect.right - imageRect.right,
          bottomGap: rect.bottom - imageRect.bottom,
        };
      });

    // No loading attribute also matches the empty state before thumbnail cues arrive.
    await expect(async () => {
      const box = await measure();

      expect(box.loaded).toBe(true);
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
      expect(box.maxWidth - box.width).toBeLessThanOrEqual(2);
    }).toPass({ timeout: 15_000 });

    const before = await measure();

    const fullscreenButton = root.getByRole('button', { name: /full ?screen/i }).first();

    await fullscreenButton.click();
    await expect(fullscreenButton).toHaveAttribute(DATA_ATTRS.fullscreen, '');
    await slider.hover();

    // Fullscreen widens the preview through a container query, and the tile has to grow to fill it — less the 1px
    // anti-fringe inset on each edge.
    await expect(async () => {
      const after = await measure();

      expect(after.loaded).toBe(true);
      expect(after.maxWidth).toBeGreaterThan(before.maxWidth);
      expect(after.maxWidth - after.width).toBeLessThanOrEqual(2);
      expect(after.width).toBeGreaterThan(before.width);
      expect(after.height).toBeGreaterThan(0);
      // Aspect ratio survives the resize, so the tile is neither cropped nor letterboxed.
      expect(Math.abs(after.width / after.height - before.width / before.height)).toBeLessThan(0.02);
      // The sprite still covers the container that clips it.
      expect(after.rightGap).toBeLessThanOrEqual(0);
      expect(after.bottomGap).toBeLessThanOrEqual(0);
    }).toPass({ timeout: 10_000 });
  });
}

for (const media of ['video', 'audio'] as const) {
  for (const { platform, skin, styling, skins } of CASES) {
    test(`${platform} ${skin} ${styling} from ${skins} selects the live ${media} skin`, async ({ page }) => {
      const query = new URLSearchParams({
        styling,
        skins,
        skin,
        source: 'hls-live',
        autoplay: '0',
        muted: '1',
        loop: '0',
        preload: 'metadata',
      });

      await page.goto(`${SANDBOX_BASE}/${platform}-hls-${media}/?${query}`, { waitUntil: 'domcontentloaded' });

      const root = page.getByRole('group', { name: 'Media player' }).first();

      await expect(root).toBeVisible({ timeout: 15_000 });
      await expect(root).toHaveAttribute('data-preset', `live-${media}`);
      await expect(page.getByRole('slider', { name: 'Seek' })).toHaveCount(0);
      // Labels arrive through the live player's store; a skin mounted without its player element renders none.
      await expect(root.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    });
  }
}

for (const media of ['video', 'audio'] as const) {
  for (const skin of ['default', 'neutral'] as const) {
    test(`cdn ${skin} selects the live ${media} skin`, async ({ page }) => {
      const query = new URLSearchParams({
        media: `hls-${media}`,
        skin,
        source: 'hls-live',
        autoplay: '0',
        muted: '1',
        loop: '0',
        preload: 'metadata',
      });

      await page.goto(`${SANDBOX_BASE}/cdn/?${query}`, { waitUntil: 'domcontentloaded' });

      const root = page.getByRole('group', { name: 'Media player' }).first();

      await expect(root).toBeVisible({ timeout: 15_000 });
      await expect(page.locator(`live-${media}-player`)).toHaveCount(1);
      await expect(root).toHaveAttribute('data-preset', `live-${media}`);
      await expect(page.getByRole('slider', { name: 'Seek' })).toHaveCount(0);
    });
  }
}

for (const { media, skin } of HTML_REGISTRY_ERROR_CASES) {
  test(`html ${skin} from registry ${media} contains the error dialog without changing the closed layout`, async ({
    page,
  }) => {
    const query = new URLSearchParams({
      styling: 'css',
      skins: 'registry',
      skin,
      source: 'mp4-1',
      autoplay: '0',
      muted: '1',
      loop: '0',
      preload: 'metadata',
    });

    await page.goto(`${SANDBOX_BASE}/html-${media}/?${query}`, { waitUntil: 'domcontentloaded' });

    const root = page.getByRole('group', { name: 'Media player' }).first();

    await expect(root).toBeVisible({ timeout: 15_000 });
    await root.evaluate((element) => {
      if (element instanceof HTMLElement) element.style.width = '320px';
    });

    const popup = root.locator('media-error-dialog media-dialog-popup').first();
    const initialRootBox = await root.boundingBox();
    if (!initialRootBox) throw new Error('Expected the media player to have a rendered box.');

    await expect(popup).toBeHidden();
    await page
      .locator(media)
      .first()
      .evaluate((element) => {
        Object.defineProperty(element, 'error', {
          configurable: true,
          value: { code: 4, message: 'Test media error' },
        });
        element.dispatchEvent(new Event('error'));
      });
    await expect(popup).toBeVisible({ timeout: 15_000 });

    const contract = await root.evaluate((element) => {
      const popup = element.querySelector<HTMLElement>('[role="alertdialog"]');
      if (!popup) throw new Error('Expected an error dialog.');

      const rootRect = element.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();

      return {
        popupInside: popupRect.top >= rootRect.top && popupRect.bottom <= rootRect.bottom,
        rootHeight: rootRect.height,
      };
    });

    expect(contract.popupInside).toBe(true);
    expect(Math.abs(contract.rootHeight - initialRootBox.height)).toBeLessThanOrEqual(1);
  });
}

for (const { platform, skin, styling, skins } of CASES) {
  test(`${platform} ${skin} ${styling} from ${skins} opens the volume popover`, async ({ page }) => {
    const query = new URLSearchParams({
      styling,
      skins,
      skin,
      source: 'mp4-1',
      autoplay: '0',
      muted: '1',
      loop: '0',
      preload: 'metadata',
    });

    await page.goto(`${SANDBOX_BASE}/${platform}-video/?${query}`, { waitUntil: 'domcontentloaded' });

    const root = page.getByRole('group', { name: 'Media player' }).first();

    await expect(root).toBeVisible({ timeout: 15_000 });

    const muteButton = page.getByRole('button', { name: 'Unmute' }).first();

    await muteButton.hover();
    const muteTooltip = page.locator('[popover="manual"]').filter({ hasText: 'Unmute' }).first();

    if (skin === 'neutral') await expect(muteTooltip).toBeVisible();
    else await expect(muteTooltip).toBeHidden();

    const volumeThumb = page.getByRole('slider', { name: 'Volume' }).first();

    await expect(volumeThumb).toBeVisible();
    await expect(volumeThumb).toHaveCSS('opacity', '1');
    await expect(volumeThumb).toHaveCSS('scale', '1');

    if (skin === 'neutral') await expect(muteTooltip).toBeVisible();

    await muteButton.focus();
    await page.keyboard.press('Tab');

    await expect(volumeThumb).toBeFocused();
    await expect(volumeThumb).toHaveCSS('opacity', '1');
    await expect(volumeThumb).toHaveCSS('scale', '1');
  });
}

for (const skins of ['package', 'registry'] as const) {
  test(`html neutral from ${skins} keeps the thumbnail inside the player`, async ({ page }) => {
    const query = new URLSearchParams({
      styling: 'css',
      skins,
      skin: 'neutral',
      source: 'hls-1',
      autoplay: '0',
      muted: '1',
      loop: '0',
      preload: 'metadata',
    });

    await page.goto(`${SANDBOX_BASE}/html-video/?${query}`, { waitUntil: 'domcontentloaded' });

    const root = page.getByRole('group', { name: 'Media player' }).first();
    const slider = root.locator(SELECTORS.timeSlider).first();
    const thumb = root.getByRole('slider', { name: 'Seek' }).first();

    await expect(root).toBeVisible({ timeout: 15_000 });
    await expect(slider).toBeVisible();
    await expect(thumb).toBeEnabled({ timeout: 15_000 });

    const sliderBox = await slider.boundingBox();
    if (!sliderBox) throw new Error('Time slider is not visible');

    const thumbnail = page.locator('media-slider-thumbnail').first();

    for (const x of [sliderBox.x + 1, sliderBox.x + sliderBox.width - 1]) {
      await page.mouse.move(x, sliderBox.y + sliderBox.height / 2);
      await expect(thumbnail).toBeAttached({ timeout: 15_000 });
      await expect(thumbnail).not.toHaveAttribute('data-loading', { timeout: 15_000 });
      await expect(thumbnail).toHaveCSS('scale', '1');

      const [rootBox, thumbnailBox] = await Promise.all([root.boundingBox(), thumbnail.boundingBox()]);
      if (!rootBox || !thumbnailBox) throw new Error('Player or thumbnail is not visible');

      expect(thumbnailBox.x).toBeGreaterThanOrEqual(rootBox.x - 1);
      expect(thumbnailBox.x + thumbnailBox.width).toBeLessThanOrEqual(rootBox.x + rootBox.width + 1);
    }
  });
}
