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
  for (const skin of ['default', 'neutral'] as const) {
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
      await expect(root.getByRole('button', { name: 'Play' })).toBeVisible();
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

test('the shell offers the authored source and the html Tailwind styling it enables', async ({ page }) => {
  await page.goto(`${SANDBOX_BASE}/?platform=html&media=video&skins=authored&styling=tailwind&source=mp4-1`, {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.locator('iframe[title="player demo"]')).toHaveAttribute('src', /skins=authored/);
  await expect(page.locator('iframe[title="player demo"]')).toHaveAttribute('src', /styling=tailwind/);
  await expect(page).toHaveURL(/[?&]skins=authored(?:&|$)/);
});
