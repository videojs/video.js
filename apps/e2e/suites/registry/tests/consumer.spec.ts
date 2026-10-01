import { expect, test } from '@playwright/test';

const visualProjects = new Set(['next-react-tailwind', 'next-react-tailwind-neutral']);

for (const preset of ['video', 'audio'] as const) {
  test(`installs a styled ${preset} player with an attached media element`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    const theme = testInfo.project.metadata.theme;

    if (theme !== 'default' && theme !== 'neutral' && theme !== 'compat')
      throw new Error(`Unknown registry theme: ${String(theme)}.`);

    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');

    const consumer = page.locator(`[data-registry-skin="${preset}"]`);
    const skin = consumer.locator('.media-skin');
    const controls = skin.locator('media-controls, .video-controls, .audio-controls').first();
    const media = consumer.locator(preset);

    await expect(skin).toBeVisible();
    await expect(skin).toHaveAttribute('data-theme', theme);

    // Compat's Tailwind output carries no semantic controls class; the play button checks below cover its controls.
    if (theme !== 'compat') await expect(controls).toBeAttached();

    await expect(media).toBeAttached();
    await expect(skin).toHaveCSS('position', 'relative');
    await expect(skin).toHaveCSS('display', 'block');
    await expect(skin).toHaveCSS('border-radius', theme === 'default' ? '28px' : '12px');

    const themeStyles = await skin.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        controlSize: style.getPropertyValue('--media-control-size').trim(),
        spacing: style.getPropertyValue('--media-spacing').trim(),
        duration: style.getPropertyValue('--media-duration-fast').trim(),
      };
    });

    expect(themeStyles.controlSize).not.toBe('');
    expect(themeStyles.spacing).not.toBe('');
    expect(themeStyles.duration).not.toBe('');

    if (preset === 'audio') {
      for (const colorScheme of ['light', 'dark'] as const) {
        await page.emulateMedia({ colorScheme });
        await skin.evaluate((element, scheme) => {
          if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML skin element.');

          element.style.colorScheme = scheme;
        }, colorScheme);

        const surface = theme === 'compat' ? skin : skin.locator('.audio-controls').first();
        const hairline = await surface.evaluate((element) => {
          const style = getComputedStyle(element);
          const probe = document.createElement('span');

          probe.style.color = 'var(--media-border)';
          element.append(probe);

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Could not create a canvas context.');

          context.fillStyle = getComputedStyle(probe).color;
          context.fillRect(0, 0, 1, 1);
          probe.remove();

          const pixel = context.getImageData(0, 0, 1, 1).data;

          return {
            alpha: pixel[3]!,
            boxShadow: style.boxShadow,
            luminance: pixel[0]! + pixel[1]! + pixel[2]!,
          };
        });

        expect(hairline.boxShadow, `${theme} ${colorScheme} audio hairline`).not.toBe('none');
        expect(hairline.alpha, `${theme} ${colorScheme} audio hairline`).toBeGreaterThan(0);

        if (colorScheme === 'light') {
          expect(hairline.luminance, `${theme} light audio hairline`).toBeLessThan(128 * 3);
        } else {
          expect(hairline.luminance, `${theme} dark audio hairline`).toBeGreaterThan(128 * 3);
        }
      }

      await page.emulateMedia({ colorScheme: 'light' });
      await skin.evaluate((element) => {
        if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML skin element.');

        element.style.removeProperty('color-scheme');
      });
    }

    const box = await skin.boundingBox();

    expect(box?.width).toBeGreaterThan(500);
    expect(box?.height).toBeGreaterThan(preset === 'video' ? 250 : 30);

    const playButton = consumer.getByRole('button', { name: /play/i }).first();

    await expect(playButton).toBeVisible();

    const controlBox = await playButton.boundingBox();

    expect(controlBox?.width).toBeGreaterThan(30);
    expect(controlBox?.height).toBeGreaterThan(30);

    const icon = playButton.locator('media-icon:visible, svg:visible').first();

    await expect(icon).toBeVisible();

    const iconBox = await icon.boundingBox();

    expect(iconBox?.width).toBeGreaterThan(10);
    expect(iconBox?.height).toBeGreaterThan(10);

    // The React page carries a probe that reports whether the media element reached the player store.
    if ((await consumer.locator('[data-media-probe]').count()) > 0) {
      await expect(consumer.locator('[data-media-probe]')).toHaveAttribute('data-attached', 'true');
    }

    if (visualProjects.has(testInfo.project.name)) {
      await skin.hover();
      await expect(skin).toHaveScreenshot(`${preset}-${theme}.png`);
    }

    if (preset === 'video') {
      const settings = consumer.getByRole('button', { name: 'Settings' });

      await expect(settings).toBeVisible();
      await settings.click();
      await expect(settings).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(settings).toHaveAttribute('aria-expanded', 'false');
    }

    expect(errors).toEqual([]);
  });
}
