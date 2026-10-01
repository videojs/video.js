import { expect, type Locator, type Page, test } from '@playwright/test';

import { testCompatParity } from './compat';
import { testRtlLayout } from './rtl';
import {
  captureRendering,
  closeMenus,
  emulatePreference,
  expectRenderingParity,
  expectSameRendering,
  frameRect,
  freezeSliderState,
  openComparison,
  openSourceComparison,
  presetVolume,
  releaseSliderState,
  type SkinCase,
  skinCases,
  type SkinComparison,
  type SkinPanel,
  type SourceComparison,
  settleFonts,
} from './vjsc-skin-parity';

const CASES = skinCases('video').filter((variant) => !variant.skin.startsWith('compat-'));
const REACT_DEFAULT: SkinCase = { framework: 'react', skin: 'default-video' };
const WIDTHS = [320, 800] as const;
const BUFFERING_INDICATOR_SELECTOR =
  '.media-buffering-indicator, media-buffering-indicator, [class~="peer/buffering"], [class~="hidden"][class~="place-content-center"]';
const CONTROLS_SELECTOR = '.video-controls';
/**
 * The poster root in every skin: the HTML element, or the React `div` carrying `data-loaded`, which no other component
 * exposes. The Tailwind output emits no semantic class for it, so a class selector misses that panel. `preparePanel`
 * waits for the loaded state, so contracts can rely on the attribute being present.
 */
const POSTER_SELECTOR = 'media-poster, [data-loaded]';
const LAYOUT_SELECTORS = [CONTROLS_SELECTOR, POSTER_SELECTOR] as const;
/**
 * The spinner icon inside the slider preview's thumbnail, relative to the slider root. Playwright's child combinator
 * pierces the `<media-slider-thumbnail>` shadow root, where a `<slot>` is also a last child, so the element type keeps
 * the match to the icon.
 */
const THUMBNAIL_SPINNER_SELECTOR = ':scope > :last-child > :first-child > :is(svg, media-icon)';

testRtlLayout(CASES);
testCompatParity('video');

