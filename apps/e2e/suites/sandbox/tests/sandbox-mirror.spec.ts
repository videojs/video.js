import { expect, type Frame, type Page, test } from '@playwright/test';

const SANDBOX_BASE = process.env.SANDBOX_URL ?? 'http://localhost:5299';

const QUERY = 'skin=default&source=mp4-1&autoplay=0&muted=1&loop=0&preload=metadata';

test.use({ trace: 'off' });

async function getPanelFrame(page: Page, id: string): Promise<Frame> {
  const iframe = page.locator(`iframe[data-panel="${id}"]`);

  await expect(iframe).toBeVisible();

  const url = await iframe.getAttribute('src');
  if (!url) throw new Error(`Panel ${id} has no frame URL.`);

  await expect
    .poll(() =>
      page
        .frames()
        .find((frame) => frame.url().endsWith(url))
        ?.url()
    )
    .toBeDefined();

  const frame = page.frames().find((frame) => frame.url().endsWith(url));
  if (!frame) throw new Error(`Panel ${id} frame not found.`);

  return frame;
}

/** The native element both pages render for the MP4 source. */
function mediaState(frame: Frame) {
  return frame.evaluate(() => {
    const media = document.querySelector('video');
    if (!media) throw new Error('Expected a video element.');

    return { paused: media.paused, muted: media.muted, currentTime: media.currentTime, rate: media.playbackRate };
  });
}

test.describe('Sandbox mirror', () => {
  test('carries playback from one panel to the other', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(
      `${SANDBOX_BASE}/?platform=html&media=video&compare=platform&layout=row&mirror=1&width=480&${QUERY}`,
      {
        waitUntil: 'domcontentloaded',
      }
    );

    const html = await getPanelFrame(page, 'html');
    const react = await getPanelFrame(page, 'react');

    for (const frame of [html, react]) {
      await expect(frame.getByRole('group', { name: 'Media player' }).first()).toBeVisible({ timeout: 15_000 });
      await expect.poll(() => frame.evaluate(() => (document.querySelector('video')?.readyState ?? 0) >= 1)).toBe(true);
    }

    await expect(page.getByRole('switch', { name: 'Mirror playback' })).toBeChecked();

    // Play in the html panel; the react panel follows.
    await html.getByRole('button', { name: 'Play' }).last().click();
    await expect.poll(() => mediaState(html).then((state) => state.paused)).toBe(false);
    await expect.poll(() => mediaState(react).then((state) => state.paused), { timeout: 10_000 }).toBe(false);

    // Pause from the react panel; the html panel follows.
    await react.getByRole('button', { name: 'Pause' }).last().click();
    await expect.poll(() => mediaState(react).then((state) => state.paused)).toBe(true);
    await expect.poll(() => mediaState(html).then((state) => state.paused), { timeout: 10_000 }).toBe(true);

    // A seek and an unmute in one panel land in the other.
    await html.evaluate(() => {
      const media = document.querySelector('video');
      if (!media) throw new Error('Expected a video element.');

      media.currentTime = 4;
      media.muted = false;
    });
    await expect.poll(() => mediaState(react).then((state) => Math.abs(state.currentTime - 4) < 0.5)).toBe(true);
    await expect.poll(() => mediaState(react).then((state) => state.muted)).toBe(false);
  });

  test('stays off unless asked, even while comparing', async ({ page }) => {
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&compare=platform&layout=row&${QUERY}`, {
      waitUntil: 'domcontentloaded',
    });

    const html = await getPanelFrame(page, 'html');
    const react = await getPanelFrame(page, 'react');

    await expect(page.getByRole('switch', { name: 'Mirror playback' })).not.toBeChecked();
    await expect(page.locator('iframe[data-panel="html"]')).not.toHaveAttribute('src', /mirror=1/);

    await expect(html.getByRole('group', { name: 'Media player' }).first()).toBeVisible({ timeout: 15_000 });
    await expect(react.getByRole('group', { name: 'Media player' }).first()).toBeVisible({ timeout: 15_000 });
    await html.evaluate(() => {
      const media = document.querySelector('video');
      if (!media) throw new Error('Expected a video element.');

      media.muted = false;
    });
    await page.waitForTimeout(500);
    expect((await mediaState(react)).muted).toBe(true);
  });
});
