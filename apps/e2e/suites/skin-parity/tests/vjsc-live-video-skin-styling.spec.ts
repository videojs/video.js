import { expect, type Locator, type Page, test } from '@playwright/test';

import { testRtlLayout } from './rtl';
import {
  buttonInteractionContract,
  captureRendering,
  collectPageErrors,
  controlsVisibilityContract,
  emulatePreference,
  expectRenderingParity,
  expectPopupMovement,
  expectReducedPopupMotion,
  failLiveManifest,
  expectSameRendering,
  feedbackContract,
  freezeSliderState,
  normalizeErrorDialogCopy,
  openComparison,
  openSourceComparison,
  popupAncestor,
  popupContract,
  presetVolume,
  type SkinCase,
  skinCases,
  type SkinComparison,
  type SkinPanel,
  type SourceComparison,
  surfaceContract,
  waitForStableText,
} from './vjsc-skin-parity';

const CASES = skinCases('live-video');
const WIDTHS = [384, 680] as const;

testRtlLayout(CASES);

for (const variant of CASES) {
  test(`${variant.framework} ${variant.skin} keeps CSS and Tailwind rendering in sync`, async ({ page }, testInfo) => {
    const pageErrors = collectPageErrors(page);

    for (const width of WIDTHS) {
      const comparison = await openVariants(page, variant, width);
      const cssContract = await layoutContract(comparison.css.root);
      const tailwindContract = await layoutContract(comparison.tailwind.root);

      expect(tailwindContract).toEqual(cssContract);
      await expectRenderingParity(testInfo, comparison, `${variant.framework}-${variant.skin}-${width}.png`, {
        // A paused stream drifts off the live edge while the other panel readies, so pull both back right before paint.
        before: (panel) => seekToLiveEdge(panel.root.getByRole('button', { name: /live/i })),
      });
    }

    expect(pageErrors).toEqual([]);
  });

  test(`${variant.framework} ${variant.skin} keeps the packaged skin in sync with the authored skin`, async ({
    page,
  }, testInfo) => {
    const { authored, generated, panels } = await openPackagedVariants(page, variant, 672);
    const authoredContract = await layoutContract(authored.root);
    const generatedContract = await layoutContract(generated.root);

    expect(generatedContract).toEqual(authoredContract);

    for (const panel of panels) await seekToLiveEdge(panel.root.getByRole('button', { name: /live/i }));

    const reference = await captureRendering(authored.root, `${variant.framework}-${variant.skin}-packaged.png`);

    await expectSameRendering(testInfo, reference, generated.root);
  });

  test(`${variant.framework} ${variant.skin} preserves live controls and popup motion`, async ({ page }) => {
    const comparison = await openVariants(page, variant, 672);
    const contracts: Awaited<ReturnType<typeof interactionContract>>[] = [];

    for (const panel of comparison.panels) {
      await test.step(panel.style, async () => {
        contracts.push(await interactionContract(panel.root));
      });
    }

    expect(contracts[1]!).toEqual(contracts[0]!);
    expect(contracts[0]!).toMatchObject({
      nestedButtons: 0,
      noPlaybackRate: true,
      noSeek: true,
      popover: { visible: true },
      tooltip: { visible: true },
    });
  });

  test(`${variant.framework} ${variant.skin} exposes captions choices for one or multiple tracks`, async ({ page }) => {
    for (const [captions, count] of [
      ['single', 2],
      ['multiple', 3],
    ] as const) {
      const comparison = await openVariants(page, variant, 672, { captions });

      for (const panel of comparison.panels) {
        await test.step(`${panel.style} ${captions}`, async () => {
          const button = await captionsButton(panel.root);

          await button.click();
          await expect(button).toHaveAttribute('aria-expanded', 'true');

          const menu = panel.root.getByRole('menu');

          await expect(menu).toBeVisible();
          await expect(menu.getByRole('menuitemradio')).toHaveCount(count);
        });
      }
    }
  });

  test(`${variant.framework} ${variant.skin} keeps controls visibility in sync`, async ({ page }) => {
    const comparison = await openVariants(page, variant, 672);
    const contracts: Awaited<ReturnType<typeof controlsVisibilityContract>>[] = [];

    for (const panel of comparison.panels) {
      contracts.push(await controlsVisibilityContract(panel.root.locator('.video-controls').first()));
    }

    expect(contracts[1]!).toEqual(contracts[0]!);

    for (const contract of contracts) {
      expect(contract.visible.opacity).toBe('1');
      expect(contract.hidden).toMatchObject({ opacity: '0', pointerEvents: 'none' });
    }
  });

  test(`${variant.framework} ${variant.skin} keeps fullscreen layout in sync`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const name = `${variant.framework}-${variant.skin}-fullscreen.png`;
    const { css, tailwind } = await openVariants(page, variant, 800);
    const cssContract = await enterFullscreen(css.root);
    const reference = await captureRendering(css.root, name);

    await exitFullscreen(page);

    expect(await enterFullscreen(tailwind.root)).toEqual(cssContract);
    await expectSameRendering(testInfo, reference, tailwind.root);
    await exitFullscreen(page);
  });

  test(`${variant.framework} ${variant.skin} keeps error-dialog styling in sync`, async ({ page }) => {
    await failLiveManifest(page);

    const comparison = await openVariants(page, variant, 672, { expectPlay: false });
    const contracts: Awaited<ReturnType<typeof popupContract>>[] = [];

    for (const panel of comparison.panels) {
      await test.step(panel.style, async () => {
        await expect(panel.root).toHaveAttribute('data-preset', 'live-video');

        const dialog = panel.root.getByRole('alertdialog');

        await expect(dialog).toBeVisible({ timeout: 20_000 });
        await waitForStableText(dialog);
        await normalizeErrorDialogCopy(dialog);
        contracts.push(await popupContract(dialog));
      });
    }

    expect(contracts[1]!).toEqual(contracts[0]!);
  });

  test(`${variant.framework} ${variant.skin} keeps keyboard feedback in sync`, async ({ page }) => {
    await page.clock.install();

    const comparison = await openVariants(page, variant, 672);
    const contracts = [];

    for (const panel of comparison.panels) {
      const captions = await feedbackContract(panel, 'c', '[data-status="captions-on"], [data-status="captions-off"]');
      const playback = await feedbackContract(panel, 'k', '[data-status="play"], [data-status="pause"]');

      await presetVolume(panel);
      const volume = await feedbackContract(panel, 'ArrowUp', '[data-level]:not([role])');

      contracts.push({ captions, playback, volume });
    }

    expect(contracts[1]!).toEqual(contracts[0]!);
  });

  test(`${variant.framework} ${variant.skin} removes movement under reduced motion`, async ({ page }) => {
    const comparison = await openVariants(page, variant, 672, { captions: 'multiple' });
    const readPopup = async (panel: SkinPanel) => {
      const button = await captionsButton(panel.root);

      if ((await button.getAttribute('aria-expanded')) !== 'true') await button.click();

      await expect(button).toHaveAttribute('aria-expanded', 'true');

      const menu = panel.root.getByRole('menu');

      await expect(menu).toBeVisible();
      return { content: await transitionContract(menu), popup: await popupContract(popupAncestor(menu)) };
    };

    for (const panel of comparison.panels) expectPopupMovement((await readPopup(panel)).popup);

    await page.emulateMedia({ reducedMotion: 'reduce' });

    const contracts = [];

    for (const panel of comparison.panels) {
      const contract = await readPopup(panel);

      expect(contract.content.movement).toEqual([
        { property: 'translate', duration: '0s' },
        { property: 'filter', duration: '0s' },
      ]);
      expectReducedPopupMotion(contract.popup);
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
        const mute = panel.root.getByRole('button', { name: /mute/i });

        await mute.hover();

        const volume = panel.root.getByRole('slider', { name: /volume/i });

        await expect(volume).toBeVisible();
        contracts.push({
          controls: await surfaceContract(panel.root.locator('.video-controls').first()),
          popup: await surfaceContract(popupAncestor(volume)),
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
  {
    captions = 'single',
    media = 'hls-live',
    expectPlay = true,
  }: { captions?: 'single' | 'multiple'; media?: string; expectPlay?: boolean } = {}
): Promise<SkinComparison> {
  return openComparison(page, { ...variant, media, captions, width }, (panel) =>
    preparePanel(panel, width, expectPlay)
  );
}

async function openPackagedVariants(page: Page, variant: SkinCase, width: number): Promise<SourceComparison> {
  return openSourceComparison(page, { ...variant, media: 'hls-live', captions: 'single', width }, (panel) =>
    preparePanel(panel, width, true)
  );
}

async function preparePanel({ root, section }: SkinPanel, width: number, expectPlay: boolean) {
  await expect(root).toBeVisible();

  if (expectPlay) {
    await expect(root.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await seekToLiveEdge(root.getByRole('button', { name: /live/i }));
    await captionsButton(root);
  }

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
  await root.evaluate((element, playerWidth) => {
    const tree = element.getRootNode();
    const sizingTarget = tree instanceof ShadowRoot ? tree.host : element;
    if (!(sizingTarget instanceof HTMLElement)) return;

    sizingTarget.style.height = `${Math.round((playerWidth * 9) / 16)}px`;
  }, width);
  await root.evaluate((element) => {
    const hideMedia = (tree: ParentNode) => {
      for (const child of tree.querySelectorAll<HTMLElement>('*')) {
        if (child instanceof HTMLVideoElement || child instanceof HTMLImageElement) child.style.visibility = 'hidden';

        if (child.shadowRoot) hideMedia(child.shadowRoot);
      }
    };

    element.style.setProperty('background', 'linear-gradient(135deg, #111827, #334155)', 'important');
    hideMedia(element);
  });
  await section.locator('video, mux-video, media-poster, img').evaluateAll((elements) => {
    for (const element of elements) {
      if (element instanceof HTMLElement) element.style.setProperty('visibility', 'hidden', 'important');
    }
  });
  await freezeSliderState(root.getByRole('slider'), ['--media-slider-buffer']);
  await root.page().evaluate(() => document.fonts.ready.then(() => undefined));
}

/** Both panels must report the same live-edge state before any paint is compared, so pull each one to the edge. */
async function seekToLiveEdge(live: Locator) {
  await expect(live).toBeVisible({ timeout: 20_000 });

  if ((await live.getAttribute('data-live-edge')) === null && (await live.isEnabled())) {
    try {
      await live.click({ timeout: 2_000 });
    } catch (error) {
      // The stream can reach its edge and disable the button between the enabled check and the click.
      if ((await live.getAttribute('data-live-edge')) === null) throw error;
    }
  }

  await expect(live).toHaveAttribute('data-live-edge', '', { timeout: 20_000 });
}

async function captionsButton(root: Locator): Promise<Locator> {
  const button = root.getByRole('button', { name: /captions/i, includeHidden: true }).first();

  await expect(button).toHaveAttribute('data-availability', 'available');

  return button;
}

async function layoutContract(root: Locator) {
  return root.evaluate((element) => {
    const rootRect = element.getBoundingClientRect();
    const round = (value: number) => Math.round(value * 2) / 2;
    const relativeRect = (target: Element) => {
      const rect = target.getBoundingClientRect();

      return {
        height: round(rect.height),
        left: round(rect.x - rootRect.x),
        top: round(rect.y - rootRect.y),
        width: round(rect.width),
      };
    };
    const controls = [
      ...element.querySelectorAll<HTMLElement>('.video-controls-primary, [class~="origin-bottom"], .video-controls'),
    ].find((candidate) => {
      const rect = candidate.getBoundingClientRect();

      return getComputedStyle(candidate).display !== 'contents' && rect.width > 0 && rect.height > 0;
    });
    if (!controls) throw new Error('Expected visible live video controls.');

    const controlsStyle = getComputedStyle(controls);
    const live = element.querySelector<HTMLElement>('[data-live-edge], [aria-label="Seek to live edge"]');
    if (!live) throw new Error('Expected a live button.');

    const liveStyle = getComputedStyle(live);
    const liveBefore = getComputedStyle(live, '::before');
    const buttons = [...element.querySelectorAll<HTMLElement>('button, [role=button]')]
      .filter((button) => {
        const rect = button.getBoundingClientRect();

        return rect.width > 0 && rect.height > 0 && !button.closest('[role=menu], [role=dialog], [role=alertdialog]');
      })
      .map((button) => ({
        label: button === live ? 'live' : button.getAttribute('aria-label'),
        rect: relativeRect(button),
      }));

    return {
      buttons,
      controls: {
        background: controlsStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
        borderRadius: controlsStyle.borderRadius,
        display: controlsStyle.display,
        padding: controlsStyle.padding,
      },
      controlsRect: relativeRect(controls),
      live: {
        before: { display: liveBefore.display, width: liveBefore.width },
        fontSize: liveStyle.fontSize,
        gap: liveStyle.gap,
        padding: liveStyle.padding,
      },
      root: { height: round(rootRect.height), width: round(rootRect.width) },
    };
  });
}

async function interactionContract(root: Locator) {
  const page = root.page();
  const play = root.getByRole('button', { name: 'Play', exact: true });

  await play.hover();

  const tooltip = root.locator('[popover]:visible').filter({ hasText: 'Play' }).first();

  await expect(tooltip).toBeVisible();
  const tooltipContract = { visible: true, ...(await popupContract(tooltip)) };

  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();

  await play.hover();
  await expect(tooltip).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(tooltip).toBeHidden();

  const mute = root.getByRole('button', { name: /mute/i });

  await mute.hover();

  const volume = root.getByRole('slider', { name: /volume/i });

  await expect(volume).toBeVisible();
  const popover = { visible: true, ...(await popupContract(popupAncestor(volume))) };

  await page.mouse.move(0, 0);
  await expect(volume).toBeHidden();
  await mute.hover();
  await expect(volume).toBeVisible();
  await page.mouse.move(0, 0);
  await expect(volume).toBeHidden();

  const button = await buttonInteractionContract(page, play);

  return {
    button,
    nestedButtons: await root.locator('button button').count(),
    noPlaybackRate: (await root.getByRole('button', { name: /playback rate/i }).count()) === 0,
    noSeek: (await root.getByRole('slider', { name: 'Seek' }).count()) === 0,
    popover,
    tooltip: tooltipContract,
  };
}

async function transitionContract(target: Locator) {
  return target.evaluate((element) => {
    const style = getComputedStyle(element);
    const durations = style.transitionDuration.split(',').map((value) => value.trim());

    return {
      movement: style.transitionProperty
        .split(',')
        .map((property) => property.trim())
        .map((property, index) => ({ duration: durations[index % durations.length] ?? '0s', property })),
    };
  });
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

  await button.click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement !== null)).toBe(true);
  await page.waitForTimeout(300);

  return root.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const controls = element.querySelector<HTMLElement>('.video-controls');
    const controlsRect = controls?.getBoundingClientRect();

    return {
      controls: controlsRect
        ? {
            bottom: Math.round(rect.bottom - controlsRect.bottom),
            height: Math.round(controlsRect.height),
            width: Math.round(controlsRect.width),
          }
        : null,
      root: {
        borderRadius: style.borderRadius,
        fontSize: style.fontSize,
        height: Math.round(rect.height),
        width: Math.round(rect.width),
      },
      scale: Number.parseFloat(style.getPropertyValue('--media-scale')),
    };
  });
}

async function exitFullscreen(page: Page) {
  await page.evaluate(async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
  });
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
}