for (const variant of CASES) {
  test(`${variant.framework} ${variant.skin} keeps poster sizing and fit in sync`, async ({ page }) => {
    const { panels } = await openComparison(page, { ...variant, width: 800 }, async () => {});

    for (const { root } of panels) {
      const image = root.locator('img').first();

      await image.evaluate((element: HTMLImageElement) => {
        element.removeAttribute('srcset');
        element.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="200"><rect width="100" height="200" fill="red"/></svg>')}`;
      });
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalHeight)).toBe(200);
      await expect(image).toHaveCSS('object-fit', 'contain');
      await expect(image).toHaveCSS('object-position', '50% 50%');
      expect(await frameRect(image)).toEqual(await frameRect(root));

      await root.evaluate((element: HTMLElement) => element.style.setProperty('--media-object-fit', 'cover'));
      await expect(image).toHaveCSS('object-fit', 'cover');
    }
  });

  test(`${variant.framework} ${variant.skin} keeps CSS and Tailwind layout in sync`, async ({ page }) => {
    for (const width of WIDTHS) {
      const { css, tailwind } = await openVariants(page, variant, width);
      const cssContract = await layoutContract(css.root);
      const tailwindContract = await layoutContract(tailwind.root);

      expect(tailwindContract).toEqual(cssContract);
    }
  });

  test(`${variant.framework} ${variant.skin} keeps CSS and Tailwind rendering in sync`, async ({ page }, testInfo) => {
    for (const width of WIDTHS) {
      const comparison = await openVariants(page, variant, width);
      const cssContract = await skinContract(comparison.css.root);
      const tailwindContract = await skinContract(comparison.tailwind.root);

      expect(tailwindContract).toEqual(cssContract);
      await expectRenderingParity(testInfo, comparison, snapshotName(variant, width));
    }
  });

  test(`${variant.framework} ${variant.skin} keeps the packaged skin in sync with the authored skin`, async ({
    page,
  }, testInfo) => {
    const { authored, generated } = await openPackagedVariants(page, variant, 800);
    const authoredContract = await skinContract(authored.root);
    const generatedContract = await skinContract(generated.root);

    expect(generatedContract).toEqual(authoredContract);

    const reference = await captureRendering(authored.root, `${variant.framework}-${variant.skin}-packaged.png`);

    await expectSameRendering(testInfo, reference, generated.root);
  });

  test(`${variant.framework} ${variant.skin} keeps button interaction styling in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-button-focus.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);

    const cssRootFocus = await focusContract(css.root);
    const tailwindRootFocus = await focusContract(tailwind.root);

    expectPaintedOutline(cssRootFocus);
    expectPaintedOutline(tailwindRootFocus);
    expect(tailwindRootFocus).toEqual(cssRootFocus);

    const cssButton = await focusPlayButton(css.root);
    const cssFocused = await buttonStateContract(cssButton);
    const reference = await captureRendering(css.root, name);
    const tailwindButton = await focusPlayButton(tailwind.root);
    const tailwindFocused = await buttonStateContract(tailwindButton);

    expectPaintedOutline(cssFocused);
    expectPaintedOutline(tailwindFocused);
    expect(tailwindFocused).toEqual(cssFocused);
    await expectSameRendering(testInfo, reference, tailwind.root);

    const cssDisabled = await disabledButtonContract(cssButton);

    expect(await disabledButtonContract(tailwindButton)).toEqual(cssDisabled);

    const cssPressed = await pressedButtonContract(cssButton);

    expect(await pressedButtonContract(tailwindButton)).toEqual(cssPressed);
  });

  test(`${variant.framework} ${variant.skin} keeps seek focus styling in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-seek-focus.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssContract = await seekFocusContract(css.root);
    const reference = await captureRendering(css.root, name);
    const tailwindContract = await seekFocusContract(tailwind.root);

    for (const contract of [cssContract, tailwindContract]) {
      if (variant.skin === 'default-video') {
        expect(contract.ring).toEqual({ content: 'painted', opacity: '1', scale: 'full', shadow: 'painted' });
      } else {
        expectPaintedOutline(contract);
      }
    }

    expect(tailwindContract).toEqual(cssContract);
    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps slider paint within the track thickness`, async ({ page }) => {
    const { panels } = await openComparison(page, { ...variant, media: 'mp4-1', width: 618 }, async ({ root }) =>
      expect(root.getByRole('slider', { name: 'Seek' })).toBeVisible()
    );

    for (const { root } of panels) {
      const layers = root
        .getByRole('slider', { name: 'Seek' })
        .locator('..')
        .locator(
          'media-slider-fill, media-slider-buffer, .media-slider-fill, .media-slider-buffer, [class~="before:bg-media-primary"], [class~="before:bg-current/20"]'
        );
      const caps = await layers.evaluateAll((elements) =>
        elements
          .filter(
            (element): element is HTMLElement =>
              element instanceof HTMLElement && getComputedStyle(element).position === 'absolute'
          )
          .flatMap((element) => {
            const layer = element;

            return ['horizontal', 'vertical'].flatMap((orientation) =>
              [0, 0.5, 4, 20, 100].map((size) => {
                layer.setAttribute('data-orientation', orientation);
                Object.assign(layer.style, {
                  transition: 'none',
                  inset: '0 auto auto 0',
                  width: `${orientation === 'horizontal' ? size : 4}px`,
                  height: `${orientation === 'vertical' ? size : 4}px`,
                });
                const paint = getComputedStyle(layer, '::before');

                return {
                  width: paint.width,
                  height: paint.height,
                  clip: getComputedStyle(layer).clipPath,
                  orientation,
                  size,
                };
              })
            );
          })
      );

      expect(caps.length).toBeGreaterThan(0);

      for (const { orientation, size, ...cap } of caps) {
        // A short segment reveals part of the track's circular cap, never a compressed vertical pill.
        expect(cap).toEqual({
          width: `${orientation === 'horizontal' ? Math.max(4, size) : 4}px`,
          height: `${orientation === 'vertical' ? Math.max(4, size) : 4}px`,
          clip: orientation === 'horizontal' ? 'inset(-1px 0px)' : 'inset(0px -1px)',
        });
      }
    }
  });

  test(`${variant.framework} ${variant.skin} animates progress continuously across chapters`, async ({ page }) => {
    const { panels } = await openComparison(page, { ...variant, media: 'hls-7', width: 618 }, async ({ root }) =>
      expect(root.getByRole('slider', { name: 'Seek' })).toBeEnabled()
    );

    for (const { root } of panels) {
      const slider = root.getByRole('slider', { name: 'Seek' }).locator('..');

      await expect(slider.locator('.media-time-slider-chapter, [class~="group/chapter"]')).toHaveCount(8);
      const progress = await slider.evaluate((element) => {
        if (!(element instanceof HTMLElement)) throw new Error('Expected a slider element.');

        const properties = ['--media-slider-fill', '--media-slider-buffer'];
        const layers = element.querySelectorAll(
          'media-slider-fill, media-slider-buffer, .media-slider-fill, .media-slider-buffer, [class~="before:bg-media-primary"], [class~="before:bg-current/20"]'
        );
        const widths = () => [...layers].map((layer) => layer.getBoundingClientRect().width);
        const setProgress = (value: string) => {
          for (const property of properties) element.style.setProperty(property, value);
        };

        element.style.transitionDuration = '0s';

        setProgress('50%');
        const expected = widths();

        setProgress('0%');
        widths();

        element.style.transitionDuration = '1s';
        element.style.transitionTimingFunction = 'linear';

        setProgress('100%');
        widths();

        const animations = element
          .getAnimations()
          .filter(
            (animation) => animation instanceof CSSTransition && properties.includes(animation.transitionProperty)
          );

        for (const animation of animations) {
          animation.pause();
          animation.currentTime = 500;
        }

        return { expected, actual: widths(), animations: animations.length };
      });

      expect(progress.animations).toBe(2);
      expect(progress.expected.length).toBeGreaterThan(0);
      expect(progress.actual).toEqual(progress.expected);
    }
  });

  test(`${variant.framework} ${variant.skin} animates seeks while focused`, async ({ page }) => {
    const { panels } = await openComparison(page, { ...variant, media: 'mp4-1', width: 618 }, async ({ root }) =>
      expect(root.getByRole('slider', { name: 'Seek' })).toBeEnabled()
    );

    for (const { root } of panels) {
      const thumb = root.getByRole('slider', { name: 'Seek' });

      await thumb.press('Home');
      await root.evaluate((element) => {
        if (element instanceof HTMLElement) element.style.setProperty('--media-duration-slider', '1s');
      });
      await thumb.press('ArrowRight');

      const properties = await thumb
        .locator('..')
        .evaluate((element) =>
          element
            .getAnimations({ subtree: true })
            .flatMap((animation) => (animation instanceof CSSTransition ? [animation.transitionProperty] : []))
        );

      expect(properties).toContain('--media-slider-fill');
      expect(properties).not.toContain('left');
      expect(properties).not.toContain('width');
    }
  });

  test(`${variant.framework} ${variant.skin} keeps seek dragging attached to the pointer`, async ({ page }) => {
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssContract = await seekDragContract(css.root);

    expect(cssContract).toMatchObject({ fillIsImmediate: true, thumbPositionIsImmediate: true });

    const tailwindContract = await seekDragContract(tailwind.root);

    expect(tailwindContract).toEqual(cssContract);
    expect(tailwindContract).toEqual({ fillIsImmediate: true, lag: 0, thumbPositionIsImmediate: true });
  });

  test(`${variant.framework} ${variant.skin} keeps hidden controls and caption placement in sync`, async ({
    page,
  }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-hidden-controls.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);

    await enableCaptions(css);
    await page.mouse.move(0, 0);
    const cssContract = await hideControls(css.root);
    const reference = await captureRendering(css.root, name);

    await enableCaptions(tailwind);
    await page.mouse.move(0, 0);
    const tailwindContract = await hideControls(tailwind.root);

    expect(tailwindContract).toEqual(cssContract);
    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps buffering styling in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-buffering.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssContract = await showBuffering(css.root);
    const reference = await captureRendering(css.root, name);
    const tailwindContract = await showBuffering(tailwind.root);

    expect(tailwindContract).toEqual(cssContract);
    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps popup styling in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-volume-popover.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssPopup = await openVolumePopover(css);
    const cssContract = await popupSurfaceContract(css.root, cssPopup);
    const cssSliderContract = await volumeSliderContract(cssPopup);
    const cssMotion = await popupMotionContract(cssPopup);
    const cssTooltipContract = await muteTooltipContract(css.root, variant.skin);

    expectPopupMotion(cssMotion);

    const reference = await captureRendering(css.root, name);
    const tailwindPopup = await openVolumePopover(tailwind);
    const tailwindContract = await popupSurfaceContract(tailwind.root, tailwindPopup);
    const tailwindSliderContract = await volumeSliderContract(tailwindPopup);
    const tailwindMotion = await popupMotionContract(tailwindPopup);
    const tailwindTooltipContract = await muteTooltipContract(tailwind.root, variant.skin);

    expect(tailwindContract).toEqual(cssContract);
    expect(tailwindSliderContract).toEqual(cssSliderContract);
    expect(tailwindMotion).toEqual(cssMotion);
    expect(tailwindTooltipContract).toEqual(cssTooltipContract);

    if (tailwindTooltipContract) expect(tailwindTooltipContract.shadow).toBe('painted');

    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps tooltip styling in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-play-tooltip.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssTooltip = await openTooltip(css.root, 'Play');
    const cssContract = await tooltipSurfaceContract(css.root, cssTooltip);
    const cssMotion = await popupMotionContract(cssTooltip);

    expectPopupMotion(cssMotion);

    const reference = await captureRendering(css.root, name);
    const tailwindTooltip = await openTooltip(tailwind.root, 'Play');
    const tailwindContract = await tooltipSurfaceContract(tailwind.root, tailwindTooltip);
    const tailwindMotion = await popupMotionContract(tailwindTooltip);

    expect(tailwindContract).toEqual(cssContract);
    expect(tailwindMotion).toEqual(cssMotion);
    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps the settings button tooltip in sync`, async ({ page }) => {
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssTooltip = await openTooltip(css.root, 'Settings');
    const cssContract = await tooltipSurfaceContract(css.root, cssTooltip);
    const tailwindTooltip = await openTooltip(tailwind.root, 'Settings');

    expect(await tooltipSurfaceContract(tailwind.root, tailwindTooltip)).toEqual(cssContract);
  });

  if (variant.skin === 'neutral-video') {
    test(`${variant.framework} ${variant.skin} keeps the expanded volume mask in sync`, async ({ page }) => {
      for (const width of WIDTHS) {
        const { css, tailwind } = await openVariants(page, variant, width);

        await openVolumePopover(css);
        const cssContract = await volumeMaskContract(css.root, width);

        await openVolumePopover(tailwind);
        const tailwindContract = await volumeMaskContract(tailwind.root, width);

        expect(tailwindContract).toEqual(cssContract);
        expect(tailwindContract).toEqual({
          mask: 'gradient',
          position: '0px 0px',
          repeat: 'no-repeat',
          size: width <= 320 ? '400% 100%' : '200% 100%',
          transition: 'mask-position 0.05s ease-out',
        });
      }
    });
  }

  test(`${variant.framework} ${variant.skin} animates the settings gear across styles`, async ({ page }) => {
    const { panels } = await openVariants(page, variant, 800);

    for (const { root } of panels) {
      const icon = root.getByRole('button', { name: 'Settings', exact: true }).locator('svg, media-icon').first();

      await icon.evaluate((element) => {
        element.addEventListener('transitionrun', (event) => {
          if ((event as TransitionEvent).propertyName === 'rotate') element.setAttribute('data-rotation-started', '');
        });
      });
      await openSettingsMenu(root);

      await expect(icon).toHaveAttribute('data-rotation-started', '');
      await expect(icon).toHaveCSS('rotate', '90deg');
    }
  });

  test(`${variant.framework} ${variant.skin} keeps settings menu styling in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-settings-menu.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssMenu = await openSettingsMenu(css.root);
    const cssContract = await popupContract(css.root, cssMenu);
    const reference = await captureRendering(css.root, name);
    const tailwindMenu = await openSettingsMenu(tailwind.root);
    const tailwindContract = await popupContract(tailwind.root, tailwindMenu);

    expect(tailwindContract).toEqual(cssContract);
    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps settings submenu styling in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-speed-menu.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssSubmenu = await openSettingsSubmenu(css.root, 'Speed');
    const cssContract = await popupContract(css.root, cssSubmenu);
    const reference = await captureRendering(css.root, name);
    const tailwindSubmenu = await openSettingsSubmenu(tailwind.root, 'Speed');
    const tailwindContract = await popupContract(tailwind.root, tailwindSubmenu);

    expect(tailwindContract).toEqual(cssContract);
    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps settings submenu motion coordinated`, async ({ page }) => {
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssContract = await settingsSubmenuMotionContract(css.root, 'Speed');
    const tailwindContract = await settingsSubmenuMotionContract(tailwind.root, 'Speed');

    expect(tailwindContract).toEqual(cssContract);
    expect(tailwindContract).toMatchObject({
      movingRootLayers: 1,
      popupResizeMotion: true,
      submenuMotion: true,
      submenuPersistsDuringClose: true,
    });
  });

  test(`${variant.framework} ${variant.skin} keeps captions submenu styling in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-captions-menu.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssSubmenu = await openSettingsSubmenu(css.root, 'Captions');
    const cssContract = await popupContract(css.root, cssSubmenu);
    const reference = await captureRendering(css.root, name);
    const tailwindSubmenu = await openSettingsSubmenu(tailwind.root, 'Captions');
    const tailwindContract = await popupContract(tailwind.root, tailwindSubmenu);

    expect(tailwindContract).toEqual(cssContract);
    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps keyboard feedback styling in sync`, async ({ page }) => {
    await page.clock.install();

    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssContract = await keyboardFeedbackContract(css);
    const tailwindContract = await keyboardFeedbackContract(tailwind);

    expect(tailwindContract).toEqual(cssContract);
  });

  test(`${variant.framework} ${variant.skin} keeps RTL settings motion in sync`, async ({ page }) => {
    const { css, tailwind } = await openVariants(page, variant, 800);

    await setDirection(page, 'rtl');

    const cssSubmenu = await openSettingsSubmenu(css.root, 'Speed');
    const cssContract = await rtlMenuContract(css.root, cssSubmenu);

    expect(cssContract.direction).toEqual({ direction: 'rtl', parentTranslate: 100, submenuTranslate: -100 });

    const tailwindSubmenu = await openSettingsSubmenu(tailwind.root, 'Speed');
    const tailwindContract = await rtlMenuContract(tailwind.root, tailwindSubmenu);

    expect(tailwindContract).toEqual(cssContract);
  });

  test(`${variant.framework} ${variant.skin} keeps active captions in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-captions-cue.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);

    await enableCaptions(css);
    const reference = await captureRendering(css.root, name);

    await enableCaptions(tailwind);
    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps the seek preview in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-seek-preview.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssSlider = await openSeekPreview(css.root);
    const cssContract = await sliderContract(cssSlider);
    const reference = await captureRendering(css.root, name);
    const cssAlignment = await sliderPreviewAlignment(cssSlider);

    expect(cssAlignment.every((offset) => Math.abs(offset) <= 1)).toBe(true);

    const tailwindSlider = await openSeekPreview(tailwind.root);
    const tailwindContract = await sliderContract(tailwindSlider);

    expect(tailwindContract).toEqual(cssContract);
    await expectSameRendering(testInfo, reference, tailwind.root);
    expect(await sliderPreviewAlignment(tailwindSlider)).toEqual(cssAlignment);
  });

  test(`${variant.framework} ${variant.skin} keeps the VJSC error dialog contained and styling in sync`, async ({
    page,
  }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-error.png`;
    const message = 'Test media error '.repeat(80);
    const { css, tailwind } = await openVariants(page, variant, 320);

    await css.root.evaluate((element) => {
      element.style.height = '180px';
    });
    const cssRootBox = await css.root.boundingBox();
    if (!cssRootBox) throw new Error('Expected the media player to have a rendered box.');

    const cssDialog = await triggerMediaError(css, message);
    const cssContract = await errorDialogContract(css.root, cssDialog);
    const cssContainment = await errorDialogContainmentContract(css.root, cssDialog);

    expect(cssContainment).toMatchObject({
      closeInside: true,
      descriptionMargin: '0px',
      popupInside: true,
      scrolls: true,
      titleMargin: '0px',
    });
    expect(Math.abs(cssContainment.rootHeight - cssRootBox.height)).toBeLessThanOrEqual(1);

    const reference = await captureRendering(css.root, name);

    await tailwind.root.evaluate((element) => {
      element.style.height = '180px';
    });
    const tailwindDialog = await triggerMediaError(tailwind, message);
    const tailwindContract = await errorDialogContract(tailwind.root, tailwindDialog);
    const tailwindContainment = await errorDialogContainmentContract(tailwind.root, tailwindDialog);

    expect(tailwindContract).toEqual(cssContract);
    expect(tailwindContainment).toEqual(cssContainment);
    await expectSameRendering(testInfo, reference, tailwind.root);
  });

  test(`${variant.framework} ${variant.skin} keeps fullscreen scaling in sync`, async ({ page }, testInfo) => {
    const name = `${variant.framework}-${variant.skin}-fullscreen.png`;
    const media = variant.skin === 'neutral-video' ? 'hls-3' : 'mp4-1';

    await page.setViewportSize({ width: 1280, height: 720 });

    const { css, tailwind } = await openVariants(page, variant, 800, media);
    const cssContract = await enterFullscreen(css.root);

    expect(cssContract.previewValueBottomInPreviewHeights).toBe(variant.skin === 'default-video' ? 11.5 : 6);

    const reference = await captureRendering(css.root, name);
    const cssPreview = variant.skin === 'neutral-video' ? await fullscreenPreviewContract(css.root) : null;
    const cssMenu = await fullscreenSpeedMenuContract(css.root);

    await exitFullscreen(page);

    const tailwindContract = await enterFullscreen(tailwind.root);

    expect(tailwindContract).toEqual(cssContract);
    await expectSameRendering(testInfo, reference, tailwind.root);

    const tailwindPreview = variant.skin === 'neutral-video' ? await fullscreenPreviewContract(tailwind.root) : null;
    const tailwindMenu = await fullscreenSpeedMenuContract(tailwind.root);

    expectFullscreenPreviewParity(tailwindPreview, cssPreview);
    expect(tailwindMenu).toEqual(cssMenu);
    expect(tailwindMenu).toEqual({ heightInSpacingUnits: 56, maxHeightInSpacingUnits: 56, scrolls: true });

    // Gaps measured once Inter has loaded the label; the fallback face reads about two pixels larger.
    if (tailwindPreview) {
      expect(tailwindPreview.timeToSliderGap).toBeGreaterThanOrEqual(14);
      expect(tailwindPreview.timeToThumbnailGap).toBeGreaterThanOrEqual(6);
    }

    await exitFullscreen(page);
  });
}

test('neutral fullscreen geometry scales through the large breakpoints', async ({ page }) => {
  const variant: SkinCase = { framework: 'react', skin: 'neutral-video' };

  for (const [viewportWidth, scale] of [
    [1536, 1.5],
    [1920, 1.75],
  ] as const) {
    await exitFullscreen(page);
    await page.setViewportSize({ width: viewportWidth, height: Math.round(viewportWidth * 0.5625) });

    const { css, tailwind } = await openVariants(page, variant, 800, 'hls-3');
    const cssFullscreen = await enterFullscreen(css.root);
    const cssPreview = await fullscreenPreviewContract(css.root);
    const cssMenu = await fullscreenSpeedMenuContract(css.root);

    expect(cssFullscreen.scale).toBe(scale);
    expect(cssPreview.timeToSliderGap).toBeGreaterThanOrEqual(17);
    expect(cssPreview.timeToThumbnailGap).toBeGreaterThanOrEqual(7);
    expect(cssMenu).toEqual({ heightInSpacingUnits: 56, maxHeightInSpacingUnits: 56, scrolls: true });

    await exitFullscreen(page);

    const tailwindFullscreen = await enterFullscreen(tailwind.root);
    const tailwindPreview = await fullscreenPreviewContract(tailwind.root);
    const tailwindMenu = await fullscreenSpeedMenuContract(tailwind.root);

    expect(tailwindFullscreen).toEqual(cssFullscreen);
    expectFullscreenPreviewParity(tailwindPreview, cssPreview);
    expect(tailwindMenu).toEqual(cssMenu);
  }
});

