import { expect, type Locator, type Page, test } from '@playwright/test';

import { testRtlLayout } from './rtl';
import {
  buttonInteractionContract,
  captureRendering,
  collectPageErrors,
  emulatePreference,
  expectRenderingParity,
  expectPopupMovement,
  expectReducedPopupMotion,
  expectSameRendering,
  frameRect,
  freezeSliderState,
  normalizeErrorDialogCopy,
  openComparison,
  openSourceComparison,
  popupAncestor,
  popupContract,
  releaseSliderState,
  type SkinCase,
  skinCases,
  type SkinComparison,
  type SkinPanel,
  type SourceComparison,
  surfaceContract,
  waitForStableText,
} from './vjsc-skin-parity';

const CASES = skinCases('audio');
const WIDTHS = [384, 672] as const;

testRtlLayout(CASES);

for (const variant of CASES) {
  test(`${variant.framework} ${variant.skin} keeps CSS and Tailwind rendering in sync`, async ({ page }, testInfo) => {
    const pageErrors = collectPageErrors(page);

    for (const width of WIDTHS) {
      const comparison = await openVariants(page, variant, width);
      const cssContract = await layoutContract(comparison.css.root);
      const tailwindContract = await layoutContract(comparison.tailwind.root);

      expect(tailwindContract).toEqual(cssContract);
      await expectRenderingParity(testInfo, comparison, `${variant.framework}-${variant.skin}-${width}.png`);
    }

    expect(pageErrors).toEqual([]);
  });

  test(`${variant.framework} ${variant.skin} keeps the packaged skin in sync with the authored skin`, async ({
    page,
  }, testInfo) => {
    const { authored, generated } = await openPackagedVariants(page, variant, 672);
    const authoredContract = await layoutContract(authored.root);
    const generatedContract = await layoutContract(generated.root);

    expect(generatedContract).toEqual(authoredContract);

    const reference = await captureRendering(authored.root, `${variant.framework}-${variant.skin}-packaged.png`);

    await expectSameRendering(testInfo, reference, generated.root);
  });

  test(`${variant.framework} ${variant.skin} preserves audio interactions and popup styling`, async ({ page }) => {
    const comparison = await openVariants(page, variant, 672);
    const contracts: Awaited<ReturnType<typeof interactionContract>>[] = [];

    for (const panel of comparison.panels) {
      await test.step(panel.style, async () => {
        contracts.push(await interactionContract(panel.root));
      });
    }

    for (const key of ['button', 'hover', 'menu', 'popover', 'tooltip'] as const) {
      expect(contracts[1]![key], `${key}: Tailwind matches CSS`).toEqual(contracts[0]![key]);
    }

    expect(contracts[0]!).toMatchObject({
      nestedButtons: 0,
      playbackRateChanged: true,
      tooltip: { visible: true },
    });
  });

  test(`${variant.framework} ${variant.skin} keeps error-dialog styling in sync`, async ({ page }) => {
    const comparison = await openVariants(page, variant, 672, { media: 'error', expectPlay: false });
    const contracts: Awaited<ReturnType<typeof popupContract>>[] = [];

    for (const panel of comparison.panels) {
      await test.step(panel.style, async () => {
        const dialog = panel.root.getByRole('alertdialog');

        await expect(dialog).toBeVisible({ timeout: 20_000 });
        await waitForStableText(dialog);
        await normalizeErrorDialogCopy(dialog);
        contracts.push(await popupContract(dialog));
      });
    }

    expect(contracts[1]!).toEqual(contracts[0]!);
  });

  test(`${variant.framework} ${variant.skin} keeps seek preview and dragging in sync`, async ({ page }) => {
    const comparison = await openVariants(page, variant, 672);
    const contracts: Awaited<ReturnType<typeof audioSeekContract>>[] = [];

    for (const panel of comparison.panels) {
      await test.step(panel.style, async () => {
        contracts.push(await audioSeekContract(panel.root));
      });
    }

    expect(contracts[1]!).toEqual(contracts[0]!);
    expect(contracts[0]!).toMatchObject({
      dragging: { fillIsImmediate: true, lag: 0, thumbPositionIsImmediate: true },
      restingFillTransitions: true,
    });
    expect(contracts[0]!.previewOffsets.every((offset) => Math.abs(offset) <= 1)).toBe(true);
  });

  test(`${variant.framework} ${variant.skin} removes movement under reduced motion`, async ({ page }) => {
    const comparison = await openVariants(page, variant, 672);
    const readPopup = async (panel: SkinPanel) => {
      const button = panel.root.getByRole('button', { name: /Playback rate/i });

      if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();

      await expect(button).toHaveAttribute('aria-expanded', 'true');

      return popupContract(popupAncestor(panel.root.getByRole('menu')));
    };

    for (const panel of comparison.panels) expectPopupMovement(await readPopup(panel));

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);

    const contracts = [];

    for (const panel of comparison.panels) {
      const contract = await readPopup(panel);

      expectReducedPopupMotion(contract);
      contracts.push(contract);
    }

    expect(contracts[1]).toEqual(contracts[0]);
  });

  for (const preference of ['reduced-transparency', 'contrast-more', 'forced-colors'] as const) {
    test(`${variant.framework} ${variant.skin} keeps ${preference} surfaces in sync`, async ({ page }) => {
      await emulatePreference(page, preference);

      const comparison = await openVariants(page, variant, 672);
      const contracts = [];

      for (const panel of comparison.panels) {
        const rate = panel.root.getByRole('button', { name: /Playback rate/i });

        await rate.click();
        await expect(rate).toHaveAttribute('aria-expanded', 'true');

        contracts.push({
          controls: await surfaceContract(panel.root.locator('.audio-controls').first()),
          popup: await surfaceContract(visibleMenuPopup(panel.root)),
        });
      }

      expect(contracts[1]!).toEqual(contracts[0]!);
    });
  }
}

