import { expect, test } from '@playwright/test';

import { DATA_ATTRS } from '../../../shared/fixtures/selectors';
import { PlayerPage } from '../../../shared/page-objects/player';

/**
 * Gesture tests — validates the media-gesture components respond to pointer events on the player container (not
 * individual buttons).
 *
 * The player's gesture system: - tap (mouse, center): togglePaused - tap (touch): toggleControls - doubletap (left):
 * seek backward 10s - doubletap (center): toggleFullscreen - doubletap (right): seek forward 10s
 */

// Helper to get center coordinates of an element
async function getCenter(player: PlayerPage) {
  const box = await player.playerRoot.boundingBox();
  if (!box) throw new Error('Player not visible');

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function seekToMiddle(player: PlayerPage) {
  await player.page.evaluate(() => {
    const media = document.querySelector('video')!;

    media.currentTime = media.duration / 2;
  });
  await player.page.waitForFunction(() => {
    const media = document.querySelector('video');

    return media && !media.seeking && Math.abs(media.currentTime - media.duration / 2) < 0.5;
  });
}

// --- Mouse gestures (pointer="mouse") ---

test.describe('Mouse Gestures', () => {
  let player: PlayerPage;

  test.beforeEach(async ({ page }) => {
    player = new PlayerPage(page);
    await page.goto('/pages/html-video-mp4.html');
    await player.waitForMediaReady();
  });

  test('click center of container toggles play/pause', async ({ page }) => {
    await expect(player.playButton).toHaveAttribute(DATA_ATTRS.paused, '');

    // Click the center of the player (not a button) — should toggle play
    const { x, y } = await getCenter(player);

    await page.mouse.click(x, y);
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused, { timeout: 5_000 });

    // Click again — should pause
    await page.mouse.click(x, y);
    await expect(player.playButton).toHaveAttribute(DATA_ATTRS.paused, '', { timeout: 5_000 });
  });

  test('click on button does not trigger container gesture', async ({ page }) => {
    // Clicking the play button should only fire the button action, not the
    // container gesture. If both fired, play would toggle twice (no-op).
    await expect(player.playButton).toHaveAttribute(DATA_ATTRS.paused, '');
    await player.playButton.click();
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused, { timeout: 5_000 });
    // Single taps can be deferred while the recognizer waits for a second tap.
    await page.waitForTimeout(300);
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused);
  });

  test('click on controls container does not trigger container gesture', async ({ page }) => {
    await expect(player.playButton).toHaveAttribute(DATA_ATTRS.paused, '');
    await player.controls.dispatchEvent('pointerdown', { button: 0, pointerType: 'mouse' });
    await player.controls.dispatchEvent('pointerup', { button: 0, pointerType: 'mouse' });
    await page.waitForTimeout(300);
    await expect(player.playButton).toHaveAttribute(DATA_ATTRS.paused, '');

    const { x, y } = await getCenter(player);

    await page.mouse.click(x, y);
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused);
  });

  test('click on slider does not trigger container gesture', async ({ page }) => {
    // Start playback so the slider has a seekable range
    await player.play();
    await player.waitForPlayback();

    // Click the time slider — should seek, not toggle play/pause.
    // Wait briefly after seek to give any leaked gesture time to fire.
    await player.seekTo(50);
    await page.waitForTimeout(300);
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused);
  });
});

// --- React gestures (verify slider interaction isolation) ---