for (const skin of ['default-video', 'neutral-video'] as const) {
  for (const preference of ['reduced-transparency', 'contrast-more', 'forced-colors'] as const) {
    test(`react ${skin} keeps CSS and Tailwind ${preference} surfaces in sync`, async ({ page }, testInfo) => {
      await emulatePreference(page, preference);

      const name = `react-${skin}-${preference}.png`;
      const { css, tailwind } = await openVariants(page, { framework: 'react', skin }, 800);
      const cssMenu = await openSettingsMenu(css.root);
      const cssContract = await preferenceSurfaceContract(css.root, cssMenu);

      if (preference !== 'forced-colors') {
        expect(cssContract.controls.backdropFilter).toBe('none');
        expect(cssContract.menu.backdropFilter).toBe('none');
      }

      const reference = await captureRendering(css.root, name);
      const tailwindMenu = await openSettingsMenu(tailwind.root);
      const tailwindContract = await preferenceSurfaceContract(tailwind.root, tailwindMenu);

      expect(tailwindContract).toEqual(cssContract);
      await expectSameRendering(testInfo, reference, tailwind.root);
    });
  }
}

for (const framework of ['react', 'html'] as const) {
  test(`${framework} chapter segments match across styles and retain their generated range props`, async ({ page }) => {
    const { panels } = await openComparison(
      page,
      { ...REACT_DEFAULT, framework, media: 'hls-7', width: 855 },
      async ({ root }) => expect(root).toBeVisible()
    );
    const contracts = [];

    for (const panel of panels) {
      const chapters = panel.section.locator('.media-time-slider-chapter, [class~="group/chapter"]');

      await expect(chapters).toHaveCount(8);
      contracts.push(
        await chapters.evaluateAll((elements) =>
          elements.map((element) => {
            if (!(element instanceof HTMLElement)) throw new Error('Expected a rendered chapter element.');

            const track = element.firstElementChild;

            return {
              end: element.style.getPropertyValue('--media-slider-chapter-end'),
              insetStart: Number(getComputedStyle(element).getPropertyValue('--media-chapter-inset-start')),
              insetEnd: Number(getComputedStyle(element).getPropertyValue('--media-chapter-inset-end')),
              orientation: element.getAttribute('data-orientation'),
              segment: getComputedStyle(element).clipPath,
              start: element.style.getPropertyValue('--media-slider-chapter-start'),
              track: track && getComputedStyle(track, '::before').clipPath !== 'none' ? 'clipped' : 'none',
            };
          })
        )
      );
    }

    expect(contracts[1]).toEqual(contracts[0]);
    expect(contracts[0]).toHaveLength(8);

    for (const contract of contracts) {
      expect(contract.map(({ insetStart }) => insetStart)).toEqual([0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]);
      expect(contract.map(({ insetEnd }) => insetEnd)).toEqual([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0]);
    }

    expect(
      contracts[0]?.every(
        ({ orientation, segment, track }) => orientation === 'horizontal' && segment !== 'none' && track !== 'none'
      )
    ).toBe(true);
    expect(new Set(contracts[0]?.map(({ start }) => start)).size).toBe(8);
  });
}

test('menu item and moving-highlight styling matches across styles', async ({ page }) => {
  for (const variant of CASES) {
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssHighlight = await menuHighlightContract(await openSettingsMenu(css.root));
    const tailwindHighlight = await menuHighlightContract(await openSettingsMenu(tailwind.root));

    expect(tailwindHighlight).toEqual(cssHighlight);
    expect(tailwindHighlight).toEqual({
      backAnchor: 'none',
      highlight: {
        borderRadius: variant.skin === 'default-video' ? '8px' : '6px',
        keyboardTransition: 'inset 0s ease-in-out',
        pointerTransition: 'inset 0.1s ease-in-out',
        transition: 'inset 0s ease-in-out',
      },
      item: {
        borderRadius: variant.skin === 'default-video' ? '8px' : '6px',
        transition: 'background-color, color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    });
  }
});

test('pointer focus does not keep the slider preview visible', async ({ page }) => {
  for (const variant of CASES) {
    const { panels } = await openVariants(page, variant, 800);

    for (const { root } of panels) {
      const thumb = root.getByRole('slider', { name: 'Seek' });
      const slider = thumb.locator('..');
      const previewContent = slider.locator(':scope > :last-child > :last-child');

      await slider.scrollIntoViewIfNeeded();

      const sliderRect = await slider.boundingBox();
      const rootRect = await root.boundingBox();
      if (!sliderRect || !rootRect) throw new Error('Expected the time slider and media player to be rendered.');

      await page.mouse.click(sliderRect.x + sliderRect.width / 2, sliderRect.y + sliderRect.height / 2);
      await expect(thumb).toBeFocused();
      expect(await thumb.evaluate((element) => element.matches(':focus-visible'))).toBe(false);

      await page.mouse.move(rootRect.x + 1, rootRect.y + 1);

      await expect(slider).not.toHaveAttribute('data-pointing', '');
      await expect(slider).toHaveAttribute('data-interactive', '');
      await expect(previewContent).toHaveCSS('opacity', '0');

      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');

      await expect(thumb).toBeFocused();
      expect(await thumb.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
      await expect(previewContent).toHaveCSS('opacity', '1');
    }
  }
});

test('VJSC preserves the shared skin motion contract', async ({ page }) => {
  for (const variant of CASES) {
    const { panels } = await openVariants(page, variant, 800);

    for (const panel of panels) {
      const { root } = panel;
      const contract = await sharedMotionContract(root);

      expect(contract).toEqual({
        button: {
          duration: '0.15s',
          properties: ['background-color', 'color', 'outline-offset', 'scale'],
        },
        container: { duration: '0.1s', properties: ['outline-offset', 'outline-color'] },
        controlsBackdrop: { duration: '0.1s', properties: ['opacity'] },
        controls: {
          duration: '0.05s',
          properties:
            variant.skin === 'default-video'
              ? ['filter', 'opacity', 'scale', 'translate']
              : ['filter', 'opacity', 'translate'],
        },
        playIcons: [
          { display: 'block', duration: '0.15s', opacity: '0', properties: ['opacity', 'scale'], scale: '0' },
          { display: 'block', duration: '0.15s', opacity: '1', properties: ['opacity', 'scale'], scale: '1' },
          { display: 'block', duration: '0.15s', opacity: '0', properties: ['opacity', 'scale'], scale: '0' },
        ],
        poster: { duration: '0.25s', properties: ['opacity'] },
        settingsIcon: {
          duration: '0.15s',
          properties: ['transform', 'translate', 'scale', 'rotate'],
        },
        slider: {
          buffer: { duration: '0s', properties: ['all'] },
          chapterTrack: { duration: '0.2s', properties: ['height', 'width'] },
          fill: { duration: '0s', properties: ['all'] },
          focusRing: variant.skin === 'default-video' ? { duration: '0.15s', properties: ['opacity', 'scale'] } : null,
          pointer: { duration: '0.2s', properties: ['opacity', 'scale'] },
          thumb: {
            duration: '0.1s',
            properties: ['opacity', 'height', 'width', 'outline-offset', 'scale'],
          },
        },
        preview: {
          duration: '0.15s',
          filter: 'blur(8px)',
          properties: ['filter', 'opacity', 'scale'],
        },
        thumbnailSpinner: {
          animation: 'none',
          duration: '0.15s',
          properties: ['opacity'],
        },
        time: {
          duration: '0.1s',
          properties: ['outline-color', 'outline-offset'],
        },
      });

      const popup = await openVolumePopover(panel);

      expectPopupMotion(await popupMotionContract(popup));
    }
  }
});

test('VJSC preserves compact default controls exit motion', async ({ page }) => {
  for (const framework of ['react', 'html'] as const) {
    const { panels } = await openVariants(page, { framework, skin: 'default-video' }, 320);

    for (const { root } of panels) {
      const contract = await compactDefaultControlsMotionContract(root);

      expect(contract).toEqual({
        primary: {
          duration: '0.3s',
          filter: 'blur(8px)',
          opacity: '0',
          properties: ['filter', 'opacity', 'scale', 'translate'],
          scale: '0.95',
          translate: '0px 4px',
        },
        secondary: {
          duration: '0.3s',
          filter: 'blur(8px)',
          opacity: '0',
          properties: ['filter', 'opacity', 'scale', 'translate'],
          scale: '0.95',
          translate: '0px -4px',
        },
      });
    }
  }
});

test('VJSC generates a readable contrast color from the media accent', async ({ page }) => {
  for (const variant of CASES) {
    const { panels } = await openVariants(page, variant, 800);

    for (const { root } of panels) {
      expect(await accentContrastContract(root, '#fff')).toEqual({
        background: 'rgb(255, 255, 255)',
        color: 'rgb(0, 0, 0)',
      });
      expect(await accentContrastContract(root, '#000')).toEqual({
        background: 'rgb(0, 0, 0)',
        color: 'rgb(255, 255, 255)',
      });
    }
  }
});

test('reduced motion keeps CSS and Tailwind transitions in sync', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const { panels } = await openVariants(page, REACT_DEFAULT, 800);
  const contracts = [];

  for (const { root } of panels) {
    const tooltip = await openTooltip(root, 'Play');
    const tooltipDuration = await tooltip.evaluate((element) => getComputedStyle(element).transitionDuration);
    const menu = await openSettingsMenu(root);

    contracts.push(await reducedMotionContract(root, menu, tooltipDuration));
  }

  for (const contract of contracts) {
    expect(contract.slider.progress).toEqual({
      animations: [],
      transitions: [
        { property: '--media-slider-fill', duration: '0s' },
        { property: '--media-slider-buffer', duration: '0s' },
      ],
      values: [60, 80],
    });
  }

  expect(contracts[1]).toEqual(contracts[0]);
  // Reduced motion collapses every duration to the instant token, except menu resize and slider fills, which stop.
  expect(contracts[0]).toMatchObject({
    button: { duration: '0.05s', properties: ['background-color', 'color'] },
    container: '0.05s',
    controls: '0.025s',
    menu: '0.05s, 0.05s, 0.05s, 0.05s, 0s, 0s',
    playIcons: [
      { duration: '0.05s', properties: ['opacity', 'scale'], scale: '1' },
      { duration: '0.05s', properties: ['opacity', 'scale'], scale: '1' },
      { duration: '0.05s', properties: ['opacity', 'scale'], scale: '1' },
    ],
    poster: { duration: '0.05s', properties: ['opacity'] },
    settingsIcon: { duration: '0.05s', properties: ['none'] },
    slider: {
      fill: { duration: '0s' },
      preview: { duration: '0.05s' },
      thumb: { duration: '0s' },
    },
    thumbnailSpinner: { animation: 'none', duration: '0.05s', properties: ['opacity'] },
    tooltip: '0.05s',
  });
});

async function openVariants(page: Page, variant: SkinCase, width: number, media = 'mp4-1'): Promise<SkinComparison> {
  return openComparison(page, { ...variant, media, width }, (panel) => preparePanel(panel, width));
}

async function openPackagedVariants(page: Page, variant: SkinCase, width: number): Promise<SourceComparison> {
  return openSourceComparison(page, { ...variant, media: 'mp4-1', width }, (panel) => preparePanel(panel, width));
}

async function preparePanel({ root }: SkinPanel, width: number) {
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute('data-controls-visible', '');
  await expect(root.getByRole('button', { name: 'Play', exact: true })).toBeVisible();

  const poster = root.locator('[data-loaded]').first();

  await expect(poster).toBeVisible();
  await expect(poster).toHaveCSS('opacity', '1');
  await expect(root.getByRole('button', { name: /captions/i, includeHidden: true }).first()).toHaveAttribute(
    'data-availability',
    'available'
  );
  // Controls render before media metadata: the seek slider stays disabled, time text shows placeholders, and
  // picture-in-picture hides until it lands. Both panels must be past that phase before any contract is compared.
  await expect(root.getByRole('slider', { name: 'Seek' })).toBeEnabled({ timeout: 20_000 });
  await root.dispatchEvent('pointermove', { pointerType: 'mouse' });
  await expect
    .poll(() =>
      root.evaluate((element) => {
        const tree = element.getRootNode();
        const sizingTarget = tree instanceof ShadowRoot ? tree.host : element;

        return Math.round(sizingTarget.getBoundingClientRect().width);
      })
    )
    .toBe(width);
  await setStableScreenshotHeight(root, width);
  // Buffered ranges advance at different rates in the two players, so keep them out of the comparison.
  await freezeSliderState(root.getByRole('slider', { name: 'Seek' }), ['--media-slider-buffer']);
}

async function exitFullscreen(page: Page) {
  await page.evaluate(async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
  });
}

async function setStableScreenshotHeight(root: Locator, width: number) {
  await root.evaluate((element, playerWidth) => {
    const tree = element.getRootNode();
    const sizingTarget = tree instanceof ShadowRoot ? tree.host : element;
    if (!(sizingTarget instanceof HTMLElement)) return;

    sizingTarget.style.height = `${Math.round((playerWidth * 9) / 16)}px`;
  }, width);
}

async function focusPlayButton(root: Locator): Promise<Locator> {
  const button = root.getByRole('button', { name: 'Play', exact: true });

  await keyboardFocus(button);
  return button;
}

async function keyboardFocus(target: Locator) {
  await target.focus();
  await target.press('Tab');
  await target.page().keyboard.press('Shift+Tab');
  await expect(target).toBeFocused();
  expect(await target.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  await target.page().waitForTimeout(200);
  await settleAnimations(target);
}

function expectPaintedOutline(contract: {
  outlineColor: (number | undefined)[];
  outlineStyle: string;
  outlineWidth: string;
}) {
  expect(contract.outlineStyle).toBe('solid');
  expect(Number.parseFloat(contract.outlineWidth)).toBeGreaterThan(0);
  expect(contract.outlineColor[3]).toBeGreaterThan(0);
}

async function focusContract(target: Locator) {
  await keyboardFocus(target);

  return target.evaluate((element) => {
    const style = getComputedStyle(element);
    const context = new OffscreenCanvas(1, 1).getContext('2d');
    if (!context) throw new Error('Expected a 2D canvas context.');

    context.fillStyle = style.outlineColor;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;

    return {
      outlineColor: [red, green, blue, alpha],
      outlineOffset: style.outlineOffset,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });
}

async function buttonStateContract(button: Locator) {
  return button.evaluate((element) => {
    const style = getComputedStyle(element);
    const context = new OffscreenCanvas(1, 1).getContext('2d');
    if (!context) throw new Error('Expected a 2D canvas context.');

    context.fillStyle = style.outlineColor;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;

    return {
      background: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
      cursor: style.cursor,
      opacity: style.opacity,
      outlineColor: [red, green, blue, alpha],
      outlineOffset: style.outlineOffset,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      scale: style.scale,
    };
  });
}

async function disabledButtonContract(button: Locator) {
  await button.evaluate((element) => {
    if (element instanceof HTMLElement) element.blur();

    element.setAttribute('aria-disabled', 'true');
  });
  await button.page().waitForTimeout(200);
  const contract = await buttonStateContract(button);

  await button.evaluate((element) => element.removeAttribute('aria-disabled'));
  return contract;
}

async function pressedButtonContract(button: Locator) {
  const page = button.page();

  await button.hover();
  await page.mouse.down();
  await page.waitForTimeout(200);
  await settleAnimations(button);
  const contract = await buttonStateContract(button);

  await page.mouse.up();
  return contract;
}

/** Wait for the element's running transitions to finish, so a contract reads settled values rather than a frame of them. */
async function settleAnimations(target: Locator) {
  await target.evaluate((element) =>
    Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => undefined)))
  );
}

async function seekFocusContract(root: Locator) {
  const thumb = root.getByRole('slider', { name: 'Seek' });
  const outline = await focusContract(thumb);

  const contract = await thumb.evaluate((element) => {
    const style = getComputedStyle(element);
    const after = getComputedStyle(element, '::after');
    const rect = element.getBoundingClientRect();
    const paintedShadow = after.boxShadow.split(/,(?![^()]*\))/).some((shadow) => {
      const transparent =
        shadow.includes('transparent') ||
        /rgba\([^)]*,\s*0\)/.test(shadow) ||
        /(?:rgb|oklab|oklch)\([^)]*\/\s*0\)/.test(shadow);
      const hasExtent = [...shadow.matchAll(/-?(?:\d*\.)?\d+px/g)].some(([value]) => Number.parseFloat(value) !== 0);

      return !transparent && hasExtent;
    });

    return {
      opacity: style.opacity,
      outlineOffset: style.outlineOffset,
      outlineWidth: style.outlineWidth,
      scale: style.scale,
      rect: { width: Math.round(rect.width), height: Math.round(rect.height) },
      ring: {
        content: after.content === 'none' ? 'none' : 'painted',
        opacity: after.opacity,
        scale: after.scale === 'none' || after.scale === '1' ? 'full' : after.scale,
        shadow: paintedShadow ? 'painted' : 'none',
      },
    };
  });

  return { ...outline, ...contract };
}

