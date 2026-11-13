import { expect, test } from '@playwright/test';

const SOURCE_SKINS = [
  { framework: 'HTML', path: '/pages/source-html-video-mp4.html' },
  { framework: 'React', path: '/pages/source-react-video-mp4.html' },
] as const;

const POSTER_SKINS = [
  { framework: 'packaged HTML', path: '/pages/html-video-mp4.html', selector: 'img[slot="poster"]' },
  { framework: 'packaged React', path: '/pages/react-video-mp4.html', selector: '.media-poster img' },
  { framework: 'VJSC HTML', path: '/pages/source-html-video-mp4.html', selector: 'media-poster img' },
  { framework: 'VJSC React', path: '/pages/source-react-video-mp4.html', selector: '.media-poster img' },
] as const;

for (const { framework, path } of SOURCE_SKINS) {
  test.describe(`Canonical Skin container — ${framework}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.locator('[data-source-skin]').waitFor({ timeout: 20_000 });
    });

    test('renders media and poster in one container composition', async ({ page }) => {
      const skin = page.locator('[data-source-skin]');
      const posterImage = skin.locator('media-poster img, .media-poster img').first();

      await expect(skin).toBeAttached();
      await expect(page.locator('video')).toBeAttached();
      await expect(skin.locator('media-poster, .media-poster')).toBeAttached();
      await expect(skin.locator('media-controls-content, .video-controls')).toBeAttached();
      await expect(skin.locator('media-controls-backdrop, .video-controls-backdrop')).toBeAttached();
      // Only the centre controls seek; the control bar has none.
      await expect(skin.locator('media-seek-button, .media-seek-button')).toHaveCount(2);
      await expect(posterImage).toHaveAttribute('src', /thumbnail/);
    });

    test('hides the poster once playback starts', async ({ page }) => {
      const poster = page.locator('media-poster, .media-poster').first();

      await expect(poster).toHaveAttribute('data-visible', '');
      await expect(poster).toHaveCSS('opacity', '1');
      await page.locator('video').evaluate((video: HTMLVideoElement) => {
        setTimeout(() => void video.play().catch(() => {}));
      });
      await expect(poster).not.toHaveAttribute('data-visible');
      await expect(poster).toHaveCSS('opacity', '0');
    });
  });
}

for (const { framework, path, selector } of POSTER_SKINS) {
  test(`fits a supplied poster despite a page image reset — ${framework}`, async ({ page }) => {
    await page.route('https://image.mux.com/**/thumbnail*', (route) =>
      route.fulfill({
        contentType: 'image/svg+xml',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="200"><rect width="100" height="200" fill="red"/></svg>',
      })
    );
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({ content: '@layer base { img { max-width: 100%; height: auto; } }' });

    const image = page.locator(selector).first();
    const skin = page.locator('video-skin, [data-source-skin], .media-skin').first();

    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    await expect(image).toHaveCSS('object-fit', 'contain');
    await expect(image).toHaveCSS('object-position', '50% 50%');
    expect(await image.boundingBox()).toEqual(await skin.boundingBox());
  });

  test(`sizes the skin from the media without an explicit aspect ratio — ${framework}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const skin = page.locator('video-skin, [data-source-skin], .media-skin').first();
    const video = page.locator('video').first();

    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.videoWidth)).toBeGreaterThan(0);
    await skin.evaluate((element: HTMLElement) => {
      element.style.aspectRatio = 'auto';
      element.style.height = 'auto';
    });

    await expect
      .poll(async () => {
        const box = await skin.boundingBox();
        const ratio = await video.evaluate((element: HTMLVideoElement) => element.videoWidth / element.videoHeight);

        return Math.abs((box?.height ?? 0) - (box?.width ?? 0) / ratio);
      })
      .toBeLessThan(1);
  });

  test(`hides a source-less poster image — ${framework}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });

    const posterImage = page.locator(selector).first();

    await expect(posterImage).toBeAttached();
    await posterImage.evaluate((image) => {
      image.removeAttribute('src');
      image.removeAttribute('srcset');
    });

    await expect(posterImage).toHaveCSS('visibility', 'hidden');
  });
}