async function openVariants(
  page: Page,
  variant: SkinCase,
  width: number,
  { media = 'mp4-1', expectPlay = true } = {}
): Promise<SkinComparison> {
  return openComparison(page, { ...variant, media, width }, (panel) => preparePanel(panel, width, expectPlay));
}

async function openPackagedVariants(page: Page, variant: SkinCase, width: number): Promise<SourceComparison> {
  return openSourceComparison(page, { ...variant, media: 'mp4-1', width }, (panel) => preparePanel(panel, width, true));
}

async function preparePanel({ root, section }: SkinPanel, width: number, expectPlay: boolean) {
  await expect(root).toBeVisible();

  if (expectPlay) {
    await expect(root.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await expect(root.getByRole('button', { name: /Playback rate/i })).toBeVisible();
  }

  await expect.poll(() => root.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(width);
  await section.locator('audio').evaluateAll((elements: HTMLMediaElement[]) => {
    for (const element of elements) {
      element.pause();
      element.currentTime = 0;
    }
  });
  await freezeSliderState(root.getByRole('slider', { name: 'Seek' }));
  await root.page().evaluate(() => document.fonts.ready.then(() => undefined));
}

async function layoutContract(root: Locator) {
  // Frame coordinates throughout, since some parts are measured inside an evaluate.
  const rootRect = await frameRect(root);
  const slider = root.getByRole('slider', { name: 'Seek' }).locator('..');

  const roundValue = (value: number) => Math.round(value * 2) / 2;
  const relativeRect = async (target: Locator) => relativeBox(await frameRect(target));
  const relativeBox = (rect: { height: number; width: number; x: number; y: number }) => ({
    height: roundValue(rect.height),
    left: roundValue(rect.x - rootRect.x),
    top: roundValue(rect.y - rootRect.y),
    width: roundValue(rect.width),
  });
  const buttons = [];

  for (const button of await root.getByRole('button').all()) {
    const popup = await button.evaluate(
      (element) => element.closest('[role=menu], [role=dialog], [role=alertdialog]') !== null
    );
    if (popup || !(await button.isVisible())) continue;

    buttons.push({ label: await button.getAttribute('aria-label'), rect: await relativeRect(button) });
  }

  const classedControls = root.locator('.audio-controls').first();
  const tooltipGroup = root.locator('media-tooltip-group').first();
  const controlsLocator = (await classedControls.count()) > 0 ? classedControls : tooltipGroup.locator('..');
  const controls =
    (await controlsLocator.count()) > 0
      ? await controlsLocator.evaluate(readControls)
      : await root.getByRole('button', { name: 'Play', exact: true }).evaluate((element) => {
          let controls = element.parentElement;

          while (
            controls &&
            !(controls.querySelector('[aria-label^="Mute"]') && controls.querySelector('[aria-label="Seek"]'))
          ) {
            controls = controls.parentElement;
          }

          if (!controls) throw new Error('Expected audio controls.');

          const rect = controls.getBoundingClientRect();
          const style = getComputedStyle(controls);

          return {
            rect: { height: rect.height, width: rect.width, x: rect.x, y: rect.y },
            style: {
              backdropFilter: style.backdropFilter,
              backgroundColor: style.backgroundColor,
              borderRadius: Number.parseFloat(style.borderRadius) > 50 ? 'pill' : style.borderRadius,
              boxShadow: style.boxShadow === 'none' ? 'none' : 'painted',
              color: style.color,
              display: style.display,
              gap: style.gap,
              padding: style.padding,
            },
          };
        });

  function readControls(element: Element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);

    return {
      rect: { height: rect.height, width: rect.width, x: rect.x, y: rect.y },
      style: {
        backdropFilter: style.backdropFilter,
        backgroundColor: style.backgroundColor,
        borderRadius: Number.parseFloat(style.borderRadius) > 50 ? 'pill' : style.borderRadius,
        boxShadow: style.boxShadow === 'none' ? 'none' : 'painted',
        color: style.color,
        display: style.display,
        gap: style.gap,
        padding: style.padding,
      },
    };
  }

  return {
    buttons,
    controls: {
      rect: relativeBox(controls.rect),
      style: controls.style,
    },
    root: { height: roundValue(rootRect.height), width: roundValue(rootRect.width) },
    slider: await relativeRect(slider),
  };
}

async function interactionContract(root: Locator) {
  const page = root.page();
  const play = root.getByRole('button', { name: /^(?:Play|Pause)$/ });

  await play.hover();
  await page.waitForTimeout(200);

  const hover = await play.evaluate((element) => {
    const style = getComputedStyle(element);

    return {
      background: /\/\s*0(?:\.0+)?\)/.test(style.backgroundColor) ? 'transparent' : 'painted',
      color: style.color,
    };
  });

  const tooltip = root.locator('[popover]:visible').filter({ hasText: 'Play' }).first();

  await expect(tooltip).toBeVisible();

  const tooltipContract = { visible: await tooltip.isVisible(), ...(await popupContract(tooltip)) };

  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();

  await play.hover();
  await expect(tooltip).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();

  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Pause');
  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Play');

  const button = await buttonInteractionContract(page, play);

  const rate = root.getByRole('button', { name: /Playback rate/i });
  const initialRate = await rate.getAttribute('data-rate');

  await rate.click();
  await expect(rate).toHaveAttribute('aria-expanded', 'true');

  const menu = root.getByRole('menu');
  const menuPopup = visibleMenuPopup(root);
  const alternative = menu.locator('[role="menuitemradio"]:not([aria-checked="true"])').last();

  await expect(menu).toBeVisible();
  const menuContract = await popupContract(menuPopup);

  await alternative.click();
  await expect.poll(() => rate.getAttribute('data-rate')).not.toBe(initialRate);

  const playbackRateChanged = (await rate.getAttribute('data-rate')) !== initialRate;

  const mute = root.getByRole('button', { name: /mute/i });

  await mute.hover();

  const volume = root.getByRole('slider', { name: /volume/i });

  await expect(volume).toBeVisible();

  const popover = await popupContract(popupAncestor(volume));

  await page.mouse.move(0, 0);
  await expect(volume).toBeHidden();

  await mute.hover();
  await expect(volume).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(volume).toBeHidden();

  return {
    button,
    hover,
    menu: menuContract,
    nestedButtons: await root.locator('button button').count(),
    playbackRateChanged,
    popover,
    tooltip: tooltipContract,
  };
}