async function seekDragContract(root: Locator) {
  const page = root.page();
  const thumb = root.getByRole('slider', { name: 'Seek' });
  const slider = thumb.locator(
    'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " media-slider ") or contains(concat(" ", normalize-space(@class), " "), " media-time-slider ") or contains(@class, "group/slider")][1]'
  );

  await slider.scrollIntoViewIfNeeded();

  const box = await slider.boundingBox();
  if (!box) throw new Error('Expected the seek slider to have a rendered box.');

  const pointerX = box.x + box.width * 0.73;
  const pointerY = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.25, pointerY);
  await page.mouse.down();
  await page.mouse.move(pointerX, pointerY);
  await expect(slider).toHaveAttribute('data-dragging', '');

  // The pointer's offset within the slider: the mouse moved in page coordinates, the thumb reports frame ones.
  const contract = await thumb.evaluate((element, expectedOffset) => {
    const style = getComputedStyle(element);
    const sliderElement = element.parentElement?.closest('[data-orientation]');
    const expectedX = (sliderElement?.getBoundingClientRect().x ?? 0) + expectedOffset;
    const slider = sliderElement ? [sliderElement] : [];
    const fills = slider
      .map((target) => getComputedStyle(target))
      .filter((style) => style.transitionProperty.includes('--media-slider-fill'));
    const rect = element.getBoundingClientRect();
    const lag = Math.abs(rect.x + rect.width / 2 - expectedX);
    const positionProperties = new Set(style.transitionProperty.split(',').map((value) => value.trim()));
    const fillDurations = fills.flatMap((style) =>
      style.transitionDuration.split(',').map((value) => Number.parseFloat(value))
    );

    return {
      fillIsImmediate: fillDurations.length > 0 && fillDurations.every((duration) => duration === 0),
      lag: lag <= 1 ? 0 : Math.ceil(lag),
      thumbPositionIsImmediate: !positionProperties.has('left') && !positionProperties.has('top'),
    };
  }, box.width * 0.73);

  await page.mouse.up();
  return contract;
}

async function hideControls(root: Locator) {
  const controls = root.locator(CONTROLS_SELECTOR).first();

  await expect(controls).toHaveAttribute('data-visible', '');
  await controls.evaluate((element) => {
    element.removeAttribute('data-visible');

    if (element.previousElementSibling?.getAttribute('aria-hidden') === 'true') {
      element.previousElementSibling.removeAttribute('data-visible');
    }

    element.querySelector(':scope > [aria-hidden="true"]')?.removeAttribute('data-visible');
    element.closest('[role="group"]')?.removeAttribute('data-controls-visible');
  });
  await root.page().waitForTimeout(650);

  return root.evaluate((element, controlsSelector) => {
    const inspect = (target: Element | null) => {
      if (!(target instanceof HTMLElement)) return null;

      const style = getComputedStyle(target);

      return {
        display: style.display,
        filter: style.filter === 'none' ? 'none' : 'blurred',
        opacity: style.opacity,
        pointerEvents: style.pointerEvents,
        scale: style.scale,
        translate: style.translate,
      };
    };

    const controls = element.querySelector<HTMLElement>(controlsSelector);
    const backdrop = inspect(
      element.querySelector('.video-controls-backdrop') ??
        controls?.querySelector(':scope > [aria-hidden="true"]') ??
        controls?.previousElementSibling ??
        null
    );

    return {
      cursor: getComputedStyle(element).cursor,
      controls: inspect(controls),
      backdrop: backdrop
        ? {
            filter: backdrop.filter,
            opacity: backdrop.opacity,
            pointerEvents: backdrop.pointerEvents,
            scale: backdrop.scale,
          }
        : null,
    };
  }, CONTROLS_SELECTOR);
}

async function showBuffering(root: Locator) {
  const indicator = root.locator(BUFFERING_INDICATOR_SELECTOR).first();

  await indicator.evaluate((element) => element.setAttribute('data-visible', ''));
  await root.page().waitForTimeout(500);

  return root.evaluate((element, bufferingIndicatorSelector) => {
    const indicator = element.querySelector<HTMLElement>(bufferingIndicatorSelector);
    const backdrop = element.querySelector<HTMLElement>('[class~="peer-data-visible/buffering:bg-black/35"]');
    const spinner = indicator?.querySelector<HTMLElement>('media-icon, svg');
    const inspect = (target: HTMLElement | null | undefined) => {
      if (!target) return null;

      const style = getComputedStyle(target);
      const rect = target.getBoundingClientRect();

      return {
        display: style.display,
        position: style.position,
        pointerEvents: style.pointerEvents,
        opacity: style.opacity,
        rect: { width: Math.round(rect.width), height: Math.round(rect.height) },
      };
    };

    const backdropStyle = backdrop
      ? getComputedStyle(backdrop)
      : indicator
        ? getComputedStyle(indicator, '::before')
        : null;
    const backdropRect = backdrop ?? indicator;
    const spinnerStyle = spinner ? getComputedStyle(spinner) : null;

    return {
      indicator: inspect(indicator),
      backdrop: {
        backdropFilter: backdropStyle?.backdropFilter.includes('blur(8px)') ? 'blurred' : backdropStyle?.backdropFilter,
        background: backdropStyle?.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
        backgroundImage: backdropStyle?.backgroundImage === 'none' ? 'none' : 'painted',
        opacity: backdropStyle?.opacity,
        rect: backdropRect
          ? {
              width: Math.round(backdropRect.getBoundingClientRect().width),
              height: Math.round(backdropRect.getBoundingClientRect().height),
            }
          : null,
      },
      spinner: {
        opacity: spinnerStyle?.opacity,
        rect: spinner
          ? {
              width: Math.round(spinner.getBoundingClientRect().width),
              height: Math.round(spinner.getBoundingClientRect().height),
            }
          : null,
      },
    };
  }, BUFFERING_INDICATOR_SELECTOR);
}

async function enterFullscreen(root: Locator) {
  const page = root.page();

  await root.evaluate((element) => {
    const tree = element.getRootNode();
    const sizingTarget = tree instanceof ShadowRoot ? tree.host : element;
    if (!(sizingTarget instanceof HTMLElement)) return;

    sizingTarget.style.height = '';
  });

  const button = root.getByRole('button', { name: /full ?screen/i }).first();

  await expect(button).toBeVisible();
  await button.click();
  await expect(button).toHaveAttribute('data-fullscreen', '');
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
  await page.waitForTimeout(300);

  return root.evaluate((element: HTMLElement) => {
    const inspect = (target: Element | null) => {
      if (!(target instanceof HTMLElement || target instanceof SVGElement)) return null;

      const style = getComputedStyle(target);
      const rect = target.getBoundingClientRect();

      return {
        fontSize: style.fontSize,
        height: Math.round(rect.height),
        width: Math.round(rect.width),
      };
    };
    const play = element.querySelector<HTMLElement>('[role="button"][aria-label="Play"]');
    const icon = [...(play?.querySelectorAll<HTMLElement | SVGElement>('svg, media-icon') ?? [])].find((candidate) => {
      const rect = candidate.getBoundingClientRect();

      return rect.width > 0 && rect.height > 0;
    });
    const seek = element.querySelector<HTMLElement>('[role="slider"][aria-label="Seek"]');
    const preview = seek?.parentElement?.lastElementChild;
    const previewValue = preview?.lastElementChild;
    const previewHeight = preview?.getBoundingClientRect().height ?? 0;
    const previewValueBottom = previewValue ? Number.parseFloat(getComputedStyle(previewValue).bottom) : 0;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();

    return {
      root: {
        borderRadius: style.borderRadius,
        fontSize: style.fontSize,
        height: Math.round(rect.height),
        width: Math.round(rect.width),
      },
      scale: Number.parseFloat(style.getPropertyValue('--media-scale')),
      play: inspect(play),
      icon: inspect(icon ?? null),
      previewValueBottomInPreviewHeights:
        previewHeight > 0 ? Math.round((previewValueBottom / previewHeight) * 10) / 10 : null,
    };
  });
}

