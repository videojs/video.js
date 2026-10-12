import type { Locator, Page } from 'playwright';

import type { TaskAssertion, TaskCheck } from '../../src/grade/browser.ts';
import { allShown, assertion, revealControls } from '../../src/grade/task-checks.ts';

type Box = { x: number; y: number; width: number; height: number };

const MUTE = /\b(mute|unmute)\b/i;
const CAPTIONS = /captions|subtitles/i;
// Everything a control row can hold, including parts the skin fades out, such as an idle slider thumb.
const CONTROLS = 'button, [role="button"], [role="slider"], a[href], input, time';

async function find(page: Page, name: RegExp): Promise<Locator | undefined> {
  return (await allShown(page.getByRole('button', { name })))[0];
}

/** Boxes of every laid-out control in the player, whether or not it is faded out. */
function controlBoxes(player: Locator): Promise<Array<Box & { label: string }>> {
  return player.evaluate((root, selector) => {
    const boxes: Array<Box & { label: string }> = [];

    for (const element of root.querySelectorAll(selector)) {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      // A control inside another, such as an icon button in a link, counts once.
      if (element.parentElement?.closest(selector) && root.contains(element.parentElement.closest(selector))) continue;

      boxes.push({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        label: element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 30) ?? element.localName,
      });
    }

    return boxes;
  }, CONTROLS);
}

/** The time slider's box: its thumb, centred on the track, when the slider itself has no role. */
async function timeSliderBox(page: Page): Promise<Box | null> {
  const slider = page.getByRole('slider', { name: /seek|time|progress|timeline/i }).first();

  return slider.boundingBox({ timeout: 2_000 }).catch(() => null);
}

const center = (box: Box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
const round = (value: number) => Math.round(value);

async function desktopOrder(page: Page, player: Locator): Promise<TaskAssertion> {
  await revealControls(player);

  const mute = await find(page, MUTE);
  const captions = await find(page, CAPTIONS);

  if (!mute || !captions) {
    return assertion('captions right after volume', false, `mute button ${!!mute}, captions button ${!!captions}`);
  }

  const muteBox = (await mute.boundingBox())!;
  const captionsBox = (await captions.boundingBox())!;
  const row = (box: Box) => Math.abs(center(box).y - center(muteBox).y) < Math.max(muteBox.height, box.height) / 2 + 4;
  const controls = (await controlBoxes(player)).filter(row);
  // The volume control ends at the mute button, or at a volume slider laid out beside it.
  const volumeEnd = Math.max(
    muteBox.x + muteBox.width,
    ...controls.filter(({ label, x }) => /volume/i.test(label) && x >= muteBox.x).map(({ x, width }) => x + width)
  );
  const between = controls.filter(({ x, width }) => {
    const middle = x + width / 2;

    return middle > volumeEnd + 1 && middle < captionsBox.x - 1;
  });

  return assertion(
    'captions right after volume',
    row(captionsBox) && captionsBox.x >= volumeEnd - 2 && between.length === 0,
    `volume ends at x=${round(volumeEnd)}, captions at x=${round(captionsBox.x)}${row(captionsBox) ? '' : ' in another row'}${
      between.length > 0 ? `, between: ${between.map(({ label }) => label).join(', ')}` : ''
    }`
  );
}

/** Enter on the focused button does what a click does. */
async function keyboard(page: Page, media: Locator): Promise<TaskAssertion[]> {
  const results: TaskAssertion[] = [];
  const captionsShowing = () =>
    media.evaluate((element) =>
      [...(element as HTMLMediaElement).textTracks].some(
        (track) => (track.kind === 'captions' || track.kind === 'subtitles') && track.mode === 'showing'
      )
    );
  const muted = () => media.evaluate((element) => (element as HTMLMediaElement).muted);
  const press = async (button: Locator, read: () => Promise<boolean>) => {
    const before = await read();

    await button.focus();
    await page.keyboard.press('Enter');

    let after = before;

    for (const deadline = Date.now() + 2_000; after === before && Date.now() < deadline;) {
      await page.waitForTimeout(100);
      after = await read();
    }

    return { before, after };
  };

  const captions = await find(page, CAPTIONS);
  const captionsResult = captions ? await press(captions, captionsShowing) : null;

  results.push(
    assertion(
      'Enter toggles captions',
      captionsResult !== null && captionsResult.before !== captionsResult.after,
      captionsResult ? `showing ${captionsResult.before} to ${captionsResult.after}` : 'no captions button'
    )
  );

  const mute = await find(page, MUTE);
  const muteResult = mute ? await press(mute, muted) : null;

  results.push(
    assertion(
      'Enter toggles mute',
      muteResult !== null && muteResult.before !== muteResult.after,
      muteResult ? `muted ${muteResult.before} to ${muteResult.after}` : 'no mute button'
    )
  );

  // Leave the player as it was for the playback check.
  if (muteResult && muteResult.after !== muteResult.before) {
    await media.evaluate((element, value) => ((element as HTMLMediaElement).muted = value), muteResult.before);
  }

  return results;
}

async function phoneLayout(page: Page, player: Locator): Promise<TaskAssertion> {
  const viewport = page.viewportSize();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  await player.scrollIntoViewIfNeeded().catch(() => {});
  await revealControls(player);

  try {
    const slider = await timeSliderBox(page);
    const mute = await find(page, MUTE);
    const captions = await find(page, CAPTIONS);

    if (!slider || !mute || !captions) {
      return assertion(
        'volume and captions below the timeline at 390 px',
        false,
        `time slider ${!!slider}, mute button ${!!mute}, captions button ${!!captions}`
      );
    }

    const bottom = slider.y + slider.height;
    const muteTop = (await mute.boundingBox())!.y;
    const captionsTop = (await captions.boundingBox())!.y;

    return assertion(
      'volume and captions below the timeline at 390 px',
      muteTop >= bottom - 1 && captionsTop >= bottom - 1,
      `timeline bottom y=${round(bottom)}, mute top y=${round(muteTop)}, captions top y=${round(captionsTop)}`
    );
  } finally {
    if (viewport) await page.setViewportSize(viewport);

    await page.waitForTimeout(300);
  }
}

/**
 * At desktop width the captions button is the next control after the volume control. At 390 px both sit below the time
 * slider. From the keyboard, Enter on either still toggles captions and mute.
 */
export const beforePlayback: TaskCheck['beforePlayback'] = async ({ page, media, player }) => [
  await desktopOrder(page, player),
  ...(await keyboard(page, media)),
  await phoneLayout(page, player),
];
