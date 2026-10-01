import { expect, test } from '@playwright/test';

import type { SkinPreset } from '../../../../../packages/skins/build/skin';
import {
  alignToPixelGrid,
  captureRendering,
  expectRenderingParity,
  expectSameRendering,
  freezeSliderState,
  openComparison,
  openSourceComparison,
  seekToLiveEdge,
  type SkinPanel,
  skinCases,
} from './vjsc-skin-parity';

// Compat has different controls and motion from Default/Neutral; compare its output rather than their styling contracts.
export function testCompatParity(preset: SkinPreset) {
  const live = preset.startsWith('live-');
  const audio = preset.endsWith('audio');

  for (const variant of skinCases(preset).filter((variant) => variant.skin.startsWith('compat-'))) {
    const params = { ...variant, media: live ? 'hls-live' : 'mp4-1', width: 672 };

    test(`${variant.framework} ${variant.skin} keeps CSS and Tailwind rendering in sync`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });

      for (const width of [320, 672]) {
        const comparison = await openComparison(page, { ...params, width }, prepare);

        await expectRenderingParity(testInfo, comparison, `${variant.skin}-${width}.png`);
      }

      const comparison = await openComparison(page, params, prepare);
      let reference: Awaited<ReturnType<typeof captureRendering>> | undefined;

      for (const panel of comparison.panels) {
        await alignToPixelGrid(panel.root);
        await panel.root.evaluate((element) => element.setAttribute('dir', 'rtl'));
        // Live video has no settings menu; its captions menu is the popup to compare.
        const trigger = panel.root.getByRole('button', {
          name: audio ? (live ? /Mute|Unmute/ : /Playback rate/) : live ? /captions/i : 'Settings',
          exact: true,
        });

        if (audio && live) {
          await expect(panel.root.getByRole('button', { name: /Playback rate/ })).toHaveCount(0);
          await trigger.hover();
          await expect(panel.root.getByRole('slider', { name: 'Volume' })).toBeVisible();
        } else {
          await trigger.click();
          await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        }

        if (reference) await expectSameRendering(testInfo, reference, panel.section);
        else reference = await captureRendering(panel.section, `${variant.skin}-rtl-popup.png`);
      }
    });

    test(`${variant.framework} ${variant.skin} keeps the packaged skin in sync with the authored skin`, async ({
      page,
    }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const comparison = await openSourceComparison(page, params, prepare);
      const reference = await captureRendering(comparison.authored.root, `${variant.skin}-packaged.png`);

      await expectSameRendering(testInfo, reference, comparison.generated.root);
    });
  }
}

async function prepare({ root, section }: SkinPanel) {
  await expect(root).toBeVisible();
  await expect(root.getByRole('button', { name: 'Play', exact: true }).last()).toBeVisible();
  await expect
    .poll(() =>
      section
        .locator('video, audio')
        .evaluateAll((elements: HTMLMediaElement[]) => elements.every((element) => element.readyState >= 1))
    )
    .toBe(true);
  await section.locator('video, audio').evaluateAll((elements: HTMLMediaElement[]) => {
    for (const element of elements) element.pause();
  });
  const live = root.getByRole('button', { name: /live/i });

  if (await live.count()) {
    await seekToLiveEdge(live);
    // Live frames differ between players; keep only the controls in the rendering comparison.
    await section.locator('video, img').evaluateAll((elements: HTMLElement[]) => {
      for (const element of elements) element.style.visibility = 'hidden';
    });
  }

  await freezeSliderState(root.getByRole('slider'));
  await root.page().evaluate(() => document.fonts.ready);
  await root.dispatchEvent('pointermove', { pointerType: 'mouse' });
  await root.page().mouse.move(0, 0);
}