async function fullscreenPreviewContract(root: Locator) {
  const slider = root.getByRole('slider', { name: 'Seek' }).locator('..');
  const box = await slider.boundingBox();
  if (!box) throw new Error('Expected the fullscreen seek slider to have a rendered box.');

  await slider.hover({ position: { x: box.width / 2, y: box.height / 2 } });

  const thumbnail = slider.locator(':scope > :last-child > :first-child');

  // The thumbnail keeps a placeholder box until its storyboard image arrives, so the gaps depend on the loaded image,
  // and the preview scales in, so they also depend on the transition having finished.
  await expect(thumbnail).not.toHaveAttribute('data-loading', '', { timeout: 20_000 });
  await expect.poll(() => thumbnail.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThan(0);
  await settleAnimations(slider.locator(':scope > :last-child'));
  // The time label appears with the preview and is the first use of its weight, so its box follows the fallback font's
  // metrics until Inter has loaded it.
  await settleFonts(slider);

  return slider.evaluate((element) => {
    const preview = element.lastElementChild;
    const thumbnail = preview?.firstElementChild;
    const value = preview?.lastElementChild;
    if (!preview || !thumbnail || !value) throw new Error('Expected the fullscreen seek preview to be rendered.');

    const previewRect = preview.getBoundingClientRect();
    const thumbnailRect = thumbnail.getBoundingClientRect();
    const valueRect = value.getBoundingClientRect();
    const style = getComputedStyle(element);
    const scaleUnit = Number.parseFloat(style.getPropertyValue('--media-scale-unit')) || 16;
    const scale = Number.parseFloat(style.getPropertyValue('--media-scale')) || 1;
    const spacing = (scaleUnit * scale) / 4;
    const round = (number: number) => Math.round(number);
    const roundUnits = (number: number) => Math.round(number * 10) / 10;

    return {
      timeToSliderGap: round(previewRect.top - valueRect.bottom),
      timeToThumbnailGap: round(valueRect.top - thumbnailRect.bottom),
      valueBottomInSpacingUnits: roundUnits(Number.parseFloat(getComputedStyle(value).bottom) / spacing),
      thumbnailBottomInSpacingUnits: roundUnits(Number.parseFloat(getComputedStyle(thumbnail).bottom) / spacing),
    };
  });
}

function expectFullscreenPreviewParity(
  actual: Awaited<ReturnType<typeof fullscreenPreviewContract>> | null,
  expected: Awaited<ReturnType<typeof fullscreenPreviewContract>> | null
) {
  if (!actual || !expected) {
    expect(actual).toEqual(expected);
    return;
  }

  const stable = ({ timeToSliderGap, valueBottomInSpacingUnits, thumbnailBottomInSpacingUnits }: typeof actual) => ({
    timeToSliderGap,
    valueBottomInSpacingUnits,
    thumbnailBottomInSpacingUnits,
  });

  expect(stable(actual)).toEqual(stable(expected));
}

async function fullscreenSpeedMenuContract(root: Locator) {
  const submenu = await openSettingsSubmenu(root, 'Speed');

  return submenu.evaluate((element) => {
    const popup = element.closest<HTMLElement>('[popover]');
    if (!popup) throw new Error('Expected the fullscreen speed submenu to be inside a Popup.');

    const style = getComputedStyle(popup);
    const spacing = Number.parseFloat(style.paddingTop);
    const round = (number: number) => Math.round(number * 10) / 10;

    return {
      heightInSpacingUnits: round(popup.clientHeight / spacing),
      maxHeightInSpacingUnits: round(Number.parseFloat(style.maxHeight) / spacing),
      scrolls: element.scrollHeight > element.clientHeight,
    };
  });
}

async function preferenceSurfaceContract(root: Locator, menu: Locator) {
  const controls = root.locator(CONTROLS_SELECTOR).first();

  const inspect = (target: Locator) =>
    target.evaluate((element) => {
      const style = getComputedStyle(element);
      const after = getComputedStyle(element, '::after');

      return {
        backdropFilter: style.backdropFilter === 'none' ? 'none' : 'filtered',
        background: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
        borderColor: style.borderBottomColor,
        borderWidth: style.borderBottomWidth,
        boxShadow: style.boxShadow === 'none' ? 'none' : 'painted',
        frame: after.boxShadow === 'none' ? 'none' : 'painted',
      };
    });

  return {
    controls: await inspect(controls),
    menu: await inspect(menu),
  };
}

async function keyboardFeedbackContract(panel: SkinPanel) {
  const { root } = panel;

  // Inter loads one weight at a time, so a label still in its fallback face centers a fraction of a pixel differently.
  await settleFonts(root);
  await presetVolume(panel);

  return {
    volume: await triggerIndicator(root, 'ArrowUp', '[data-level]:not([role])'),
    captions: await triggerIndicator(root, 'c', '[data-status="captions-on"], [data-status="captions-off"]'),
    seek: await triggerIndicator(root, 'ArrowRight', '[data-direction="forward"]'),
    playback: await triggerIndicator(root, 'k', '[data-status="play"], [data-status="pause"]'),
  };
}

async function triggerIndicator(root: Locator, key: string, selector: string) {
  const page = root.page();

  await root.focus();
  await page.keyboard.press(key);
  await page.clock.runFor(150);

  const indicator = root.locator(selector).filter({ visible: true }).first();

  await expect(indicator).toBeVisible();
  await expect(indicator).not.toHaveAttribute('data-starting-style', '');
  // The indicator's label is the first use of its weight, so Inter starts loading it now, not when the page loaded.
  await settleFonts(indicator);
  const contract = await indicatorContract(indicator);

  await page.clock.runFor(1_000);
  await expect(indicator).toBeHidden();
  return contract;
}

async function indicatorContract(indicator: Locator) {
  return indicator.evaluate((element) => {
    if (!(element instanceof HTMLElement)) throw new Error('Expected an HTML status indicator.');

    const round = (value: number) => Math.round(value);
    // Centered indicators land on sub-pixel offsets that follow glyph widths; whole pixels are what the styling owns.
    const roundPx = (value: string) => (value.endsWith('px') ? `${round(Number.parseFloat(value))}px` : value);
    const inspect = (target: Element | null) => {
      if (!(target instanceof HTMLElement || target instanceof SVGElement)) return null;

      const style = getComputedStyle(target);
      const rect = target.getBoundingClientRect();
      const radius = Number.parseFloat(style.borderRadius);
      const width = target instanceof HTMLElement ? target.offsetWidth : Number.parseFloat(style.width);
      const height = target instanceof HTMLElement ? target.offsetHeight : Number.parseFloat(style.height);

      return {
        padding: style.padding,
        gap: style.gap,
        borderRadius: radius >= Math.min(rect.width, rect.height) / 2 ? 'round' : style.borderRadius,
        backgroundColor: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
        backgroundImage: style.backgroundImage === 'none' ? 'none' : 'painted',
        backdropFilter: style.backdropFilter,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        inset: {
          top: roundPx(style.top),
          right: roundPx(style.right),
          bottom: roundPx(style.bottom),
          left: roundPx(style.left),
        },
        motion: {
          animationName: style.animationName,
          transitionDuration: style.transitionDuration,
          transitionProperties: style.transitionProperty
            .split(',')
            .map((value) => value.trim())
            .sort(),
        },
        rect: {
          width: round(width),
          height: round(height),
        },
        // The level or status the indicator announces; a width difference alone does not say which panel diverged.
        text: target.textContent?.trim() ?? '',
      };
    };
    const inspectProgress = (content: Element | null, progress: Element | undefined) => {
      if (!content) return null;

      const target = progress ?? content;
      const trackStyle = getComputedStyle(target, progress ? null : '::before');
      if (!progress && (trackStyle.content === 'none' || trackStyle.display === 'none')) return null;

      const fillStyle = getComputedStyle(target, progress ? '::before' : '::after');
      const dimensions = (style: CSSStyleDeclaration, measuredTarget?: Element) => {
        const rect = measuredTarget?.getBoundingClientRect();

        return {
          width: round(rect?.width ?? Number.parseFloat(style.width)),
          height: round(rect?.height ?? Number.parseFloat(style.height)),
        };
      };
      const trackRect = dimensions(trackStyle, progress);
      const fillRect = dimensions(fillStyle);
      const radius = Number.parseFloat(trackStyle.borderRadius);
      const boxShadow = trackStyle.boxShadow
        .split(/,(?![^()]*\))/)
        .map((shadow) => shadow.trim())
        .filter((shadow) => !shadow.startsWith('rgba(0, 0, 0, 0)'))
        .join(', ');

      return {
        track: {
          background: trackStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
          borderRadius: radius >= Math.min(trackRect.width, trackRect.height) / 2 ? 'round' : trackStyle.borderRadius,
          boxShadow: boxShadow || 'none',
          rect: trackRect,
        },
        fill: {
          background: fillStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
          rect: fillRect,
          transitionDuration: fillStyle.transitionDuration,
          transitionProperty: fillStyle.transitionProperty,
        },
      };
    };
    const visibleIcon = [...element.querySelectorAll('media-icon, svg')].find((icon) => {
      const style = getComputedStyle(icon);

      return style.display !== 'none' && icon.getBoundingClientRect().width > 0;
    });
    const presenceState = (attribute: 'data-starting-style' | 'data-ending-style') => {
      const rootTransition = element.style.transition;
      const iconTransition =
        visibleIcon instanceof HTMLElement || visibleIcon instanceof SVGElement ? visibleIcon.style.transition : '';
      const inspectMotion = (target: Element | undefined) => {
        if (!target) return null;

        const style = getComputedStyle(target);

        return {
          filter: style.filter,
          opacity: style.opacity,
          scale: style.scale,
          translate: style.translate,
        };
      };

      element.style.transition = 'none';

      if (visibleIcon instanceof HTMLElement || visibleIcon instanceof SVGElement)
        visibleIcon.style.transition = 'none';

      element.setAttribute(attribute, '');

      const state = { root: inspectMotion(element), icon: inspectMotion(visibleIcon) };

      element.removeAttribute(attribute);
      element.style.transition = rootTransition;

      if (visibleIcon instanceof HTMLElement || visibleIcon instanceof SVGElement) {
        visibleIcon.style.transition = iconTransition;
      }

      return state;
    };
    const isTopIndicator =
      element.hasAttribute('data-level') || element.getAttribute('data-status')?.startsWith('captions');
    const content = isTopIndicator ? element.firstElementChild : null;
    const progress = [...(content?.children ?? [])].find((child) => {
      const style = getComputedStyle(child);

      return child.tagName === 'DIV' && style.display !== 'none';
    });
    const value = isTopIndicator
      ? content?.lastElementChild
      : element.hasAttribute('data-direction')
        ? element.lastElementChild
        : null;

    return {
      level: element.getAttribute('data-level'),
      status: element.getAttribute('data-status'),
      direction: element.getAttribute('data-direction'),
      root: inspect(element),
      content: inspect(content),
      progress: inspectProgress(content, progress),
      icon: inspect(visibleIcon ?? null),
      presence: {
        starting: presenceState('data-starting-style'),
        ending: presenceState('data-ending-style'),
      },
      value: inspect(value ?? null),
    };
  });
}

async function setDirection(page: Page, direction: 'ltr' | 'rtl') {
  for (const frame of page.frames()) {
    if (frame === page.mainFrame()) continue;

    // The player derives its direction from its locale, so the document alone is not enough: the sandbox pins both.
    await frame.evaluate((value) => window.postMessage({ type: 'dir-change', dir: value }, '*'), direction);

    const root = frame.getByRole('group', { name: 'Media player' });

    await expect(frame.locator('html')).toHaveAttribute('dir', direction);
    await expect(root).toHaveCSS('direction', direction);
    // The html page renders its player again for the change; bring the controls back before the menus open.
    await root.dispatchEvent('pointermove', { pointerType: 'mouse' });
    await expect(root).toHaveAttribute('data-controls-visible', '');
  }
}

async function enableCaptions({ root, section }: SkinPanel) {
  const button = root.getByRole('button', { name: /captions/i }).first();

  await button.click();
  await expect(button).toHaveAttribute('data-active', '');

  // The HTML player owns its media outside the skin's accessible group, while the React skin renders it within.
  const video = section.locator('video').first();

  await video.evaluate((element: HTMLVideoElement) => {
    element.pause();
    element.currentTime = 2;
  });
  // Cues activate when the seek completes, which waits on media data from the network while the showing track fetches
  // its cues in parallel. The media may also carry a thumbnails metadata track, so look the caption track up by kind.
  await expect
    .poll(
      () =>
        video.evaluate((element: HTMLVideoElement) => {
          const track = [...element.textTracks].find(
            ({ kind, mode }) => (kind === 'subtitles' || kind === 'captions') && mode === 'showing'
          );
          const active = track?.activeCues?.length ?? 0;

          // Cues that land after the seek completed only activate on the next one.
          if (track?.cues?.length && !active && !element.seeking) element.currentTime = 2;

          return active;
        }),
      { timeout: 20_000 }
    )
    .toBeGreaterThan(0);
  await root.page().waitForTimeout(100);
}