async function audioSeekContract(root: Locator) {
  const page = root.page();
  const thumb = root.getByRole('slider', { name: 'Seek' });
  const slider = thumb.locator('..');

  await releaseSliderState(thumb);
  await slider.scrollIntoViewIfNeeded();

  const previewOffsets: number[] = [];

  for (const ratio of [0.25, 0.75]) {
    const box = await slider.boundingBox();
    if (!box) throw new Error('Expected the audio seek slider to have a rendered box.');

    await slider.hover({ position: { x: box.width * ratio, y: box.height / 2 } });
    await expect(slider).toHaveAttribute('data-pointing', '');

    const pointer = await slider.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const ratio = Number.parseFloat(getComputedStyle(element).getPropertyValue('--media-slider-pointer')) / 100;

      return rect.x + rect.width * ratio;
    });

    const preview = slider.locator(':scope > :last-child > :last-child');
    // The pointer position above came from the frame, so the preview's box has to as well.
    const previewBox = await frameRect(preview);

    const offset = Math.round((previewBox.x + previewBox.width / 2 - pointer) * 10) / 10;

    // Fonts and percentage positioning can round onto opposite device pixels without changing the alignment.
    previewOffsets.push(Math.abs(offset) <= 2 ? 0 : offset);
  }

  await expect
    .poll(() =>
      slider.evaluate((element) => {
        const fills = [element]
          .map((target) => getComputedStyle(target))
          .filter((style) => style.transitionProperty.includes('--media-slider-fill'));

        return (
          fills.length > 0 &&
          fills.every((style) =>
            style.transitionDuration.split(',').some((duration) => Number.parseFloat(duration) > 0)
          )
        );
      })
    )
    .toBe(true);

  const restingFillTransitions = true;
  const box = await slider.boundingBox();
  if (!box) throw new Error('Expected the audio seek slider to have a rendered box.');

  const pointerX = box.x + box.width * 0.73;
  const pointerY = box.y + box.height / 2;

  await page.mouse.move(box.x + box.width * 0.25, pointerY);
  await page.mouse.down();
  await page.mouse.move(pointerX, pointerY);
  await expect(slider).toHaveAttribute('data-dragging', '');

  // The pointer's offset within the slider: the mouse moved in page coordinates, the thumb reports frame ones.
  const dragging = await thumb.evaluate((element, expectedOffset) => {
    const style = getComputedStyle(element);
    const root = element.parentElement;
    const expectedX = (root?.getBoundingClientRect().x ?? 0) + expectedOffset;
    const fills = (root ? [getComputedStyle(root)] : []).filter((candidate) =>
      candidate.transitionProperty.includes('--media-slider-fill')
    );
    const rect = element.getBoundingClientRect();
    const lag = Math.abs(rect.x + rect.width / 2 - expectedX);
    const positionProperties = new Set(style.transitionProperty.split(',').map((value) => value.trim()));
    const fillDurations = fills.flatMap((candidate) =>
      candidate.transitionDuration.split(',').map((value) => Number.parseFloat(value))
    );

    return {
      fillIsImmediate: fillDurations.length > 0 && fillDurations.every((duration) => duration === 0),
      lag: lag <= 1 ? 0 : Math.ceil(lag),
      thumbPositionIsImmediate: !positionProperties.has('left') && !positionProperties.has('top'),
    };
  }, box.width * 0.73);

  await page.mouse.up();
  return { dragging, previewOffsets, restingFillTransitions };
}

function visibleMenuPopup(root: Locator): Locator {
  return root
    .locator(
      '.media-menu:visible, .media-menu-popup:visible, [popover]:has(> [role="menu"]):visible, media-menu:has(> media-menu-content):visible, [role="menu"]:visible'
    )
    .first();
}
