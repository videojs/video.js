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
  failLiveManifest,
  expectSameRendering,
  normalizeErrorDialogCopy,
  openComparison,
  openSourceComparison,
  popupAncestor,
  popupContract,
  type SkinCase,
  skinCases,
  type SkinComparison,
  type SkinPanel,
  type SourceComparison,
  surfaceContract,
  waitForStableText,
} from './vjsc-skin-parity';

const CASES = skinCases('live-audio');
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

  test(`${variant.framework} ${variant.skin} preserves live audio controls and popup styling`, async ({ page }) => {
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
      statusRegions: 1,
      popover: { visible: true },
      tooltip: { visible: true },
    });
  });

  test(`${variant.framework} ${variant.skin} keeps error-dialog styling in sync`, async ({ page }) => {
    await failLiveManifest(page);

    const comparison = await openVariants(page, variant, 672, { expectPlay: false });
    const contracts: Awaited<ReturnType<typeof popupContract>>[] = [];

    for (const panel of comparison.panels) {
      await test.step(panel.style, async () => {
        await expect(panel.root).toHaveAttribute('data-preset', 'live-audio');

        const dialog = panel.root.getByRole('alertdialog');

        await expect(dialog).toBeVisible({ timeout: 20_000 });
        await waitForStableText(dialog);
        await normalizeErrorDialogCopy(dialog);
        contracts.push(await popupContract(dialog));
      });
    }

    expect(contracts[1]!).toEqual(contracts[0]!);
  });

  test(`${variant.framework} ${variant.skin} removes popup movement under reduced motion`, async ({ page }) => {
    const comparison = await openVariants(page, variant, 672);
    const readPopup = async (panel: SkinPanel) => {
      await panel.root.getByRole('button', { name: /mute/i }).hover();

      const volume = panel.root.getByRole('slider', { name: /volume/i });

      await expect(volume).toBeVisible();
      return popupContract(popupAncestor(volume));
    };

    for (const panel of comparison.panels) expectPopupMovement(await readPopup(panel));

    await page.mouse.move(0, 0);
    await page.emulateMedia({ reducedMotion: 'reduce' });

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
        const mute = panel.root.getByRole('button', { name: /mute/i });

        await mute.hover();

        const volume = panel.root.getByRole('slider', { name: /volume/i });

        await expect(volume).toBeVisible();
        contracts.push({
          controls: await surfaceContract(panel.root.locator('.audio-controls').first()),
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
  { media = 'hls-live', expectPlay = true } = {}
): Promise<SkinComparison> {
  return openComparison(page, { ...variant, media, width }, (panel) => preparePanel(panel, width, expectPlay));
}

async function openPackagedVariants(page: Page, variant: SkinCase, width: number): Promise<SourceComparison> {
  return openSourceComparison(page, { ...variant, media: 'hls-live', width }, (panel) =>
    preparePanel(panel, width, true)
  );
}

async function preparePanel({ root, section }: SkinPanel, width: number, expectPlay: boolean) {
  await expect(root).toBeVisible();

  if (expectPlay) {
    await expect(root.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await seekToLiveEdge(root.getByRole('button', { name: /live/i }));
  }

  await expect.poll(() => root.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(width);
  await section.locator('audio').evaluateAll((elements: HTMLMediaElement[]) => {
    for (const element of elements) element.pause();
  });
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
    const controls = [...element.querySelectorAll<HTMLElement>('.audio-controls')].find((candidate) => {
      const rect = candidate.getBoundingClientRect();

      return getComputedStyle(candidate).display !== 'contents' && rect.width > 0 && rect.height > 0;
    });

    if (!controls) {
      const play = element.querySelector<HTMLElement>('[aria-label="Play"]');
      let candidate = play?.parentElement;

      while (
        candidate &&
        (!(
          candidate.querySelector('[data-live-edge], [aria-label="Seek to live edge"]') &&
          candidate.querySelector('[aria-label^="Mute"]')
        ) ||
          getComputedStyle(candidate).display === 'contents' ||
          candidate.getBoundingClientRect().width === 0)
      ) {
        candidate = candidate.parentElement;
      }

      if (!candidate) throw new Error('Expected live audio controls.');

      return readLayout(candidate);
    }

    return readLayout(controls);

    function readLayout(target: HTMLElement) {
      const style = getComputedStyle(target);
      const live = element.querySelector<HTMLElement>('[data-live-edge], [aria-label="Seek to live edge"]');
      const buttons = [...element.querySelectorAll<HTMLElement>('[role=button]')]
        .filter((button) => {
          const rect = button.getBoundingClientRect();

          return rect.width > 0 && rect.height > 0 && !button.closest('[role=dialog], [role=alertdialog]');
        })
        .map((button) => ({
          label: button === live ? 'live' : button.getAttribute('aria-label'),
          rect: relativeRect(button),
        }));

      return {
        buttons,
        controls: {
          backdropFilter: style.backdropFilter === 'none' ? 'none' : 'painted',
          background: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : 'painted',
          borderRadius: Number.parseFloat(style.borderRadius) > 50 ? 'pill' : style.borderRadius,
          display: style.display,
          gap: style.gap,
          padding: style.padding,
          rect: relativeRect(target),
        },
        root: { height: round(rootRect.height), width: round(rootRect.width) },
      };
    }
  });
}

async function interactionContract(root: Locator) {
  const page = root.page();
  const play = root.getByRole('button', { name: /^(?:Play|Pause)$/ });

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

  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Pause');
  await play.click();
  await expect(play).toHaveAttribute('aria-label', 'Play');

  const button = await buttonInteractionContract(page, play);

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

  return {
    button,
    nestedButtons: await root.locator('button button').count(),
    noPlaybackRate: (await root.getByRole('button', { name: /playback rate/i }).count()) === 0,
    noSeek: (await root.getByRole('slider', { name: 'Seek' }).count()) === 0,
    popover,
    statusRegions: await root.getByRole('status').count(),
    tooltip: tooltipContract,
  };
}