async function openSeekPreview(root: Locator) {
  const thumb = root.getByRole('slider', { name: 'Seek' });
  const slider = thumb.locator('..');
  const box = await slider.boundingBox();
  if (!box) throw new Error('Expected the seek slider to have a rendered box.');

  await slider.hover({ position: { x: box.width / 2, y: box.height / 2 } });
  await expect(slider).toHaveAttribute('data-pointing', '');
  await root.page().waitForTimeout(200);
  return slider;
}

async function sliderPreviewAlignment(slider: Locator) {
  const offsets: number[] = [];

  for (const ratio of [0.25, 0.75]) {
    const box = await slider.boundingBox();
    if (!box) throw new Error('Expected the seek slider to have a rendered box.');

    const pointer = box.x + box.width * ratio;

    await slider.hover({ position: { x: box.width * ratio, y: box.height / 2 } });
    const previewValue = slider.locator(':scope > :last-child > :last-child');
    const previewBox = await previewValue.boundingBox();
    if (!previewBox) throw new Error('Expected the seek preview value to have a rendered box.');

    offsets.push(Math.round((previewBox.x + previewBox.width / 2 - pointer) * 10) / 10);
  }

  return offsets;
}

async function sliderContract(slider: Locator) {
  return slider.evaluate((element) => {
    const inspect = (target: Element | null) => {
      if (!(target instanceof HTMLElement)) return null;

      const style = getComputedStyle(target);

      return {
        display: style.display,
        position: style.position,
        width: Math.round(target.offsetWidth),
        height: Math.round(target.offsetHeight),
        padding: style.padding,
        opacity: style.opacity,
        transitionDuration: style.transitionDuration,
      };
    };

    const chapters = element.firstElementChild;
    const chapter = chapters?.firstElementChild;
    const track = chapter?.firstElementChild;
    const thumb = element.querySelector('[role="slider"]');
    const preview = element.lastElementChild;
    const thumbnail = preview?.firstElementChild;
    const previewValue = preview?.lastElementChild;

    return {
      root: inspect(element),
      track: inspect(track ?? null),
      thumb: inspect(thumb),
      preview: inspect(preview),
      thumbnail: inspect(thumbnail ?? null),
      previewValue: inspect(previewValue ?? null),
    };
  });
}

async function sharedMotionContract(root: Locator) {
  const transition = (target: Locator) =>
    target.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        duration: style.transitionDuration,
        properties: style.transitionProperty.split(',').map((value) => value.trim()),
      };
    });
  const controls = root.locator(CONTROLS_SELECTOR).first();
  const button = root.getByRole('button', { name: 'Play', exact: true });
  const poster = root.locator(POSTER_SELECTOR).first();
  const settingsIcon = root.getByRole('button', { name: 'Settings', exact: true }).locator('svg, media-icon').first();
  const playIconCandidates = await root
    .getByRole('button', { name: 'Play', exact: true })
    .locator('svg, media-icon')
    .all();
  const playIcons: Array<{
    display: string;
    duration: string;
    opacity: string;
    properties: string[];
    scale: string;
  }> = [];

  for (const icon of playIconCandidates) {
    const contract = await icon.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        display: style.display,
        duration: style.transitionDuration,
        opacity: style.opacity,
        properties: style.transitionProperty.split(',').map((value) => value.trim()),
        scale: style.scale,
      };
    });

    if (contract.properties.includes('opacity') && contract.properties.includes('scale')) playIcons.push(contract);
  }

  const time = root.getByRole('button', { name: /Show (?:duration|remaining time)/ }).first();
  const thumb = root.getByRole('slider', { name: 'Seek' }).first();
  const slider = thumb.locator('..');
  const chapterTrack = slider
    .locator(
      '.media-time-slider-chapter-track, media-slider-track, :scope > :first-child > :first-child > :first-child'
    )
    .first();
  const buffer = chapterTrack.locator(':scope > :first-child');
  const fill = chapterTrack.locator(':scope > :last-child');
  const preview = slider.locator(':scope > :last-child > :last-child');
  const previewRoot = slider.locator(':scope > :last-child');
  const thumbnailSpinner = slider.locator(THUMBNAIL_SPINNER_SELECTOR);
  const pseudoTransition = (target: Locator, pseudo: '::before' | '::after') =>
    target.evaluate((element, pseudoElement) => {
      const style = getComputedStyle(element, pseudoElement);
      if (style.content === 'none') return null;

      return {
        duration: style.transitionDuration,
        properties: style.transitionProperty.split(',').map((value) => value.trim()),
      };
    }, pseudo);

  if (playIcons.length !== 3) {
    throw new Error(
      `Expected three play icons, received: ${JSON.stringify(
        await Promise.all(
          playIconCandidates.map((icon) =>
            icon.evaluate((element) => ({
              className: element.getAttribute('class'),
              tagName: element.tagName,
              transitionProperty: getComputedStyle(element).transitionProperty,
            }))
          )
        )
      )}`
    );
  }

  return {
    button: await transition(button),
    container: await transition(root),
    controlsBackdrop: await controls.evaluate((element) => {
      const target = element.previousElementSibling ?? element.querySelector(':scope > [aria-hidden="true"]');
      if (!target) throw new Error('Expected the controls backdrop to be rendered.');

      const style = getComputedStyle(target);

      return {
        duration: style.transitionDuration,
        properties: style.transitionProperty.split(',').map((value) => value.trim()),
      };
    }),
    controls: await transition(controls),
    playIcons,
    poster: await transition(poster),
    settingsIcon: await transition(settingsIcon),
    slider: {
      buffer: await transition(buffer),
      chapterTrack: await transition(chapterTrack),
      fill: await transition(fill),
      focusRing: await pseudoTransition(thumb, '::after'),
      pointer: await pseudoTransition(previewRoot, '::before'),
      thumb: await transition(thumb),
    },
    preview: await preview.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        duration: style.transitionDuration,
        filter: style.filter,
        properties: style.transitionProperty.split(',').map((value) => value.trim()),
      };
    }),
    thumbnailSpinner: await thumbnailSpinner.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        animation: style.getPropertyValue('--media-spinner-animation').trim(),
        duration: style.transitionDuration,
        properties: style.transitionProperty.split(',').map((value) => value.trim()),
      };
    }),
    time: await transition(time),
  };
}

async function compactDefaultControlsMotionContract(root: Locator) {
  return root.evaluate(async (element) => {
    const deepQuery = (parent: ParentNode, selector: string): HTMLElement | null => {
      const match = parent.querySelector<HTMLElement>(selector);
      if (match) return match;

      if (parent instanceof Element && parent.shadowRoot) {
        const shadowMatch = deepQuery(parent.shadowRoot, selector);
        if (shadowMatch) return shadowMatch;
      }

      for (const child of parent.querySelectorAll<HTMLElement>('*')) {
        if (!child.shadowRoot) continue;

        const shadowMatch = deepQuery(child.shadowRoot, selector);
        if (shadowMatch) return shadowMatch;
      }

      return null;
    };
    const controls = deepQuery(element, '.video-controls');
    const primary = controls && deepQuery(controls, '.video-controls-primary, [class~="origin-bottom"]');
    const secondary = controls && deepQuery(controls, '.video-controls-secondary, [class~="origin-top"]');
    const inspect = (target: HTMLElement) => {
      const style = getComputedStyle(target);

      return {
        duration: style.transitionDuration,
        filter: style.filter,
        opacity: style.opacity,
        properties: style.transitionProperty.split(',').map((value) => value.trim()),
        scale: style.scale,
        translate: style.translate,
      };
    };

    if (!controls || !primary || !secondary) throw new Error('Expected compact default controls regions.');

    controls.removeAttribute('data-visible');
    element.removeAttribute('data-controls-visible');
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    for (const animation of [...primary.getAnimations(), ...secondary.getAnimations()]) animation.finish();

    return { primary: inspect(primary), secondary: inspect(secondary) };
  });
}

async function accentContrastContract(root: Locator, accent: string) {
  await root.evaluate((element, value) => {
    element.style.setProperty('--media-accent-color', value);
  }, accent);
  const target = root.getByRole('button', { name: 'Play', exact: true });

  await target.hover();
  await root.page().waitForTimeout(200);
  // The color transitions in oklab, and a computed color read mid-transition serializes in that space.
  await settleAnimations(target);

  return target.evaluate((element) => {
    const style = getComputedStyle(element);

    return { background: style.backgroundColor, color: style.color };
  });
}

async function triggerMediaError({ root, section }: SkinPanel, message?: string): Promise<Locator> {
  await section
    .locator('video')
    .first()
    .evaluate((element: HTMLVideoElement, errorMessage) => {
      if (errorMessage) {
        Object.defineProperty(element, 'error', {
          configurable: true,
          value: { code: 4, message: errorMessage },
        });
        element.dispatchEvent(new Event('error'));
        return;
      }

      element.src = '/missing-video-that-does-not-exist.mp4';
      element.load();
    }, message);
  const dialog = root.getByRole('alertdialog');

  await expect
    .poll(() =>
      dialog.evaluate((element) => {
        const target = element.querySelector('.media-dialog-popup') ?? element;
        const rect = target.getBoundingClientRect();
        const style = getComputedStyle(target);

        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      })
    )
    .toBe(true);
  await expect(dialog).not.toHaveAttribute('data-starting-style', '');
  await root.page().waitForTimeout(600);
  return dialog;
}

async function errorDialogContainmentContract(root: Locator, dialog: Locator) {
  const close = dialog.getByRole('button').first();
  const title = dialog.locator('h2, media-dialog-title').first();
  const description = dialog.locator('p, media-dialog-description').first();
  const [rootBox, popupBox, closeBox] = await Promise.all([
    root.boundingBox(),
    dialog.boundingBox(),
    close.boundingBox(),
  ]);

  if (!rootBox || !popupBox || !closeBox)
    throw new Error('Expected the error dialog to be rendered inside the player.');

  return {
    closeInside: closeBox.y >= rootBox.y && closeBox.y + closeBox.height <= rootBox.y + rootBox.height,
    descriptionMargin: await description.evaluate((element) => getComputedStyle(element).margin),
    popupInside: popupBox.y >= rootBox.y && popupBox.y + popupBox.height <= rootBox.y + rootBox.height,
    rootHeight: rootBox.height,
    scrolls: await description.evaluate((element) => {
      const content = element.parentElement;

      return content !== null && content.scrollHeight > content.clientHeight;
    }),
    titleMargin: await title.evaluate((element) => getComputedStyle(element).margin),
  };
}

async function errorDialogContract(root: Locator, dialog: Locator) {
  const rootRect = await frameRect(root);

  return dialog.evaluate((element: HTMLElement, playerRect) => {
    const surface = element.querySelector<HTMLElement>('.media-dialog-popup') ?? element;
    const title = element.querySelector<HTMLElement>('h2, media-dialog-title');
    const description = element.querySelector<HTMLElement>('p, media-dialog-description');
    const close = element.querySelector<HTMLElement>('button, media-dialog-close');
    const backdrop =
      (surface.previousElementSibling instanceof HTMLElement ? surface.previousElementSibling : null) ??
      surface.parentElement?.querySelector<HTMLElement>('.media-dialog-backdrop');
    // Centered dialogs land on half pixels, so finer rounding only reports layout noise.
    const round = (value: number) => Math.round(value * 2) / 2;
    const inspect = (target: HTMLElement | null, includePadding = true) => {
      if (!target) return null;

      const style = getComputedStyle(target);
      const rect = target.getBoundingClientRect();

      const contract = {
        gap: style.gap,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
        opacity: style.opacity,
        rect: {
          x: round(rect.x - playerRect.x),
          y: round(rect.y - playerRect.y),
          width: round(rect.width),
          height: round(rect.height),
        },
      };

      return includePadding ? { padding: style.padding, ...contract } : contract;
    };
    const motion = (target: HTMLElement | null | undefined) => {
      if (!target) return null;

      const style = getComputedStyle(target);
      const normalizeTransitionList = (value: string) =>
        [...new Set(value.split(',').map((part) => part.trim()))].join(', ');
      const transition = {
        delay: normalizeTransitionList(style.transitionDelay),
        duration: normalizeTransitionList(style.transitionDuration),
        property: style.transitionProperty,
      };
      const inlineTransition = target.style.transition;
      const state = (attribute: 'data-starting-style' | 'data-ending-style') => {
        target.style.transition = 'none';
        target.setAttribute(attribute, '');

        const stateStyle = getComputedStyle(target);
        const result = { opacity: stateStyle.opacity, scale: stateStyle.scale };

        target.removeAttribute(attribute);
        target.style.transition = inlineTransition;
        return result;
      };

      return {
        transition,
        starting: state('data-starting-style'),
        ending: state('data-ending-style'),
      };
    };

    return {
      surface: inspect(surface),
      motion: { backdrop: motion(backdrop), popup: motion(surface) },
      title: inspect(title),
      description: inspect(description),
      close: inspect(close, false),
    };
  }, rootRect);
}