test.describe('React Mouse Gestures', () => {
  let player: PlayerPage;

  test.beforeEach(async ({ page }) => {
    player = new PlayerPage(page);
    await page.goto('/pages/react-video-mp4.html');
    await player.waitForMediaReady();
  });

  test('click center of container toggles play/pause', async ({ page }) => {
    await expect(player.playButton).toHaveAttribute(DATA_ATTRS.paused, '');

    const { x, y } = await getCenter(player);

    await page.mouse.click(x, y);
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused, { timeout: 5_000 });
  });

  test('click on button does not trigger container gesture', async ({ page }) => {
    await expect(player.playButton).toHaveAttribute(DATA_ATTRS.paused, '');
    await player.playButton.click();
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused, { timeout: 5_000 });
    // Single taps can be deferred while the recognizer waits for a second tap.
    await page.waitForTimeout(300);
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused);
  });

  test('click on controls container does not trigger container gesture', async ({ page }) => {
    await expect(player.playButton).toHaveAttribute(DATA_ATTRS.paused, '');
    await player.controls.dispatchEvent('pointerdown', { button: 0, pointerType: 'mouse' });
    await player.controls.dispatchEvent('pointerup', { button: 0, pointerType: 'mouse' });
    await page.waitForTimeout(300);
    await expect(player.playButton).toHaveAttribute(DATA_ATTRS.paused, '');

    const { x, y } = await getCenter(player);

    await page.mouse.click(x, y);
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused);
  });

  test('click on slider does not trigger container gesture', async ({ page }) => {
    await player.play();
    await player.waitForPlayback();

    // Click the time slider — should seek, not toggle play/pause.
    // Wait briefly after seek to give any leaked gesture time to fire.
    await player.seekTo(50);
    await page.waitForTimeout(300);
    await expect(player.playButton).not.toHaveAttribute(DATA_ATTRS.paused);
  });
});

// --- Touch gestures (pointer="touch") ---

test.describe('Touch Gestures', () => {
  test.use({ hasTouch: true, viewport: { width: 375, height: 667 } });

  let player: PlayerPage;

  test.beforeEach(async ({ page }) => {
    player = new PlayerPage(page);
    await page.goto('/pages/html-video-mp4.html');
    await player.waitForMediaReady();
  });

  test('tap container toggles controls visibility', async ({ page }) => {
    await player.play();
    await expect(player.controls).not.toHaveAttribute(DATA_ATTRS.visible);
    const { x, y } = await getCenter(player);

    await page.touchscreen.tap(x, y);
    await expect(player.controls).toHaveAttribute(DATA_ATTRS.visible, '');
    // Separate single taps, then require hiding before the two-second idle timeout.
    await page.waitForTimeout(300);
    await page.touchscreen.tap(x, y);
    await expect(player.controls).not.toHaveAttribute(DATA_ATTRS.visible, { timeout: 1_000 });
  });

  test('double-tap right side seeks forward', async ({ page }) => {
    await player.play();
    await player.waitForPlayback();
    await player.pause();
    await seekToMiddle(player);
    const before = await player.getCurrentTime();
    const duration = await page.evaluate(() => document.querySelector('video')!.duration);

    expect(duration - before).toBeGreaterThan(10);

    // Get a point in the right third of the player
    const box = await player.playerRoot.boundingBox();
    if (!box) throw new Error('Player not visible');

    const rightX = box.x + box.width * 0.85;
    const centerY = box.y + box.height / 2;

    // Double-tap right side — should seek forward 10s
    await page.touchscreen.tap(rightX, centerY);
    await page.waitForTimeout(50);
    await page.touchscreen.tap(rightX, centerY);

    await expect.poll(async () => Math.abs((await player.getCurrentTime()) - (before + 10))).toBeLessThan(0.5);
  });

  test('double-tap left side seeks backward', async ({ page }) => {
    await player.play();
    await player.waitForPlayback();
    await player.pause();
    await seekToMiddle(player);
    const before = await player.getCurrentTime();

    expect(before).toBeGreaterThan(10);

    // Get a point in the left third of the player
    const box = await player.playerRoot.boundingBox();
    if (!box) throw new Error('Player not visible');

    const leftX = box.x + box.width * 0.15;
    const centerY = box.y + box.height / 2;

    // Double-tap left side — should seek backward 10s
    await page.touchscreen.tap(leftX, centerY);
    await page.waitForTimeout(50);
    await page.touchscreen.tap(leftX, centerY);

    await expect.poll(async () => Math.abs((await player.getCurrentTime()) - (before - 10))).toBeLessThan(0.5);
  });
});
