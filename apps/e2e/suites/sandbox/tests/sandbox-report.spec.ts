import { expect, type Frame, type Page, test } from '@playwright/test';

declare global {
  interface Window {
    captureReport: (text: string) => Promise<void>;
  }
}

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

test.describe('Sandbox report', () => {
  test('copies a report that states the selection, the environment, and relayed errors', async ({ page }) => {
    const copied: string[] = [];

    await page.exposeFunction('captureReport', (text: string) => {
      copied.push(text);
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: (text: string) => window.captureReport(text),
        },
      });
    });
    await page.goto(`${SANDBOX_BASE}/?platform=react&media=video&${QUERY}`, { waitUntil: 'domcontentloaded' });

    const frame = await getPreviewFrame(page, '/react-video/');

    await expect(frame.getByRole('group', { name: 'Media player' }).first()).toBeVisible({ timeout: 15_000 });
    await frame.evaluate(() => {
      console.error('sandbox report probe');
    });

    const report = page.getByRole('button', { name: /^Report/ });

    await expect(report).toContainText('1');
    await report.click();

    const dialog = page.getByRole('dialog', { name: 'Preview report' });
    const markdown = dialog.getByLabel('Report markdown');

    await expect(dialog).toBeVisible();
    expect(copied).toEqual([await markdown.inputValue()]);
    await expect(dialog.getByText('Copied to the clipboard.', { exact: true })).toBeVisible();
    await expect(markdown).toHaveValue(/## Video\.js sandbox preview/);
    await expect(markdown).toHaveValue(/- Selection: React · Video · Default · CSS · from the package · 896px/);
    await expect(markdown).toHaveValue(/- Build: \S+ @ \S+/);
    await expect(markdown).toHaveValue(/- Preferences: reduced motion (?:on|off), /);
    await expect(markdown).toHaveValue(/- Errors:\n {2}- \d\d:\d\d:\d\d single: sandbox report probe/);

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });

  test('shows the detected preferences in the options panel and follows emulation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&${QUERY}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Options' }).click();

    const badges = page.getByRole('list', { name: 'Detected preferences' });

    await expect(badges.getByText('reduced motion: on')).toBeVisible();
    await expect(badges.getByText('hover: on')).toBeVisible();

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(badges.getByText('reduced motion: off')).toBeVisible();
  });
});
