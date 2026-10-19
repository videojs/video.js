import { expect, type Locator, type Page } from '@playwright/test';

import { DATA_ATTRS, SELECTORS } from '../fixtures/selectors';

/**
 * Page Object Model for the Video.js player.
 *
 * Uses cross-renderer selectors that work for both: - HTML (Web Components): custom element tags like
 * `media-play-button` - React: standard elements with CSS classes like `.media-play-button`
 *
 * Both renderers share the same data attributes for state, so all assertions against `data-paused`, `data-muted`, etc.
 * are portable.
 *
 * Playwright auto-pierces Shadow DOM for HTML custom elements.
 */
export class PlayerPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // --- Control locators ---

  get playButton(): Locator {
    return this.page.locator(SELECTORS.playButton).first();
  }

  get centerPlayButton(): Locator {
    return this.page.locator(SELECTORS.centerPlayButton).first();
  }

  get seekForward(): Locator {
    return this.page.locator(SELECTORS.seekForward).first();
  }

  get seekBackward(): Locator {
    return this.page.locator(SELECTORS.seekBackward).first();
  }

  get timeSlider(): Locator {
    return this.page.locator(SELECTORS.timeSlider).first();
  }

  get timeSliderThumb(): Locator {
    return this.timeSlider.getByRole('slider');
  }

  get muteButton(): Locator {
    return this.page.locator(SELECTORS.muteButton).first();
  }

  get volumeSlider(): Locator {
    return this.page.locator(SELECTORS.volumeSlider).first();
  }

  get volumeSliderThumb(): Locator {
    return this.volumeSlider.getByRole('slider');
  }

  get fullscreenButton(): Locator {
    return this.page.locator(SELECTORS.fullscreenButton).first();
  }

  get pipButton(): Locator {
    return this.page.locator(SELECTORS.pipButton).first();
  }

  get castButton(): Locator {
    return this.page.locator(SELECTORS.castButton).first();
  }

  get airPlayButton(): Locator {
    return this.page.locator(SELECTORS.airPlayButton).first();
  }

  get captionsButton(): Locator {
    return this.page.locator(SELECTORS.captionsButton).first();
  }

  get playbackRateButton(): Locator {
    return this.page.locator(SELECTORS.playbackRateButton).first();
  }

  get settingsButton(): Locator {
    return this.page.locator(SELECTORS.settingsButton).first();
  }

  get settingsCaptionsItem(): Locator {
    return this.page.locator(SELECTORS.settingsCaptionsItem).first();
  }

  get settingsSpeedItem(): Locator {
    return this.page.locator(SELECTORS.settingsSpeedItem).first();
  }

  /** The scrollable panel of the menu view that is currently on screen. */
  get activeMenuPanel(): Locator {
    return this.page.locator(SELECTORS.activeMenuPanel).first();
  }

  get poster(): Locator {
    return this.page.locator(SELECTORS.poster).first();
  }

  get bufferingIndicator(): Locator {
    return this.page.locator(SELECTORS.bufferingIndicator).first();
  }

  get controls(): Locator {
    return this.page.locator(SELECTORS.controls).first();
  }

  get currentTime(): Locator {
    return this.page.locator(SELECTORS.currentTime).first();
  }

  get duration(): Locator {
    return this.page.locator(SELECTORS.duration).first();
  }

  get timeToggle(): Locator {
    return this.page.locator(SELECTORS.timeToggle).first();
  }

  get thumbnail(): Locator {
    return this.page.locator(SELECTORS.thumbnail).first();
  }

  get tooltip(): Locator {
    return this.page.locator(SELECTORS.tooltip);
  }

  get playTooltip(): Locator {
    return this.tooltip.filter({ hasText: 'Play' }).first();
  }

  get settingsTooltip(): Locator {
    return this.tooltip.filter({ hasText: 'Settings' }).first();
  }

  get popover(): Locator {
    return this.page.locator(SELECTORS.popover).first();
  }

  /** Locator for the outermost player wrapper (works for both video and audio). */
  get playerRoot(): Locator {
    return this.page.locator(SELECTORS.container).first();
  }

  get videoPlayer(): Locator {
    return this.page.locator(SELECTORS.videoPlayer).first();
  }

  get audioPlayer(): Locator {
    return this.page.locator(SELECTORS.audioPlayer).first();
  }

  // --- Actions ---

  /** Wait for the player to load media and show controls. */
  async waitForMediaReady({ muted = true }: { muted?: boolean } = {}): Promise<void> {
    await this.playButton.waitFor({ state: 'attached', timeout: 20_000 });
    await this.playerRoot.evaluate(async (root) => {
      const elements = [root, ...root.querySelectorAll<HTMLElement>('*')].filter((element) =>
        element.localName.includes('-')
      );

      await Promise.all(
        [...new Set(elements.map((element) => element.localName))].map((name) => customElements.whenDefined(name))
      );
      await Promise.all(
        elements.map((element) => (element as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete)
      );
    });

    // Wait for the media element to have at least metadata loaded.
    // SPF-based renderers (hls-video) with preload="metadata" need
    // time to resolve the manifest before seeks or other interactions work.
    await this.page.waitForFunction(
      (selector) => {
        const media = document.querySelector(selector) as HTMLMediaElement | null;
        const actual = (media?.querySelector?.('video') as HTMLMediaElement) ?? media;

        return actual && actual.readyState >= 1;
      },
      SELECTORS.media,
      { timeout: 20_000 }
    );

    if (muted) {
      // Mute the media element to prevent audio during test runs.
      // Chromium supports --mute-audio but WebKit has no browser-level
      // equivalent, so we mute the renderer directly for cross-browser silence.
      await this.page.evaluate((selector) => {
        const media = document.querySelector(selector) as HTMLMediaElement | null;
        const actual = (media?.querySelector?.('video') as HTMLMediaElement) ?? media;

        if (actual) actual.muted = true;
      }, SELECTORS.media);
    }
  }

  /** Click play and wait for the paused attribute to be removed. */
  async play(): Promise<void> {
    await this.playButton.click();
    await expect(this.playButton).not.toHaveAttribute(DATA_ATTRS.paused, { timeout: 5_000 });
  }

  /** Start the media without interacting with controls. */
  async playMedia(): Promise<void> {
    await this.page.evaluate(async (selector) => {
      const media = document.querySelector(selector) as HTMLMediaElement | null;
      const actual = (media?.querySelector?.('video') as HTMLMediaElement) ?? media;

      await actual?.play();
    }, SELECTORS.media);
    await expect(this.playButton).not.toHaveAttribute(DATA_ATTRS.paused, { timeout: 5_000 });
  }

  /** Click pause and wait for the paused attribute to appear. */
  async pause(): Promise<void> {
    // In Firefox headless (especially audio), controls may hide after play
    // starts and force-click doesn't reliably dispatch to Shadow DOM buttons.
    // Fall back to dispatching click via JS, then verify UI state.
    await this.playButton.dispatchEvent('click');
    await expect(this.playButton).toHaveAttribute(DATA_ATTRS.paused, '', { timeout: 5_000 });
  }

  async openPlaybackRateSettings(): Promise<void> {
    await this.showControls();
    await this.settingsButton.click();
    await expect(this.settingsSpeedItem).toBeVisible();
    await this.settingsSpeedItem.click();
    await expect(this.page.locator(SELECTORS.activeMenuOptions).first()).toBeVisible();
  }

  async openCaptionsSettings(): Promise<void> {
    await this.showControls();
    await this.settingsButton.click();
    await expect(this.settingsCaptionsItem).toBeVisible();
    await this.settingsCaptionsItem.click();
    await expect(this.page.locator(SELECTORS.activeMenuOptions).first()).toBeVisible();
  }

  async getPlaybackRate(): Promise<number> {
    return this.page.evaluate((selector) => {
      const media = document.querySelector(selector) as HTMLMediaElement | null;
      const actual = (media?.querySelector?.('video') as HTMLMediaElement) ?? media;

      return actual?.playbackRate ?? 1;
    }, SELECTORS.media);
  }

  /** Read the current playhead of the backing media element. */
  async getCurrentTime(): Promise<number> {
    return this.page.evaluate((selector) => {
      const media = document.querySelector<HTMLMediaElement>(selector);
      const actual = media?.querySelector<HTMLMediaElement>('video') ?? media;

      return actual?.currentTime ?? 0;
    }, SELECTORS.media);
  }

  /** Wait until playback has advanced past `seconds`, so later seeks and gestures act on a moving timeline. */
  async waitForPlayback(seconds = 0): Promise<void> {
    await expect.poll(() => this.getCurrentTime(), { timeout: 10_000 }).toBeGreaterThan(seconds);
  }

  /** Click at a percentage position on the time slider. */
  async seekTo(percent: number): Promise<void> {
    // Wait for readyState >= 1 (HAVE_METADATA) and a non-zero duration.
    // On WebKit, seeking with no buffered data resolves to currentTime 0
    // instead of the requested position.
    await this.page.waitForFunction(
      (selector) => {
        const media = document.querySelector(selector) as HTMLMediaElement | null;
        const actual = (media?.querySelector?.('video') as HTMLMediaElement) ?? media;

        return actual && actual.readyState >= 1 && actual.duration > 0 && Number.isFinite(actual.duration);
      },
      SELECTORS.media,
      { timeout: 30_000 }
    );

    const duration = await this.page.evaluate((selector) => {
      const media = document.querySelector<HTMLMediaElement>(selector);
      const actual = media?.querySelector<HTMLMediaElement>('video') ?? media;

      return actual?.duration ?? 0;
    }, SELECTORS.media);
    const box = await this.timeSlider.boundingBox();
    if (!box) throw new Error('Time slider not visible');

    const x = box.x + box.width * (percent / 100);
    const y = box.y + box.height / 2;

    await this.page.mouse.click(x, y);

    // Wait for the seek to land near the clicked position; keyframe alignment and slider rounding shift it a little.
    const target = duration * (percent / 100);
    const tolerance = Math.max(2, duration * 0.05);

    await expect
      .poll(async () => Math.abs((await this.getCurrentTime()) - target), { timeout: 10_000 })
      .toBeLessThanOrEqual(tolerance);
  }

  /** Hover over the time slider at a percentage position. */
  async hoverTimeSlider(percent: number): Promise<void> {
    const box = await this.timeSlider.boundingBox();
    if (!box) throw new Error('Time slider not visible');

    const x = box.x + box.width * (percent / 100);
    const y = box.y + box.height / 2;

    await this.page.mouse.move(x, y);
  }

  /**
   * Opens the playback rate menu and selects the first option that differs from the current rate. Skins expose rate via
   * a menu (not cycle-on-trigger).
   */
  async selectAlternativePlaybackRate(): Promise<void> {
    const initialRate = await this.getPlaybackRate();
    const usesSettingsMenu = (await this.settingsButton.count()) > 0;

    if (usesSettingsMenu) {
      await this.openPlaybackRateSettings();
    } else {
      await this.showControls();
      await this.playbackRateButton.click();
    }

    const option = this.page
      .locator(usesSettingsMenu ? SELECTORS.activeMenuUncheckedOptions : SELECTORS.playbackRateUncheckedOptions)
      .first();

    await expect(option).toBeVisible({ timeout: 5_000 });
    // Menu popovers can intercept pointer events on nested radio items.
    await option.dispatchEvent('click');

    await expect.poll(async () => this.getPlaybackRate()).not.toBe(initialRate);
  }

  /** Signal pointer activity to show controls and reset the idle timer. */
  async showControls(): Promise<void> {
    await this.playerRoot.dispatchEvent('pointermove', { pointerType: 'mouse' });

    if ((await this.videoPlayer.count()) > 0) {
      await expect(this.controls).toHaveAttribute(DATA_ATTRS.visible, '');
    }
  }
}