async function reducedMotionContract(root: Locator, menu: Locator, tooltipDuration: string) {
  const inspect = (target: Locator) =>
    target.evaluate((element) => {
      const style = getComputedStyle(element);

      return {
        duration: style.transitionDuration,
        properties: style.transitionProperty.split(',').map((value) => value.trim()),
      };
    });
  const controls = root.locator(CONTROLS_SELECTOR).first();
  const play = root.getByRole('button', { name: 'Play', exact: true });
  const playIcons = await Promise.all(
    (await play.locator('svg, media-icon').all()).map((icon) =>
      icon.evaluate((element) => {
        const style = getComputedStyle(element);

        return {
          duration: style.transitionDuration,
          properties: style.transitionProperty.split(',').map((value) => value.trim()),
          scale: style.scale,
        };
      })
    )
  );
  const poster = root.locator(POSTER_SELECTOR).first();
  const settingsIcon = root.getByRole('button', { name: 'Settings', exact: true }).locator('svg, media-icon').first();
  const seekThumb = root.getByRole('slider', { name: 'Seek' });
  const seekSlider = seekThumb.locator('..');
  const chapterTrack = seekSlider
    .locator(
      '.media-time-slider-chapter-track, media-slider-track, :scope > :first-child > :first-child > :first-child'
    )
    .first();
  const fill = chapterTrack.locator(':scope > :last-child');
  const preview = seekSlider.locator(':scope > :last-child > :last-child');
  const thumbnailSpinner = seekSlider.locator(THUMBNAIL_SPINNER_SELECTOR);
  const thumbnailSpinnerMotion = await inspect(thumbnailSpinner);

  await releaseSliderState(seekThumb, ['--media-slider-buffer']);

  const progress = await seekSlider.evaluate((element) => {
    if (!(element instanceof HTMLElement)) throw new Error('Expected a slider element.');

    const properties = ['--media-slider-fill', '--media-slider-buffer'];
    const style = getComputedStyle(element);
    const transitionProperties = style.transitionProperty.split(',').map((value) => value.trim());
    const durations = style.transitionDuration.split(',').map((value) => value.trim());
    const transitions = properties.map((property) => {
      const index = transitionProperties.indexOf(property);

      return { property, duration: index < 0 ? null : durations[index % durations.length] };
    });

    for (const property of properties) element.style.setProperty(property, '0%', 'important');

    element.getBoundingClientRect();
    element.style.setProperty('--media-slider-fill', '60%', 'important');
    element.style.setProperty('--media-slider-buffer', '80%', 'important');
    element.getBoundingClientRect();

    return {
      animations: element
        .getAnimations()
        .flatMap((animation) =>
          animation instanceof CSSTransition && properties.includes(animation.transitionProperty)
            ? [animation.transitionProperty]
            : []
        ),
      transitions,
      values: properties.map((property) => Number.parseFloat(getComputedStyle(element).getPropertyValue(property))),
    };
  });

  const rootMotion = {
    container: await root.evaluate((element) => getComputedStyle(element).transitionDuration),
    controls: await controls.evaluate((element) => getComputedStyle(element).transitionDuration),
    button: await inspect(play),
    playIcons,
    poster: await inspect(poster),
    settingsIcon: await inspect(settingsIcon),
    slider: {
      fill: await inspect(fill),
      progress,
      preview: await inspect(preview),
      thumb: await inspect(seekThumb),
    },
    thumbnailSpinner: {
      ...thumbnailSpinnerMotion,
      animation: await thumbnailSpinner.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--media-spinner-animation').trim()
      ),
    },
  };
  const menuDuration = await menu.evaluate((element) => getComputedStyle(element).transitionDuration);

  return { ...rootMotion, menu: menuDuration, tooltip: tooltipDuration };
}

async function rtlMenuContract(root: Locator, submenu: Locator) {
  const popup = await popupContract(root, submenu);
  const direction = await submenu.evaluate((element) => {
    const parentContent = [...(element.parentElement?.children ?? [])].find(
      (child) => child.getAttribute('role') === 'menu' && !child.hasAttribute('data-submenu')
    );
    const hadStartingStyle = element.hasAttribute('data-starting-style');
    const transition = element.style.transition;

    element.style.transition = 'none';
    element.toggleAttribute('data-starting-style', true);

    const submenuTranslate = Number.parseFloat(getComputedStyle(element).translate);

    element.toggleAttribute('data-starting-style', hadStartingStyle);
    element.style.transition = transition;

    return {
      direction: getComputedStyle(element).direction,
      parentTranslate: parentContent ? Number.parseFloat(getComputedStyle(parentContent).translate) : Number.NaN,
      submenuTranslate,
    };
  });

  return { popup, direction };
}

async function layoutContract(root: Locator) {
  return root.evaluate((element, [controlsSelector, posterSelector]) => {
    const rootRect = element.getBoundingClientRect();
    const round = (value: number) => Math.round(value * 10) / 10;
    const inspect = (
      target: Element | null,
      { includeGap = true, includeHorizontalPosition = true, includeRadius = true, includeWidth = true } = {}
    ) => {
      if (!(target instanceof HTMLElement)) return null;

      const style = getComputedStyle(target);
      const rect = target.getBoundingClientRect();

      if (style.display === 'contents') return { display: style.display };

      const radius = Number.parseFloat(style.borderRadius);
      const isRound = radius >= Math.min(rect.width, rect.height) / 2;
      const rectContract = {
        y: round(rect.y - rootRect.y),
        height: round(rect.height),
      };
      const contract = {
        display: style.display,
        position: style.position,
        flex: style.flex,
        order: style.order,
        padding: style.padding,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        rect: rectContract,
      };

      if (includeGap) Object.assign(contract, { gap: style.gap });

      if (includeRadius) Object.assign(contract, { borderRadius: isRound ? 'round' : style.borderRadius });

      if (includeHorizontalPosition) Object.assign(rectContract, { x: round(rect.x - rootRect.x) });

      if (includeWidth) Object.assign(rectContract, { width: round(rect.width) });

      return contract;
    };
    const query = (selector: string) => element.querySelector<HTMLElement>(selector);
    const play = query('[role="button"][aria-label="Play"]');
    const seek = query('[role="slider"][aria-label="Seek"]');

    return {
      root: inspect(element),
      poster: inspect(query(posterSelector), { includeRadius: false }),
      controls: inspect(query(controlsSelector), { includeGap: false }),
      primary: inspect(play?.parentElement ?? null, { includeGap: false }),
      timeline: inspect(seek?.parentElement?.parentElement ?? null, {
        includeHorizontalPosition: false,
        includeWidth: false,
      }),
      play: inspect(play),
      mute: inspect(query('[role="button"][aria-label="Mute"]')),
      seekThumb: inspect(seek, { includeHorizontalPosition: false }),
      settings: inspect(query('[role="button"][aria-label="Settings"]'), {
        includeHorizontalPosition: false,
      }),
      pictureInPicture: inspect(
        query(
          '[role="button"][aria-label="Enter picture-in-picture"], [role="button"][aria-label="Exit picture-in-picture"]'
        )
      ),
      fullscreen: inspect(
        query('[role="button"][aria-label="Enter fullscreen"], [role="button"][aria-label="Exit fullscreen"]')
      ),
    };
  }, LAYOUT_SELECTORS);
}

async function openSettingsMenu(root: Locator): Promise<Locator> {
  const trigger = root.getByRole('button', { name: 'Settings', exact: true });

  await closeMenus(root.page());
  await expect(trigger).toBeVisible();
  await trigger.click();

  const menu = root
    .locator(
      '.media-menu--settings:visible, .media-settings:visible, [popover]:has(> [role="menu"]):visible, media-menu:has(> media-menu-content):visible, [role="menu"]:visible'
    )
    .first();

  await expect(menu).toBeVisible();
  await expect(menu).not.toHaveAttribute('data-starting-style', '');

  // Whether an item starts highlighted depends on how focus arrived, so pin the highlight to the first item.
  const first = menu.getByRole('menuitem').first();

  await first.hover();
  await expect(first).toHaveAttribute('data-highlighted', /^(?:pointer|keyboard)?$/);
  await root.page().waitForTimeout(300);
  return menu;
}

async function openSettingsSubmenu(root: Locator, name: string): Promise<Locator> {
  const menu = await openSettingsMenu(root);
  const trigger = menu.getByRole('menuitem').filter({ hasText: name }).first();

  await expect(trigger).toBeVisible();
  await trigger.click();

  const submenu = menu.locator('[data-submenu]:visible').first();

  await expect(submenu).toBeVisible();
  await expect(submenu).not.toHaveAttribute('data-starting-style', '');
  await expect(await rootMenuContent(menu)).toHaveAttribute('data-child-open', '');
  await root.page().waitForTimeout(300);
  return submenu;
}

async function settingsSubmenuMotionContract(root: Locator, name: string) {
  const menu = await openSettingsMenu(root);
  const trigger = menu.getByRole('menuitem').filter({ hasText: name }).first();

  await expect(trigger).toBeVisible();
  await trigger.click();

  const submenu = menu.locator('[data-submenu]:visible').first();

  await expect(submenu).toBeVisible();
  await expect(await rootMenuContent(menu)).toHaveAttribute('data-child-open', '');

  const motion = await menu.evaluate((element) => {
    const hasPanelMotion = (target: Element) => {
      const style = getComputedStyle(target);
      const properties = style.transitionProperty.split(',').map((value) => value.trim());
      const durations = style.transitionDuration.split(',').map((value) => Number.parseFloat(value));
      const transitions = new Map(properties.map((property, index) => [property, durations[index % durations.length]]));

      return transitions.get('translate') === 0.25 && transitions.get('filter') === 0.25;
    };
    const popupStyle = getComputedStyle(element);
    const popupProperties = popupStyle.transitionProperty.split(',').map((value) => value.trim());
    const popupDurations = popupStyle.transitionDuration.split(',').map((value) => Number.parseFloat(value));
    const popupTransition = new Map(
      popupProperties.map((property, index) => [property, popupDurations[index % popupDurations.length]])
    );
    const movingRootLayers = [...element.children].filter(
      (child) => !child.hasAttribute('data-submenu') && hasPanelMotion(child)
    );
    const activeSubmenu = element.querySelector('[data-submenu]:not([hidden])');

    return {
      movingRootLayers: movingRootLayers.length,
      popupResizeMotion: popupTransition.get('width') === 0.25 && popupTransition.get('height') === 0.25,
      submenuMotion: activeSubmenu ? hasPanelMotion(activeSubmenu) : false,
    };
  });

  const back = submenu.getByRole('menuitem').filter({ hasText: name }).first();

  await back.click();
  await expect(submenu).toHaveAttribute('data-ending-style', '');
  const submenuPersistsDuringClose = await submenu.isVisible();

  await expect(submenu).toBeHidden();

  return { ...motion, submenuPersistsDuringClose };
}

async function rootMenuContent(root: Locator): Promise<Locator> {
  const content = root
    .locator(':scope > [role="menu"]:not([data-submenu]), :scope > media-menu-content:not([data-submenu])')
    .first();

  return (await content.count()) > 0 ? content : root;
}

async function menuHighlightContract(menu: Locator) {
  const content = await rootMenuContent(menu);
  const items = content.locator(':scope > [role="menuitem"]:visible');
  const transition = () =>
    content.evaluate((element) => {
      const style = getComputedStyle(element, '::before');

      return `${style.transitionProperty} ${style.transitionDuration} ${style.transitionTimingFunction}`;
    });

  if ((await items.count()) < 2) throw new Error('Expected at least two settings menu items.');

  await items.nth(0).hover();
  await items.nth(1).hover();
  const pointerTransition = await transition();

  await items.nth(1).focus();
  await menu.page().keyboard.press('ArrowDown');
  const keyboardTransition = await transition();

  return content
    .evaluate((element) => {
      const item = element.querySelector('[role="menuitem"][data-highlighted]');
      const back = element.parentElement?.querySelector<HTMLElement>('.media-menu-back-item');

      if (!item) throw new Error('Expected the settings menu to have a highlighted item.');

      const highlightStyle = getComputedStyle(element, '::before');
      const itemStyle = getComputedStyle(item);

      return {
        backAnchor: back ? getComputedStyle(back).anchorName : 'none',
        highlight: {
          borderRadius: highlightStyle.borderRadius,
          transition: `${highlightStyle.transitionProperty} ${highlightStyle.transitionDuration} ${highlightStyle.transitionTimingFunction}`,
        },
        item: {
          borderRadius: itemStyle.borderRadius,
          transition: `${itemStyle.transitionProperty} ${itemStyle.transitionDuration} ${itemStyle.transitionTimingFunction}`,
        },
      };
    })
    .then((contract) => ({
      ...contract,
      highlight: { ...contract.highlight, keyboardTransition, pointerTransition },
    }));
}

