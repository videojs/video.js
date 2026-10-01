import { expect, test } from '@playwright/test';

import { DATA_ATTRS, SELECTORS } from '../../../../shared/fixtures/selectors';
import { PlayerPage } from '../../../../shared/page-objects/player';

test.describe.configure({ mode: 'serial' });

/**
 * Visual snapshot tests for the video skin.
 *
 * These verify the skin's CSS and layout aren't broken — not UX interactions. Strategy: - Screenshot the skin container
 * in its initial paused state - Generous pixel thresholds absorb cross-platform rendering differences - Animations
 * disabled globally (configured in playwright.config.ts)
 */

const VISUAL_PAGES = [
  { name: 'HTML', path: '/pages/html-video-mp4.html' },
  { name: 'React', path: '/pages/react-video-mp4.html' },
  { name: 'CDN', path: '/pages/cdn-video-mp4.html' },
];

for (const { name, path } of VISUAL_PAGES) {
  test.describe(`Visual — Video Skin (${name})`, () => {
    let player: PlayerPage;

    test.beforeEach(async ({ page }) => {
      player = new PlayerPage(page);
      await page.goto(path);
      await player.waitForMediaReady();
    });

    test('default paused state', async () => {
      await player.showControls();
      await expect(player.playerRoot).toHaveScreenshot(`video-${name.toLowerCase()}-default.png`);
    });

    test('storyboard thumbnail on hover', async () => {
      await player.hoverTimeSlider(50);

      // Wait for thumbnail to finish loading (deterministic, no fixed timeout)
      await expect(player.thumbnail).toBeAttached({ timeout: 10_000 });
      await expect(player.thumbnail).not.toHaveAttribute(DATA_ATTRS.loading, { timeout: 10_000 });

      await expect(player.playerRoot).toHaveScreenshot(`video-${name.toLowerCase()}-storyboard.png`);
    });
  });
}

test.describe('Visual — Live Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/html-video-mp4.html', { waitUntil: 'domcontentloaded' });
    await page.addScriptTag({ type: 'module', url: '/@id/@videojs/html/live-video/skin' });
    await page.waitForFunction(() => customElements.get('live-video-skin'));
    await page.evaluate(() => {
      document.getElementById('root')!.innerHTML = '<live-video-skin></live-video-skin>';
    });
  });

  test('keeps the live-edge indicator colored when aria-disabled', async ({ page }) => {
    const styles = await page.evaluate(() => {
      const container = document.querySelector('live-video-skin')?.shadowRoot?.querySelector('media-container');
      if (!container) throw new Error('Expected the live skin container.');

      const liveButton = document.createElement('button');

      liveButton.className = 'media-button media-live-button';
      liveButton.style.setProperty('--media-live-color', 'rgb(12, 123, 234)');
      liveButton.setAttribute('aria-disabled', 'true');
      liveButton.setAttribute('data-live-edge', '');

      const disabledButton = document.createElement('button');

      disabledButton.className = 'media-button';
      disabledButton.setAttribute('aria-disabled', 'true');

      container?.append(liveButton, disabledButton);

      liveButton.dataset.liveColorProbe = '';
      const liveStyle = getComputedStyle(liveButton);
      const disabledStyle = getComputedStyle(disabledButton);

      return {
        live: { filter: liveStyle.filter, opacity: liveStyle.opacity },
        disabled: { filter: disabledStyle.filter, opacity: disabledStyle.opacity },
      };
    });

    await expect
      .poll(() =>
        page
          .locator('[data-live-color-probe]')
          .evaluate((button) => getComputedStyle(button, '::before').backgroundColor)
      )
      .toBe('rgb(12, 123, 234)');

    expect(styles.live).toEqual({ filter: 'none', opacity: '0.5' });
    expect(styles.disabled).toEqual({ filter: 'none', opacity: '0.5' });
  });
});

// --- Portrait media layout ---

test.describe('Visual — HTML Portrait Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/html-video-mp4.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => customElements.get('video-skin'));
    await page.evaluate(() => {
      const root = document.getElementById('root');
      if (!root) return;

      root.innerHTML = `
        <video-player>
          <video-skin style="width: 320px; aspect-ratio: 16/9">
            <video width="270" height="480" playsinline></video>
          </video-skin>
        </video-player>
      `;
    });
  });

  test('keeps the authored skin aspect ratio', async ({ page }) => {
    const box = await page.evaluate(() => {
      const container = document.querySelector('video-skin')?.shadowRoot?.querySelector('media-container');
      const rect = container?.getBoundingClientRect();

      return rect ? { height: rect.height, width: rect.width } : null;
    });

    expect(box).not.toBeNull();
    expect(box!.width / box!.height).toBeCloseTo(16 / 9, 1);
  });

  test('caps portrait thumbnails to the configured max height', async ({ page }) => {
    const size = await page.evaluate(() => {
      const skin = document.querySelector('video-skin')!.shadowRoot!;
      const thumbnail = skin.querySelector<HTMLElement>('media-slider-thumbnail')!;
      const probe = document.createElement('div');

      thumbnail.removeAttribute('data-hidden');
      thumbnail.style.width = '270px';
      thumbnail.style.height = '480px';
      probe.style.position = 'absolute';
      probe.style.height = 'var(--media-slider-preview-max-height)';
      thumbnail.parentElement!.append(probe);

      const style = getComputedStyle(thumbnail);
      const configuredMaxHeight = parseFloat(getComputedStyle(probe).height);
      const result = {
        height: thumbnail.getBoundingClientRect().height,
        configuredMaxHeight,
        maxHeight: parseFloat(style.maxHeight),
      };

      probe.remove();

      return result;
    });

    expect(size.maxHeight).toBeCloseTo(size.configuredMaxHeight, 0);
    expect(size.height).toBeLessThanOrEqual(size.maxHeight);
  });
});

// --- Captions snapshot (dedicated page with subtitle track baked in) ---

test.describe('Visual — Captions', () => {
  let player: PlayerPage;

  test.beforeEach(async ({ page }) => {
    player = new PlayerPage(page);
    await page.goto('/pages/html-video-captions.html');
    await player.waitForMediaReady();
  });

  test('captions enabled', async ({ page, browserName }) => {
    // WebKit doesn't render data:text/vtt subtitle tracks in headless mode
    test.skip(browserName === 'webkit', 'WebKit headless does not render data:text/vtt captions');

    await player.showControls();
    await player.openCaptionsSettings();
    await expect(page.locator(SELECTORS.activeMenuOptions)).toHaveCount(2);
    await page.locator(SELECTORS.activeMenuOptions).nth(1).dispatchEvent('click');

    // Play to the same frame the baseline holds; the caption cue at 0:00 is active by then.
    await player.play();
    await player.waitForPlayback(0.5);
    await player.pause();
    await player.showControls();

    await expect(player.playerRoot).toHaveScreenshot('captions-enabled.png');
  });
});

// --- Mobile viewport snapshot (375×667) ---

test.describe('Visual — Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  let player: PlayerPage;

  test.beforeEach(async ({ page }) => {
    player = new PlayerPage(page);
    await page.goto('/pages/html-video-mp4.html');
    await player.waitForMediaReady();
  });

  test('mobile layout', async () => {
    await player.showControls();
    await expect(player.playerRoot).toHaveScreenshot('mobile-default.png');
  });
});