async function openVolumePopover({ frame, root }: SkinPanel): Promise<Locator> {
  await root.getByRole('button', { name: 'Mute' }).hover();
  const slider = root.getByRole('slider', { name: 'Volume' });

  await expect(slider).toBeVisible();
  // The inner locator is evaluated relative to each popover, so it must not carry the root scope, and it has to come
  // from the panel's frame.
  const popup = root
    .locator('[popover]:visible')
    .filter({ has: frame.getByRole('slider', { name: 'Volume' }) })
    .first();

  await expect(popup).toBeVisible();
  await expect(popup).not.toHaveAttribute('data-starting-style', '');
  await waitForOwnAnimations(popup);
  return popup;
}

async function openTooltip(root: Locator, name: string): Promise<Locator> {
  await root.getByRole('button', { name, exact: true }).hover();
  const tooltip = root.locator('[popover]:visible').filter({ hasText: name }).first();

  await expect(tooltip).toBeVisible();
  await expect(tooltip).not.toHaveAttribute('data-starting-style', '');
  await waitForOwnAnimations(tooltip);
  return tooltip;
}

async function waitForOwnAnimations(element: Locator) {
  await element.evaluate(async (target) => {
    await Promise.all(target.getAnimations().map((animation) => animation.finished));
  });
}

async function muteTooltipContract(root: Locator, skin: SkinCase['skin']) {
  if (skin !== 'neutral-video') return null;

  const tooltip = await openTooltip(root, 'Mute');

  return tooltipSurfaceContract(root, tooltip);
}

async function popupSurfaceContract(root: Locator, popup: Locator) {
  const rootRect = await frameRect(root);

  return popup.evaluate((element, playerRect) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const round = (value: number) => Math.round(value * 10) / 10;
    const radius = Number.parseFloat(style.borderRadius);
    const normalizedRadius = radius >= Math.min(rect.width, rect.height) / 2 ? 'round' : style.borderRadius;
    const hasPaintedShadow = style.boxShadow.split(/,(?![^()]*\))/).some((shadow) => {
      const transparent =
        shadow.includes('transparent') ||
        /rgba\([^)]*,\s*0\)/.test(shadow) ||
        /(?:rgb|oklab|oklch)\([^)]*\/\s*0\)/.test(shadow);
      const hasVisibleGeometry = [...shadow.matchAll(/-?(?:\d*\.)?\d+px/g)].some(
        ([value]) => Number.parseFloat(value) !== 0
      );

      return !transparent && hasVisibleGeometry;
    });

    return {
      side: element.getAttribute('data-side'),
      align: element.getAttribute('data-align'),
      padding: style.padding,
      borderRadius: normalizedRadius,
      backdropFilter: style.backdropFilter,
      border: Number.parseFloat(style.borderWidth) === 0 ? 'none 0px' : `${style.borderStyle} ${style.borderWidth}`,
      boxShadow: hasPaintedShadow ? 'painted' : 'none',
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      rect: {
        x: round(rect.x - playerRect.x),
        y: round(rect.y - playerRect.y),
        width: round(rect.width),
        height: round(rect.height),
      },
    };
  }, rootRect);
}

async function tooltipSurfaceContract(root: Locator, tooltip: Locator) {
  const surface = await popupSurfaceContract(root, tooltip);
  const innerShadow = await tooltip.evaluate((element) => {
    const shadow = getComputedStyle(element, '::after').boxShadow;

    return shadow === 'none' || shadow.split(/,(?![^()]*\))/).every((part) => /(?:\/\s*0\)|,\s*0\))/.test(part))
      ? 'none'
      : 'painted';
  });

  return { ...surface, innerShadow, shadow: surface.boxShadow };
}

async function volumeSliderContract(popup: Locator) {
  const slider = popup.getByRole('slider', { name: 'Volume' });

  return slider.evaluate((element) => {
    const root =
      element.closest('.media-slider, .media-volume-slider, media-volume-slider') ?? element.parentElement ?? element;
    const popup = root.closest('[popover]');
    if (!popup) throw new Error('Expected the volume slider to be rendered in a popover.');

    const popupRect = popup.getBoundingClientRect();
    const round = (value: number) => Math.round(value * 10) / 10;
    const inspect = (target: Element) => {
      const style = getComputedStyle(target);
      const rect = target.getBoundingClientRect();
      const radius = Number.parseFloat(style.borderRadius);

      return {
        background: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
        borderRadius: radius >= Math.min(rect.width, rect.height) / 2 ? 'round' : style.borderRadius,
        boxShadow: style.boxShadow === 'none' ? 'none' : 'painted',
        clipPath: style.clipPath,
        opacity: style.opacity,
        outline: `${style.outlineStyle} ${style.outlineWidth}`,
        rect: {
          x: round(rect.x - popupRect.x),
          y: round(rect.y - popupRect.y),
          width: round(rect.width),
          height: round(rect.height),
        },
        scale: style.scale,
      };
    };
    const track = root.querySelector('.media-slider-track, media-slider-track') ?? root.firstElementChild;
    const fill = track?.querySelector('.media-slider-fill, media-slider-fill') ?? track?.firstElementChild;
    if (!track || !fill) throw new Error('Expected the volume slider track and fill to be rendered.');

    return {
      slider: inspect(root),
      track: inspect(track),
      fill: inspect(fill),
      thumb: inspect(element),
    };
  });
}

async function volumeMaskContract(root: Locator, width: number) {
  await root.page().waitForTimeout(100);

  return root.evaluate((element, compact) => {
    const descendants = [...element.querySelectorAll<HTMLElement>('*')];
    const className = (target: HTMLElement) => target.getAttribute('class') ?? '';
    const time = descendants.find((target) => {
      const value = className(target);

      return (
        value.includes('video-time-controls') ||
        value.includes('video-time-slider-group') ||
        value.includes('@container/video-time-controls')
      );
    });
    const buttonGroups = descendants.filter((target) => className(target).includes('media-button-group'));
    const end =
      descendants.find((target) => className(target).includes('video-controls-end')) ??
      buttonGroups.at(-1) ??
      descendants.find((target) => {
        const value = className(target);

        return value.includes('justify-end') && value.includes('flex-1');
      });
    const target = compact ? end : time;
    if (!target) throw new Error(`Expected the ${compact ? 'ending controls' : 'time controls'} mask target.`);

    const style = getComputedStyle(target);

    return {
      mask: style.maskImage === 'none' ? 'none' : 'gradient',
      position: style.maskPosition,
      repeat: style.maskRepeat,
      size: style.maskSize,
      transition: `${style.transitionProperty} ${style.transitionDuration} ${style.transitionTimingFunction}`,
    };
  }, width <= 320);
}

function expectPopupMotion(contract: Awaited<ReturnType<typeof popupMotionContract>>) {
  expect(contract).toMatchObject({
    ending: {
      filter: 'blur(4px)',
      opacity: '0',
      transform: { scale: 0.95, x: 0, y: 0 },
    },
    positioningPreserved: true,
    starting: {
      opacity: '0',
      transform: { scale: 0.95 },
    },
  });
  expect(Math.abs(contract.starting.transform.x) + Math.abs(contract.starting.transform.y)).toBeGreaterThan(0);
  expect(new Set(contract.transitionProperty.split(',').map((value) => value.trim()))).toEqual(
    new Set(['filter', 'opacity', 'scale', 'transform'])
  );
}

async function popupMotionContract(popup: Locator) {
  return popup.evaluate((element) => {
    const visualTransform = (style: CSSStyleDeclaration) => {
      const matrix = style.transform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(style.transform);
      const independentScale = style.scale === 'none' ? 1 : Number.parseFloat(style.scale);

      return {
        scale: Math.round(matrix.a * independentScale * 100) / 100,
        x: Math.round(matrix.e * 10) / 10,
        y: Math.round(matrix.f * 10) / 10,
      };
    };
    const visible = getComputedStyle(element);
    const positionedTranslate = visible.translate;
    const transitionDurations = [...new Set(visible.transitionDuration.split(',').map((value) => value.trim()))];
    const transitionProperty = visible.transitionProperty;
    const inlineTransition = element.style.transition;

    element.style.transition = 'none';
    element.setAttribute('data-starting-style', '');

    const starting = getComputedStyle(element);
    const startingContract = {
      filter: starting.filter,
      opacity: starting.opacity,
      transform: visualTransform(starting),
    };

    element.removeAttribute('data-starting-style');
    element.setAttribute('data-ending-style', '');

    const ending = getComputedStyle(element);
    const contract = {
      ending: {
        filter: ending.filter,
        opacity: ending.opacity,
        transform: visualTransform(ending),
      },
      positioningPreserved: ending.translate === positionedTranslate && starting.translate === positionedTranslate,
      starting: startingContract,
      transitionDurations,
      transitionProperty,
    };

    element.removeAttribute('data-ending-style');
    element.style.transition = inlineTransition;
    return contract;
  });
}

async function popupContract(root: Locator, popup: Locator) {
  const rootRect = await frameRect(root);

  return popup.evaluate((element, playerRect) => {
    const round = (value: number) => Math.round(value * 10) / 10;
    const inspect = (target: Element | null) => {
      if (!(target instanceof HTMLElement)) return null;

      const style = getComputedStyle(target);
      const rect = target.getBoundingClientRect();

      return {
        display: style.display,
        padding: style.padding,
        gap: style.gap,
        borderRadius: style.borderRadius,
        overflow: style.overflow,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        rect: {
          x: round(rect.x - playerRect.x),
          y: round(rect.y - playerRect.y),
          width: round(rect.width),
          height: round(rect.height),
        },
      };
    };
    const visible = (selector: string) =>
      [...element.querySelectorAll(selector)].find((target) => target.getBoundingClientRect().width > 0) ?? null;

    return {
      side: element.getAttribute('data-side'),
      align: element.getAttribute('data-align'),
      popup: inspect(element),
      item: inspect(visible('[role^="menuitem"]')),
      separator: inspect(visible('[role="separator"], .media-separator')),
    };
  }, rootRect);
}

async function skinContract(root: Locator) {
  return root.evaluate((element: HTMLElement, posterSelector) => {
    const rootRect = element.getBoundingClientRect();
    const round = (value: number) => Math.round(value * 10) / 10;
    const relativeRect = (rect: DOMRect) => ({
      x: round(rect.x - rootRect.x),
      y: round(rect.y - rootRect.y),
      width: round(rect.width),
      height: round(rect.height),
    });
    const play = element.querySelector<HTMLElement>('[role="button"][aria-label="Play"]');
    const mute = element.querySelector<HTMLElement>('[role="button"][aria-label="Mute"]');
    const seek = element.querySelector<HTMLElement>('[role="slider"][aria-label="Seek"]');
    const controls = play?.closest<HTMLElement>('[data-interactive], media-controls');
    const poster = element.querySelector<HTMLElement>(posterSelector);

    const inspect = (target: HTMLElement | null | undefined) => {
      if (!target) return null;

      const style = getComputedStyle(target);
      const rect = target.getBoundingClientRect();
      const renderedRect = style.display === 'contents' ? null : relativeRect(rect);

      return {
        display: style.display,
        position: style.position,
        width: style.width,
        height: style.height,
        padding: style.padding,
        gap: style.gap,
        color: style.color,
        opacity: style.opacity,
        transform: style.transform,
        borderRadius: style.borderRadius,
        boxSizing: style.boxSizing,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        rect: renderedRect,
      };
    };

    const rootStyle = getComputedStyle(element);

    return {
      root: inspect(element),
      poster: inspect(poster),
      controls: inspect(controls),
      play: inspect(play),
      mute: inspect(mute),
      seek: inspect(seek),
      tokens: {
        spacing: rootStyle.getPropertyValue('--media-spacing').trim(),
        radius: rootStyle.getPropertyValue('--media-video-border-radius').trim(),
        controlRadius: rootStyle.getPropertyValue('--media-control-radius').trim(),
      },
    };
  }, POSTER_SELECTOR);
}

function snapshotName(variant: SkinCase, width: number): string {
  return `${variant.framework}-${variant.skin}-${width}.png`;
}
